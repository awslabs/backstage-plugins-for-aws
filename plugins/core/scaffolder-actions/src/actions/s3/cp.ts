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

// Based on https://github.com/RoadieHQ/roadie-backstage-plugins/blob/35c787dc759897fdc1b88bd620d5af20cc6f7648/plugins/scaffolder-actions/scaffolder-backend-module-aws/src/actions/s3/cp.ts

import { createTemplateAction } from '@backstage/plugin-scaffolder-node';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { AwsCredentialsManager } from '@backstage/integration-aws-node';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import fs from 'fs-extra';
import { z } from 'zod';
import { resolveSafeChildPath } from '@backstage/backend-common';
import { glob } from 'glob';
import { AWS_SDK_CUSTOM_USER_AGENT } from '@aws/aws-core-plugin-for-backstage-common';

export const createAwsS3CpAction = (options: {
  credsManager: AwsCredentialsManager;
}) => {
  return createTemplateAction<{
    accountId?: string;
    region?: string;

    bucketName: string;
    path?: string;
    prefix?: string;
  }>({
    id: 'aws:s3:cp',
    description: 'Copies files to an Amazon S3 bucket',
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
        bucketName: z.string().describe('Name of the Amazon S3 bucket.'),
        path: z
          .string()
          .optional()
          .describe('File pattern to copy to the bucket'),
        prefix: z
          .string()
          .optional()
          .describe('Amazon S3 bucket prefix to add to the files.'),
      }),
    },
    async handler(ctx) {
      const { accountId, region, bucketName, path, prefix = '' } = ctx.input;

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

      const files = glob
        .sync(resolveSafeChildPath(ctx.workspacePath, path ? path : '**'))
        .filter(filePath => fs.lstatSync(filePath).isFile());

      const client = new S3Client({
        region,
        customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
        credentialDefaultProvider: () => credentialProvider,
      });

      await Promise.all(
        files.map((file: string) => {
          return client.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: prefix + file.replace(`${ctx.workspacePath}/`, ''),
              Body: fs.readFileSync(file).toString(),
            }),
          );
        }),
      );
    },
  });
};
