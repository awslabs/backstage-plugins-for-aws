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

import { Tool } from '@langchain/core/tools';
import { AgentService } from '../service/types';
import { RunnableConfig } from '@langchain/core/runnables';
import { BackstageCredentials } from '@backstage/backend-plugin-api';

export class InvokeAgentTool extends Tool {
  static lc_name() {
    return 'InvokeAgentTool';
  }

  private agentService?: AgentService;

  constructor(
    public readonly name: string,
    public readonly description: string,
  ) {
    super();
  }

  public setAgentService(agentService: AgentService) {
    this.agentService = agentService;
  }

  async _call(query: string, _: any, config: RunnableConfig): Promise<string> {
    const credentials = config?.configurable!
      .credentials as BackstageCredentials;

    if (!this.agentService) {
      throw new Error('Agent service not set in InvokeAgentTool');
    }

    try {
      const response = await this.agentService.generate(query, {
        agentName: this.name,
        credentials,
      });

      return response.output;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
