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

import { DiscoveryService, AuthService } from '@backstage/backend-plugin-api';
import { ActionsRegistryService } from '@backstage/backend-plugin-api/alpha';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';

export const createTechDocsReadAction = ({
  discovery,
  auth,
  actionsRegistry,
}: {
  discovery: DiscoveryService;
  auth: AuthService;
  actionsRegistry: ActionsRegistryService;
}) => {
  const turndownService = new TurndownService();

  actionsRegistry.register({
    name: `read-techdocs`,
    title: `Read TechDocs`,
    attributes: {
      destructive: false,
      readOnly: true,
      idempotent: true,
    },
    description: `Reads a specific page of Backstage TechDocs technical documentation and returns the content.

The location parameter can be found in TechDocs search results.

Alternatively the path to the root documentation page of a Backstage entity can be constructed as follows:

/docs/<namespace>/<kind>/<name>/

The response will be formatted as Markdown.`,
    schema: {
      input: z =>
        z.object({
          location: z.string().describe('Location path of the documentation'),
        }),
      output: z => z.object({}).passthrough(),
    },
    action: async ({ input, credentials }) => {
      const url = new URL(
        `${await discovery.getBaseUrl('techdocs')}/static${input.location}`,
      );

      const pageUrl = `${url.origin}${url.pathname}`;

      const { token } = await auth.getPluginRequestToken({
        onBehalfOf: credentials,
        targetPluginId: 'techdocs',
      });
      const response = await fetch(
        `${pageUrl.endsWith('/') ? pageUrl : `${pageUrl}/`}index.html`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const html = await response.text();

      const root = parse(html);

      const container = root.querySelector('.md-content');

      if (!container) {
        throw new Error('Failed to parse TechDocs page');
      }

      return {
        output: { content: turndownService.turndown(container.outerHTML) },
      };
    },
  });
};
