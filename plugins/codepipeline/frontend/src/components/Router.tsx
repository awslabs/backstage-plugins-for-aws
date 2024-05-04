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

import { Entity } from '@backstage/catalog-model';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  useEntity,
  MissingAnnotationEmptyState,
} from '@backstage/plugin-catalog-react';
import { getOneOfEntityAnnotations } from '@aws/aws-core-plugin-for-backstage-common';
import {
  AWS_CODEPIPELINE_ARN_ANNOTATION,
  AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY,
  AWS_CODEPIPELINE_TAGS_ANNOTATION,
} from '@aws/aws-codepipeline-plugin-for-backstage-common';
import { CodePipelineExecutions } from './CodePipelineExecutions';

export const isAwsCodePipelineAvailable = (entity: Entity) =>
  getOneOfEntityAnnotations(entity, [
    AWS_CODEPIPELINE_ARN_ANNOTATION,
    AWS_CODEPIPELINE_TAGS_ANNOTATION,
    AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY,
  ]) !== undefined;

export const Router = () => {
  const { entity } = useEntity();

  if (!isAwsCodePipelineAvailable(entity)) {
    return (
      <MissingAnnotationEmptyState
        annotation={[
          AWS_CODEPIPELINE_ARN_ANNOTATION,
          AWS_CODEPIPELINE_TAGS_ANNOTATION,
        ]}
      />
    );
  }

  return (
    <Routes>
      <Route path="/" element={<CodePipelineExecutions entity={entity} />} />
    </Routes>
  );
};
