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
import { awsCodeBuildPlugin } from '../src/plugin';
import { TestApiRegistry } from '@backstage/test-utils';
import { ApiProvider, ConfigReader } from '@backstage/core-app-api';
import { configApiRef, ConfigApi } from '@backstage/core-plugin-api';
import { awsCodeBuildApiRef } from '../src/api';
import { MockAwsCodeBuildApiClient } from '../src/mocks';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import { mockEntityWithTags } from '@aws/aws-codebuild-plugin-for-backstage-common';
import { CodeBuildProjectCard } from '../src/components/CodeBuildProjectCard';

const configApi: ConfigApi = new ConfigReader({});

const apis = TestApiRegistry.from(
  [configApiRef, configApi],
  [awsCodeBuildApiRef, new MockAwsCodeBuildApiClient()],
);

createDevApp()
  .registerPlugin(awsCodeBuildPlugin)
  .addPage({
    path: '/fixture-project-card',
    title: 'Project Card',
    element: (
      <ApiProvider apis={apis}>
        <EntityProvider entity={mockEntityWithTags}>
          <CodeBuildProjectCard />
        </EntityProvider>
      </ApiProvider>
    ),
  })
  .render();
