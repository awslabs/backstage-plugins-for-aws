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
  ChatEvent,
  ChatSession,
  GenerateResponse,
  SyncResponse,
} from '@aws/genai-plugin-for-backstage-common';
import { BackstageCredentials } from '@backstage/backend-plugin-api';
import { Agent } from '../agent/Agent';

export interface AgentService {
  getAgents(): Agent[];

  getAgent(agentName: string): Agent | undefined;

  stream(
    userMessage: string,
    options: {
      agentName: string;
      sessionId?: string;
      credentials: BackstageCredentials;
      signal?: AbortSignal;
    },
  ): Promise<ReadableStream<ChatEvent>>;

  sync(
    userMessage: string,
    options: {
      agentName: string;
      sessionId?: string;
      credentials: BackstageCredentials;
      signal?: AbortSignal;
    },
  ): Promise<SyncResponse>;

  generate(
    prompt: string,
    options: {
      agentName: string;
      credentials?: BackstageCredentials;
      signal?: AbortSignal;
      responseFormat?: Record<string, any>;
    },
  ): Promise<GenerateResponse>;

  createSession(options: {
    agentName: string;
    credentials: BackstageCredentials;
  }): Promise<ChatSession>;

  endSession(options: {
    agentName: string;
    sessionId: string;
    credentials: BackstageCredentials;
  }): Promise<void>;

  getUserSession(options: {
    agentName: string;
    sessionId: string;
    credentials: BackstageCredentials;
  }): Promise<ChatSession | undefined>;
}
