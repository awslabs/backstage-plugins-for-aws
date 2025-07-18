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
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { CompoundEntityRef } from '@backstage/catalog-model';
import { StructuredToolInterface } from '@langchain/core/tools';
import {
  ChatEvent,
  GenerateResponse,
} from '@aws/genai-plugin-for-backstage-common';
import { Config } from '@backstage/config';

export interface AgentType {
  stream(
    userMessage: string,
    sessionId: string,
    newSession: boolean,
    logger: LoggerService,
    options: {
      userEntityRef?: CompoundEntityRef;
      credentials: BackstageCredentials;
    },
  ): Promise<ReadableStream<ChatEvent>>;

  generate(
    prompt: string,
    sessionId: string,
    logger: LoggerService,
    options: {
      responseFormat?: Record<string, any>;
      userEntityRef?: CompoundEntityRef;
      credentials: BackstageCredentials;
    },
  ): Promise<GenerateResponse>;
}

export interface AgentTypeFactory {
  create(
    agentConfig: AgentConfig,
    tools: StructuredToolInterface[],
  ): Promise<AgentType>;

  getTypeName(): string;
}

export interface AgentConfig {
  name: string;
  description: string;
  prompt: string;
  type?: string;
  tools: string[];
  config: Config;
}
