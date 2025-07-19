import {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
} from '@backstage/backend-plugin-api';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { parse } from 'node-html-parser';
import TurndownService from 'turndown';

export function createBackstageTechDocsReadTool(
  discoveryApi: DiscoveryService,
  auth: AuthService,
) {
  return new DynamicStructuredTool({
    name: 'backstageTechDocsRead',
    description: `Reads a specific page of Backstage TechDocs technical documentation and returns the content.

The location parameter can be found in TechDocs search results.

Alternatively the path to the root documentation page of a Backstage entity can be constructed as follows:

/docs/<namespace>/<kind>/<name>/

The response will be formatted as Markdown.
`,
    schema: z.object({
      location: z.string().describe('Location path of the documentation'),
    }),
    func: async ({ location }, _, toolConfig) => {
      const credentials = toolConfig?.configurable!
        .credentials as BackstageCredentials;

      const url = new URL(
        `${await discoveryApi.getBaseUrl('techdocs')}/static${location}`,
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

      const turndownService = new TurndownService();

      return turndownService.turndown(container.outerHTML);
    },
  });
}
