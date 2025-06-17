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

export function createBackstageCatalogSearchTool(
  discoveryApi: DiscoveryService,
  auth: AuthService,
) {
  return new DynamicStructuredTool({
    get name() {
      return 'backstageCatalogSearch';
    },
    description: `Search the Backstage catalog for entities. Results are ordered by relevance to the query.

Responses are paginated. To get the next page, pass the "nextPageCursor" value as the "pageCursor" parameter to the tool again.

DO NOT try to filter on kinds in the query string, always use the "kinds" parameter.
`,
    schema: z.object({
      query: z.string().describe('Search query'),
      kinds: z
        .string()
        .describe(
          'Comma-separated list of Backstage entity kinds. If not specified then all kinds are searched.',
        )
        .optional(),
      pageLimit: z
        .number()
        .describe('Number of results to return per page')
        .optional()
        .default(10),
      pageCursor: z.string().describe('Cursor for the next page').optional(),
    }),
    func: async ({ query, kinds, pageLimit, pageCursor }, _, toolConfig) => {
      const credentials = toolConfig?.configurable!
        .credentials as BackstageCredentials;

      const filters: string[] = [];

      if (kinds) {
        kinds.split(',').forEach((kind: string) => {
          filters.push(`filters[kind]=${kind}`);
        });
      }

      let fullQuery = `term=${query}&pageLimit=${pageLimit}`;

      if (pageCursor) {
        fullQuery += `&pageCursor=${pageCursor}`;
      }

      if (filters.length > 0) {
        fullQuery += `&${filters.join('&')}`;
      }

      const url = `${await discoveryApi.getBaseUrl(
        'search',
      )}/query?${fullQuery}`;
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

      return response.text();
    },
  });
}
