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
  UserInfoService,
} from '@backstage/backend-plugin-api';
import { AgentService } from './types';
import { Config } from '@backstage/config';
import { v4 as uuidv4 } from 'uuid';
import { Toolkit } from '../tools/Toolkit';
import { parseEntityRef } from '@backstage/catalog-model';
import { readAgentsConfig } from '../config/config';
import { Agent } from '../agent/Agent';
import { InvokeAgentTool } from '../tools/invokeAgentTool';
import { AgentTypeFactory } from '@aws/genai-plugin-for-backstage-node';
import {
  ChatEvent,
  GenerateResponse,
} from '@aws/genai-plugin-for-backstage-common';

export class DefaultAgentService implements AgentService {
  public constructor(
    private readonly logger: LoggerService,
    private readonly userInfo: UserInfoService,
    private readonly agents: Map<string, Agent>,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      agentTypeFactories: AgentTypeFactory[];
      toolkit: Toolkit;
      userInfo: UserInfoService;
      logger: LoggerService;
    },
  ) {
    const agentTypeFactoryMap = new Map(
      options.agentTypeFactories.map(factory => [
        factory.getTypeName(),
        factory,
      ]),
    );

    const agentConfigs = readAgentsConfig(config);
    const agents = new Map<string, Agent>();

    const agentTools = agentConfigs.map(e => {
      return new InvokeAgentTool(e.name, e.description);
    });

    options.toolkit.add(...agentTools);

    for (const agentConfig of agentConfigs) {
      let agentTypeFactory: AgentTypeFactory | undefined;

      if (!agentConfig.type) {
        if (agentTypeFactoryMap.size === 1) {
          agentTypeFactory = agentTypeFactoryMap.values().next().value!;
        } else {
          throw new Error(
            `Agent type not specified for agent ${agentConfig.name}`,
          );
        }
      } else {
        agentTypeFactory = agentTypeFactoryMap.get(agentConfig.type);
      }

      if (!agentTypeFactory) {
        throw new Error(`Unknown agent type ${agentConfig.type}`);
      }

      const agent = await Agent.fromConfig(
        agentConfig,
        agentTypeFactory,
        options.toolkit,
        options.logger,
      );

      agents.set(agent.getName(), agent);
    }

    const service = new DefaultAgentService(
      options.logger,
      options.userInfo,
      agents,
    );

    agentTools.forEach(e => e.setAgentService(service));

    return service;
  }

  async stream(
    userMessage: string,
    options: {
      agentName: string;
      sessionId?: string;
      credentials?: BackstageCredentials;
    },
  ): Promise<ReadableStream<ChatEvent>> {
    let realSessionId = options.sessionId;
    let newSession = false;

    if (!realSessionId) {
      realSessionId = this.generateSessionId();
      newSession = true;
    }

    const userEntityRef = await this.getUserEntityRef(options.credentials);

    const agent = this.getActualAgent(options.agentName);

    return agent.stream(userMessage, realSessionId, newSession, userEntityRef, {
      credentials: options.credentials,
    });
  }

  async generate(
    prompt: string,
    options: {
      agentName: string;
      credentials?: BackstageCredentials;
    },
  ): Promise<GenerateResponse> {
    const realSessionId = this.generateSessionId();

    const userEntityRef = await this.getUserEntityRef(options.credentials);

    const agent = this.getActualAgent(options.agentName);

    return agent.generate(prompt, realSessionId, userEntityRef, {
      credentials: options.credentials,
    });
  }

  private getActualAgent(agentName: string): Agent {
    const agent = this.agents.get(agentName);

    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    return agent;
  }

  public getAgent(agent: string): Agent | undefined {
    return this.agents.get(agent);
  }

  private generateSessionId() {
    const sessionId = uuidv4();
    this.logger.info(`Generated session ${sessionId}`);

    return sessionId;
  }

  private async getUserEntityRef(credentials?: BackstageCredentials) {
    const userInfo = await this.userInfo.getUserInfo(credentials!);

    return parseEntityRef(userInfo.userEntityRef);
  }
}
