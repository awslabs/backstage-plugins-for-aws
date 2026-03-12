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

import { createApiRef } from '@backstage/core-plugin-api';
import {
  ChatEvent,
  ChatRequest,
  ChatSession,
  EndSessionRequest,
} from '@aws/genai-plugin-for-backstage-common';

export const agentApiRef = createApiRef<AgentApi>({
  id: 'plugin.aws-genai-agent.service',
});

export interface AgentApi {
  chatSync(
    request: ChatRequest,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatEvent>;

  endSession(request: EndSessionRequest): Promise<void>;

  getUserSession(
    agent: string,
    sessionId: string,
  ): Promise<ChatSession | undefined>;
}
