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
import { AwsSecurityHubService } from '../service';

export const createGetFindingsByEntityAction = ({
  awsSecurityHubApi,
  actionsRegistry,
}: {
  awsSecurityHubApi: AwsSecurityHubService;
  actionsRegistry: ActionsRegistryService;
}) => {
  actionsRegistry.register({
    name: 'get-amazon-securityhub-findings',
    title: 'AWS Security Hub Findings',
    attributes: {
      destructive: false,
      readOnly: true,
      idempotent: true,
    },
    description:
      'Provides information regarding AWS Security Hub findings for a given entity in the Backstage catalog. Returns a formatted summary of security findings including title, severity, description, and remediation information.',
    schema: {
      input: z =>
        z.object({
          entityName: z
            .string()
            .describe('Entity name as it appears in the Backstage catalog'),
          kind: z
            .string()
            .describe('Entity kind as it appears in the Backstage catalog'),
          namespace: z
            .string()
            .describe(
              'Entity namespace as it appears in the Backstage catalog',
            ),
          findingId: z
            .string()
            .describe('Security Hub finding ID to retrieve information for')
            .optional(),
        }),
      output: z =>
        z.object({
          response: z.string().describe('Formatted security findings summary'),
        }),
    },
    action: async ({ input, credentials }) => {
      const { entityName, kind, namespace, findingId } = input;

      let results = await awsSecurityHubApi.getFindingsByEntity({
        entityRef: {
          kind,
          namespace,
          name: entityName,
        },
        credentials,
      });

      if (findingId) {
        results = results.filter(e => e.Id === findingId);
      }

      // Return formatted string summary instead of large JSON array
      const summary = results
        .map(e => {
          const severityLabel = e.Severity?.Label || 'UNKNOWN';
          const remediationUrl =
            e.Remediation?.Recommendation?.Url || 'N/A';
          return [
            `Title: ${e.Title}`,
            `ID: ${e.Id}`,
            `Severity: ${severityLabel}`,
            `Description: ${e.Description}`,
            `Remediation: ${remediationUrl}`,
            `Created: ${e.CreatedAt}`,
            `Account: ${e.AwsAccountId}`,
            '---',
          ].join('\n');
        })
        .join('\n');

      return {
        output: {
          response: `Found ${results.length} security finding(s):\n\n${summary}`,
        },
      };
    },
  });
};
