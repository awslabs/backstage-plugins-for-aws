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
  AWS_CODEPIPELINE_TAGS_ANNOTATION,
  PipelineExecutionsResponse,
  PipelineStateResponse,
} from '@aws/aws-codepipeline-plugin-for-backstage-common';

const DEFAULT_EXECUTIONS_LIMIT = 100;

export class DefaultAwsCodePipelineService implements AwsCodePipelineService {
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

    return new DefaultAwsCodePipelineService(
      options.logger,
      options.catalogApi,
      resourceLocator,
      credsManager,
    );
  }

  public async getPipelineExecutionsByEntity(
    entityRef: CompoundEntityRef,
  ): Promise<PipelineExecutionsResponse> {
    this.logger?.debug(`Fetch CodePipeline executions for ${entityRef}`);

    const arns = await this.getPipelineArnsForEntity(entityRef);

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

        const pipelineExecutions: PipelineExecutionSummary[] = [];

        for await (const page of paginator) {
          const executions = page.pipelineExecutionSummaries || [];

          if (
            pipelineExecutions.length + executions.length >
            DEFAULT_EXECUTIONS_LIMIT
          ) {
            pipelineExecutions.push(
              ...executions.slice(
                0,
                DEFAULT_EXECUTIONS_LIMIT - pipelineExecutions.length,
              ),
            );
          } else {
            pipelineExecutions.push(...executions);
          }

          if (pipelineExecutions.length === DEFAULT_EXECUTIONS_LIMIT) {
            break;
          }
        }

        return {
          pipelineName,
          pipelineRegion: region,
          pipelineArn: arn,
          pipelineExecutions,
        };
      }),
    );

    return {
      pipelineExecutions,
    };
  }

  public async getPipelineStateByEntity(
    entityRef: CompoundEntityRef,
  ): Promise<PipelineStateResponse> {
    this.logger?.debug(`Fetch CodePipeline state for ${entityRef}`);

    const arns = await this.getPipelineArnsForEntity(entityRef);

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

  private async getPipelineArnsForEntity(
    entityRef: CompoundEntityRef,
  ): Promise<string[]> {
    const entity = await this.catalogApi.getEntityByRef(entityRef);

    if (!entity) {
      throw new Error(`Failed to find entity ${JSON.stringify(entityRef)}`);
    }

    const annotation = getOneOfEntityAnnotations(entity, [
      AWS_CODEPIPELINE_ARN_ANNOTATION,
      AWS_CODEPIPELINE_TAGS_ANNOTATION,
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
      customUserAgent: 'aws-codepipeline-plugin-for-backstage',
      credentialDefaultProvider: () => credentialProvider.sdkCredentialProvider,
    });
  }
}
