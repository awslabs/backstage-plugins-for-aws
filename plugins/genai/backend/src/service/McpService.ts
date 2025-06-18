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

import { BackstageCredentials } from '@backstage/backend-plugin-api';
import { AgentService } from './types';
import { Server as McpServer } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { version } from '@aws/genai-plugin-for-backstage-backend/package.json';

export class McpService {
  public constructor(private readonly agentService: AgentService) {}

  static async fromConfig(agentService: AgentService) {
    return new McpService(agentService);
  }

  getServer(options: { agentName: string; credentials: BackstageCredentials }) {
    const { agentName, credentials } = options;

    const agent = this.agentService.getAgent(agentName);

    if (!agent) {
      throw new Error(`Agent ${agentName} not found`);
    }

    const server = new McpServer(
      {
        name: `backstage-${agentName}`,
        version,
      },
      { capabilities: { tools: {} } },
    );

    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'A natural language question for the agent.',
                },
              },
              required: ['query'],
            },

            name: agent.getName(),
            description: agent.getDescription(),
            annotations: {
              destructiveHint: true,
              idempotentHint: false,
              readOnlyHint: false,
              openWorldHint: true,
            },
          },
        ],
      };
    });

    server.setRequestHandler(CallToolRequestSchema, async ({ params }) => {
      if (params.arguments?.query) {
        const result = await this.agentService.generate(
          params.arguments.query as string,
          {
            agentName: params.name,
            credentials,
          },
        );

        return {
          content: [
            {
              type: 'text',
              text: result.output,
            },
          ],
        };
      }

      throw new Error('No query provided');
    });

    return server;
  }
}
