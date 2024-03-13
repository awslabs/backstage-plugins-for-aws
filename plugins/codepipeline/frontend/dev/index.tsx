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

import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import {
  EntityAwsCodePipelineExecutionsContent,
  awsCodePipelinePlugin,
} from '../src/plugin';
import { TestApiRegistry } from '@backstage/test-utils';
import { ApiProvider, ConfigReader } from '@backstage/core-app-api';
import { configApiRef, ConfigApi } from '@backstage/core-plugin-api';
import { awsCodePipelineApiRef } from '../src/api';
import { MockAwsCodePipelineApiClient } from '../src/mocks';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { mockEntityWithTags } from '@aws/aws-codepipeline-plugin-for-backstage-common';
import { CodePipelineStateCard } from '../src/components/CodePipelineStateCard';

const configApi: ConfigApi = new ConfigReader({});

const apis = TestApiRegistry.from(
  [configApiRef, configApi],
  [awsCodePipelineApiRef, new MockAwsCodePipelineApiClient()],
);

createDevApp()
  .registerPlugin(awsCodePipelinePlugin)
  .addPage({
    element: (
      <ApiProvider apis={apis}>
        <EntityProvider entity={mockEntityWithTags}>
          <EntityAwsCodePipelineExecutionsContent />
        </EntityProvider>
      </ApiProvider>
    ),
    title: 'Pipeline Executions',
    path: '/codepipeline-executions',
  })
  .addPage({
    element: (
      <ApiProvider apis={apis}>
        <EntityProvider
          entity={{
            apiVersion: 'backstage.io/v1alpha1',
            kind: 'Component',
            metadata: {
              name: 'backstage',
              description: 'backstage.io',
              annotations: {},
            },
          }}
        >
          <EntityAwsCodePipelineExecutionsContent />
        </EntityProvider>
      </ApiProvider>
    ),
    title: 'Pipeline Executions (Missing Annotation)',
    path: '/codepipeline-executions-missing-annotation',
  })
  .addPage({
    path: '/fixture-pipeline-card',
    title: 'Pipeline Card',
    element: (
      <ApiProvider apis={apis}>
        <EntityProvider entity={mockEntityWithTags}>
          <CodePipelineStateCard />
        </EntityProvider>
      </ApiProvider>
    ),
  })
  .render();
