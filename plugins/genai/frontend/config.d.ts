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
    chat?: {
      /**
       * (Optional) Whether to show the information button in the chat interface
       * If not set, information model cannot be accessed
       * @visibility frontend
       */
      showInformation?: boolean;
    };

    agents?: {
      [agentName: string]: {
        /**
         * Title displayed in the UI header
         * @visibility frontend
         */
        title?: string;

        /**
         * Short description for the empty state title
         * @visibility frontend
         */
        description?: string;

        /**
         * Welcome message shown when no conversation has started
         * @visibility frontend
         */
        welcomeMessage?: string;
      };
    };
  };
}
