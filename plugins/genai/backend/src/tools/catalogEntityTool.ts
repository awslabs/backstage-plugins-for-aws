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
} from '@backstage/backend-plugin-api';
import { CatalogApi } from '@backstage/catalog-client';
import { stringifyEntityRef } from '@backstage/catalog-model';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';

export function createBackstageEntityTool(
  catalogApi: CatalogApi,
  auth: AuthService,
) {
  return new DynamicStructuredTool({
    get name() {
      return 'backstageEntity';
    },
    description:
      'Returns information regarding an entity from the Backstage catalog.',
    schema: z.object({
      entityName: z
        .string()
        .describe('Entity name as it appears in the Backstage catalog'),
      kind: z
        .string()
        .describe('Entity kind as it appears in the Backstage catalog'),
      namespace: z
        .string()
        .describe('Entity namespace as it appears in the Backstage catalog')
        .default('default'),
    }),
    func: async ({ entityName, kind, namespace }, _, toolConfig) => {
      const credentials = toolConfig?.configurable!
        .credentials as BackstageCredentials;

      return JSON.stringify(
        await catalogApi.getEntitiesByRefs(
          {
            entityRefs: [
              stringifyEntityRef({ kind, namespace, name: entityName }),
            ],
          },
          await auth.getPluginRequestToken({
            onBehalfOf: credentials,
            targetPluginId: 'catalog',
          }),
        ),
      );
    },
  });
}
