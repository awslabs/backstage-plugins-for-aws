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

import { useApi, configApiRef } from '@backstage/core-plugin-api';

export interface AgentUIConfig {
  title: string;
  description: string;
  welcomeMessage: string;
}

/**
 * Hook to load agent metadata from app-config.yaml with fallback defaults
 */
export const useAgentMetadata = (agentName: string): AgentUIConfig => {
  const config = useApi(configApiRef);

  // Load agent config directly (no metadata wrapper)
  const agentConfig = config.getOptionalConfig(`genai.agents.${agentName}`);
  const title = agentConfig?.getOptionalString('title') ?? 'Chat Assistant';
  const description =
    agentConfig?.getOptionalString('description') ?? 'Start chatting!';
  const welcomeMessage =
    agentConfig?.getOptionalString('welcomeMessage') ??
    'This assistant can answer questions for you, type a message below to get started.';

  return {
    title,
    description,
    welcomeMessage,
  };
};
