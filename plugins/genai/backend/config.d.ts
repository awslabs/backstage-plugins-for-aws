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

export interface Config {
  genai?: {
    agents?: {
      [name: string]: {
        /**
         * (Required) Description of the agents purpose
         */
        description: string;
        /**
         * (Required) System prompt for the agent
         */
        prompt: string;
        /**
         * (Optional) List of tools the agent has access to
         */
        tools?: string[];
        /**
         * (Optional) Params that will be passed to the agent type for this agent
         */
        params?: any;
      };
    };
  };
}
