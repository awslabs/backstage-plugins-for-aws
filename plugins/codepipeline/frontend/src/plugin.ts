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
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { AwsCodePipelineApiClient, awsCodePipelineApiRef } from './api';
import { rootRouteRef } from './routes';

export const awsCodePipelinePlugin = createPlugin({
  id: 'aws-codepipeline',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: awsCodePipelineApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AwsCodePipelineApiClient({ discoveryApi, fetchApi }),
    }),
  ],
});

export const EntityAwsCodePipelineExecutionsContent =
  awsCodePipelinePlugin.provide(
    createRoutableExtension({
      name: 'EntityAwsCodePipelineExecutionsContent',
      component: () => import('./components/Router').then(m => m.Router),
      mountPoint: rootRouteRef,
    }),
  );

export const EntityAwsCodePipelineCard = awsCodePipelinePlugin.provide(
  createComponentExtension({
    name: 'EntityAwsCodePipelineCard',
    component: {
      lazy: () =>
        import('./components/CodePipelineStateCard').then(
          m => m.CodePipelineStateCard,
        ),
    },
  }),
);

export { isAwsCodePipelineAvailable } from './components';
