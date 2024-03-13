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
  createPlugin,
  configApiRef,
  identityApiRef,
  createApiFactory,
  createComponentExtension,
} from '@backstage/core-plugin-api';
import { rootRouteRef } from './routes';
import { AwsCodeBuildApiClient, awsCodeBuildApiRef } from './api';
import { Entity } from '@backstage/catalog-model';
import { getOneOfEntityAnnotations } from '@aws/aws-core-plugin-for-backstage-common';
import {
  AWS_CODEBUILD_ARN_ANNOTATION,
  AWS_CODEBUILD_TAGS_ANNOTATION,
} from '@aws/aws-codebuild-plugin-for-backstage-common';

export const isAwsCodeBuildAvailable = (entity: Entity) =>
  getOneOfEntityAnnotations(entity, [
    AWS_CODEBUILD_ARN_ANNOTATION,
    AWS_CODEBUILD_TAGS_ANNOTATION,
  ]) !== undefined;

export const awsCodeBuildPlugin = createPlugin({
  id: 'aws-codebuild',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: awsCodeBuildApiRef,
      deps: { configApi: configApiRef, identityApi: identityApiRef },
      factory: ({ configApi, identityApi }) =>
        new AwsCodeBuildApiClient({ configApi, identityApi }),
    }),
  ],
});

export const EntityAwsCodeBuildCard = awsCodeBuildPlugin.provide(
  createComponentExtension({
    name: 'EntityAwsCodeBuildCard',
    component: {
      lazy: () =>
        import('./components/CodeBuildProjectCard').then(
          m => m.CodeBuildProjectCard,
        ),
    },
  }),
);
