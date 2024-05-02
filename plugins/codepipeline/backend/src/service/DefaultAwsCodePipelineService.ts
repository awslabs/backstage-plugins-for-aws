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
import { AwsCodePipelineService } from './types';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { Config } from '@backstage/config';
import {
  CodePipelineClient,
  GetPipelineStateCommand,
  PipelineExecutionSummary,
  paginateListPipelineExecutions,
} from '@aws-sdk/client-codepipeline';
import {
  AWS_CODEPIPELINE_ARN_ANNOTATION,
  AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY,
  AWS_CODEPIPELINE_TAGS_ANNOTATION,
  PipelineExecutionsResponse,
  PipelineStateResponse,
} from '@aws/aws-codepipeline-plugin-for-backstage-common';
import {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
  HttpAuthService,
} from '@backstage/backend-plugin-api';
import { createLegacyAuthAdapters } from '@backstage/backend-common';

const DEFAULT_EXECUTIONS_LIMIT = 100;

export class DefaultAwsCodePipelineService implements AwsCodePipelineService {
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

    return new DefaultAwsCodePipelineService(
      options.logger,
      auth,
      options.catalogApi,
      resourceLocator,
      credsManager,
    );
  }

  public async getPipelineExecutionsByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<PipelineExecutionsResponse> {
    this.logger?.debug(`Fetch CodePipeline state for ${options.entityRef}`);

    const arns = await this.getPipelineArnsForEntity(options);

    const pipelineExecutions = await Promise.all(
      arns.map(async arn => {
        const { region, resource } = parse(arn);

        const pipelineName = resource;

        const client = await this.getClient(region, arn);
        const paginatorConfig = {
          client,
          pageSize: 25,
        };
        const commandParams = {
          pipelineName,
        };
        const paginator = paginateListPipelineExecutions(
          paginatorConfig,
          commandParams,
        );

        const pipelineExecutionSummaries: PipelineExecutionSummary[] = [];

        for await (const page of paginator) {
          const executions = page.pipelineExecutionSummaries || [];

          if (
            pipelineExecutionSummaries.length + executions.length >
            DEFAULT_EXECUTIONS_LIMIT
          ) {
            pipelineExecutionSummaries.push(
              ...executions.slice(
                0,
                DEFAULT_EXECUTIONS_LIMIT - pipelineExecutionSummaries.length,
              ),
            );
          } else {
            pipelineExecutionSummaries.push(...executions);
          }

          if (pipelineExecutionSummaries.length === DEFAULT_EXECUTIONS_LIMIT) {
            break;
          }
        }

        return {
          pipelineName,
          pipelineRegion: region,
          pipelineArn: arn,
          pipelineExecutions: pipelineExecutionSummaries,
        };
      }),
    );

    return {
      pipelineExecutions,
    };
  }

  public async getPipelineStateByEntity(options: {
    entityRef: CompoundEntityRef;
    credentials?: BackstageCredentials;
  }): Promise<PipelineStateResponse> {
    this.logger?.debug(`Fetch CodePipeline state for ${options.entityRef}`);

    const arns = await this.getPipelineArnsForEntity(options);

    const pipelines = await Promise.all(
      arns.map(async arn => {
        const { region, resource } = parse(arn);

        const pipelineName = resource;

        const client = await this.getClient(region, arn);
        const pipelineState = await client.send(
          new GetPipelineStateCommand({
            name: pipelineName,
          }),
        );

        return {
          pipelineName,
          pipelineRegion: region,
          pipelineArn: arn,
          pipelineState,
        };
      }),
    );

    return {
      pipelines,
    };
  }

  private async getPipelineArnsForEntity(options: {
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
      AWS_CODEPIPELINE_ARN_ANNOTATION,
      AWS_CODEPIPELINE_TAGS_ANNOTATION,
      AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY,
    ]);

    if (!annotation) {
      throw new Error('Annotation not found on entity');
    }

    let arns: string[];

    if (annotation.name === AWS_CODEPIPELINE_TAGS_ANNOTATION) {
      arns = await this.resourceLocator.getResourceArns({
        resourceType: 'AWS::CodePipeline::Pipeline',
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
  ): Promise<CodePipelineClient> {
    const credentialProvider = await this.credsManager.getCredentialProvider({
      arn,
    });

    return new CodePipelineClient({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider.sdkCredentialProvider,
    });
  }
}
