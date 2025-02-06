/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
import { AmazonEcrApi } from './AwsEcrApi';
import { CompoundEntityRef } from '@backstage/catalog-model';
import {
  EcrImageScanFindingsResponse,
  EcrImagesResponse,
} from '@aws/amazon-ecr-plugin-for-backstage-common';

export class AwsEcrClient implements AmazonEcrApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;

  public constructor(options: {
    discoveryApi: DiscoveryApi;
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
  }
  public async listEcrImages({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<EcrImagesResponse> {
    const urlSegment = `v1/entity/${encodeURIComponent(
      entity.namespace,
    )}/${encodeURIComponent(entity.kind)}/${encodeURIComponent(
      entity.name,
    )}/images`;

    const items = await this.get<EcrImagesResponse>(urlSegment);

    return items;
  }

  public async listScanResults({
    entity,
    repository,
    digest,
  }: {
    entity: CompoundEntityRef;
    repository: string;
    digest: string;
  }): Promise<EcrImageScanFindingsResponse> {
    const urlSegment = `v1/entity/${encodeURIComponent(
      entity.namespace,
    )}/${encodeURIComponent(entity.kind)}/${encodeURIComponent(
      entity.name,
    )}/findings/${encodeURIComponent(repository)}/${encodeURIComponent(
      digest,
    )}`;

    const results = await this.get<EcrImageScanFindingsResponse>(urlSegment);

    return results;
  }

  private async get<T>(path: string): Promise<T> {
    const baseUrl = `${await this.discoveryApi.getBaseUrl('amazon-ecr')}/`;
    const url = new URL(path, baseUrl);

    const { token: idToken } = await this.identityApi.getCredentials();
    const response = await fetch(url.toString(), {
      headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
    });

    if (!response.ok) {
      throw Error(response.statusText);
    }

    return response.json() as Promise<T>;
  }
}
