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

import { AwsApiClient } from '@aws/aws-core-plugin-for-backstage-react';
import { ChatSyncResponse } from '@aws/amazon-bedrock-plugin-for-backstage-common';
import { AmazonBedrockAgentApi } from './AmazonBedrockAgentApi';

export class AmazonBedrockAgentApiClient
  extends AwsApiClient
  implements AmazonBedrockAgentApi
{
  public constructor(options: {
    discoveryApi: DiscoveryApi;
    fetchApi: FetchApi;
  }) {
    super({
      backendName: 'amazon-bedrock',
      ...options,
    });
  }

  async chatSync({
    userMessage,
    sessionId,
  }: {
    userMessage: string;
    sessionId: string | undefined;
  }): Promise<ChatSyncResponse> {
    return await this.post<ChatSyncResponse>('v1/agents/chat', {
      userMessage,
      sessionId,
    });
  }
}
