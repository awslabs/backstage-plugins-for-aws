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
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { AmazonEcsApiClient, amazonEcsApiRef } from './api';
import { rootRouteRef } from './routes';

export const amazonEcsPlugin = createPlugin({
  id: 'amazon-ecs',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: amazonEcsApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AmazonEcsApiClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export const EntityAmazonEcsServicesContent = amazonEcsPlugin.provide(
  createRoutableExtension({
    name: 'EntityAmazonEcsServicesContent',
    component: () => import('./components/Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);

export { isAmazonEcsServiceAvailable } from './components';
