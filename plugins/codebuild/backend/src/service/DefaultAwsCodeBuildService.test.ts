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

import { CatalogApi } from '@backstage/catalog-client';
import { Entity, CompoundEntityRef } from '@backstage/catalog-model';
import { ConfigReader } from '@backstage/config';
import { mockClient } from 'aws-sdk-client-mock';
import { getVoidLogger } from '@backstage/backend-common';
import { DefaultAwsCodeBuildService } from './DefaultAwsCodeBuildService';
import { AwsResourceLocator } from '@aws/aws-core-plugin-for-backstage-common';
import {
  DefaultAwsCredentialsManager,
  AwsCredentialProvider,
  AwsCredentialProviderOptions,
} from '@backstage/integration-aws-node';
import {
  BatchGetBuildsCommand,
  BatchGetProjectsCommand,
  CodeBuildClient,
  ListBuildsForProjectCommand,
} from '@aws-sdk/client-codebuild';
import {
  AWS_CODEBUILD_ARN_ANNOTATION,
  AWS_CODEBUILD_ARN_ANNOTATION_LEGACY,
  AWS_CODEBUILD_TAGS_ANNOTATION,
  mockCodeBuildProject,
  mockCodeBuildProjectBuild,
} from '@aws/aws-codebuild-plugin-for-backstage-common';
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

const codebuildMock = mockClient(CodeBuildClient);
codebuildMock.onAnyCommand().resolves({});

const mockResourceLocator: jest.Mocked<AwsResourceLocator> = {
  getResourceArns: jest.fn(),
} as any as jest.Mocked<AwsResourceLocator>;

const logger = getVoidLogger();

describe('DefaultAwsCodeBuildService', () => {
  beforeAll(async () => {});

  beforeEach(() => {
    jest.resetAllMocks();
    codebuildMock.reset();
    getCredProviderMock.mockImplementation((_?: AwsCredentialProviderOptions) =>
      getMockCredentialProvider(),
    );
  });

  async function configureProvider(
    configData: any,
    entityData: any,
  ): Promise<DefaultAwsCodeBuildService> {
    const config = new ConfigReader(configData);
    mockCatalog.getEntityByRef.mockReturnValueOnce(
      Promise.resolve(entityData as Entity),
    );

    return await DefaultAwsCodeBuildService.fromConfig(config, {
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
          'arn:aws:codebuild:us-west-2:1234567890:project/project1',
          'arn:aws:codebuild:us-west-2:1234567890:project/project2',
        ]),
      );

      const { project: project1, projectBuilds: project1Builds } =
        setupCodeBuildProjectMock('project1', 5);
      const { project: project2, projectBuilds: project2Builds } =
        setupCodeBuildProjectMock('project2', 2);

      // Override mock response for multiple projects
      codebuildMock.on(BatchGetBuildsCommand).callsFake(input => {
        const response = [...project1Builds, ...project2Builds].filter(e => {
          return input.ids.includes(e.arn);
        });

        return { builds: response };
      });

      const service = await configureProvider(
        {},
        {
          metadata: {
            annotations: {
              [AWS_CODEBUILD_TAGS_ANNOTATION]: 'component=test',
            },
          },
        },
      );

      const response = await service.getProjectsByEntity({ entityRef });

      expect(response.projects.length).toBe(2);

      await expect(response).toMatchObject({
        projects: [
          {
            project: project1,
            builds: project1Builds,
          },
          {
            project: project2,
            builds: project2Builds,
          },
        ],
      });

      expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(1);
      expect(mockResourceLocator.getResourceArns).toHaveBeenCalledWith({
        resourceType: 'AWS::CodeBuild::Project',
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
              [AWS_CODEBUILD_TAGS_ANNOTATION]: 'component=test',
            },
          },
        },
      );

      await expect(
        service.getProjectsByEntity({ entityRef }),
      ).resolves.toMatchObject({
        projects: [],
      });
    });
  });

  describe('by arn', () => {
    it('returns ok', async () => {
      const { project: project1, projectBuilds: project1Builds } =
        setupCodeBuildProjectMock('project1', 5);

      const service = await configureProvider(
        {},
        {
          metadata: {
            annotations: {
              [AWS_CODEBUILD_ARN_ANNOTATION]:
                'arn:aws:codebuild:us-west-2:1234567890:project/project1',
            },
          },
        },
      );

      const response = await service.getProjectsByEntity({ entityRef });

      expect(response.projects.length).toBe(1);

      await expect(response).toMatchObject({
        projects: [
          {
            project: project1,
            builds: project1Builds,
          },
        ],
      });

      expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(0);
    });

    it('returns max 5 builds', async () => {
      const { project: project1, projectBuilds: project1Builds } =
        setupCodeBuildProjectMock('project1', 10);

      const service = await configureProvider(
        {},
        {
          metadata: {
            annotations: {
              [AWS_CODEBUILD_ARN_ANNOTATION]:
                'arn:aws:codebuild:us-west-2:1234567890:project/project1',
            },
          },
        },
      );

      const response = await service.getProjectsByEntity({ entityRef });

      expect(response.projects.length).toBe(1);

      await expect(response).toMatchObject({
        projects: [
          {
            project: project1,
            builds: project1Builds.slice(0, 5),
          },
        ],
      });

      expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(0);
    });
  });

  describe('by arn (legacy)', () => {
    it('returns ok', async () => {
      const { project: project1, projectBuilds: project1Builds } =
        setupCodeBuildProjectMock('project1', 5);

      const service = await configureProvider(
        {},
        {
          metadata: {
            annotations: {
              [AWS_CODEBUILD_ARN_ANNOTATION_LEGACY]:
                'arn:aws:codebuild:us-west-2:1234567890:project/project1',
            },
          },
        },
      );

      const response = await service.getProjectsByEntity({ entityRef });

      expect(response.projects.length).toBe(1);

      await expect(response).toMatchObject({
        projects: [
          {
            project: project1,
            builds: project1Builds,
          },
        ],
      });

      expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(0);
    });

    it('returns max 5 builds', async () => {
      const { project: project1, projectBuilds: project1Builds } =
        setupCodeBuildProjectMock('project1', 10);

      const service = await configureProvider(
        {},
        {
          metadata: {
            annotations: {
              [AWS_CODEBUILD_ARN_ANNOTATION_LEGACY]:
                'arn:aws:codebuild:us-west-2:1234567890:project/project1',
            },
          },
        },
      );

      const response = await service.getProjectsByEntity({ entityRef });

      expect(response.projects.length).toBe(1);

      await expect(response).toMatchObject({
        projects: [
          {
            project: project1,
            builds: project1Builds.slice(0, 5),
          },
        ],
      });

      expect(mockResourceLocator.getResourceArns).toHaveBeenCalledTimes(0);
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
      service.getProjectsByEntity({
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
      service.getProjectsByEntity({
        entityRef: {
          kind: 'Component',
          namespace: 'foo',
          name: 'missing',
        },
      }),
    ).rejects.toThrow("Couldn't find entity with name: component:foo/missing");
  });
});

function setupCodeBuildProjectMock(name: string, numBuilds: number) {
  const project = mockCodeBuildProject(name);
  const projectBuilds = [...Array(numBuilds).keys()].map(e =>
    mockCodeBuildProjectBuild(name, e.toString()),
  );

  codebuildMock
    .on(BatchGetProjectsCommand, {
      names: [project.name!],
    })
    .resolves({
      projects: [project],
    });

  codebuildMock
    .on(ListBuildsForProjectCommand, {
      projectName: project.name!,
    })
    .resolves({
      ids: projectBuilds.map(e => e.arn!),
    });

  codebuildMock.on(BatchGetBuildsCommand).callsFake(input => {
    const response = projectBuilds.filter(e => {
      return input.ids.includes(e.arn);
    });

    return { builds: response };
  });

  return {
    project,
    projectBuilds,
  };
}
