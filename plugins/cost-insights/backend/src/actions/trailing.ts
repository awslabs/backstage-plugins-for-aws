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
import { CostInsightsAwsService } from '../service';
import { DateTime, Duration as LuxonDuration } from 'luxon';

export const createGetTrailingCostsAction = ({
  costInsightsAwsService,
  actionsRegistry,
}: {
  costInsightsAwsService: CostInsightsAwsService;
  actionsRegistry: ActionsRegistryService;
}) => {
  actionsRegistry.register({
    name: `get-cost-insights-aws-history`,
    title: `Get Cost Insights AWS History`,
    attributes: {
      destructive: false,
      readOnly: true,
      idempotent: true,
    },
    description: `
This allows you to retrieve historical cost information for AWS resources related to a single entity from the software catalog.
Data is retrieved for a specified amount of time before the start date.

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
          unit: z
            .enum(['days', 'months'])
            .describe('Time unit to group costs by'),
          intervalCount: z
            .number()
            .describe(
              'Number of intervals to retrieve before the start date (months, days etc)',
            ),
          startDate: z.coerce
            .date()
            .optional()
            .describe(
              'Start date to retrieve data from and work backwards, format YYYY-MM-DD',
            ),
        }),
      output: z => z.object({}).passthrough(),
    },
    action: async ({ input, credentials }) => {
      const duration = {
        months: LuxonDuration.fromObject({ months: input.intervalCount - 1 }),
        days: LuxonDuration.fromObject({ days: input.intervalCount }),
      }[input.unit];

      const startDate = input.startDate
        ? DateTime.fromJSDate(input.startDate)
        : DateTime.now().endOf(input.unit === 'days' ? 'day' : 'month');
      const endDate = startDate.minus(duration);

      const result = await costInsightsAwsService.getCatalogEntityRangeCost({
        entityRef: {
          kind: input.kind,
          name: input.name,
          namespace: input.namespace,
        },
        startDate: startDate.toJSDate(),
        endDate: endDate.toJSDate(),
        granularity: input.unit === 'days' ? 'DAILY' : 'MONTHLY',
        credentials,
      });

      return {
        output: {
          totalCost: result.aggregation,
          groupedCosts: result.groupedCosts,
        },
      };
    },
  });
};
