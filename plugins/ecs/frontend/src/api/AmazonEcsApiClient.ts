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

import { ServicesResponse } from '@aws/amazon-ecs-plugin-for-backstage-common';
import { AwsApiClient } from '@aws/aws-core-plugin-for-backstage-react';
import type { CompoundEntityRef } from '@backstage/catalog-model';
import { AmazonEcsApi } from '.';

export class AmazonEcsApiClient extends AwsApiClient implements AmazonEcsApi {
  public constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    super({
      backendName: 'amazon-ecs',
      ...options,
    });
  }

  async getServicesByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<ServicesResponse> {
    const urlSegment = `v1/entity/${encodeURIComponent(
      entity.namespace,
    )}/${encodeURIComponent(entity.kind)}/${encodeURIComponent(
      entity.name,
    )}/services`;

    const services = await this.get<ServicesResponse>(urlSegment);

    return services;
  }
}
