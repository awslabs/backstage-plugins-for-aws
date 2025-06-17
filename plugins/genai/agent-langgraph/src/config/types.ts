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

export interface SharedLangGraphAgentConfig {
  memory: string;
  langfuse?: LangGraphAgentLangFuseConfig;
}

export interface LangGraphAgentLangFuseConfig {
  baseUrl: string;
  publicKey: string;
  secretKey: string;
  flushAt?: number;
}

export interface LangGraphAgentConfig {
  messagesMaxTokens: number;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  bedrock?: LangGraphAgentBedrockConfig;
  openai?: LangGraphAgentOpenAIConfig;
}

export interface LangGraphAgentBedrockConfig {
  region: string;
  modelId: string;
}

export interface LangGraphAgentOpenAIConfig {
  apiKey: string;
  modelName?: string;
  baseUrl?: string;
}
