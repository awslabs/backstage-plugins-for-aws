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
  CloudControlClient,
  CreateResourceCommand,
  GetResourceRequestStatusCommand,
  waitUntilResourceRequestSuccess,
} from '@aws-sdk/client-cloudcontrol';
import { AwsCredentialsManager } from '@backstage/integration-aws-node';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { AWS_SDK_CUSTOM_USER_AGENT } from '@aws/aws-core-plugin-for-backstage-common';

export function createAwsCloudControlCreateAction(options: {
  credsManager: AwsCredentialsManager;
}) {
  return createTemplateAction({
    id: 'aws:cloudcontrol:create',
    description: 'Creates the specified resource.',
    schema: {
      input: {
        accountId: z =>
          z
            .string({
              description: 'The AWS account ID to create the resource.',
            })
            .optional(),
        region: z =>
          z
            .string({ description: 'The AWS region to create the resource.' })
            .optional(),
        typeName: z =>
          z.string({ description: 'The name of the resource type.' }),
        desiredState: z =>
          z.string({
            description:
              "Structured data format representing the desired state of the resource, consisting of that resource's properties and their desired values.",
          }),
        clientToken: z =>
          z
            .string({
              description:
                'A unique identifier to ensure the idempotency of the resource request.',
            })
            .optional(),
        roleArn: z =>
          z
            .string({
              description:
                'IAM role for Cloud Control API to use when performing this resource operation.',
            })
            .optional(),
        typeVersionId: z =>
          z
            .string({
              description:
                'For private resource types, the type version to use in this resource operation.',
            })
            .optional(),
        wait: z =>
          z
            .boolean({
              description:
                'Whether the action should wait until the requested resource is created.',
            })
            .optional()
            .default(false),
        maxWaitTime: z =>
          z
            .number({
              description:
                'If this action is configured to wait this is the maximum time in seconds it will wait before failing.',
            })
            .optional()
            .default(120),
      },
      output: {
        identifier: z =>
          z.string({
            description:
              'The primary identifier for the resource (only available if wait is enabled).',
          }),
      },
    },
    async handler(ctx) {
      const {
        accountId,
        region,
        typeName,
        desiredState,
        roleArn,
        clientToken,
        typeVersionId,
        wait = false,
        maxWaitTime = 120,
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

      const client = new CloudControlClient({
        region,
        customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
        credentialDefaultProvider: () => credentialProvider,
      });
      const response = await client.send(
        new CreateResourceCommand({
          TypeName: typeName,
          DesiredState: desiredState,
          RoleArn: roleArn,
          ClientToken: clientToken,
          TypeVersionId: typeVersionId,
        }),
      );

      if (!wait) {
        return;
      }

      ctx.logger.info(
        `Waiting ${maxWaitTime} seconds for resource creation...`,
      );

      const requestToken = response.ProgressEvent?.RequestToken;

      await waitUntilResourceRequestSuccess(
        { client, maxWaitTime: maxWaitTime! },
        { RequestToken: response.ProgressEvent?.RequestToken },
      );

      const resourceRequest = await client.send(
        new GetResourceRequestStatusCommand({
          RequestToken: requestToken,
        }),
      );

      const identifier = resourceRequest.ProgressEvent?.Identifier;

      ctx.logger.info(
        `Resource creation succeeded, returning identifier ${identifier}`,
      );

      ctx.output('identifier', identifier || '');
    },
  });
}
