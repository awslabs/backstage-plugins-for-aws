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

import { Build, Project } from '@aws-sdk/client-codebuild';
import { Entity } from '@backstage/catalog-model';
import {
  AWS_CODEBUILD_ARN_ANNOTATION,
  AWS_CODEBUILD_ARN_ANNOTATION_LEGACY,
  AWS_CODEBUILD_TAGS_ANNOTATION,
} from '../types';

export function mockCodeBuildProjectBuild(project: string, id: string): Build {
  return {
    arn: `arn:aws:codebuild:us-west-2:1234567890:build/${project}:${id}`,
    artifacts: {
      encryptionDisabled: false,
      location: `arn:aws:s3:::nk-hello-artifact/${project}`,
      md5sum: '',
      overrideArtifactName: false,
      sha256sum: '',
    },
    buildComplete: true,
    buildNumber: 10,
    buildStatus: 'SUCCEEDED',
    cache: {
      type: 'NO_CACHE',
    },
    currentPhase: 'COMPLETED',
    encryptionKey: 'arn:aws:kms:us-west-2:1234567890:alias/aws/s3',
    endTime: new Date('2022-04-13T23:34:38.397Z'),
    environment: {
      computeType: 'BUILD_GENERAL1_SMALL',
      environmentVariables: [],
      image: 'aws/codebuild/standard:5.0',
      imagePullCredentialsType: 'CODEBUILD',
      privilegedMode: false,
      type: 'LINUX_CONTAINER',
    },
    id: 'Deploy2Project-KpLyLCIGYbKE:792ebbad-1dbb-4594-8206-5a09ed4330b6',
    initiator: 'someone',
    logs: {
      cloudWatchLogs: {
        status: 'ENABLED',
      },
      cloudWatchLogsArn:
        'arn:aws:logs:us-west-2:1234567890:log-group:/aws/codebuild/Deploy2Project-KpLyLCIGYbKE:log-stream:792ebbad-1dbb-4594-8206-5a09ed4330b6',
      deepLink:
        'https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#logEvent:group=/aws/codebuild/Deploy2Project-KpLyLCIGYbKE;stream=792ebbad-1dbb-4594-8206-5a09ed4330b6',
      groupName: '/aws/codebuild/Deploy2Project-KpLyLCIGYbKE',
      s3Logs: {
        encryptionDisabled: false,
        status: 'DISABLED',
      },
      streamName: '792ebbad-1dbb-4594-8206-5a09ed4330b6',
    },
    phases: [
      {
        durationInSeconds: 0,
        endTime: new Date('2022-04-13T23:31:26.165Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'SUBMITTED',
        startTime: new Date('2022-04-13T23:31:26.086Z'),
      },
      {
        durationInSeconds: 1,
        endTime: new Date('2022-04-13T23:31:28.022Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'QUEUED',
        startTime: new Date('2022-04-13T23:31:26.165Z'),
      },
      {
        contexts: [
          {
            message: '',
            statusCode: '',
          },
        ],
        durationInSeconds: 19,
        endTime: new Date('2022-04-13T23:31:47.454Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'PROVISIONING',
        startTime: new Date('2022-04-13T23:31:28.022Z'),
      },
      {
        contexts: [
          {
            message: '',
            statusCode: '',
          },
        ],
        durationInSeconds: 2,
        endTime: new Date('2022-04-13T23:31:50.437Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'DOWNLOAD_SOURCE',
        startTime: new Date('2022-04-13T23:31:47.454Z'),
      },
      {
        contexts: [
          {
            message: '',
            statusCode: '',
          },
        ],
        durationInSeconds: 4,
        endTime: new Date('2022-04-13T23:31:55.327Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'INSTALL',
        startTime: new Date('2022-04-13T23:31:50.437Z'),
      },
      {
        contexts: [
          {
            message: '',
            statusCode: '',
          },
        ],
        durationInSeconds: 7,
        endTime: new Date('2022-04-13T23:32:02.465Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'PRE_BUILD',
        startTime: new Date('2022-04-13T23:31:55.327Z'),
      },
      {
        contexts: [
          {
            message: '',
            statusCode: '',
          },
        ],
        durationInSeconds: 3,
        endTime: new Date('2022-04-13T23:32:05.531Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'BUILD',
        startTime: new Date('2022-04-13T23:32:02.465Z'),
      },
      {
        contexts: [
          {
            message: '',
            statusCode: '',
          },
        ],
        durationInSeconds: 0,
        endTime: new Date('2022-04-13T23:32:05.570Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'POST_BUILD',
        startTime: new Date('2022-04-13T23:32:05.531Z'),
      },
      {
        contexts: [
          {
            message: '',
            statusCode: '',
          },
        ],
        durationInSeconds: 0,
        endTime: new Date('2022-04-13T23:32:06.322Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'UPLOAD_ARTIFACTS',
        startTime: new Date('2022-04-13T23:32:05.570Z'),
      },
      {
        contexts: [
          {
            message: '',
            statusCode: '',
          },
        ],
        durationInSeconds: 2,
        endTime: new Date('2022-04-13T23:32:08.397Z'),
        phaseStatus: 'SUCCEEDED',
        phaseType: 'FINALIZING',
        startTime: new Date('2022-04-13T23:32:06.322Z'),
      },
      {
        phaseType: 'COMPLETED',
        startTime: new Date('2022-04-13T23:32:08.397Z'),
      },
    ],
    projectName: project,
    queuedTimeoutInMinutes: 480,
    resolvedSourceVersion: 'e37188da86d7b4c143238954f961b85d23f87678',
    secondaryArtifacts: [],
    secondarySourceVersions: [],
    secondarySources: [],
    serviceRole: 'arn:aws:iam::1234567890:role/service-role/service-role',
    source: {
      buildspec: 'NOOP',
      gitCloneDepth: 1,
      gitSubmodulesConfig: {
        fetchSubmodules: false,
      },
      insecureSsl: false,
      location: 'https://github.com/example/example',
      reportBuildStatus: false,
      type: 'GITHUB',
    },
    startTime: new Date('2022-04-13T23:31:26.086Z'),
    timeoutInMinutes: 60,
  };
}

export function mockCodeBuildProject(project: string): Project {
  return {
    name: project,
    arn: `arn:aws:codebuild:us-west-2:1234567890:project/${project}`,
    source: {
      type: 'CODEPIPELINE',
      buildspec: 'dummy',
      insecureSsl: false,
    },
    artifacts: {
      type: 'CODEPIPELINE',
      name: 'project1',
      packaging: 'NONE',
      encryptionDisabled: false,
    },
    cache: {
      type: 'NO_CACHE',
    },
    environment: {
      type: 'LINUX_CONTAINER',
      image: 'aws/codebuild/amazonlinux2-x86_64-standard:3.0',
      computeType: 'BUILD_GENERAL1_SMALL',
      environmentVariables: [
        {
          name: 'service_name',
          value: 'codepipeline-demo',
          type: 'PLAINTEXT',
        },
        {
          name: 'service_instance_name',
          value: 'prod',
          type: 'PLAINTEXT',
        },
      ],
      privilegedMode: false,
      imagePullCredentialsType: 'CODEBUILD',
    },
    serviceRole: 'arn:aws:iam::1234567890:role/servicerole',
    timeoutInMinutes: 60,
    queuedTimeoutInMinutes: 480,
    encryptionKey:
      'arn:aws:kms:us-west-2:1234567890:key/d37f7299-9412-485e-b467-33a05e8e9622',
    created: new Date('2022-05-20T13:58:29.342000-06:00'),
    lastModified: new Date('2022-05-20T13:58:29.342000-06:00'),
    badge: {
      badgeEnabled: false,
    },
    projectVisibility: 'PRIVATE',
  };
}

export const mockEntityWithTags: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backstage',
    description: 'backstage.io',
    annotations: {
      [AWS_CODEBUILD_TAGS_ANNOTATION]: 'component=test',
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
      [AWS_CODEBUILD_ARN_ANNOTATION]:
        'arn:aws:codebuild:us-west-2:1234567890:project/mock',
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
      [AWS_CODEBUILD_ARN_ANNOTATION_LEGACY]:
        'arn:aws:codebuild:us-west-2:1234567890:project/mock',
    },
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};
