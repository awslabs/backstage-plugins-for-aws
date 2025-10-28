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
import { ChatOpenAI, AzureChatOpenAI } from '@langchain/openai';
import { ChatOllama } from '@langchain/ollama';
import { BaseCheckpointSaver, MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import {
  HumanMessage,
  SystemMessage,
  trimMessages,
} from '@langchain/core/messages';
import { DynamicStructuredTool, ToolInterface } from '@langchain/core/tools';
import {
  InvokeAgentTool,
  ResponseTransformStream,
  tiktokenCounter,
} from './util';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  LangGraphAgentConfig,
  readLangGraphAgentConfig,
  readSharedLangGraphAgentConfig,
  SharedLangGraphAgentConfig,
} from './config';
import {
  AgentConfig,
  AgentType,
  PeerAgentToolInstance,
} from '@aws/genai-plugin-for-backstage-node';
import {
  ChatEvent,
  GenerateResponse,
} from '@aws/genai-plugin-for-backstage-common';
import { CallbackHandler } from 'langfuse-langchain';
import { SqliteSaver } from '@langchain/langgraph-checkpoint-sqlite';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import {
  ActionsService,
  ActionsServiceAction,
} from '@backstage/backend-plugin-api/alpha';

export class LangGraphReactAgentType implements AgentType {
  private readonly prompt?: string;

  public constructor(
    private readonly llm: BaseChatModel,
    private readonly actions: ActionsService,
    private readonly tools: ToolInterface[],
    private readonly checkpointSaver: BaseCheckpointSaver,
    private readonly langGraphAgentConfig: LangGraphAgentConfig,
    private readonly sharedConfig: SharedLangGraphAgentConfig,
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
    tools: ToolInterface[],
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
    } else if (agentLangGraphConfig.ollama) {
      agentModel = LangGraphReactAgentType.createOllamaModel(
        agentLangGraphConfig,
        logger,
      );
    } else if (agentLangGraphConfig.azureOpenAI) {
      agentModel = LangGraphReactAgentType.createAzureOpenAIModel(
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
      agentLangGraphConfig,
      sharedLangGraphConfig,
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

  private static createOllamaModel(
    config: LangGraphAgentConfig,
    logger: LoggerService,
  ) {
    const { model, baseUrl } = config.ollama!;

    logger.info(`Instantiating ChatOllama model using baseUrl '${baseUrl}'`);

    return new ChatOllama({
      model: model,
      baseUrl: baseUrl,
      streaming: true,
      temperature: config.temperature,
      topP: config.topP,
    });
  }

  private static createAzureOpenAIModel(
    config: LangGraphAgentConfig,
    logger: LoggerService,
  ) {
    const { apiKey, apiVersion, endpoint, instanceName, deploymentName } =
      config.azureOpenAI!;

    logger.info(
      `Instantiating ChatAzureOpenAI model using endpoint '${endpoint}'`,
    );

    return new AzureChatOpenAI({
      azureOpenAIApiKey: apiKey,
      azureOpenAIApiVersion: apiVersion,
      azureOpenAIEndpoint: endpoint,
      azureOpenAIApiInstanceName: instanceName,
      azureOpenAIApiDeploymentName: deploymentName,
      streaming: true,
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
    agentActions: ActionsServiceAction[],
    peerAgentTools: PeerAgentToolInstance[],
    _: LoggerService,
    options: {
      userEntityRef?: CompoundEntityRef;
      credentials: BackstageCredentials;
      signal?: AbortSignal;
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
      tools: await this.buildActionsTools(
        agentActions,
        peerAgentTools,
        credentials,
      ),
      checkpointSaver: this.checkpointSaver,
      messageModifier: this.langGraphAgentConfig.messagesMaxTokens
        ? async e => {
            const trimmed = await trimMessages(e, {
              maxTokens: this.langGraphAgentConfig.messagesMaxTokens,
              strategy: 'last',
              tokenCounter: tiktokenCounter,
              includeSystem: true,
              startOn: 'human',
            });

            // If there are two human messages in a row at the end
            // then assume the first was cancelled
            const len = trimmed.length;
            if (
              len >= 2 &&
              trimmed[len - 1] instanceof HumanMessage &&
              trimmed[len - 2] instanceof HumanMessage
            ) {
              trimmed.splice(len - 2, 1);
            }

            return trimmed;
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
        signal: options.signal,
      },
    );

    const stream = eventStreamFinalRes.pipeThrough(
      new ResponseTransformStream(sessionId),
    );

    return new ReadableStream({
      async start(controller) {
        const reader = stream.getReader();
        try {
          while (true as const) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        } catch (error: any) {
          if (error.message && error.message === 'Abort') {
            return;
          }

          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });
  }

  public async generate(
    prompt: string,
    sessionId: string,
    agentActions: ActionsServiceAction[],
    peerAgentTools: PeerAgentToolInstance[],
    logger: LoggerService,
    options: {
      userEntityRef?: CompoundEntityRef;
      credentials: BackstageCredentials;
      responseFormat?: Record<string, any>;
      signal?: AbortSignal;
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
      tools: await this.buildActionsTools(
        agentActions,
        peerAgentTools,
        credentials,
      ),
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
        signal: options.signal,
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

  private async buildActionsTools(
    agentActions: ActionsServiceAction[],
    peerAgentTools: PeerAgentToolInstance[],
    credentials: BackstageCredentials,
  ) {
    const tools = agentActions.map(action => {
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

    const peerAgents = peerAgentTools.map(peer => {
      return new InvokeAgentTool(peer);
    });

    return [...tools, ...peerAgents, ...this.tools];
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
