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

import {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { SearchResultSet } from '@backstage/plugin-search-common';

export function createBackstageTechDocsSearchTool(
  discoveryApi: DiscoveryService,
  auth: AuthService,
) {
  return new DynamicStructuredTool({
    get name() {
      return 'backstageTechDocsSearch';
    },
    description:
      'Searches the Backstage TechDocs internal documentation for the organization.',
    schema: z.object({
      query: z.string().describe('Search query'),
    }),
    func: async ({ query }, _, toolConfig) => {
      const credentials = toolConfig?.configurable!
        .credentials as BackstageCredentials;

      const url = `${await discoveryApi.getBaseUrl(
        'search',
      )}/query?term=${query}&types[0]=techdocs`;
      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'search',
      });
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const payload = (await response.json()) as SearchResultSet;

      return {
        nextPageCursor: payload.nextPageCursor,
        results: payload.results.map(result => ({
          location: result.document.location,
          title: result.document.title,
          text: result.document.text,
        })),
      };
    },
  });
}
