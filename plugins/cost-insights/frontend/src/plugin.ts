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
  configApiRef,
  createApiFactory,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';
import { costInsightsApiRef } from '@backstage-community/plugin-cost-insights';
import { CostExplorerClient } from './api';
import { catalogApiRef } from '@backstage/plugin-catalog-react';

export const costInsightsAwsPlugin = createPlugin({
  id: 'cost-insights-aws',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: costInsightsApiRef,
      deps: {
        configApi: configApiRef,
        fetchApi: fetchApiRef,
        discoveryApi: discoveryApiRef,
        catalogApi: catalogApiRef,
      },
      factory: ({ discoveryApi, fetchApi, catalogApi }) => {
        return new CostExplorerClient(discoveryApi, fetchApi, catalogApi);
      },
    }),
  ],
});
