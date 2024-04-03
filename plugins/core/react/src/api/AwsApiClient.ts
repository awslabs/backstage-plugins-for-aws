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

import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

import { ResponseError } from '@backstage/errors';

export abstract class AwsApiClient {
  private readonly backendName: string;
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  public constructor(options: {
    backendName: string;
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    this.backendName = options.backendName;
    this.fetchApi = options.fetchApi;
    this.discoveryApi = options.discoveryApi;
  }

  private async getBaseUrl(): Promise<string> {
    return this.discoveryApi.getBaseUrl(this.backendName);
  }

  protected async get<T>(path: string): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}/${path}`;

    const response = await this.fetchApi.fetch(url);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json() as Promise<T>;
  }
}
