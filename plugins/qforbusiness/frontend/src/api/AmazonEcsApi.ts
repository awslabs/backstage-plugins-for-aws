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

import { ServicesResponse } from '@aws/amazon-ecs-plugin-for-backstage-common';
import { createApiRef } from '@backstage/core-plugin-api';
import type { CompoundEntityRef } from '@backstage/catalog-model';

export const amazonEcsApiRef = createApiRef<AmazonEcsApi>({
  id: 'plugin.amazon-ecs.service',
});

export interface AmazonEcsApi {
  getServicesByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<ServicesResponse>;
}
