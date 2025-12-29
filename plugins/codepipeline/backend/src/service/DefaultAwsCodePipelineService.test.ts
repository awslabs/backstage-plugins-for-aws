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

import { Entity, CompoundEntityRef } from '@backstage/catalog-model';
import { ConfigReader } from '@backstage/config';
import { mockClient } from 'aws-sdk-client-mock';
import { DefaultAwsCodePipelineService } from './DefaultAwsCodePipelineService';
import { AwsResourceLocator } from '@aws/aws-core-plugin-for-backstage-node';
import {
  DefaultAwsCredentialsManager,
  AwsCredentialProvider,
  AwsCredentialProviderOptions,
} from '@backstage/integration-aws-node';
import {
  CodePipelineClient,
  GetPipelineStateCommand,
  ListPipelineExecutionsCommand,
} from '@aws-sdk/client-codepipeline';
import {
  AWS_CODEPIPELINE_ARN_ANNOTATION,
  AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY,
  AWS_CODEPIPELINE_TAGS_ANNOTATION,
  mockCodePipelineExecutions,
  mockCodePipelineStatus,
} from '@aws/aws-codepipeline-plugin-for-backstage-common';
import { mockCredentials, mockServices } from '@backstage/backend-test-utils';
import { CatalogService } from '@backstage/plugin-catalog-node';

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

const codepipelineMock = mockClient(CodePipelineClient);
codepipelineMock.onAnyCommand().resolves({});

const mockResourceLocator: jest.Mocked<AwsResourceLocator> = {
  getResourceArns: jest.fn(),
} as any as jest.Mocked<AwsResourceLocator>;

const logger = mockServices.logger.mock();

describe('DefaultAwsCodePipelineService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    codepipelineMock.reset();
    getCredProviderMock.mockImplementation((_?: AwsCredentialProviderOptions) =>
      getMockCredentialProvider(),
    );
  });

  async function configureProvider(
    configData: any,
    entityData: any,
  ): Promise<DefaultAwsCodePipelineService> {
    const config = new ConfigReader(configData);
    mockCatalog.getEntityByRef.mockImplementation(() =>
      Promise.resolve(entityData as Entity),
    );

    return await DefaultAwsCodePipelineService.fromConfig(config, {
      logger,
      catalogService: mockCatalog,
      discovery: mockServices.discovery.mock(),
      resourceLocator: mockResourceLocator,
    });
  }

  describe('getPipelineStateByEntity', () => {
    describe('by tags', () => {
      it('returns ok', async () => {
        mockResourceLocator.getResourceArns.mockReturnValue(
          Promise.resolve([
            'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
            'arn:aws:codepipeline:us-west-2:1234567890:pipeline2',
          ]),
        );

        const mockState = mockCodePipelineStatus();
        codepipelineMock.on(GetPipelineStateCommand).resolves({
          ...mockState,
        });

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_TAGS_ANNOTATION]: 'component=test',
              },
            },
          },
        );

        const response = await service.getPipelineStateByEntity({
          entityRef,
          credentials,
        });

        expect(response.pipelines.length).toBe(2);
        expect(mockResourceLocator.getResourceArns).toHaveBeenCalledWith({
          resourceType: 'AWS::CodePipeline::Pipeline',
          tagString: 'component=test',
        });
      });

      it('returns empty', async () => {
        mockResourceLocator.getResourceArns.mockReturnValue(
          Promise.resolve([]),
        );

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_TAGS_ANNOTATION]: 'component=test',
              },
            },
          },
        );

        const response = await service.getPipelineStateByEntity({
          entityRef,
          credentials,
        });

        expect(response.pipelines).toEqual([]);
      });
    });

    describe('by arn', () => {
      it('returns ok', async () => {
        const mockState = mockCodePipelineStatus('pipeline1');
        codepipelineMock.on(GetPipelineStateCommand).resolves({
          ...mockState,
        });

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_ARN_ANNOTATION]:
                  'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
              },
            },
          },
        );

        const response = await service.getPipelineStateByEntity({
          entityRef,
          credentials,
        });

        expect(response.pipelines.length).toBe(1);
        expect(response.pipelines[0].pipelineName).toBe('pipeline1');
        expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(0);
      });
    });

    describe('by arn (legacy)', () => {
      it('returns ok', async () => {
        const mockState = mockCodePipelineStatus('pipeline1');
        codepipelineMock.on(GetPipelineStateCommand).resolves({
          ...mockState,
        });

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY]:
                  'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
              },
            },
          },
        );

        const response = await service.getPipelineStateByEntity({
          entityRef,
          credentials,
        });

        expect(response.pipelines.length).toBe(1);
        expect(response.pipelines[0].pipelineName).toBe('pipeline1');
        expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('getPipelineStateByEntityWithArn', () => {
    describe('by tags', () => {
      it('returns ok', async () => {
        mockResourceLocator.getResourceArns.mockReturnValue(
          Promise.resolve([
            'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
            'arn:aws:codepipeline:us-west-2:1234567890:pipeline2',
          ]),
        );

        const mockState = mockCodePipelineStatus();
        codepipelineMock.on(GetPipelineStateCommand).resolves({
          ...mockState,
        });

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_TAGS_ANNOTATION]: 'component=test',
              },
            },
          },
        );

        const response = await service.getPipelineStateByEntityWithArn({
          entityRef,
          arn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
          credentials,
        });

        expect(response).toEqual({
          pipelineArn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
          pipelineName: 'pipeline1',
          pipelineRegion: 'us-west-2',
          pipelineState: mockState,
        });
        expect(mockResourceLocator.getResourceArns).toHaveBeenCalledWith({
          resourceType: 'AWS::CodePipeline::Pipeline',
          tagString: 'component=test',
        });
      });

      it('returns empty', async () => {
        mockResourceLocator.getResourceArns.mockReturnValue(
          Promise.resolve([]),
        );

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_TAGS_ANNOTATION]: 'component=test',
              },
            },
          },
        );

        const response = await service.getPipelineStateByEntity({
          entityRef,
          credentials,
        });

        expect(response.pipelines).toEqual([]);
      });
    });

    describe('by arn', () => {
      it('returns ok', async () => {
        const mockState = mockCodePipelineStatus('pipeline1');
        codepipelineMock.on(GetPipelineStateCommand).resolves({
          ...mockState,
        });

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_ARN_ANNOTATION]:
                  'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
              },
            },
          },
        );

        const response = await service.getPipelineStateByEntity({
          entityRef,
          credentials,
        });

        expect(response.pipelines.length).toBe(1);
        expect(response.pipelines[0].pipelineName).toBe('pipeline1');
        expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(0);
      });
    });

    describe('by arn (legacy)', () => {
      it('returns ok', async () => {
        const mockState = mockCodePipelineStatus('pipeline1');
        codepipelineMock.on(GetPipelineStateCommand).resolves({
          ...mockState,
        });

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_ARN_ANNOTATION_LEGACY]:
                  'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
              },
            },
          },
        );

        const response = await service.getPipelineStateByEntity({
          entityRef,
          credentials,
        });

        expect(response.pipelines.length).toBe(1);
        expect(response.pipelines[0].pipelineName).toBe('pipeline1');
        expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('getPipelineExecutionsByEntity', () => {
    describe('by arn', () => {
      it('returns ok', async () => {
        const mockExecutions = mockCodePipelineExecutions();
        codepipelineMock.on(ListPipelineExecutionsCommand).resolves({
          pipelineExecutionSummaries: mockExecutions,
        });

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_ARN_ANNOTATION]:
                  'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
              },
            },
          },
        );

        const response = await service.getPipelineExecutionsByEntity({
          entityRef,
          credentials,
        });

        expect(response.pipelineExecutions.length).toBe(1);
        expect(response.pipelineExecutions[0].pipelineExecutions).toEqual(
          mockExecutions,
        );
      });
    });
  });

  describe('getPipelineExecutionsByEntityWithArn', () => {
    describe('by arn', () => {
      it('returns ok with default pagination', async () => {
        const mockExecutions = mockCodePipelineExecutions();
        codepipelineMock.on(ListPipelineExecutionsCommand).resolves({
          pipelineExecutionSummaries: mockExecutions,
        });

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_ARN_ANNOTATION]:
                  'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
              },
            },
          },
        );

        const response = await service.getPipelineExecutionsByEntityWithArn({
          entityRef,
          arn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
          credentials,
        });

        expect(response.pipelineExecutions).toEqual(mockExecutions);
      });

      it('validates page size', async () => {
        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_ARN_ANNOTATION]:
                  'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
              },
            },
          },
        );

        await expect(
          service.getPipelineExecutionsByEntityWithArn({
            entityRef,
            arn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
            credentials,
            pageSize: 0,
          }),
        ).rejects.toThrow('Page size must be a positive integer');
      });

      it('validates page number', async () => {
        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_ARN_ANNOTATION]:
                  'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
              },
            },
          },
        );

        await expect(
          service.getPipelineExecutionsByEntityWithArn({
            entityRef,
            arn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
            credentials,
            page: 0,
          }),
        ).rejects.toThrow('Page must be a positive integer');
      });

      it('returns correct pages with pagination', async () => {
        const mockExecutions = mockCodePipelineExecutions(); // Returns 3 items
        codepipelineMock.on(ListPipelineExecutionsCommand).resolves({
          pipelineExecutionSummaries: mockExecutions,
        });

        const service = await configureProvider(
          {},
          {
            metadata: {
              annotations: {
                [AWS_CODEPIPELINE_ARN_ANNOTATION]:
                  'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
              },
            },
          },
        );

        // Test page 1 with pageSize 2 - should return first 2 items
        const page1Response =
          await service.getPipelineExecutionsByEntityWithArn({
            entityRef,
            arn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
            credentials,
            pageSize: 2,
            page: 1,
          });

        expect(page1Response.pipelineExecutions).toHaveLength(2);
        expect(page1Response.pipelineExecutions).toEqual(
          mockExecutions.slice(0, 2),
        );

        // Test page 2 with pageSize 2 - should return last 1 item
        const page2Response =
          await service.getPipelineExecutionsByEntityWithArn({
            entityRef,
            arn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
            credentials,
            pageSize: 2,
            page: 2,
          });

        expect(page2Response.pipelineExecutions).toHaveLength(1);
        expect(page2Response.pipelineExecutions).toEqual(
          mockExecutions.slice(2, 3),
        );
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
      service.getPipelineStateByEntity({
        entityRef: {
          kind: 'Component',
          namespace: 'foo',
          name: 'missing',
        },
        credentials,
      }),
    ).rejects.toThrow('Annotation not found on entity');
  });

  it('throws on missing entity', async () => {
    const service = await configureProvider({}, undefined);

    await expect(
      service.getPipelineStateByEntity({
        entityRef: {
          kind: 'Component',
          namespace: 'foo',
          name: 'missing',
        },
        credentials,
      }),
    ).rejects.toThrow("Couldn't find entity with name: component:foo/missing");
  });
});
