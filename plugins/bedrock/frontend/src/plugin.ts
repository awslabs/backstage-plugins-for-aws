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
import { AmazonBedrockAgentApiClient, amazonBedrockAgentApiRef } from './api';
import { rootRouteRef } from './routes';

export const amazonBedrockPlugin = createPlugin({
  id: 'amazon-bedrock',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: amazonBedrockAgentApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AmazonBedrockAgentApiClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export const AmazonBedrockAgentChatPage = amazonBedrockPlugin.provide(
  createRoutableExtension({
    name: 'AmazonBedrockAgentChatPage',
    component: () => import('./components/Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);
