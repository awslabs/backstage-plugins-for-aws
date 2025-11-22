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

import { createAwsEventBridgeEventAction } from './eventbridge';
import { createMockActionContext } from '@backstage/plugin-scaffolder-node-test-utils';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DefaultAwsCredentialsManager,
  AwsCredentialProvider,
  AwsCredentialProviderOptions,
} from '@backstage/integration-aws-node';
import { ConfigReader } from '@backstage/config';
import {
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import 'aws-sdk-client-mock-jest';

const eventBridgeMock = mockClient(EventBridgeClient);

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

describe('aws:eventbridge:event', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    eventBridgeMock.reset();
    getCredProviderMock.mockImplementation((_?: AwsCredentialProviderOptions) =>
      getMockCredentialProvider(),
    );
  });

  const config = new ConfigReader({});

  const action = createAwsEventBridgeEventAction({
    credsManager: DefaultAwsCredentialsManager.fromConfig(config),
  });

  it('sends event with detail string', async () => {
    const mockContext = createMockActionContext({
      input: {
        source: 'test.source',
        detail: '{"key":"value"}',
        detailType: 'Test Event',
        eventBusName: 'test-bus',
      },
    });

    await action.handler(mockContext);

    expect(eventBridgeMock).toHaveReceivedCommandWith(PutEventsCommand, {
      Entries: [
        {
          Source: 'test.source',
          Detail: '{"key":"value"}',
          DetailType: 'Test Event',
          EventBusName: 'test-bus',
        },
      ],
    });
  });

  it('sends event with detailObject', async () => {
    const mockContext = createMockActionContext({
      input: {
        source: 'test.source',
        detailObject: { key: 'value' },
        detailType: 'Test Event',
        eventBusName: 'test-bus',
      },
    });

    await action.handler(mockContext);

    expect(eventBridgeMock).toHaveReceivedCommandWith(PutEventsCommand, {
      Entries: [
        {
          Source: 'test.source',
          Detail: '{"key":"value"}',
          DetailType: 'Test Event',
          EventBusName: 'test-bus',
        },
      ],
    });
  });

  it('sends event with accountId and region', async () => {
    const mockContext = createMockActionContext({
      input: {
        accountId: '123456789012',
        region: 'us-east-1',
        source: 'test.source',
        detail: '{"key":"value"}',
        detailType: 'Test Event',
        eventBusName: 'test-bus',
      },
    });

    await action.handler(mockContext);

    expect(getCredProviderMock).toHaveBeenCalledWith({
      accountId: '123456789012',
    });
    expect(eventBridgeMock).toHaveReceivedCommandWith(PutEventsCommand, {
      Entries: [
        {
          Source: 'test.source',
          Detail: '{"key":"value"}',
          DetailType: 'Test Event',
          EventBusName: 'test-bus',
        },
      ],
    });
  });

  it('throws error when neither detail nor detailObject provided', async () => {
    const mockContext = createMockActionContext({
      input: {
        source: 'test.source',
        detailType: 'Test Event',
        eventBusName: 'test-bus',
      },
    });

    await expect(action.handler(mockContext)).rejects.toThrow(
      'Either detail or detailObject must be provided.',
    );
  });
});
