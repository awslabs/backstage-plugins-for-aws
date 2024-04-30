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

import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import {
  CodeCommitClient,
  CreateCommitCommand,
  CreateRepositoryCommand,
  PutFileEntry,
} from '@aws-sdk/client-codecommit';
import { AwsCredentialsManager } from '@backstage/integration-aws-node';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { AWS_SDK_CUSTOM_USER_AGENT } from '@aws/aws-core-plugin-for-backstage-common';

export const createAwsCodeCommitPublishAction = (options: {
  credsManager: AwsCredentialsManager;
}) => {
  return createTemplateAction<{
    accountId?: string;
    region?: string;

    repositoryName: string;
    defaultBranch: string;
    sourcePath?: string;
    gitCommitMessage?: string;
    gitAuthorName?: string;
    gitAuthorEmail?: string;
  }>({
    id: 'aws:codecommit:publish',
    description:
      'Initializes a git repository of the content in the workspace, and publishes it to AWS CodeCommit.',
    schema: {
      input: z.object({
        accountId: z
          .string()
          .describe('The AWS account ID to create the resource.')
          .optional(),
        region: z
          .string()
          .describe('The AWS region to create the resource.')
          .optional(),
        repositoryName: z
          .string()
          .describe('Name of the AWS CodeCommit repository.'),
        defaultBranch: z
          .string()
          .describe(
            `Sets the default branch on the repository. The default value is 'main'`,
          ),
        sourcePath: z
          .string()
          .optional()
          .describe(
            'Path within the workspace that will be used as the repository root. If omitted, the entire workspace will be published as the repository.',
          ),
        gitCommitMessage: z
          .string()
          .optional()
          .describe(
            `Sets the commit message on the repository. The default value is 'initial commit'`,
          ),
        gitAuthorName: z
          .string()
          .optional()
          .describe(
            `Sets the default author name for the commit. The default value is 'Scaffolder'`,
          ),
        gitAuthorEmail: z
          .string()
          .optional()
          .describe(`Sets the default author email for the commit.`),
      }),
      output: z.object({
        arn: z.string().optional().describe('ARN of the repository'),
        repositoryName: z.string().optional().describe("The repository's name"),
        repositoryId: z
          .string()
          .optional()
          .describe('The ID of the repository'),
        cloneUrlHttp: z
          .string()
          .optional()
          .describe('The URL to use for cloning the repository over HTTPS'),
        cloneUrlSsh: z
          .string()
          .optional()
          .describe('The URL to use for cloning the repository over SSH'),
      }),
    },
    async handler(ctx) {
      const {
        accountId,
        region,
        repositoryName,
        defaultBranch = 'main',
        gitCommitMessage = 'initial commit',
        gitAuthorName,
        gitAuthorEmail,
      } = ctx.input;

      let credentialProvider: AwsCredentialIdentityProvider;

      if (accountId) {
        credentialProvider = (
          await options.credsManager.getCredentialProvider({ accountId })
        ).sdkCredentialProvider;
      } else {
        credentialProvider = (
          await options.credsManager.getCredentialProvider()
        ).sdkCredentialProvider;
      }

      const client = new CodeCommitClient({
        region,
        customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
        credentialDefaultProvider: () => credentialProvider,
      });
      const response = await client.send(
        new CreateRepositoryCommand({
          repositoryName,
        }),
      );

      const putFiles: PutFileEntry[] = [];

      for (const file of readAllFiles(ctx.workspacePath)) {
        putFiles.push({
          filePath: path.relative(ctx.workspacePath, file),
          fileContent: fs.readFileSync(file),
        });
      }

      await client.send(
        new CreateCommitCommand({
          branchName: defaultBranch,
          repositoryName,
          authorName: gitAuthorName,
          email: gitAuthorEmail,
          commitMessage: gitCommitMessage,
          putFiles,
        }),
      );

      ctx.output('repositoryId', response.repositoryMetadata?.repositoryId);
      ctx.output('repositoryName', response.repositoryMetadata?.repositoryName);
      ctx.output('arn', response.repositoryMetadata?.Arn);
      ctx.output('cloneUrlHttp', response.repositoryMetadata?.cloneUrlHttp);
      ctx.output('cloneUrlSsh', response.repositoryMetadata?.cloneUrlSsh);
    },
  });
};

function* readAllFiles(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    if (file.isDirectory()) {
      yield* readAllFiles(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name);
    }
  }
}
