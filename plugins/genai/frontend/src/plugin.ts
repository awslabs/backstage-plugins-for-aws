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
import { AgentApiClient, agentApiRef } from './api';
import { rootRouteRef } from './routes';

export const awsGenAiPlugin = createPlugin({
  id: 'aws-genai',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: agentApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AgentApiClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export const AgentChatPage = awsGenAiPlugin.provide(
  createRoutableExtension({
    name: 'AgentChatPage',
    component: () => import('./components/AgentPage').then(m => m.AgentPage),
    mountPoint: rootRouteRef,
  }),
);
