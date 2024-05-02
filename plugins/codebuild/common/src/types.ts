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

import { Build, Project } from '@aws-sdk/client-codebuild';

export const AWS_CODEBUILD_ARN_ANNOTATION =
  'aws.amazon.com/aws-codebuild-project-arn';
export const AWS_CODEBUILD_TAGS_ANNOTATION =
  'aws.amazon.com/aws-codebuild-project-tags';
export const AWS_CODEBUILD_ARN_ANNOTATION_LEGACY =
  'aws.amazon.com/aws-codebuild-project';

export interface ProjectResponse {
  project: Project;
  projectRegion: string;
  projectAccountId: string;
  projectName: string;
  builds: Array<Build>;
}

export interface ProjectsResponse {
  projects: Array<ProjectResponse>;
}
