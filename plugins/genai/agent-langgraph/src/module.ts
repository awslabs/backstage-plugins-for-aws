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

import {
  coreServices,
  createBackendModule,
} from '@backstage/backend-plugin-api';
import {
  AgentConfig,
  agentTypeExtensionPoint,
} from '@aws/genai-plugin-for-backstage-node';
import { LangGraphReactAgentType } from './LangGraphReactAgentType';
import { ToolInterface } from '@langchain/core/tools';

export const genAiPluginForBackstageModuleLangGraphAgent = createBackendModule({
  pluginId: 'aws-genai',
  moduleId: 'agent-langgraph',
  register(reg) {
    reg.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        agentType: agentTypeExtensionPoint,
      },
      async init({ agentType, config, logger }) {
        agentType.addAgentType({
          create: async (agentConfig: AgentConfig, tools: ToolInterface[]) =>
            LangGraphReactAgentType.fromConfig(
              config,
              agentConfig,
              tools,
              logger,
            ),

          getTypeName: () => 'langgraph-react',
        });
      },
    });
  },
});
