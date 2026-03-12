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
  CostExplorerClient,
  GetCostAndUsageCommand,
  Granularity,
} from '@aws-sdk/client-cost-explorer';
import { Entity, CompoundEntityRef } from '@backstage/catalog-model';
import { ConfigReader } from '@backstage/config';
import { mockClient } from 'aws-sdk-client-mock';
import { CostExplorerCostInsightsAwsService } from './CostExplorerCostInsightsAwsService';
import {
  DefaultAwsCredentialsManager,
  AwsCredentialProvider,
  AwsCredentialProviderOptions,
} from '@backstage/integration-aws-node';
import {
  COST_INSIGHTS_AWS_COST_CATEGORY_ANNOTATION,
  COST_INSIGHTS_AWS_TAGS_ANNOTATION,
} from '@aws/cost-insights-plugin-for-backstage-common';
import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import { CatalogService } from '@backstage/plugin-catalog-node';
import { readCostInsightsAwsConfig } from '../config';

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

const credentials = mockCredentials.user('user:default/guest');

const mockCatalog: jest.Mocked<CatalogService> = {
  getEntityByRef: jest.fn(),
} as any as jest.Mocked<CatalogService>;

const entityRef: CompoundEntityRef = {
  kind: 'Component',
  namespace: 'foo',
  name: 'bar',
};

const costExplorerMock = mockClient(CostExplorerClient);
costExplorerMock.onAnyCommand().resolves({});

const logger = mockServices.logger.mock();

describe('CostExplorerCostInsightsAwsService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    costExplorerMock.reset();
  });

  async function configureService(
    configData: any,
    entityData: any,
  ): Promise<CostExplorerCostInsightsAwsService> {
    const config = new ConfigReader(configData);
    mockCatalog.getEntityByRef.mockReturnValueOnce(
      Promise.resolve(entityData as Entity),
    );

    getCredProviderMock.mockImplementation((_?: AwsCredentialProviderOptions) =>
      getMockCredentialProvider(),
    );

    const pluginConfig = readCostInsightsAwsConfig(config);
    const credentialsManager = DefaultAwsCredentialsManager.fromConfig(config);

    return await CostExplorerCostInsightsAwsService.fromConfig(pluginConfig, {
      logger,
      catalogService: mockCatalog,
      credentialsManager,
    });
  }

  describe('getCatalogEntityRangeCost', () => {
    it('returns cost data with tags annotation', async () => {
      costExplorerMock.on(GetCostAndUsageCommand).resolves({
        ResultsByTime: [
          {
            TimePeriod: { Start: '2024-01-01', End: '2024-01-02' },
            Total: { UnblendedCost: { Amount: '100.50', Unit: 'USD' } },
            Groups: [],
          },
          {
            TimePeriod: { Start: '2024-01-02', End: '2024-01-03' },
            Total: { UnblendedCost: { Amount: '150.75', Unit: 'USD' } },
            Groups: [],
          },
        ],
      });

      const service = await configureService(
        {},
        {
          kind: 'Component',
          metadata: {
            name: 'test-component',
            annotations: {
              [COST_INSIGHTS_AWS_TAGS_ANNOTATION]: 'component=test',
            },
          },
        },
      );

      const response = await service.getCatalogEntityRangeCost({
        entityRef,
        startDate: new Date('2024-01-03'),
        endDate: new Date('2024-01-01'),
        granularity: Granularity.DAILY,
        credentials,
      });

      expect(response.id).toBe('test-component');
      expect(response.aggregation).toHaveLength(2);
      expect(response.aggregation[0].amount).toBe(100.5);
      expect(response.aggregation[1].amount).toBe(150.75);
    });

    it('returns cost data with cost category annotation', async () => {
      costExplorerMock.on(GetCostAndUsageCommand).resolves({
        ResultsByTime: [
          {
            TimePeriod: { Start: '2024-01-01', End: '2024-01-02' },
            Total: { UnblendedCost: { Amount: '200.00', Unit: 'USD' } },
            Groups: [],
          },
        ],
      });

      const service = await configureService(
        {},
        {
          kind: 'Component',
          metadata: {
            name: 'test-component',
            annotations: {
              [COST_INSIGHTS_AWS_COST_CATEGORY_ANNOTATION]: 'category=prod',
            },
          },
        },
      );

      const response = await service.getCatalogEntityRangeCost({
        entityRef,
        startDate: new Date('2024-01-02'),
        endDate: new Date('2024-01-01'),
        granularity: Granularity.DAILY,
        credentials,
      });

      expect(response.id).toBe('test-component');
      expect(response.aggregation).toHaveLength(1);
      expect(response.aggregation[0].amount).toBe(200);
    });

    it('handles grouped costs', async () => {
      costExplorerMock
        .on(GetCostAndUsageCommand, {
          GroupBy: undefined,
        })
        .resolves({
          ResultsByTime: [
            {
              TimePeriod: { Start: '2024-01-01', End: '2024-01-02' },
              Total: { UnblendedCost: { Amount: '100.00', Unit: 'USD' } },
              Groups: [],
            },
          ],
        })
        .on(GetCostAndUsageCommand, {
          GroupBy: [{ Type: 'DIMENSION', Key: 'SERVICE' }],
        })
        .resolves({
          ResultsByTime: [
            {
              TimePeriod: { Start: '2024-01-01', End: '2024-01-02' },
              Groups: [
                {
                  Keys: ['EC2'],
                  Metrics: { UnblendedCost: { Amount: '50.00', Unit: 'USD' } },
                },
                {
                  Keys: ['S3'],
                  Metrics: { UnblendedCost: { Amount: '50.00', Unit: 'USD' } },
                },
              ],
            },
          ],
        });

      const service = await configureService(
        {
          aws: {
            costInsights: {
              entityGroups: [
                {
                  kind: 'Component',
                  groups: [
                    {
                      name: 'service',
                      key: 'SERVICE',
                      type: 'DIMENSION',
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          kind: 'Component',
          metadata: {
            name: 'test-component',
            annotations: {
              [COST_INSIGHTS_AWS_TAGS_ANNOTATION]: 'component=test',
            },
          },
        },
      );

      const response = await service.getCatalogEntityRangeCost({
        entityRef,
        startDate: new Date('2024-01-02'),
        endDate: new Date('2024-01-01'),
        granularity: Granularity.DAILY,
        credentials,
      });

      expect(response.groupedCosts).toBeDefined();
      expect(response.groupedCosts!.service).toHaveLength(2);
      expect(response.groupedCosts!.service[0].id).toBe('EC2');
      expect(response.groupedCosts!.service[1].id).toBe('S3');
    });

    it('throws on missing entity', async () => {
      const service = await configureService({}, undefined);

      await expect(
        service.getCatalogEntityRangeCost({
          entityRef,
          startDate: new Date('2024-01-02'),
          endDate: new Date('2024-01-01'),
          granularity: Granularity.DAILY,
          credentials,
        }),
      ).rejects.toThrow("Couldn't find entity with name: component:foo/bar");
    });

    it('throws on missing annotation', async () => {
      const service = await configureService(
        {},
        {
          metadata: {
            name: 'test-component',
            annotations: {},
          },
        },
      );

      await expect(
        service.getCatalogEntityRangeCost({
          entityRef,
          startDate: new Date('2024-01-02'),
          endDate: new Date('2024-01-01'),
          granularity: Granularity.DAILY,
          credentials,
        }),
      ).rejects.toThrow('Annotation not found on entity');
    });
  });

  describe('getCatalogEntityDailyCost', () => {
    it('returns daily cost data', async () => {
      costExplorerMock.on(GetCostAndUsageCommand).resolves({
        ResultsByTime: [
          {
            TimePeriod: { Start: '2024-01-01', End: '2024-01-02' },
            Total: { UnblendedCost: { Amount: '100.00', Unit: 'USD' } },
            Groups: [],
          },
        ],
      });

      const service = await configureService(
        {},
        {
          kind: 'Component',
          metadata: {
            name: 'test-component',
            annotations: {
              [COST_INSIGHTS_AWS_TAGS_ANNOTATION]: 'component=test',
            },
          },
        },
      );

      const response = await service.getCatalogEntityDailyCost({
        entityRef,
        intervals: 'R1/P30D/2024-01-31T00:00:00Z',
        credentials,
      });

      expect(response.id).toBe('test-component');
      expect(response.aggregation).toHaveLength(1);
    });

    it('throws on invalid interval format', async () => {
      const service = await configureService(
        {},
        {
          kind: 'Component',
          metadata: {
            name: 'test-component',
            annotations: {
              [COST_INSIGHTS_AWS_TAGS_ANNOTATION]: 'component=test',
            },
          },
        },
      );

      await expect(
        service.getCatalogEntityDailyCost({
          entityRef,
          intervals: 'invalid',
          credentials,
        }),
      ).rejects.toThrow('Incorrect interval for invalid');
    });
  });
});
