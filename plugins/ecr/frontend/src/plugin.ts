/*
 * Copyright 2022 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Entity } from '@backstage/catalog-model';
import {
  createApiFactory,
  createPlugin,
  createComponentExtension,
  discoveryApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { AwsEcrClient, awsEcrScanApiRef } from './api';

export const ECR_ANNOTATION = 'aws.amazon.com/aws-ecr-repository-name';

export const isAwsEcrScanResultsAvailable = (entity: Entity) =>
  Boolean(entity.metadata.annotations?.[ECR_ANNOTATION]);

export const awsEcrScanPlugin = createPlugin({
  id: 'aws-ecr-scan',
  apis: [
    createApiFactory({
      api: awsEcrScanApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
      factory: ({ discoveryApi, identityApi }) =>
        new AwsEcrClient({ discoveryApi, identityApi }),
    }),
  ],
});

export const EntityEcrScanResultsContent = awsEcrScanPlugin.provide(
  createComponentExtension({
    name: 'AwsEcrScanTab',
    component: {
      lazy: () =>
        import('./components/EntityEcrScanResultsContent').then(
          m => m.EntityEcrScanResultsContent,
        ),
    },
  }),
);
