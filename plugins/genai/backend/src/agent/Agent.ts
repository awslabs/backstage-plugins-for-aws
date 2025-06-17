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

import { Toolkit } from '../tools/Toolkit';
import {
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { StructuredToolInterface } from '@langchain/core/tools';
import { CompoundEntityRef } from '@backstage/catalog-model';
import {
  AgentConfig,
  AgentType,
  AgentTypeFactory,
} from '@aws/genai-plugin-for-backstage-node';
import {
  ChatEvent,
  GenerateResponse,
} from '@aws/genai-plugin-for-backstage-common';

export class Agent {
  constructor(
    private readonly name: string,
    private readonly description: string,
    private readonly agentType: AgentType,
    private readonly logger: LoggerService,
  ) {}

  static async fromConfig(
    agentConfig: AgentConfig,
    agentTypeFactory: AgentTypeFactory,
    toolkit: Toolkit,
    logger: LoggerService,
  ): Promise<Agent> {
    const tools: StructuredToolInterface[] = [];

    logger.info(
      `Creating agent '${agentConfig.name}' with tools ${JSON.stringify(
        agentConfig.tools,
      )}`,
    );

    for (const toolName of agentConfig.tools) {
      const tool = toolkit.getToolByName(toolName);

      if (!tool) {
        throw new Error(`Unknown tool ${toolName}`);
      }

      tools.push(tool);
    }

    const agentType = await agentTypeFactory.create(agentConfig, tools);

    return new Agent(
      agentConfig.name,
      agentConfig.description,
      agentType,
      logger,
    );
  }

  public getName() {
    return this.name;
  }

  public getDescription() {
    return this.description;
  }

  public async stream(
    userMessage: string,
    sessionId: string,
    newSession: boolean,
    options: {
      userEntityRef?: CompoundEntityRef;
      credentials: BackstageCredentials;
    },
  ): Promise<ReadableStream<ChatEvent>> {
    return this.agentType.stream(
      userMessage,
      sessionId,
      newSession,
      this.logger,
      options,
    );
  }

  public async generate(
    prompt: string,
    sessionId: string,
    options: {
      userEntityRef?: CompoundEntityRef;
      responseSchema?: any;
      credentials: BackstageCredentials;
    },
  ): Promise<GenerateResponse> {
    return this.agentType.generate(prompt, sessionId, this.logger, options);
  }
}
