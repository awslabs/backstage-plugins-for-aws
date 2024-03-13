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
  GetResourcesCommand,
  ResourceGroupsTaggingAPIClient,
  TagFilter,
} from '@aws-sdk/client-resource-groups-tagging-api';
import { AwsResourceTaggingApiLocator } from './resource-tagging-api-locator';

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

const resourceTaggingMock = mockClient(ResourceGroupsTaggingAPIClient);

const logger = getVoidLogger();

describe('Resource Explorer locator', () => {
  beforeAll(async () => {});

  beforeEach(() => {
    jest.resetAllMocks();
    resourceTaggingMock.reset();
    getCredProviderMock.mockImplementation((_?: AwsCredentialProviderOptions) =>
      getMockCredentialProvider(),
    );
  });

  async function configureProvider(
    configData: any,
  ): Promise<AwsResourceTaggingApiLocator> {
    const config = new ConfigReader(configData);

    return await AwsResourceTaggingApiLocator.fromConfig(config, { logger });
  }

  describe('empty config', () => {
    it('returns ok', async () => {
      resourceTaggingMock
        .on(GetResourcesCommand, {
          ResourceTypeFilters: ['ecs:service'],
          TagFilters: [
            {
              Key: 'component',
              Values: ['test'],
            } as TagFilter,
          ],
        })
        .resolves({
          ResourceTagMappingList: [
            {
              ResourceARN: 'arn1',
            },
          ],
        });

      const locator = await configureProvider({});

      const response = await locator.getResourceArns({
        resourceType: 'AWS::ECS::Service',
        tagString: 'component=test',
      });

      expect(response.length).toBe(1);
      expect(response[0]).toMatch('arn1');
    });
  });
});
