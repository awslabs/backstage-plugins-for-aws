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

import { ProjectsResponse } from '@aws/aws-codebuild-plugin-for-backstage-common';
import { AwsApiClient } from '@aws/aws-core-plugin-for-backstage-react';
import type { CompoundEntityRef } from '@backstage/catalog-model';
import { AwsCodeBuildApi } from '.';

export class AwsCodeBuildApiClient
  extends AwsApiClient
  implements AwsCodeBuildApi
{
  public constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    super({
      backendName: 'aws-codebuild',
      ...options,
    });
  }

  public async getProjectsByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<ProjectsResponse> {
    const urlSegment = `v1/entity/${encodeURIComponent(
      entity.namespace,
    )}/${encodeURIComponent(entity.kind)}/${encodeURIComponent(
      entity.name,
    )}/projects`;

    const services = await this.get<ProjectsResponse>(urlSegment);

    return services;
  }
}
