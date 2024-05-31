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
  DescribeClustersCommand,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ECSClient,
  ListTasksCommand,
} from '@aws-sdk/client-ecs';
import { CatalogApi } from '@backstage/catalog-client';
import { Entity, CompoundEntityRef } from '@backstage/catalog-model';
import { ConfigReader } from '@backstage/config';
import { mockClient } from 'aws-sdk-client-mock';
import { getVoidLogger } from '@backstage/backend-common';
import { DefaultAmazonEcsService } from './DefaultAmazonEcsService';
import { AwsResourceLocator } from '@aws/aws-core-plugin-for-backstage-common';
import {
  DefaultAwsCredentialsManager,
  AwsCredentialProvider,
  AwsCredentialProviderOptions,
} from '@backstage/integration-aws-node';
import {
  AWS_ECS_SERVICE_ARN_ANNOTATION,
  AWS_ECS_SERVICE_TAGS_ANNOTATION,
  mockEcsCluster,
  mockEcsService,
  mockEcsTask,
} from '@aws/amazon-ecs-plugin-for-backstage-common';
import { mockServices } from '@backstage/backend-test-utils';

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

const mockCatalog: jest.Mocked<CatalogApi> = {
  getEntityByRef: jest.fn(),
} as any as jest.Mocked<CatalogApi>;

const entityRef: CompoundEntityRef = {
  kind: 'Component',
  namespace: 'foo',
  name: 'bar',
};

const ecsMock = mockClient(ECSClient);
ecsMock.onAnyCommand().resolves({});

const mockResourceLocator: jest.Mocked<AwsResourceLocator> = {
  getResourceArns: jest.fn(),
} as any as jest.Mocked<AwsResourceLocator>;

const logger = getVoidLogger();

describe('DefaultAmazonEcsService', () => {
  beforeAll(async () => {});

  beforeEach(() => {
    jest.resetAllMocks();
    ecsMock.reset();
    getCredProviderMock.mockImplementation((_?: AwsCredentialProviderOptions) =>
      getMockCredentialProvider(),
    );
  });

  async function configureProvider(
    configData: any,
    entityData: any,
  ): Promise<DefaultAmazonEcsService> {
    const config = new ConfigReader(configData);
    mockCatalog.getEntityByRef.mockReturnValueOnce(
      Promise.resolve(entityData as Entity),
    );

    return await DefaultAmazonEcsService.fromConfig(config, {
      logger,
      catalogApi: mockCatalog,
      resourceLocator: mockResourceLocator,
      discovery: mockServices.discovery(),
    });
  }

  describe('by tags', () => {
    it('returns ok', async () => {
      mockResourceLocator.getResourceArns.mockReturnValue(
        Promise.resolve([
          'arn:aws:ecs:us-west-2:1234567890:service/cluster1/service1',
          'arn:aws:ecs:us-west-2:1234567890:service/cluster2/service2',
        ]),
      );

      const cluster1 = mockEcsCluster('cluster1');
      const service1 = mockEcsService('service1', 'cluster1', 1, 1, 0);
      const task1 = mockEcsTask('service1', 'cluster1');

      const cluster2 = mockEcsCluster('cluster2');
      const service2 = mockEcsService('service2', 'cluster2', 1, 1, 0);
      const task2 = mockEcsTask('service2', 'cluster2');

      ecsMock
        .on(DescribeClustersCommand, {
          clusters: ['cluster1'],
        })
        .resolves({
          clusters: [cluster1],
        });

      ecsMock
        .on(DescribeClustersCommand, {
          clusters: ['cluster2'],
        })
        .resolves({
          clusters: [cluster2],
        });

      ecsMock
        .on(DescribeServicesCommand, {
          cluster: 'cluster1',
          // services: ['service1'],
        })
        .resolves({
          services: [service1],
        });

      ecsMock
        .on(DescribeServicesCommand, {
          cluster: 'cluster2',
          // services: ['service2'],
        })
        .resolves({
          services: [service2],
        });

      ecsMock
        .on(ListTasksCommand, {
          cluster: 'cluster1',
          serviceName: 'service1',
        })
        .resolves({
          taskArns: [task1.taskArn],
        });

      ecsMock
        .on(ListTasksCommand, {
          cluster: 'cluster2',
          serviceName: 'service2',
        })
        .resolves({
          taskArns: [task2.taskArn],
        });

      ecsMock
        .on(DescribeTasksCommand, {
          cluster: 'cluster1',
          tasks: [task1.taskArn],
        })
        .resolves({
          tasks: [task1],
        });

      ecsMock
        .on(DescribeTasksCommand, {
          cluster: 'cluster2',
          tasks: [task2.taskArn],
        })
        .resolves({
          tasks: [task2],
        });

      const service = await configureProvider(
        {},
        {
          metadata: {
            annotations: {
              [AWS_ECS_SERVICE_TAGS_ANNOTATION]: 'component=test',
            },
          },
        },
      );

      const response = await service.getServicesByEntity({ entityRef });

      expect(response.clusters.length).toBe(2);

      await expect(response).toMatchObject({
        clusters: [
          {
            cluster: cluster1,
            services: [
              {
                service: service1,
                tasks: [task1],
              },
            ],
          },
          {
            cluster: cluster2,
            services: [
              {
                service: service2,
                tasks: [task2],
              },
            ],
          },
        ],
      });

      expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(1);
      expect(mockResourceLocator.getResourceArns).toHaveBeenCalledWith({
        resourceType: 'AWS::ECS::Service',
        tagString: 'component=test',
      });
    });

    it('returns empty', async () => {
      mockResourceLocator.getResourceArns.mockReturnValue(Promise.resolve([]));

      const service = await configureProvider(
        {},
        {
          metadata: {
            annotations: {
              [AWS_ECS_SERVICE_TAGS_ANNOTATION]: 'component=test',
            },
          },
        },
      );

      await expect(
        service.getServicesByEntity({ entityRef }),
      ).resolves.toMatchObject({
        clusters: [],
      });
    });
  });

  describe('by arn', () => {
    it('returns ok', async () => {
      const cluster1 = mockEcsCluster('cluster1');
      const service1 = mockEcsService('service1', 'cluster1', 1, 1, 0);
      const task1 = mockEcsTask('service1', 'cluster1');

      ecsMock
        .on(DescribeClustersCommand, {
          clusters: ['cluster1'],
        })
        .resolves({
          clusters: [cluster1],
        });

      ecsMock
        .on(DescribeServicesCommand, {
          cluster: 'cluster1',
          // services: ['service1'],
        })
        .resolves({
          services: [service1],
        });

      ecsMock
        .on(ListTasksCommand, {
          cluster: 'cluster1',
          serviceName: 'service1',
        })
        .resolves({
          taskArns: [task1.taskArn],
        });

      ecsMock
        .on(DescribeTasksCommand, {
          cluster: 'cluster1',
          tasks: [task1.taskArn],
        })
        .resolves({
          tasks: [task1],
        });

      const service = await configureProvider(
        {},
        {
          metadata: {
            annotations: {
              [AWS_ECS_SERVICE_ARN_ANNOTATION]:
                'arn:aws:ecs:us-west-2:1234567890:service/cluster1/service1',
            },
          },
        },
      );

      const response = await service.getServicesByEntity({ entityRef });

      expect(response.clusters.length).toBe(1);

      await expect(response).toMatchObject({
        clusters: [
          {
            cluster: cluster1,
            services: [
              {
                service: service1,
                tasks: [task1],
              },
            ],
          },
        ],
      });

      expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(0);
    });

    it('handles empty tasks', async () => {
      const cluster1 = mockEcsCluster('cluster1');
      const service1 = mockEcsService('service1', 'cluster1', 1, 1, 0);

      ecsMock
        .on(DescribeClustersCommand, {
          clusters: ['cluster1'],
        })
        .resolves({
          clusters: [cluster1],
        });

      ecsMock
        .on(DescribeServicesCommand, {
          cluster: 'cluster1',
          // services: ['service1'],
        })
        .resolves({
          services: [service1],
        });

      ecsMock
        .on(ListTasksCommand, {
          cluster: 'cluster1',
          serviceName: 'service1',
        })
        .resolves({
          taskArns: [],
        });

      const service = await configureProvider(
        {},
        {
          metadata: {
            annotations: {
              [AWS_ECS_SERVICE_ARN_ANNOTATION]:
                'arn:aws:ecs:us-west-2:1234567890:service/cluster1/service1',
            },
          },
        },
      );

      const response = await service.getServicesByEntity({ entityRef });

      await expect(response).toMatchObject({
        clusters: [
          {
            cluster: cluster1,
            services: [
              {
                service: service1,
                tasks: [],
              },
            ],
          },
        ],
      });
    });
  });

  it('throws on missing annotation', async () => {
    const service = await configureProvider(
      {},
      {
        metadata: {
          annotations: {},
        },
      },
    );

    await expect(
      service.getServicesByEntity({
        entityRef: {
          kind: 'Component',
          namespace: 'foo',
          name: 'missing',
        },
      }),
    ).rejects.toThrow('Annotation not found on entity');
  });

  it('throws on missing entity', async () => {
    const service = await configureProvider({}, undefined);

    await expect(
      service.getServicesByEntity({
        entityRef: {
          kind: 'Component',
          namespace: 'foo',
          name: 'missing',
        },
      }),
    ).rejects.toThrow("Couldn't find entity with name: component:foo/missing");
  });
});
