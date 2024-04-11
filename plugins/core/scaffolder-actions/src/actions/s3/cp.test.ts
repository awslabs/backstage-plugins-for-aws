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

import { createAwsS3CpAction } from './cp';
import { createMockDirectory } from '@backstage/backend-test-utils';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DefaultAwsCredentialsManager,
  AwsCredentialProvider,
  AwsCredentialProviderOptions,
} from '@backstage/integration-aws-node';
import { ConfigReader } from '@backstage/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import 'aws-sdk-client-mock-jest';

const s3Mock = mockClient(S3Client);

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

const mockDir = createMockDirectory({ mockOsTmpDir: true });
const mockTmpDir = mockDir.path;

describe('testing', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    s3Mock.reset();
    getCredProviderMock.mockImplementation((_?: AwsCredentialProviderOptions) =>
      getMockCredentialProvider(),
    );
    mockDir.setContent({
      dir1: {
        'test-file.json': '{}',
        'test-file-again.json': '{}',
      },
      dir2: {
        'test-file.json': '{}',
      },
    });
  });

  const config = new ConfigReader({});

  const action = createAwsS3CpAction({
    credsManager: DefaultAwsCredentialsManager.fromConfig(config),
  });

  const mockContext = createMockActionContext({
    input: {
      bucketName: 'test-bucket',
    },
    workspacePath: mockTmpDir,
  });

  it('copies the workspace', async () => {
    await action.handler(mockContext);

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'test-bucket',
      Key: 'dir1/test-file.json',
    });

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'test-bucket',
      Key: 'dir1/test-file-again.json',
    });
  });

  it('copies a file', async () => {
    await action.handler({
      ...mockContext,
      input: {
        ...mockContext.input,
        path: 'dir1/test-file.json',
      },
    });

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'test-bucket',
      Key: 'dir1/test-file.json',
    });
  });

  it('copies a file with prefix', async () => {
    await action.handler({
      ...mockContext,
      input: {
        ...mockContext.input,
        path: 'dir1/test-file.json',
        prefix: 'test/',
      },
    });

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'test-bucket',
      Key: 'test/dir1/test-file.json',
    });
  });

  it('copies a directory', async () => {
    await action.handler({
      ...mockContext,
      input: {
        ...mockContext.input,
        path: 'dir1/**',
      },
    });

    expect(s3Mock).toHaveReceivedCommandWith(PutObjectCommand, {
      Bucket: 'test-bucket',
      Key: 'dir1/test-file.json',
    });
  });
});
