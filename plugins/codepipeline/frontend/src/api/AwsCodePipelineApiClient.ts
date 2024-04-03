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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

import {
  PipelineExecutionsResponse,
  PipelineStateResponse,
} from '@aws/aws-codepipeline-plugin-for-backstage-common';
import { AwsApiClient } from '@aws/aws-core-plugin-for-backstage-react';
import type { CompoundEntityRef } from '@backstage/catalog-model';
import { AwsCodePipelineApi } from '.';

export class AwsCodePipelineApiClient
  extends AwsApiClient
  implements AwsCodePipelineApi
{
  public constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    super({
      backendName: 'aws-codepipeline',
      ...options,
    });
  }

  public async getPipelineExecutionsByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<PipelineExecutionsResponse> {
    const urlSegment = `v1/entity/${encodeURIComponent(
      entity.namespace,
    )}/${encodeURIComponent(entity.kind)}/${encodeURIComponent(
      entity.name,
    )}/executions`;

    const services = await this.get<PipelineExecutionsResponse>(urlSegment);

    return services;
  }

  public async getPipelineStateByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<PipelineStateResponse> {
    const urlSegment = `v1/entity/${encodeURIComponent(
      entity.namespace,
    )}/${encodeURIComponent(entity.kind)}/${encodeURIComponent(
      entity.name,
    )}/state`;

    const services = await this.get<PipelineStateResponse>(urlSegment);

    return services;
  }
}
