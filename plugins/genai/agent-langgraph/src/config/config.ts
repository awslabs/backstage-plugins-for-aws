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
  LangGraphAgentBedrockConfig,
  LangGraphAgentConfig,
  LangGraphAgentLangFuseConfig,
  LangGraphAgentOllamaConfig,
  LangGraphAgentOpenAIConfig,
  SharedLangGraphAgentConfig,
} from './types';

export function readSharedLangGraphAgentConfig(
  rootConfig: Config,
): SharedLangGraphAgentConfig {
  const config = rootConfig.getOptionalConfig('genai.langgraph');

  let langfuseAgentConfig: LangGraphAgentLangFuseConfig | undefined;

  if (config) {
    const langfuseConfig = config.getOptionalConfig('langfuse');

    if (langfuseConfig) {
      langfuseAgentConfig = {
        baseUrl: langfuseConfig.getString('baseUrl'),
        publicKey: langfuseConfig.getString('publicKey'),
        secretKey: langfuseConfig.getString('secretKey'),
        flushAt: langfuseConfig.getOptionalNumber('flushAt'),
      };
    }
  }

  return {
    memory: config?.getOptionalString('memory') ?? 'in-memory',
    recursionLimit: config?.getOptionalNumber('recursionLimit') ?? 25,
    langfuse: langfuseAgentConfig,
  };
}

export function readLangGraphAgentConfig(
  agentConfig: Config,
): LangGraphAgentConfig {
  const config = agentConfig.getConfig('langgraph');

  return {
    messagesMaxTokens: config.getNumber('messagesMaxTokens'),
    maxTokens: config.getOptionalNumber('maxTokens'),
    temperature: config.getOptionalNumber('temperature'),
    topP: config.getOptionalNumber('topP'),
    bedrock: readLangGraphAgentBedrockConfig(config),
    openai: readLangGraphAgentOpenAIConfig(config),
    ollama: readLangGraphAgentOllamaConfig(config),
  };
}

export function readLangGraphAgentBedrockConfig(
  agentConfig: Config,
): LangGraphAgentBedrockConfig | undefined {
  if (!agentConfig.has('bedrock')) {
    return undefined;
  }

  const config = agentConfig.getConfig('bedrock');

  return {
    modelId: config.getString('modelId'),
    region: config.getString('region'),
  };
}

export function readLangGraphAgentOpenAIConfig(
  agentConfig: Config,
): LangGraphAgentOpenAIConfig | undefined {
  if (!agentConfig.has('openai')) {
    return undefined;
  }

  const config = agentConfig.getConfig('openai');

  return {
    apiKey: config.getString('apiKey'),
    modelName: config.getOptionalString('modelName'),
    baseUrl: config.getOptionalString('baseUrl'),
  };
}

export function readLangGraphAgentOllamaConfig(
  agentConfig: Config,
): LangGraphAgentOllamaConfig | undefined {
  if (!agentConfig.has('ollama')) {
    return undefined;
  }

  const config = agentConfig.getConfig('ollama');

  return {
    model: config.getString('model'),
    baseUrl: config.getString('baseUrl'),
  };
}
