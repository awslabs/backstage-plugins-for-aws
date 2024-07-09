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
  ConfigServiceClient,
  InvalidExpressionException,
  SelectAggregateResourceConfigCommandOutput,
  paginateSelectAggregateResourceConfig,
  paginateSelectResourceConfig,
} from '@aws-sdk/client-config-service';
import { Logger } from 'winston';
import {
  AWS_SDK_CUSTOM_USER_AGENT,
  AwsResourceLocator,
} from '@aws/aws-core-plugin-for-backstage-common';
import { AwsCredentialIdentityProvider, Paginator } from '@aws-sdk/types';
import { Config } from '@backstage/config';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { convertResourceTypeString, parseResourceLocatorTags } from './utils';

export class AwsConfigResourceLocator implements AwsResourceLocator {
  static readonly AWS_CONFIG_QUERY_TEMPLATE = 'SELECT arn';

  public constructor(
    private readonly logger: Logger,
    private readonly client: ConfigServiceClient,
    private readonly aggregatorName: string | undefined,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      logger: Logger;
    },
  ) {
    let region: string | undefined;
    let accountId: string | undefined;
    let aggregatorName: string | undefined;

    const conf = config.getOptionalConfig('aws.locator.awsConfig');

    if (conf) {
      aggregatorName = conf.getOptionalString('aggregatorName');
      accountId = conf.getOptionalString('accountId');
      region = conf.getOptionalString('region');
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

    const client = new ConfigServiceClient({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider,
    });

    return new AwsConfigResourceLocator(options.logger, client, aggregatorName);
  }

  async getResourceArns({
    resourceType,
    tagString,
  }: {
    resourceType: string;
    tagString: string;
  }): Promise<string[]> {
    const tagFilters = parseResourceLocatorTags(tagString);

    const convertedResourceType = convertResourceTypeString(resourceType);

    this.logger.debug(`Retrieving resource ARNs for ${convertedResourceType}`);

    const whereClause = `${tagFilters
      .map(e => {
        return `tags.tag='${e.key}=${e.value}'`;
      })
      .concat(`resourceType='${resourceType}'`)
      .join(' AND ')}`;

    const query = `${AwsConfigResourceLocator.AWS_CONFIG_QUERY_TEMPLATE} WHERE ${whereClause}`;

    this.logger.debug(`AWS Config query: ${query}`);

    let paginator: Paginator<SelectAggregateResourceConfigCommandOutput>;

    try {
      if (this.aggregatorName) {
        paginator = paginateSelectAggregateResourceConfig(
          {
            client: this.client,
            pageSize: 25,
          },
          {
            Expression: query,
            ConfigurationAggregatorName: this.aggregatorName,
          },
        );
      } else {
        paginator = paginateSelectResourceConfig(
          {
            client: this.client,
            pageSize: 25,
          },
          {
            Expression: query,
          },
        );
      }
    } catch (e) {
      if (e instanceof InvalidExpressionException) {
        this.logger.error(`Invalid AWS Config query: ${query}`);
      }

      throw e;
    }

    let arns: string[] = [];

    for await (const page of paginator) {
      if (page.Results) {
        arns = arns.concat(
          page.Results.map(e => {
            return JSON.parse(e).arn as string;
          }),
        );
      }
    }

    return arns;
  }
}
