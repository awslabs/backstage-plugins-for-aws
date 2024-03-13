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
import { AwsCodePipelineApi } from '../api';
import {
  PipelineExecutionsResponse,
  PipelineStateResponse,
  mockCodePipelineExecutions,
  mockCodePipelineStatus as mockCodePipelineState,
} from '@aws/aws-codepipeline-plugin-for-backstage-common';

export class MockAwsCodePipelineApiClient implements AwsCodePipelineApi {
  // @ts-ignore
  getPipelineExecutionsByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<PipelineExecutionsResponse> {
    return Promise.resolve({
      pipelineExecutions: [
        {
          pipelineName: 'pipeline1',
          pipelineRegion: 'us-west-2',
          pipelineArn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
          pipelineExecutions: mockCodePipelineExecutions(),
        },
        {
          pipelineName: 'pipeline2',
          pipelineRegion: 'us-west-2',
          pipelineArn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline2',
          pipelineExecutions: mockCodePipelineExecutions(),
        },
      ],
    });
  }
  // @ts-ignore
  getPipelineStateByEntity({
    entity,
  }: {
    entity: CompoundEntityRef;
  }): Promise<PipelineStateResponse> {
    return Promise.resolve({
      pipelines: [
        {
          pipelineName: 'pipeline2',
          pipelineRegion: 'us-west-2',
          pipelineArn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline2',
          pipelineState: mockCodePipelineState(),
        },
      ],
    });
  }
}
