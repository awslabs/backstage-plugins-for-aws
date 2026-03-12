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

import { createDevApp } from '@backstage/dev-utils';
import { EntityAmazonEcsServicesContent, amazonEcsPlugin } from '../src/plugin';
import { TestApiRegistry } from '@backstage/test-utils';
import { ApiProvider, ConfigReader } from '@backstage/core-app-api';
import { configApiRef, ConfigApi } from '@backstage/core-plugin-api';
import { amazonEcsApiRef } from '../src/api';
import { MockAmazonEcsApiClient, mockEntity } from '../src/mocks';
import { EntityProvider } from '@backstage/plugin-catalog-react';

const configApi: ConfigApi = new ConfigReader({});

const apis = TestApiRegistry.from(
  [configApiRef, configApi],
  [amazonEcsApiRef, new MockAmazonEcsApiClient()],
);

createDevApp()
  .registerPlugin(amazonEcsPlugin)
  .addPage({
    element: (
      <ApiProvider apis={apis}>
        <EntityProvider entity={mockEntity}>
          <EntityAmazonEcsServicesContent />
        </EntityProvider>
      </ApiProvider>
    ),
    title: 'Root Page',
    path: '/amazon-ecs-plugin-for-backstage',
  })
  .render();
