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
import { ToolInterface } from '@langchain/core/tools';
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
import { ActionsService } from '@backstage/backend-plugin-api/alpha';
import {
  PeerAgentTool,
  PeerAgentToolInstance,
} from '@aws/genai-plugin-for-backstage-node';

export class Agent {
  constructor(
    private readonly agentConfig: AgentConfig,
    private readonly agentType: AgentType,
    private readonly logger: LoggerService,
    private readonly actions: ActionsService,
  ) {}

  static async fromConfig(
    agentConfig: AgentConfig,
    agentTypeFactory: AgentTypeFactory,
    toolkit: Toolkit,
    actions: ActionsService,
    logger: LoggerService,
  ): Promise<Agent> {
    const tools: ToolInterface[] = [];

    logger.info(`Creating agent '${agentConfig.name}'`);

    for (let toolName of agentConfig.tools) {
      if (toolName.startsWith('agent:')) {
        const agentName = toolName.split(':')[1];

        toolName = `agent-${agentName}`;
      }

      const tool = toolkit.getToolByName(toolName);

      if (!tool) {
        throw new Error(`Unknown tool ${toolName}`);
      }

      tools.push(tool);
    }

    const agentType = await agentTypeFactory.create(agentConfig, tools);

    return new Agent(agentConfig, agentType, logger, actions);
  }

  public getName() {
    return this.agentConfig.name;
  }

  public getDescription() {
    return this.agentConfig.description;
  }

  public async stream(
    userMessage: string,
    sessionId: string,
    newSession: boolean,
    peerAgentTools: PeerAgentTool[],
    options: {
      userEntityRef?: CompoundEntityRef;
      credentials: BackstageCredentials;
      signal?: AbortSignal;
    },
  ): Promise<ReadableStream<ChatEvent>> {
    const { credentials, signal } = options;

    return this.agentType.stream(
      userMessage,
      sessionId,
      newSession,
      await this.getAgentActions(credentials),
      this.getPeerAgentTools(peerAgentTools, credentials, signal),
      this.logger,
      options,
    );
  }

  public async generate(
    prompt: string,
    sessionId: string,
    peerAgentTools: PeerAgentTool[],
    options: {
      responseFormat?: Record<string, any>;
      userEntityRef?: CompoundEntityRef;
      responseSchema?: any;
      credentials: BackstageCredentials;
      signal?: AbortSignal;
    },
  ): Promise<GenerateResponse> {
    const { credentials, signal } = options;

    return this.agentType.generate(
      prompt,
      sessionId,
      await this.getAgentActions(credentials),
      this.getPeerAgentTools(peerAgentTools, credentials, signal),
      this.logger,
      options,
    );
  }

  private async getAgentActions(credentials: BackstageCredentials) {
    const actionList = await this.actions.list({ credentials });
    const actionNames = [...this.agentConfig.actions];

    const actions = actionList.actions.filter(action => {
      const index = actionNames.indexOf(action.name);

      if (index >= 0) {
        actionNames.splice(index, 1);

        return true;
      }

      return false;
    });
    actionNames.forEach(name => {
      this.logger.warn(`Action ${name} not found`);
    });

    return actions;
  }

  private getPeerAgentTools(
    tools: PeerAgentTool[],
    credentials: BackstageCredentials,
    signal?: AbortSignal,
  ) {
    return tools
      .filter(t => this.agentConfig.peerAgents.includes(t.getName()))
      .map(t => new PeerAgentToolInstance(t, credentials, signal));
  }
}
