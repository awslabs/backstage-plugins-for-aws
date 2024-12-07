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

import { AgentConfig } from '@aws/genai-plugin-for-backstage-node';
import { Config } from '@backstage/config';

function getRootConfig(config: Config) {
  return config.getOptionalConfig('genai');
}

export function readAgentsConfig(rootConfig: Config): AgentConfig[] {
  const genaiConfig = getRootConfig(rootConfig);

  if (!genaiConfig) {
    return [];
  }

  const agentsConfig = genaiConfig.getOptionalConfigArray('agents');

  if (!agentsConfig) {
    return [];
  }

  const result: AgentConfig[] = [];

  for (const config of agentsConfig) {
    result.push(readAgentConfig(config));
  }

  return result;
}

export function readAgentConfig(config: Config): AgentConfig {
  return {
    name: config.getString('name'),
    description: config.getString('description'),
    prompt: config.getString('prompt'),
    type: config.getOptionalString('type'),
    tools: config.getOptionalStringArray('tools') || [],
    params: config.getConfig('params'),
  };
}
