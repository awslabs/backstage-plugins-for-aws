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
  BackstageServicePrincipal,
  BackstageUserPrincipal,
  LoggerService,
  UserInfoService,
} from '@backstage/backend-plugin-api';
import { AgentService } from './types';
import { Config } from '@backstage/config';
import { v4 as uuidv4 } from 'uuid';
import { Toolkit } from '../tools/Toolkit';
import { CompoundEntityRef, parseEntityRef } from '@backstage/catalog-model';
import { readAgentsConfig } from '../config/config';
import { Agent } from '../agent/Agent';
import { InvokeAgentTool } from '../tools/invokeAgentTool';
import { AgentTypeFactory } from '@aws/genai-plugin-for-backstage-node';
import {
  ChatEvent,
  ChatSession,
  GenerateResponse,
  SyncResponse,
} from '@aws/genai-plugin-for-backstage-common';
import { SessionStore } from '../database';

export class DefaultAgentService implements AgentService {
  public constructor(
    private readonly logger: LoggerService,
    private readonly userInfo: UserInfoService,
    private readonly agents: Map<string, Agent>,
    private readonly sessionStore: SessionStore,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      agentTypeFactories: AgentTypeFactory[];
      toolkit: Toolkit;
      userInfo: UserInfoService;
      logger: LoggerService;
      sessionStore: SessionStore;
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
        options.logger.child({
          agent: agentConfig.name,
        }),
      );

      agents.set(agent.getName(), agent);
    }

    const service = new DefaultAgentService(
      options.logger,
      options.userInfo,
      agents,
      options.sessionStore,
    );

    agentTools.forEach(e => e.setAgentService(service));

    return service;
  }

  getAgents(): Agent[] {
    return Array.from(this.agents.values());
  }

  async stream(
    userMessage: string,
    options: {
      agentName: string;
      sessionId?: string;
      credentials: BackstageCredentials<
        BackstageUserPrincipal | BackstageServicePrincipal
      >;
    },
  ): Promise<ReadableStream<ChatEvent>> {
    const { agentName, sessionId, credentials } = options;

    let newSession = false;
    let session: ChatSession;

    const { principal, userEntityRef } = await this.getUserEntityRef(
      credentials,
    );

    const agent = this.getActualAgent(options.agentName);

    if (!sessionId) {
      session = await this.makeSession(agentName, principal, false);

      newSession = true;
    } else {
      const sessionResult = await this.getSession(
        agentName,
        principal,
        sessionId,
      );

      if (!sessionResult) {
        throw new Error(
          `Session ${sessionId} not found for agent ${agentName}`,
        );
      }

      session = sessionResult;
    }

    return agent.stream(userMessage, session.sessionId, newSession, {
      userEntityRef,
      credentials,
    });
  }

  async getUserSession(options: {
    agentName: string;
    sessionId: string;
    credentials: BackstageCredentials<
      BackstageUserPrincipal | BackstageServicePrincipal
    >;
  }): Promise<ChatSession | undefined> {
    const { agentName, sessionId, credentials } = options;

    const { principal } = await this.getUserEntityRef(credentials);

    return this.sessionStore.getSession(agentName, sessionId, principal);
  }

  async createSession(options: {
    agentName: string;
    credentials: BackstageCredentials<
      BackstageUserPrincipal | BackstageServicePrincipal
    >;
  }): Promise<ChatSession> {
    const { agentName, credentials } = options;

    const { principal } = await this.getUserEntityRef(credentials);

    return this.makeSession(agentName, principal, false);
  }

  async endSession(options: {
    agentName: string;
    sessionId: string;
    credentials: BackstageCredentials<
      BackstageUserPrincipal | BackstageServicePrincipal
    >;
  }): Promise<void> {
    const { agentName, sessionId, credentials } = options;

    const { principal } = await this.getUserEntityRef(credentials);

    await this.sessionStore.endSession(agentName, sessionId, principal);
  }

  async sync(
    userMessage: string,
    options: {
      agentName: string;
      sessionId?: string;
      credentials: BackstageCredentials<
        BackstageUserPrincipal | BackstageServicePrincipal
      >;
    },
  ): Promise<SyncResponse> {
    const { principal, userEntityRef } = await this.getUserEntityRef(
      options.credentials,
    );

    const agent = this.getActualAgent(options.agentName);

    const session = await this.makeSession(options.agentName, principal, true);

    const output = agent.generate(userMessage, session.sessionId, {
      userEntityRef,
      credentials: options.credentials,
    });

    return {
      output,
      sessionId: session.sessionId,
    };
  }

  async generate(
    prompt: string,
    options: {
      responseFormat?: Record<string, any>;
      agentName: string;
      credentials: BackstageCredentials<
        BackstageUserPrincipal | BackstageServicePrincipal
      >;
    },
  ): Promise<GenerateResponse> {
    const { responseFormat, agentName, credentials } = options;

    const { principal, userEntityRef } = await this.getUserEntityRef(
      credentials,
    );

    const agent = this.getActualAgent(agentName);

    const session = await this.makeSession(agentName, principal, true);

    return agent.generate(prompt, session.sessionId, {
      userEntityRef,
      credentials,
      responseFormat,
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

  private makeSession(agent: string, principal: string, ended: boolean) {
    const sessionId = uuidv4();

    this.logger.info(`Generated session ${sessionId}`);

    return this.sessionStore.createSession({
      agent,
      principal,
      sessionId,
      ended,
    });
  }

  private getSession(agent: string, principal: string, sessionId: string) {
    this.logger.info(`Generated session ${sessionId}`);

    return this.sessionStore.getSession(agent, sessionId, principal);
  }

  private async getUserEntityRef(
    credentials: BackstageCredentials<
      BackstageUserPrincipal | BackstageServicePrincipal
    >,
  ): Promise<{ userEntityRef?: CompoundEntityRef; principal: string }> {
    if (credentials.principal.type === 'service') {
      return { principal: `service:credentials.principal` };
    }

    const userInfo = await this.userInfo.getUserInfo(credentials);

    const userEntityRef = parseEntityRef(userInfo.userEntityRef);

    return {
      userEntityRef,
      principal: `user:${userEntityRef.namespace}/${userEntityRef.name}`,
    };
  }
}
