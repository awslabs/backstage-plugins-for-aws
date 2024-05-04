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
  AWS_CODEBUILD_ARN_ANNOTATION,
  AWS_CODEBUILD_ARN_ANNOTATION_LEGACY,
  AWS_CODEBUILD_TAGS_ANNOTATION,
} from '@aws/aws-codebuild-plugin-for-backstage-common';
import { getOneOfEntityAnnotations } from '@aws/aws-core-plugin-for-backstage-common';
import { Entity } from '@backstage/catalog-model';
import {
  createApiFactory,
  createComponentExtension,
  createPlugin,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { AwsCodeBuildApiClient, awsCodeBuildApiRef } from './api';
import { rootRouteRef } from './routes';

export const isAwsCodeBuildAvailable = (entity: Entity) =>
  getOneOfEntityAnnotations(entity, [
    AWS_CODEBUILD_ARN_ANNOTATION,
    AWS_CODEBUILD_TAGS_ANNOTATION,
    AWS_CODEBUILD_ARN_ANNOTATION_LEGACY,
  ]) !== undefined;

export const awsCodeBuildPlugin = createPlugin({
  id: 'aws-codebuild',
  routes: {
    root: rootRouteRef,
  },
  apis: [
    createApiFactory({
      api: awsCodeBuildApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AwsCodeBuildApiClient({ discoveryApi, fetchApi }),
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
