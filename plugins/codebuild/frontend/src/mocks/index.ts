/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CompoundEntityRef } from '@backstage/catalog-model';
import { AwsCodeBuildApi } from '../api';
import {
  ProjectsResponse,
  mockCodeBuildProjectBuild,
  mockCodeBuildProject,
} from '@aws/aws-codebuild-plugin-for-backstage-common';

export class MockAwsCodeBuildApiClient implements AwsCodeBuildApi {
  // @ts-ignore
  getProjectsByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<ProjectsResponse> {
    return Promise.resolve({
      projects: [
        {
          projectAccountId: '111111111',
          projectName: 'project1',
          projectRegion: 'us-west-2',
          project: mockCodeBuildProject('project1'),
          builds: [mockCodeBuildProjectBuild('project1', 'test')],
        },
      ],
    });
  }
}
