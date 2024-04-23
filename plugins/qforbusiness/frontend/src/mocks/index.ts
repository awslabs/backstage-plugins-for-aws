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

import { CompoundEntityRef, Entity } from '@backstage/catalog-model';
import { AmazonEcsApi } from '../api';
import {
  AWS_ECS_SERVICE_TAGS_ANNOTATION,
  ServicesResponse,
  mockEcsCluster,
  mockEcsService,
  mockEcsTask,
} from '@aws/amazon-ecs-plugin-for-backstage-common';

export class MockAmazonEcsApiClient implements AmazonEcsApi {
  // @ts-ignore
  getServicesByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<ServicesResponse> {
    return Promise.resolve({
      clusters: [
        {
          cluster: mockEcsCluster('cluster1'),
          services: [
            {
              service: mockEcsService('service1', 'cluster1', 1, 1, 0),
              tasks: [mockEcsTask('service1', 'cluster1')],
            },
          ],
        },
      ],
    });
  }
}

export const mockEntity: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backstage',
    description: 'backstage.io',
    annotations: {
      [AWS_ECS_SERVICE_TAGS_ANNOTATION]: 'component=test',
    },
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};
