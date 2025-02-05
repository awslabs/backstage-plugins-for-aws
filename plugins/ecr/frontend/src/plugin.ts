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
  discoveryApiRef,
  identityApiRef,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { AwsEcrClient, amazonEcrApiRef } from './api';
import { rootRouteRef } from './routes';

export const amazonEcrPlugin = createPlugin({
  id: 'amazon-ecr',
  apis: [
    createApiFactory({
      api: amazonEcrApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
      factory: ({ discoveryApi, identityApi }) =>
        new AwsEcrClient({ discoveryApi, identityApi }),
    }),
  ],
});

export const EntityAmazonEcrImagesContent = amazonEcrPlugin.provide(
  createRoutableExtension({
    name: 'EntityAmazonEcrImagesContent',
    component: () => import('./components/Router').then(m => m.Router),
    mountPoint: rootRouteRef,
  }),
);

export { isAmazonEcrAvailable } from './components';
