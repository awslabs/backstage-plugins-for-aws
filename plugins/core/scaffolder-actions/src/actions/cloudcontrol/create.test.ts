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
  CloudControlClient,
  CreateResourceCommand,
  GetResourceRequestStatusCommand,
} from '@aws-sdk/client-cloudcontrol';
import { createAwsCloudControlCreateAction } from './create';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DefaultAwsCredentialsManager,
  AwsCredentialProvider,
  AwsCredentialProviderOptions,
} from '@backstage/integration-aws-node';
import { ConfigReader } from '@backstage/config';

const cloudControlMock = mockClient(CloudControlClient);

function getMockCredentialProvider(): Promise<AwsCredentialProvider> {
  return Promise.resolve({
    sdkCredentialProvider: async () => {
      return Promise.resolve({
        accessKeyId: 'MY_ACCESS_KEY_ID',
        secretAccessKey: 'MY_SECRET_ACCESS_KEY',
      });
    },
  });
}
const getCredProviderMock = jest.spyOn(
  DefaultAwsCredentialsManager.prototype,
  'getCredentialProvider',
);

describe('testing', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    cloudControlMock.reset();
    getCredProviderMock.mockImplementation((_?: AwsCredentialProviderOptions) =>
      getMockCredentialProvider(),
    );
  });

  const config = new ConfigReader({});

  const action = createAwsCloudControlCreateAction({
    credsManager: DefaultAwsCredentialsManager.fromConfig(config),
  });

  const mockContext = createMockActionContext({
    input: {
      typeName: 'AWS::ECR::Repository',
      desiredState: '{"RepositoryName": "testing-thing"}',
    },
  });

  it('creates a resource', async () => {
    cloudControlMock
      .on(CreateResourceCommand, {
        TypeName: 'AWS::ECR::Repository',
      })
      .resolves({
        ProgressEvent: {
          RequestToken: 'fake-token',
        },
      });

    await action.handler({
      ...mockContext,
      input: {
        typeName: 'AWS::ECR::Repository',
        desiredState: '{"RepositoryName": "testing-thing"}',
      },
    });

    expect(mockContext.output).toHaveBeenCalledTimes(0);
  });

  it('waits until resource is created', async () => {
    cloudControlMock
      .on(CreateResourceCommand, {
        TypeName: 'AWS::ECR::Repository',
      })
      .resolves({
        ProgressEvent: {
          RequestToken: 'fake-token',
        },
      });

    cloudControlMock
      .on(GetResourceRequestStatusCommand, {
        RequestToken: 'fake-token',
      })
      .resolves({
        ProgressEvent: {
          Identifier: 'fake-identifier',
          OperationStatus: 'SUCCESS',
        },
      });

    await action.handler({
      ...mockContext,
      input: {
        ...mockContext.input,
        wait: true,
      },
    });

    expect(mockContext.output).toHaveBeenCalledWith(
      'identifier',
      'fake-identifier',
    );
  });
});
