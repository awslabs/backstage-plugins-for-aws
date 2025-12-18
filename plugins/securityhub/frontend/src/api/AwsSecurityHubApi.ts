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

import { AwsSecurityFinding } from '@aws-sdk/client-securityhub';
import { createApiRef } from '@backstage/core-plugin-api';
import type { CompoundEntityRef } from '@backstage/catalog-model';
import { AssistantResponse } from '@aws/aws-securityhub-plugin-for-backstage-common';

export const awsSecurityHubApiRef = createApiRef<AwsSecurityHubApi>({
  id: 'plugin.aws-securityhub.service',
});

export interface AwsSecurityHubApi {
  getFindingsByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<AwsSecurityFinding[]>;

  assistant({
    entity,
    findingId,
  }: {
    entity: CompoundEntityRef;
    findingId: string;
  }): Promise<AssistantResponse>;
}
