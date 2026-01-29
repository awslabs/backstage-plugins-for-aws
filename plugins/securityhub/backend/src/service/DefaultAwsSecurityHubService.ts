/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  paginateGetFindings,
  AwsSecurityFinding,
  SecurityHubClient,
  MapFilterComparison,
} from '@aws-sdk/client-securityhub';
import { CatalogApi } from '@backstage/catalog-client';
import {
  getOneOfEntityAnnotations,
  AWS_SDK_CUSTOM_USER_AGENT,
} from '@aws/aws-core-plugin-for-backstage-common';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { AWS_SECURITYHUB_FINDINGS_TAGS_ANNOTATION } from '@aws/aws-securityhub-plugin-for-backstage-common';
import {
  CompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { AwsSecurityHubService } from './types';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { Config } from '@backstage/config';
import {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { createLegacyAuthAdapters } from '@backstage/backend-common';

export class DefaultAwsSecurityHubService implements AwsSecurityHubService {
  public constructor(
    private readonly logger: LoggerService,
    private readonly auth: AuthService,
    private readonly catalogApi: CatalogApi,
    private readonly client: SecurityHubClient,
    private readonly customFilters?: any,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      catalogApi: CatalogApi;
      discovery: DiscoveryService;
      auth?: AuthService;
      httpAuth?: HttpAuthService;
      logger: LoggerService;
    },
  ) {
    let region: string | undefined;
    let accountId: string | undefined;

    const conf = config.getOptionalConfig('aws.securityHub');

    let customFilters: any = undefined;

    if (conf) {
      accountId = conf.getOptionalString('accountId');
      region = conf.getOptionalString('region');

      // Read custom filters from config
      const filtersConfig = conf.getOptionalConfigArray('filters');
      if (filtersConfig) {
        customFilters = {};
        for (const filterConfig of filtersConfig) {
          const name = filterConfig.getString('name');
          const values = filterConfig.getOptionalStringArray('values');
          const value = filterConfig.getOptionalString('value');
          const comparison =
            filterConfig.getOptionalString('comparison') || 'EQUALS';

          if (!customFilters[name]) {
            customFilters[name] = [];
          }

          if (values) {
            // Multiple values for the same filter
            for (const val of values) {
              customFilters[name].push({
                Comparison: comparison,
                Value: val,
              });
            }
          } else if (value) {
            // Single value
            customFilters[name].push({
              Comparison: comparison,
              Value: value,
            });
          }
        }
      }
    }

    const credsManager = DefaultAwsCredentialsManager.fromConfig(config);

    let credentialProvider: AwsCredentialIdentityProvider;

    if (accountId) {
      credentialProvider = (
        await credsManager.getCredentialProvider({ accountId })
      ).sdkCredentialProvider;
    } else {
      credentialProvider = (await credsManager.getCredentialProvider())
        .sdkCredentialProvider;
    }

    const { auth } = createLegacyAuthAdapters(options);

    const client = new SecurityHubClient({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider,
    });

    return new DefaultAwsSecurityHubService(
      options.logger,
      auth,
      options.catalogApi,
      client,
      customFilters,
    );
  }

  public async getFindingsByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<AwsSecurityFinding[]> {
    this.logger.debug(`Fetch SecurityHub findings for ${options.entityRef}`);

    const entity = await this.catalogApi.getEntityByRef(
      options.entityRef,
      options.credentials &&
        (await this.auth.getPluginRequestToken({
          onBehalfOf: options.credentials,
          targetPluginId: 'catalog',
        })),
    );

    if (!entity) {
      throw new Error(
        `Couldn't find entity with name: ${stringifyEntityRef(
          options.entityRef,
        )}`,
      );
    }

    const annotation = getOneOfEntityAnnotations(entity, [
      AWS_SECURITYHUB_FINDINGS_TAGS_ANNOTATION,
    ]);

    if (!annotation) {
      throw new Error('Annotation not found on entity');
    }

    const resourceTags = annotation.value.split(',').map(e => {
      const parts = e.split('=');

      if (parts.length !== 2) {
        throw new Error(`Invalid tag format: ${annotation}`);
      }

      return {
        Comparison: MapFilterComparison.EQUALS,
        Key: parts[0],
        Value: parts[1],
      };
    });

    // Build filters - start with defaults
    const filters: any = {
      ResourceTags: resourceTags,
      WorkflowStatus: [
        {
          Comparison: 'EQUALS',
          Value: 'NEW',
        },
        {
          Comparison: 'EQUALS',
          Value: 'NOTIFIED',
        },
      ],
      RecordState: [
        {
          Comparison: 'EQUALS',
          Value: 'ACTIVE',
        },
      ],
    };

    // Merge custom filters from config
    if (this.customFilters) {
      Object.assign(filters, this.customFilters);
      this.logger.debug(
        `Applying custom filters: ${JSON.stringify(this.customFilters)}`,
      );
    }

    const paginator = paginateGetFindings(
      {
        client: this.client,
        pageSize: 25,
      },
      {
        Filters: filters,
        SortCriteria: [
          {
            Field: 'SeverityLabel',
            SortOrder: 'asc',
          },
        ],
      },
    );

    let result: AwsSecurityFinding[] = [];

    for await (const page of paginator) {
      result = result.concat(page.Findings!);
    }

    this.logger.debug(
      `Found ${
        result.length
      } SecurityHub findings for entity with tags: ${JSON.stringify(
        resourceTags,
      )}`,
    );

    return result;
  }
}
