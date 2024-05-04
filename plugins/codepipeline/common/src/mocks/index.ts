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

import {
  ActionExecutionStatus,
  PipelineExecutionStatus,
  StageExecutionStatus,
  TriggerType,
} from '@aws-sdk/client-codepipeline';
import { Entity } from '@backstage/catalog-model';
import {
  AWS_CODEPIPELINE_ARN_ANNOTATION,
  AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY,
  AWS_CODEPIPELINE_TAGS_ANNOTATION,
} from '../types';

export function mockCodePipelineExecutions() {
  return [
    {
      lastUpdateTime: new Date('2022-05-03T00:52:45.631Z'),
      pipelineExecutionId: 'e6c91a02-d844-4663-ad62-b719608f8fc5',
      sourceRevisions: [
        {
          actionName: 'Checkout',
          revisionId: 'da7add70427515f20f736525be1b92bf23ff6b6f',
          revisionSummary:
            '{"ProviderType":"GitHub","CommitMessage":"Updated some files"}',
          revisionUrl:
            'https://us-west-2.console.aws.amazon.com/codesuite/settings/connections/redirect?connectionArn=arn:aws:codestar-connections:us-west-2:1234567890:connection/4dde5c82-51d6-4ea9-918e-03aed6972ff3&referenceType=COMMIT&FullRepositoryId=aws/dummy-repository&Commit=da7add70427515f20f736525be1b92bf23ff6b6f',
        },
      ],
      startTime: new Date('2022-05-03T00:51:35.229Z'),
      status: PipelineExecutionStatus.InProgress,
      stopTrigger: undefined,
      trigger: {
        triggerType: TriggerType.Webhook,
        triggerDetail:
          'arn:aws:codestar-connections:us-west-2:111111111111:connection/4dde5c82-51d6-4ea9-918e-03aed6971ff3',
      },
    },
    {
      lastUpdateTime: new Date('2022-04-15T17:55:04.950Z'),
      pipelineExecutionId: '17baba6f-22f6-4f6d-8d37-96321a35f77e',
      sourceRevisions: [
        {
          actionName: 'SourceAction',
          revisionId: 'bf8606e49a5ec67d31c24665e921d0cc2d52d71a',
          revisionSummary: 'Initial commit by AWS CodeCommit',
          revisionUrl:
            'https://console.aws.amazon.com/codecommit/home?region=us-west-2#/repository/dummy/commit/bf8606e49a5ec67d31c24665e921d0cc2d52d71a',
        },
      ],
      startTime: new Date('2022-04-15T17:45:51.244Z'),
      status: PipelineExecutionStatus.Failed,
      stopTrigger: undefined,
      trigger: {
        triggerType: TriggerType.CreatePipeline,
        triggerDetail:
          'arn:aws:sts::1234567890:assumed-role/ServiceRole/DummyRole',
      },
    },
    {
      lastUpdateTime: new Date('2022-04-15T17:55:04.950Z'),
      pipelineExecutionId: '17baba6f-22f6-4f6d-8d37-96321a35f77e',
      sourceRevisions: [
        {
          actionName: 'Source',
          revisionId: 'CXkyGc4T_6.0ZrS3vwWYfF1NHHYqGtmh',
          revisionSummary:
            'Amazon S3 version id: CXkyGc4T_6.0ZrS3vwWYfF1NHHYqGtmh',
        },
      ],
      startTime: new Date('2022-04-15T17:45:51.244Z'),
      status: PipelineExecutionStatus.Succeeded,
      stopTrigger: undefined,
      trigger: {
        triggerType: TriggerType.StartPipelineExecution,
        triggerDetail:
          'arn:aws:sts::1234567890:assumed-role/ServiceRole/DummyRole',
      },
    },
  ];
}

export function mockCodePipelineStatus() {
  return {
    created: new Date('2022-04-15T17:45:51.244Z'),
    pipelineName: 'test-pipeline',
    pipelineVersion: 1,
    stageStates: [
      {
        actionStates: [
          {
            actionName: 'Source',
            entityUrl: 'https://console.aws.amazon.com/s3/home?#',
            latestExecution: {
              lastStatusChange: new Date('2022-04-15T17:45:51.244Z'),
              status: ActionExecutionStatus.Succeeded,
              actionExecutionId: '17baba6f-22f6-4f6d-8d37-96321a35f77e',
            },
          },
        ],
        latestExecution: {
          pipelineExecutionId: 'e8e9ca8f-bacf-4878-8887-05a6ccec0019',
          status: StageExecutionStatus.Succeeded,
        },
        stageName: 'Source',
      },
      {
        actionStates: [
          {
            actionName: 'CodePipelineDemoFleet',
            entityUrl:
              'https://console.aws.amazon.com/codedeploy/home?#/applications/CodePipelineDemoApplication/deployment-groups/CodePipelineDemoFleet',
            latestExecution: {
              externalExecutionId: 'd-EXAMPLE',
              externalExecutionUrl:
                'https://console.aws.amazon.com/codedeploy/home?#/deployments/d-EXAMPLE',
              lastStatusChange: new Date('2022-04-15T17:45:51.244Z'),
              status: ActionExecutionStatus.Succeeded,
              summary: 'Deployment Succeeded',
              actionExecutionId: 'e6c91a02-d844-4663-ad62-b719608f8fc5',
            },
          },
        ],
        inboundTransitionState: {
          enabled: true,
        },
        latestExecution: {
          pipelineExecutionId: 'e8e9ca8f-bacf-4878-8887-05a6ccec0019',
          status: StageExecutionStatus.Succeeded,
        },
        stageName: 'Beta',
      },
    ],
    updated: new Date('2022-04-15T17:45:51.244Z'),
  };
}

export const mockEntityWithTags: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backstage',
    description: 'backstage.io',
    annotations: {
      [AWS_CODEPIPELINE_TAGS_ANNOTATION]: 'component=test',
    },
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};

export const mockEntityWithArn: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backstage',
    description: 'backstage.io',
    annotations: {
      [AWS_CODEPIPELINE_ARN_ANNOTATION]:
        'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
    },
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};

export const mockEntityWithArnLegacy: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backstage',
    description: 'backstage.io',
    annotations: {
      [AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY]:
        'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
    },
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};
