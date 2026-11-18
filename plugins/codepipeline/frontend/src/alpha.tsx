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
  ApiBlueprint,
  createFrontendPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/frontend-plugin-api';
import {
  EntityCardBlueprint,
  EntityContentBlueprint,
} from '@backstage/plugin-catalog-react/alpha';
import { AwsCodePipelineApiClient, awsCodePipelineApiRef } from './api';
import { isAwsCodePipelineAvailable } from './components/Router';

const awsCodePipelineApi = ApiBlueprint.make({
  params: defineParams =>
    defineParams({
      api: awsCodePipelineApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AwsCodePipelineApiClient({ discoveryApi, fetchApi }),
    }),
});

const awsCodePipelineExecutionsEntityContent = EntityContentBlueprint.make({
  name: 'executions',
  params: {
    path: '/aws-codepipeline',
    title: 'AWS CodePipeline',
    filter: isAwsCodePipelineAvailable,
    loader: () =>
      import('./components/CodePipelineExecutions').then(m => (
        <m.EntityCodePipelineExecutions />
      )),
  },
});

const awsCodePipelineStateEntityCard = EntityCardBlueprint.make({
  name: 'state',
  params: {
    filter: isAwsCodePipelineAvailable,
    loader: () =>
      import('./components/CodePipelineStateCard').then(m => (
        <m.CodePipelineStateCard />
      )),
  },
});

export default createFrontendPlugin({
  pluginId: 'aws-codepipeline',
  info: { packageJson: () => import('../package.json') },
  extensions: [
    awsCodePipelineApi,
    awsCodePipelineExecutionsEntityContent,
    awsCodePipelineStateEntityCard,
  ],
});
