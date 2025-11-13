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

import { Config } from '@backstage/config';
import { JsonObject } from '@backstage/types';
import {
  BackstageCredentials,
  LoggerService,
} from '@backstage/backend-plugin-api';
import {
  CompoundEntityRef,
  stringifyEntityRef,
} from '@backstage/catalog-model';
import { ChatBedrockConverse } from '@langchain/aws';
import { ChatOpenAI } from '@langchain/openai';
import { BaseCheckpointSaver, MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import {
  HumanMessage,
  SystemMessage,
  trimMessages,
} from '@langchain/core/messages';
import {
  DynamicStructuredTool,
  StructuredToolInterface,
} from '@langchain/core/tools';
import { ResponseTransformStream, tiktokenCounter } from './util';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  LangGraphAgentConfig,
  readLangGraphAgentConfig,
  readSharedLangGraphAgentConfig,
  SharedLangGraphAgentConfig,
} from './config';
import { AgentConfig, AgentType } from '@aws/genai-plugin-for-backstage-node';
import {
  ChatEvent,
  GenerateResponse,
} from '@aws/genai-plugin-for-backstage-common';
import { CallbackHandler } from 'langfuse-langchain';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import { ActionsService } from '@backstage/backend-plugin-api/alpha';

export class LangGraphReactAgentType implements AgentType {
  private readonly prompt?: string;

  public constructor(
    private readonly llm: BaseChatModel,
    private readonly actions: ActionsService,
    private readonly tools: StructuredToolInterface[],
    private readonly checkpointSaver: BaseCheckpointSaver,
    private readonly agentConfig: AgentConfig,
    private readonly langGraphAgentConfig: LangGraphAgentConfig,
    private readonly sharedConfig: SharedLangGraphAgentConfig,
    private readonly logger: LoggerService,
    options: {
      prompt?: string;
    },
  ) {
    this.prompt = options.prompt;
  }

  static async fromConfig(
    rootConfig: Config,
    agentConfig: AgentConfig,
    actions: ActionsService,
    tools: StructuredToolInterface[],
    logger: LoggerService,
    dbConfig: any,
  ) {
    const prompt = agentConfig.prompt;

    const sharedLangGraphConfig = readSharedLangGraphAgentConfig(rootConfig);

    const agentLangGraphConfig = readLangGraphAgentConfig(agentConfig.config);

    let agentModel: BaseChatModel;

    if (agentLangGraphConfig.bedrock) {
      agentModel =
        LangGraphReactAgentType.createBedrockModel(agentLangGraphConfig);
    } else if (agentLangGraphConfig.openai) {
      agentModel = LangGraphReactAgentType.createOpenAIModel(
        agentLangGraphConfig,
        logger,
      );
    } else {
      throw new Error('No agent model configured');
    }

    logger.info(
      `Instantiating langgraph-react gent ${
        agentConfig.name
      } using model '${agentModel.getName()}'`,
    );

    const agentCheckpointer = await this.createCheckpointer(
      sharedLangGraphConfig,
      dbConfig,
      logger,
    );

    return new LangGraphReactAgentType(
      agentModel,
      actions,
      tools,
      agentCheckpointer,
      agentConfig,
      agentLangGraphConfig,
      sharedLangGraphConfig,
      logger,
      {
        prompt,
      },
    );
  }

  private static async createCheckpointer(
    sharedConfig: SharedLangGraphAgentConfig,
    dbConfig: any,
    logger: LoggerService,
  ) {
    if (sharedConfig.memory === 'backstage') {
      if (dbConfig.client === 'pg') {
        logger.info('Using postgres checkpointer');

        const host = dbConfig.connection.host;
        const port = dbConfig.connection.port;
        const user = dbConfig.connection.user;
        const password = dbConfig.connection.password;

        const database = dbConfig.connection.database;

        const checkpointer = PostgresSaver.fromConnString(
          `postgresql://${user}:${password}@${host}:${port}/${database}`,
        );

        await checkpointer.setup();

        return checkpointer;
      } else if (dbConfig.client === 'better-sqlite3') {
        logger.info('Using sqlite checkpointer');

        const checkpointer = SqliteSaver.fromConnString(':memory:');

        return checkpointer;
      }

      throw new Error(`Unsupported database client ${dbConfig.client}`);
    }

    logger.info('Using in-memory checkpointer');

    return new MemorySaver();
  }

  private static createBedrockModel(config: LangGraphAgentConfig) {
    const { modelId, region } = config.bedrock!;

    return new ChatBedrockConverse({
      model: modelId,
      region: region,
      streaming: true,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
    });
  }

  private static createOpenAIModel(
    config: LangGraphAgentConfig,
    logger: LoggerService,
  ) {
    const { modelName, apiKey } = config.openai!;

    const baseUrl = config.openai?.baseUrl ?? 'https://api.openai.com/v1';

    logger.info(
      `Instantiating ChatOpenAI model '${modelName}' using baseUrl '${baseUrl}'`,
    );

    return new ChatOpenAI({
      configuration: {
        baseURL: baseUrl,
      },
      apiKey: apiKey,
      streaming: true,
      modelName: modelName,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
    });
  }

  private buildCallbackHandler(
    sessionId: string,
    userEntityRef?: CompoundEntityRef,
  ): CallbackHandler[] {
    const callbacks: CallbackHandler[] = [];

    const userId = userEntityRef
      ? stringifyEntityRef(userEntityRef)
      : 'unknown';

    if (this.sharedConfig.langfuse) {
      callbacks.push(
        new CallbackHandler({
          ...this.sharedConfig.langfuse,
          sessionId,
          userId,
        }),
      );
    }

    return callbacks;
  }

  public async stream(
    userMessage: string,
    sessionId: string,
    newSession: boolean,
    _: LoggerService,
    options: {
      userEntityRef?: CompoundEntityRef;
      credentials?: BackstageCredentials;
    },
  ): Promise<ReadableStream<ChatEvent>> {
    const messages: (SystemMessage | HumanMessage)[] = [];

    const { userEntityRef, credentials } = options;

    if (this.prompt) {
      if (newSession) {
        messages.push(this.buildSystemPrompt(this.prompt, userEntityRef));
      }
    }

    messages.push(new HumanMessage(userMessage));

    const agent = createReactAgent({
      llm: this.llm,
      tools: await this.buildActionsTools(credentials!),
      checkpointSaver: this.checkpointSaver,
      messageModifier: this.langGraphAgentConfig.messagesMaxTokens
        ? async e => {
            return await trimMessages(e, {
              maxTokens: this.langGraphAgentConfig.messagesMaxTokens,
              strategy: 'last',
              tokenCounter: tiktokenCounter,
              includeSystem: true,
              startOn: 'human',
            });
          }
        : undefined,
    });

    const eventStreamFinalRes = agent.streamEvents(
      {
        messages,
      },
      {
        version: 'v2',
        callbacks: this.buildCallbackHandler(sessionId, userEntityRef),
        recursionLimit: this.sharedConfig.recursionLimit,
        configurable: {
          thread_id: sessionId,
          credentials,
        },
      },
    );

    return eventStreamFinalRes.pipeThrough(
      new ResponseTransformStream(sessionId),
    );
  }

  public async generate(
    prompt: string,
    sessionId: string,
    logger: LoggerService,
    options: {
      userEntityRef?: CompoundEntityRef;
      credentials?: BackstageCredentials;
      responseFormat?: Record<string, any>;
    },
  ): Promise<GenerateResponse> {
    const messages: (SystemMessage | HumanMessage)[] = [];

    const { userEntityRef, credentials, responseFormat } = options;

    if (this.prompt) {
      messages.push(this.buildSystemPrompt(this.prompt, userEntityRef));
    }

    messages.push(new HumanMessage(prompt));

    let output: any = '';

    const agent = createReactAgent({
      llm: this.llm,
      tools: await this.buildActionsTools(credentials!),
      responseFormat,
    });
    const finalState = await agent.invoke(
      { messages },
      {
        callbacks: this.buildCallbackHandler(sessionId, userEntityRef),
        recursionLimit: this.sharedConfig.recursionLimit,
        configurable: {
          thread_id: sessionId,
          credentials,
        },
      },
    );

    if (responseFormat) {
      return {
        output: finalState.structuredResponse,
      };
    }

    const outputMessages = finalState.messages.slice(messages.length);

    if (outputMessages.length > 0) {
      const outputMessage = outputMessages[outputMessages.length - 1];

      output = outputMessage.content;
    } else {
      const errorMessage = `No output messages found for session ${sessionId}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    return {
      output,
    };
  }

  private async buildActionsTools(credentials: BackstageCredentials) {
    const actionList = await this.actions.list({ credentials });
    const actionNames = [...this.agentConfig.actions];
    const tools = actionList.actions
      .filter(action => {
        const index = actionNames.indexOf(action.name);

        if (index >= 0) {
          actionNames.splice(index, 1);

          return true;
        }

        return false;
      })
      .map(action => {
        return new DynamicStructuredTool({
          get name() {
            return action.name;
          },
          description: action.description,
          schema: action.schema.input,
          func: async input => {
            return this.actions.invoke({
              id: action.id,
              input: input as JsonObject,
              credentials,
            });
          },
        });
      });

    actionNames.forEach(name => {
      this.logger.warn(`Action ${name} not found`);
    });

    return [...tools, ...this.tools];
  }

  private buildSystemPrompt(
    template: string,
    userEntityRef?: CompoundEntityRef,
  ) {
    return new SystemMessage(
      template.replace('{username}', userEntityRef?.name ?? 'unknown'),
    );
  }
}
