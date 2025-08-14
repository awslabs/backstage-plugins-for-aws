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

import { renderInTestApp, TestApiProvider } from '@backstage/test-utils';
import { CodePipelineExecutions } from '.';
import { AwsCodePipelineApi, awsCodePipelineApiRef } from '../../api';
import {
  mockCodePipelineExecutions,
  mockEntityWithTags,
} from '@aws/aws-codepipeline-plugin-for-backstage-common';
import { ConfigApi, configApiRef } from '@backstage/core-plugin-api';
import { ConfigReader } from '@backstage/core-app-api';

const configApi: ConfigApi = new ConfigReader({
  aws: {
    sso: {
      subdomain: 'd-123456',
    },
  },
});

const codePipelineApiSingle: Partial<AwsCodePipelineApi> = {
  getPipelineExecutionsByEntity: () =>
    Promise.resolve({
      pipelineExecutions: [
        {
          pipelineName: 'pipeline1',
          pipelineRegion: 'us-west-2',
          pipelineArn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
          pipelineExecutions: mockCodePipelineExecutions(),
        },
      ],
    }),
};

const codePipelineApiMultiple: Partial<AwsCodePipelineApi> = {
  getPipelineExecutionsByEntity: () =>
    Promise.resolve({
      pipelineExecutions: [
        {
          pipelineName: 'pipeline1',
          pipelineRegion: 'us-west-2',
          pipelineArn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline1',
          pipelineExecutions: mockCodePipelineExecutions(),
        },
        {
          pipelineName: 'pipeline2',
          pipelineRegion: 'us-west-2',
          pipelineArn: 'arn:aws:codepipeline:us-west-2:1234567890:pipeline2',
          pipelineExecutions: mockCodePipelineExecutions(),
        },
      ],
    }),
};

const EXECUTION_ID = 'e6c91a02-d844-4663-ad62-b719608f8fc5';

const CONSOLE_URL = `https://us-west-2.console.aws.amazon.com/codesuite/codepipeline/pipelines/pipeline1/executions/${EXECUTION_ID}/timeline?region=us-west-2`;
const SSO_CONSOLE_URL = `https://d-123456.awsapps.com/start/#/console?account_id=1234567890&destination=${encodeURIComponent(
  CONSOLE_URL,
)}`;

describe('<CodePipelineExecutions />', () => {
  describe('for a single pipeline', () => {
    it('should show latest executions', async () => {
      const rendered = await renderInTestApp(
        <TestApiProvider
          apis={[[awsCodePipelineApiRef, codePipelineApiSingle]]}
        >
          <CodePipelineExecutions entity={mockEntityWithTags} />
        </TestApiProvider>,
      );

      expect(await rendered.findByText(EXECUTION_ID)).toBeInTheDocument();
      expect(
        await rendered.queryByTestId('select-pipeline'),
      ).not.toBeInTheDocument();
      expect(
        (await rendered.findByText(EXECUTION_ID)).getAttribute('href'),
      ).toBe(CONSOLE_URL);
    });

    it('should use sso domain', async () => {
      const rendered = await renderInTestApp(
        <TestApiProvider
          apis={[
            [awsCodePipelineApiRef, codePipelineApiSingle],
            [configApiRef, configApi],
          ]}
        >
          <CodePipelineExecutions entity={mockEntityWithTags} />
        </TestApiProvider>,
      );

      expect(await rendered.findByText(EXECUTION_ID)).toBeInTheDocument();
      expect(
        await rendered.queryByTestId('select-pipeline'),
      ).not.toBeInTheDocument();
      expect(
        (await rendered.findByText(EXECUTION_ID)).getAttribute('href'),
      ).toBe(SSO_CONSOLE_URL);
    });
  });

  describe('for multiple pipelines', () => {
    it('should show latest executions', async () => {
      const rendered = await renderInTestApp(
        <TestApiProvider
          apis={[[awsCodePipelineApiRef, codePipelineApiMultiple]]}
        >
          <CodePipelineExecutions entity={mockEntityWithTags} />
        </TestApiProvider>,
      );

      expect(await rendered.findByText(EXECUTION_ID)).toBeInTheDocument();
      expect(
        await rendered.queryByTestId('select-pipeline'),
      ).toBeInTheDocument();
    });
  });
});
