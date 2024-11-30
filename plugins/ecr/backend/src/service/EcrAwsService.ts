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
  ECRClient,
  DescribeImageScanFindingsCommand,
  ImageScanFindings,
  DescribeImagesCommand,
  ImageDetail,
} from '@aws-sdk/client-ecr';
import { CatalogApi } from '@backstage/catalog-client';
import {
  AWS_SDK_CUSTOM_USER_AGENT,
} from '@aws/aws-core-plugin-for-backstage-common';
import { 
  AwsEcrListImagesRequest,
  AwsEcrListImagesResponse,
  AwsEcrListScanResultsRequest,
  AwsEcrListScanResultsResponse,
  EcrScanAwsService,
} from './types';
import {
  AwsCredentialsManager,
  DefaultAwsCredentialsManager,
} from '@backstage/integration-aws-node';
import {
  AuthService,
  BackstageCredentials,
  coreServices,
  createServiceFactory,
  createServiceRef,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { createLegacyAuthAdapters } from '@backstage/backend-common';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { EcrConfig, readEcrConfig } from '../config';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';

export class EcrAwsService
  implements EcrScanAwsService
{
  public constructor(
    private readonly logger: LoggerService,
    private readonly auth: AuthService,
    private readonly catalogApi: CatalogApi,
    private readonly ecrClient: ECRClient,
    private readonly config: EcrConfig,
  ) {}

  static async fromConfig(
    config: EcrConfig,
    options: {
      catalogApi: CatalogApi;
      discovery: DiscoveryService;
      auth?: AuthService;
      httpAuth?: HttpAuthService;
      logger: LoggerService;
      credentialsManager: AwsCredentialsManager;
    },
  ) {
    const { auth } = createLegacyAuthAdapters(options);

    const { region, accountId } = config.ecr;

    const { credentialsManager } = options;

    let credentialProvider: AwsCredentialIdentityProvider;

    if (accountId) {
      credentialProvider = (
        await credentialsManager.getCredentialProvider({ accountId })
      ).sdkCredentialProvider;
    } else {
      credentialProvider = (await credentialsManager.getCredentialProvider())
        .sdkCredentialProvider;
    }

    const ecrClient = new ECRClient({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider,
    });

    return new EcrAwsService(
      options.logger,
      auth,
      options.catalogApi,
      ecrClient,
      config,
    );
  }
  async listEcrImages(
    req: AwsEcrListImagesRequest,
  ): Promise<AwsEcrListImagesResponse> {

    const images = await this.ecrClient.send(
      new DescribeImagesCommand({
        repositoryName: req.componentKey,
        maxResults: 1000,
      }),
    );

    return {
      items: images.imageDetails as ImageDetail[],
    };
  }

  async listScanResults(
    req: AwsEcrListScanResultsRequest,
  ):  Promise<AwsEcrListScanResultsResponse> {
    const results = await this.ecrClient.send(
      new DescribeImageScanFindingsCommand({
        imageId: {
          imageDigest: req.imageDigest,
          imageTag: req.imageTag,
        },
        repositoryName: req.componentKey,
        maxResults: 1000,
      }),
    );

    return {
      results: results.imageScanFindings as ImageScanFindings
    }
  }

}

export const costInsightsAwsServiceRef =
  createServiceRef<EcrScanAwsService>({
    id: 'ecr-aws.api',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {
          logger: coreServices.logger,
          config: coreServices.rootConfig,
          catalogApi: catalogServiceRef,
          auth: coreServices.auth,
          discovery: coreServices.discovery,
          httpAuth: coreServices.httpAuth,
        },
        async factory({
          logger,
          config,
          catalogApi,
          auth,
          httpAuth,
          discovery,
        }) {
          const pluginConfig = readEcrConfig(config);

          const impl = await EcrAwsService.fromConfig(
            pluginConfig,
            {
              catalogApi,
              auth,
              httpAuth,
              discovery,
              logger,
              credentialsManager:
                DefaultAwsCredentialsManager.fromConfig(config),
            },
          );

          return impl;
        },
      }),
  });
