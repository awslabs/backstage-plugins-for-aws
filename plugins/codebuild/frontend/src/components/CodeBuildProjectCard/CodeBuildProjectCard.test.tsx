import React from 'react';
import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { CodeBuildProjectCard } from '.';
import { AwsCodeBuildApi, awsCodeBuildApiRef } from '../../api';
import { ConfigApi, configApiRef } from '@backstage/core-plugin-api';
import { ConfigReader } from '@backstage/core-app-api';
import { EntityProvider } from '@backstage/plugin-catalog-react';
import {
  mockCodeBuildProject,
  mockCodeBuildProjectBuild,
  mockEntityWithTags,
} from '@aws/aws-codebuild-plugin-for-backstage-common';

const configApi: ConfigApi = new ConfigReader({
  aws: {
    sso: {
      subdomain: 'd-123456',
    },
  },
});

const codeBuildApiSingle: Partial<AwsCodeBuildApi> = {
  getProjectsByEntity: () =>
    Promise.resolve({
      projects: [
        {
          projectAccountId: '1234567890',
          projectName: 'project1',
          projectRegion: 'us-west-2',
          project: mockCodeBuildProject('project1'),
          builds: [mockCodeBuildProjectBuild('project1', 'test')],
        },
      ],
    }),
};

const PROJECT_URL = `https://us-west-2.console.aws.amazon.com/codesuite/codebuild/1234567890/projects/project1/?region=us-west-2`;
const SSO_PROJECT_URL = `https://d-123456.awsapps.com/start/#/console?account_id=1234567890&destination=${encodeURIComponent(
  PROJECT_URL,
)}`;

describe('<CodeBuildProjectCard />', () => {
  describe('for a single project', () => {
    it('should show project status', async () => {
      const rendered = await renderInTestApp(
        <TestApiProvider apis={[[awsCodeBuildApiRef, codeBuildApiSingle]]}>
          <EntityProvider entity={mockEntityWithTags}>
            <CodeBuildProjectCard />
          </EntityProvider>
        </TestApiProvider>,
      );

      expect((await rendered.findByText('project1')).getAttribute('href')).toBe(
        PROJECT_URL,
      );
    });

    it('should use sso domain', async () => {
      const rendered = await renderInTestApp(
        <TestApiProvider
          apis={[
            [awsCodeBuildApiRef, codeBuildApiSingle],
            [configApiRef, configApi],
          ]}
        >
          <EntityProvider entity={mockEntityWithTags}>
            <CodeBuildProjectCard />
          </EntityProvider>
        </TestApiProvider>,
      );

      expect((await rendered.findByText('project1')).getAttribute('href')).toBe(
        SSO_PROJECT_URL,
      );
    });
  });
});
