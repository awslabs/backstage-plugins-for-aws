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
  aws?: {
    securityHub?: {
      /**
       * (Optional) AWS region to query Security Hub
       * @visibility frontend
       */
      region?: string;

      /**
       * (Optional) AWS account ID to query
       * @visibility frontend
       */
      accountId?: string;

      /**
       * (Optional) Custom filters to override defaults
       * By default, the plugin filters findings to show only active and actionable items:
       * - WorkflowStatus: NEW or NOTIFIED
       * - RecordState: ACTIVE
       * - ResourceTags: Filtered based on entity annotations
       *
       * Custom filters will replace the default WorkflowStatus and RecordState filters.
       * @visibility frontend
       */
      filters?: Array<{
        /**
         * (Required) The Security Hub filter field name
         * Examples: SeverityLabel, ComplianceStatus, WorkflowStatus, RecordState
         */
        name: string;

        /**
         * (Optional) Single value for the filter
         * Use either 'value' or 'values', not both
         */
        value?: string;

        /**
         * (Optional) Array of values for the filter
         * Use either 'value' or 'values', not both
         */
        values?: string[];

        /**
         * (Optional) Comparison operator
         * @default EQUALS
         */
        comparison?:
          | 'EQUALS'
          | 'PREFIX'
          | 'NOT_EQUALS'
          | 'PREFIX_NOT_EQUALS'
          | 'CONTAINS'
          | 'NOT_CONTAINS';
      }>;

      /**
       * (Optional) AI Agent configuration for findings analysis
       */
      agent?: {
        /**
         * (Optional) Enable AI assistant for findings
         * @default true
         * @visibility frontend
         */
        enabled?: boolean;

        /**
         * (Optional) Name of the agent configured in genai.agents
         * @default security-hub
         * @visibility frontend
         */
        name?: string;
      };
    };
  };
}
