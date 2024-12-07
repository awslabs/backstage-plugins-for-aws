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
  LangGraphAgentOpenAIConfig,
  SharedLangGraphAgentConfig,
} from './types';

export function readSharedLangGraphAgentConfig(
  rootConfig: Config,
): SharedLangGraphAgentConfig | undefined {
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
    langfuse: langfuseAgentConfig,
  };
}

export function readLangGraphAgentConfig(config: Config): LangGraphAgentConfig {
  return {
    messagesMaxTokens: config.getNumber('messagesMaxTokens'),
    provider: config.getString('provider'),
  };
}

export function readLangGraphAgentBedrockConfig(
  config: Config,
): LangGraphAgentBedrockConfig {
  return {
    modelId: config.getString('modelId'),
    region: config.getString('region'),
    maxTokens: config.getOptionalNumber('maxTokens'),
    temperature: config.getOptionalNumber('temperature'),
    topP: config.getOptionalNumber('topP'),
  };
}

export function readLangGraphAgentOpenAIConfig(
  config: Config,
): LangGraphAgentOpenAIConfig {
  return {
    apiKey: config.getString('apiKey'),
    modelName: config.getOptionalString('modelName'),
    maxTokens: config.getOptionalNumber('maxTokens'),
    temperature: config.getOptionalNumber('temperature'),
    topP: config.getOptionalNumber('topP'),
  };
}
