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

import {
  AgentRequestOptions,
  GenerateRequest,
  GenerateResponse,
} from './types';
import fetch from 'cross-fetch';
import * as parser from 'uri-template';

const PLUGIN_ID = 'aws-genai';

export interface AgentClient {
  generate(
    request: GenerateRequest,
    options: AgentRequestOptions,
  ): Promise<GenerateResponse>;
}

export class DefaultAgentClient implements AgentClient {
  constructor(
    private readonly discoveryApi: {
      getBaseUrl(pluginId: string): Promise<string>;
    },
  ) {}

  async generate(
    request: GenerateRequest,
    options?: AgentRequestOptions,
  ): Promise<GenerateResponse> {
    const baseUrl = await this.discoveryApi.getBaseUrl(PLUGIN_ID);

    const uriTemplate = `/v1/generate`;

    const uri = parser.parse(uriTemplate).expand({});

    const response = await fetch(`${baseUrl}${uri}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.token && { Authorization: `Bearer ${options?.token}` }),
      },
      method: 'POST',
      body: JSON.stringify(request),
    });

    return response.json() as Promise<GenerateResponse>;
  }
}
