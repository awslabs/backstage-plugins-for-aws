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

import { ConfigReader } from '@backstage/config';
import { mockClient } from 'aws-sdk-client-mock';
import { getVoidLogger } from '@backstage/backend-common';
import {
  DefaultAwsCredentialsManager,
  AwsCredentialProvider,
  AwsCredentialProviderOptions,
} from '@backstage/integration-aws-node';
import {
  ConfigServiceClient,
  SelectAggregateResourceConfigCommand,
  SelectResourceConfigCommand,
} from '@aws-sdk/client-config-service';
import { AwsConfigResourceLocator } from './aws-config-locator';

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

const awsConfigMock = mockClient(ConfigServiceClient);

const logger = getVoidLogger();

describe('AWS Config locator', () => {
  beforeAll(async () => {});

  beforeEach(() => {
    jest.resetAllMocks();
    awsConfigMock.reset();
    getCredProviderMock.mockImplementation((_?: AwsCredentialProviderOptions) =>
      getMockCredentialProvider(),
    );
  });

  async function configureProvider(
    configData: any,
  ): Promise<AwsConfigResourceLocator> {
    const config = new ConfigReader(configData);

    return await AwsConfigResourceLocator.fromConfig(config, { logger });
  }

  describe('empty config', () => {
    it('returns ok', async () => {
      awsConfigMock
        .on(SelectResourceConfigCommand, {
          Expression:
            "SELECT arn WHERE tags.tag='component=test' AND resourceType='AWS::ECS::Service'",
        })
        .resolves({
          Results: ['{"arn": "arn1"}'],
        });

      const locator = await configureProvider({});

      const response = await locator.getResourceArns({
        resourceType: 'AWS::ECS::Service',
        tagString: 'component=test',
      });

      expect(response.length).toBe(1);
      expect(response[0]).toMatch('arn1');
    });

    it('handles empty result', async () => {
      awsConfigMock
        .on(SelectResourceConfigCommand, {
          Expression:
            "SELECT arn WHERE tags.tag='component=test' AND resourceType='AWS::ECS::Service'",
        })
        .resolves({
          Results: [],
        });

      const locator = await configureProvider({});

      const response = await locator.getResourceArns({
        resourceType: 'AWS::ECS::Service',
        tagString: 'component=test',
      });

      expect(response.length).toBe(0);
    });
  });

  describe('Aggregator configured', () => {
    it('queries aggregator', async () => {
      awsConfigMock
        .on(SelectAggregateResourceConfigCommand, {
          Expression:
            "SELECT arn WHERE tags.tag='component=test' AND resourceType='AWS::ECS::Service'",
          ConfigurationAggregatorName: 'aggregatorname',
        })
        .resolves({
          Results: ['{"arn": "arn1"}'],
        });

      const locator = await configureProvider({
        aws: {
          locator: {
            awsConfig: {
              aggregatorName: 'aggregatorname',
            },
          },
        },
      });

      const response = await locator.getResourceArns({
        resourceType: 'AWS::ECS::Service',
        tagString: 'component=test',
      });

      expect(response.length).toBe(1);
      expect(response[0]).toMatch('arn1');
    });
  });
});
