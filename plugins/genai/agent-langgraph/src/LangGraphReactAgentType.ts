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
import { CompiledStateGraph, MemorySaver } from '@langchain/langgraph';
import { AgentState, createReactAgent } from '@langchain/langgraph/prebuilt';
import {
  HumanMessage,
  SystemMessage,
  trimMessages,
} from '@langchain/core/messages';
import { ToolInterface } from '@langchain/core/tools';
import { ResponseTransformStream, tiktokenCounter } from './util';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import {
  LangGraphAgentLangFuseConfig,
  LangGraphAgentConfig,
  readLangGraphAgentConfig,
  readSharedLangGraphAgentConfig,
} from './config';
import { AgentConfig, AgentType } from '@aws/genai-plugin-for-backstage-node';
import {
  ChatEvent,
  GenerateResponse,
} from '@aws/genai-plugin-for-backstage-common';
import { CallbackHandler } from 'langfuse-langchain';

export class LangGraphReactAgentType implements AgentType {
  private readonly prompt?: string;
  private readonly langfuseConfig?: LangGraphAgentLangFuseConfig;

  public constructor(
    private readonly llm: BaseChatModel,
    private readonly tools: ToolInterface[],
    private readonly agent: CompiledStateGraph<
      AgentState,
      Partial<AgentState>,
      any
    >,
    options: {
      prompt?: string;
      langfuseConfig?: LangGraphAgentLangFuseConfig;
    },
  ) {
    this.prompt = options.prompt;
    this.langfuseConfig = options.langfuseConfig;
  }

  static async fromConfig(
    rootConfig: Config,
    agentConfig: AgentConfig,
    tools: ToolInterface[],
    logger: LoggerService,
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
      `Instantiating langgraph-react agent ${
        agentConfig.name
      } using model '${agentModel.getName()}'`,
    );

    const agentCheckpointer = new MemorySaver();
    const agent = createReactAgent({
      llm: agentModel,
      tools,
      checkpointSaver: agentCheckpointer,
      messageModifier: agentLangGraphConfig.messagesMaxTokens
        ? async e => {
            return await trimMessages(e, {
              maxTokens: agentLangGraphConfig.messagesMaxTokens,
              strategy: 'last',
              tokenCounter: tiktokenCounter,
              includeSystem: true,
              startOn: 'human',
            });
          }
        : undefined,
    });

    return new LangGraphReactAgentType(agentModel, tools, agent, {
      prompt,
      langfuseConfig: sharedLangGraphConfig?.langfuse,
    });
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
    userId: string,
  ): CallbackHandler[] {
    const callbacks: CallbackHandler[] = [];

    if (this.langfuseConfig) {
      callbacks.push(
        new CallbackHandler({
          ...this.langfuseConfig,
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
    userEntityRef: CompoundEntityRef,
    _: LoggerService,
    options: {
      credentials?: BackstageCredentials;
    },
  ): Promise<ReadableStream<ChatEvent>> {
    const messages: (SystemMessage | HumanMessage)[] = [];

    if (this.prompt) {
      if (newSession) {
        messages.push(this.buildSystemPrompt(this.prompt, userEntityRef));
      }
    }

    messages.push(new HumanMessage(userMessage));

    const eventStreamFinalRes = this.agent.streamEvents(
      {
        messages,
      },
      {
        version: 'v2',
        callbacks: this.buildCallbackHandler(
          sessionId,
          stringifyEntityRef(userEntityRef),
        ),
        configurable: {
          thread_id: sessionId,
          credentials: options.credentials,
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
    userEntityRef: CompoundEntityRef,
    logger: LoggerService,
    options: {
      credentials?: BackstageCredentials;
    },
  ): Promise<GenerateResponse> {
    const messages: (SystemMessage | HumanMessage)[] = [];

    if (this.prompt) {
      messages.push(this.buildSystemPrompt(this.prompt, userEntityRef));
    }

    messages.push(new HumanMessage(prompt));

    let output: any = '';

    const agent = createReactAgent({
      llm: this.llm,
      tools: this.tools,
    });
    const finalState = await agent.invoke(
      { messages },
      {
        callbacks: this.buildCallbackHandler(
          sessionId,
          stringifyEntityRef(userEntityRef),
        ),
        configurable: {
          thread_id: sessionId,
          credentials: options.credentials,
        },
      },
    );

    const outputMessages = finalState.messages.slice(messages.length);

    if (outputMessages.length > 0) {
      const outputMessage = outputMessages[outputMessages.length - 1];

      output = outputMessage.content;
    } else {
      logger.error(`No output messages found for session ${sessionId}`);
      throw new Error(`No output messages found for session ${sessionId}`);
    }

    return {
      output,
    };
  }

  private buildSystemPrompt(
    template: string,
    userEntityRef: CompoundEntityRef,
  ) {
    return new SystemMessage(
      template.replace('{username}', userEntityRef.name),
    );
  }
}
