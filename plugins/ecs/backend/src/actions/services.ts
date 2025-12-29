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
import { AmazonECSService } from '../service';

export const createGetServicesByEntityAction = ({
  amazonEcsApi,
  actionsRegistry,
}: {
  amazonEcsApi: AmazonECSService;
  actionsRegistry: ActionsRegistryService;
}) => {
  actionsRegistry.register({
    name: `get-amazon-ecs-services`,
    title: `Get Amazon ECS Services`,
    attributes: {
      destructive: false,
      readOnly: true,
      idempotent: true,
    },
    description: `
This allows you to retrieve the Amazon ECS Services related to a single entity from the software catalog.

Each entity in the software catalog has a unique name, kind, and namespace. The default namespace is "default".
Each entity is identified by a unique entity reference, which is a string of the form "kind:namespace/name".
    `,
    schema: {
      input: z =>
        z.object({
          name: z
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
        }),
      output: z => z.object({}).passthrough(),
    },
    action: async ({ input, credentials }) => {
      const response = await amazonEcsApi.getServicesSummaryByEntity({
        entityRef: input,
        credentials,
      });

      for (const service of response) {
        delete service.events;
        delete service.deployments;
        delete service.taskSets;
      }

      return {
        output: {
          services: response,
        },
      };
    },
  });
};
