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

import { StructuredToolInterface } from '@langchain/core/tools';

export class Toolkit {
  private tools: Map<string, StructuredToolInterface>;

  constructor() {
    this.tools = new Map<string, StructuredToolInterface>();
  }

  add(...tools: StructuredToolInterface[]): void {
    tools.forEach(tool => {
      const name = tool.getName();
      if (name) {
        this.tools.set(name, tool);
      } else {
        console.warn(
          'Attempted to add a tool without a name. This tool will be skipped.',
        );
      }
    });
  }

  getTools(): StructuredToolInterface[] {
    return Array.from(this.tools.values());
  }

  getToolByName(name: string): StructuredToolInterface | undefined {
    return this.tools.get(name);
  }
}
