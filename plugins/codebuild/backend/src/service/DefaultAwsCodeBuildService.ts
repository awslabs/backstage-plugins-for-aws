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
} from '@aws/aws-core-plugin-for-backstage-common';
import { AwsCredentialsManager } from '@backstage/integration-aws-node';
import { CompoundEntityRef } from '@backstage/catalog-model';
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
  AWS_CODEBUILD_TAGS_ANNOTATION,
  ProjectsResponse,
} from '@aws/aws-codebuild-plugin-for-backstage-common';

export class DefaultAwsCodeBuildService implements AwsCodeBuildService {
  public constructor(
    private readonly logger: Logger,
    private readonly catalogApi: CatalogApi,
    private readonly resourceLocator: AwsResourceLocator,
    private readonly credsManager: AwsCredentialsManager,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      catalogApi: CatalogApi;
      logger: Logger;
      resourceLocator?: AwsResourceLocator;
    },
  ) {
    const credsManager = DefaultAwsCredentialsManager.fromConfig(config);

    const resourceLocator =
      options?.resourceLocator ??
      (await AwsResourceLocatorFactory.fromConfig(config, options.logger));

    return new DefaultAwsCodeBuildService(
      options.logger,
      options.catalogApi,
      resourceLocator,
      credsManager,
    );
  }

  public async getProjectsByEntity(
    entityRef: CompoundEntityRef,
  ): Promise<ProjectsResponse> {
    this.logger?.debug(`Fetch CodeBuild projects for ${entityRef}`);

    const arns = await this.getCodeBuildArnsForEntity(entityRef);

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

        if (buildIds.ids) {
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

  private async getCodeBuildArnsForEntity(
    entityRef: CompoundEntityRef,
  ): Promise<string[]> {
    const entity = await this.catalogApi.getEntityByRef(entityRef);

    if (!entity) {
      throw new Error(`Failed to find entity ${JSON.stringify(entityRef)}`);
    }

    const annotation = getOneOfEntityAnnotations(entity, [
      AWS_CODEBUILD_ARN_ANNOTATION,
      AWS_CODEBUILD_TAGS_ANNOTATION,
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
      customUserAgent: 'aws-codebuild-plugin-for-backstage',
      credentialDefaultProvider: () => credentialProvider.sdkCredentialProvider,
    });
  }
}
