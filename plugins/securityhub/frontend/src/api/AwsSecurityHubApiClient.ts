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

import type { CompoundEntityRef } from '@backstage/catalog-model';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { AwsApiClient } from '@aws/aws-core-plugin-for-backstage-react';
import { AwsSecurityHubApi } from '.';
import { AwsSecurityFinding } from '@aws-sdk/client-securityhub';
import { AssistantResponse } from '@aws/aws-securityhub-plugin-for-backstage-common';

export class AwsSecurityHubApiClient
  extends AwsApiClient
  implements AwsSecurityHubApi
{
  public constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    super({
      backendName: 'aws-securityhub',
      ...options,
    });
  }

  async getFindingsByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<AwsSecurityFinding[]> {
    const urlSegment = `v1/entity/${encodeURIComponent(
      entity.namespace,
    )}/${encodeURIComponent(entity.kind)}/${encodeURIComponent(
      entity.name,
    )}/findings`;

    const findings = await this.get<AwsSecurityFinding[]>(urlSegment);

    return findings;
  }

  async assistant({
    entity,
    finding,
  }: {
    entity: CompoundEntityRef;
    finding: AwsSecurityFinding;
  }): Promise<AssistantResponse> {
    const urlSegment = `v1/entity/${encodeURIComponent(
      entity.namespace,
    )}/${encodeURIComponent(entity.kind)}/${encodeURIComponent(
      entity.name,
    )}/assistant`;

    const baseUrl = await this.discoveryApi.getBaseUrl('aws-securityhub');
    const url = `${baseUrl}/${urlSegment}`;

    const response = await this.fetchApi.fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ finding }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to get AI assistance';
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Ignore JSON parsing errors
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  }
}
