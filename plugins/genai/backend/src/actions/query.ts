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

import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { AgentService } from '../service/types';

export const createQueryAgentActions = ({
  agentService,
  actionsRegistry,
}: {
  agentService: AgentService;
  actionsRegistry: ActionsRegistryService;
}) => {
  for (const agent of agentService.getAgents()) {
    actionsRegistry.register({
      name: `query-agent-${agent.getName()}`,
      title: `Query Agent: ${agent.getName()}`,
      attributes: {
        destructive: true,
        readOnly: false,
        idempotent: false,
      },
      description: agent.getDescription(),
      schema: {
        input: z =>
          z.object({
            query: z
              .string()
              .describe('A natural language question for the agent.'),
          }),
        output: z =>
          z.object({
            response: z.string().describe('Natural language response'),
          }),
      },
      action: async ({ input, credentials }) => {
        const response = await agentService.generate(input.query, {
          agentName: agent.getName(),
          credentials,
        });

        return {
          output: {
            response: response.output,
          },
        };
      },
    });
  }
};
