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

import { Logger } from 'winston';
import { parse } from '@aws-sdk/util-arn-parser';
import { CatalogApi } from '@backstage/catalog-client';
import {
  AwsResourceLocatorFactory,
  AwsResourceLocator,
  getOneOfEntityAnnotations,
  AWS_SDK_CUSTOM_USER_AGENT,
} from '@aws/aws-core-plugin-for-backstage-common';
import { AwsCredentialsManager } from '@backstage/integration-aws-node';
import {
  CompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { AwsCodeBuildService } from './types';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { Config } from '@backstage/config';
import {
  BatchGetBuildsCommand,
  BatchGetProjectsCommand,
  Build,
  CodeBuildClient,
  ListBuildsForProjectCommand,
} from '@aws-sdk/client-codebuild';
import {
  AWS_CODEBUILD_ARN_ANNOTATION,
  AWS_CODEBUILD_ARN_ANNOTATION_LEGACY,
  AWS_CODEBUILD_TAGS_ANNOTATION,
  ProjectsResponse,
} from '@aws/aws-codebuild-plugin-for-backstage-common';
import {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
  HttpAuthService,
} from '@backstage/backend-plugin-api';
import { createLegacyAuthAdapters } from '@backstage/backend-common';

export class DefaultAwsCodeBuildService implements AwsCodeBuildService {
  public constructor(
    private readonly logger: Logger,
    private readonly auth: AuthService,
    private readonly catalogApi: CatalogApi,
    private readonly resourceLocator: AwsResourceLocator,
    private readonly credsManager: AwsCredentialsManager,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      catalogApi: CatalogApi;
      discovery: DiscoveryService;
      auth?: AuthService;
      httpAuth?: HttpAuthService;
      logger: Logger;
      resourceLocator?: AwsResourceLocator;
    },
  ) {
    const credsManager = DefaultAwsCredentialsManager.fromConfig(config);

    const { auth } = createLegacyAuthAdapters(options);

    const resourceLocator =
      options?.resourceLocator ??
      (await AwsResourceLocatorFactory.fromConfig(config, options.logger));

    return new DefaultAwsCodeBuildService(
      options.logger,
      auth,
      options.catalogApi,
      resourceLocator,
      credsManager,
    );
  }

  public async getProjectsByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<ProjectsResponse> {
    this.logger?.debug(`Fetch CodeBuild projects for ${options.entityRef}`);

    const arns = await this.getCodeBuildArnsForEntity(options);

    const projects = await Promise.all(
      arns.map(async arn => {
        const { region, accountId, resource } = parse(arn);

        const projectName = resource.split('/')[1];

        const client = await this.getClient(region, arn);
        const projectResponse = await client.send(
          new BatchGetProjectsCommand({
            names: [projectName],
          }),
        );

        const project = projectResponse.projects![0];

        const buildIds = await client.send(
          new ListBuildsForProjectCommand({
            projectName,
          }),
        );

        let builds: Build[] = [];

        if (buildIds.ids && buildIds.ids.length > 0) {
          const output = await client.send(
            new BatchGetBuildsCommand({
              ids: buildIds.ids.slice(0, 5),
            }),
          );
          builds = output.builds ?? [];
        }

        return {
          project,
          projectName,
          projectRegion: region,
          projectAccountId: accountId,
          builds,
        };
      }),
    );

    return {
      projects,
    };
  }

  private async getCodeBuildArnsForEntity(options: {
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
      AWS_CODEBUILD_ARN_ANNOTATION,
      AWS_CODEBUILD_TAGS_ANNOTATION,
      AWS_CODEBUILD_ARN_ANNOTATION_LEGACY,
    ]);

    if (!annotation) {
      throw new Error('Annotation not found on entity');
    }

    let arns: string[];

    if (annotation.name === AWS_CODEBUILD_TAGS_ANNOTATION) {
      arns = await this.resourceLocator.getResourceArns({
        resourceType: 'AWS::CodeBuild::Project',
        tagString: annotation.value,
      });
    } else {
      arns = [annotation.value];
    }

    return Promise.resolve(arns);
  }

  private async getClient(
    region: string,
    arn: string,
  ): Promise<CodeBuildClient> {
    const credentialProvider = await this.credsManager.getCredentialProvider({
      arn,
    });

    return new CodeBuildClient({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider.sdkCredentialProvider,
    });
  }
}
