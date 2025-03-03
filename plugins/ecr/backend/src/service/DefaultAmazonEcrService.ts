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
  DescribeImageScanFindingsCommand,
  ECRClient,
  ImageDetail,
  paginateDescribeImages,
} from '@aws-sdk/client-ecr';
import { CatalogApi } from '@backstage/catalog-client';
import {
  AWS_SDK_CUSTOM_USER_AGENT,
  getOneOfEntityAnnotations,
} from '@aws/aws-core-plugin-for-backstage-common';
import {
  EcrImagesResponse,
  AMAZON_ECR_ARN_ANNOTATION,
  AMAZON_ECR_TAGS_ANNOTATION,
  EcrImageScanFindingsResponse,
} from '@aws/amazon-ecr-plugin-for-backstage-common';
import { AmazonEcrService } from './types';
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
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import {
  CompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import {
  AwsResourceLocator,
  AwsResourceLocatorFactory,
} from '@aws/aws-core-plugin-for-backstage-node';
import { Config } from '@backstage/config/index';
import { parse } from '@aws-sdk/util-arn-parser';
import { EcrConfig, readEcrConfig } from '../config';

export class DefaultAmazonEcrService implements AmazonEcrService {
  public constructor(
    private readonly auth: AuthService,
    private readonly catalogApi: CatalogApi,
    private readonly resourceLocator: AwsResourceLocator,
    private readonly credsManager: AwsCredentialsManager,
    private readonly config: EcrConfig,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      catalogApi: CatalogApi;
      discovery: DiscoveryService;
      auth?: AuthService;
      httpAuth?: HttpAuthService;
      logger: LoggerService;
      resourceLocator?: AwsResourceLocator;
    },
  ) {
    const credsManager = DefaultAwsCredentialsManager.fromConfig(config);

    const { auth } = createLegacyAuthAdapters(options);

    const resourceLocator =
      options?.resourceLocator ??
      (await AwsResourceLocatorFactory.fromConfig(config, options.logger));

    return new DefaultAmazonEcrService(
      auth,
      options.catalogApi,
      resourceLocator,
      credsManager,
      readEcrConfig(config),
    );
  }

  async listEcrImages({
    entityRef,
    credentials,
  }: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<EcrImagesResponse> {
    const arns = await this.getRepositoryArnsForEntity({
      entityRef,
      credentials,
    });

    const repositories = await Promise.all(
      arns.map(async arn => {
        const { region, resource } = parse(arn);

        const repositoryName = this.getRepositoryName(resource);

        const client = await this.getClient(region, arn);
        const paginatorConfig = {
          client,
          pageSize: 25,
        };
        const commandParams = {
          repositoryName,
        };
        const paginator = paginateDescribeImages(
          paginatorConfig,
          commandParams,
        );

        const repositoryImages: ImageDetail[] = [];

        for await (const page of paginator) {
          const images = page.imageDetails || [];

          if (repositoryImages.length + images.length > this.config.maxImages) {
            repositoryImages.push(
              ...images.slice(
                0,
                this.config.maxImages - repositoryImages.length,
              ),
            );
          } else {
            repositoryImages.push(...images);
          }

          if (repositoryImages.length === this.config.maxImages) {
            break;
          }
        }

        return {
          repositoryName,
          repositoryRegion: region,
          repositoryArn: arn,
          images: repositoryImages.sort((a: ImageDetail, b: ImageDetail) => {
            if (a.imagePushedAt === undefined) {
              return 1;
            }

            if (b.imagePushedAt === undefined) {
              return -1;
            }
            const a1 = new Date(a.imagePushedAt).getTime();
            const b1 = new Date(b.imagePushedAt).getTime();

            return b1 - a1;
          }),
        };
      }),
    );

    return {
      repositories,
    };
  }

  async listScanResults({
    entityRef,
    credentials,
    arn,
    digest,
  }: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
    arn: string;
    digest: string;
  }): Promise<EcrImageScanFindingsResponse> {
    const arns = await this.getRepositoryArnsForEntity({
      entityRef,
      credentials,
    });

    if (arns.indexOf(arn) < 0) {
      throw new Error('Repository ARN not found for entity');
    }

    const { region, resource, accountId } = parse(arn);

    const repositoryName = this.getRepositoryName(resource);

    const client = await this.getClient(region, arn);

    const response = await client.send(
      new DescribeImageScanFindingsCommand({
        repositoryName,
        registryId: accountId,
        imageId: {
          imageDigest: digest,
        },
        maxResults: this.config.maxScanFindings,
      }),
    );

    return {
      findings: response.imageScanFindings || {},
    };
  }

  private async getRepositoryArnsForEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<string[]> {
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
      AMAZON_ECR_ARN_ANNOTATION,
      AMAZON_ECR_TAGS_ANNOTATION,
    ]);

    if (!annotation) {
      throw new Error('Annotation not found on entity');
    }

    let arns: string[];

    if (annotation.name === AMAZON_ECR_TAGS_ANNOTATION) {
      arns = await this.resourceLocator.getResourceArns({
        resourceType: 'AWS::ECR::Repository',
        tagString: annotation.value,
      });
    } else {
      arns = [annotation.value];
    }

    return Promise.resolve(arns);
  }

  private async getClient(region: string, arn: string): Promise<ECRClient> {
    const credentialProvider = await this.credsManager.getCredentialProvider({
      arn,
    });

    return new ECRClient({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider.sdkCredentialProvider,
    });
  }

  private getRepositoryName(resource: string) {
    return resource.split('/').slice(1).join('/');
  }
}

export const amazonEcrServiceRef = createServiceRef<AmazonEcrService>({
  id: 'amazon-ecr.api',
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
      async factory({ logger, config, catalogApi, auth, httpAuth, discovery }) {
        const impl = await DefaultAmazonEcrService.fromConfig(config, {
          catalogApi,
          auth,
          httpAuth,
          discovery,
          logger,
        });

        return impl;
      },
    }),
});
