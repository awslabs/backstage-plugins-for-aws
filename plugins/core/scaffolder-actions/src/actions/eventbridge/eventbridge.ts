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
  EventBridgeClient,
  PutEventsCommand,
} from '@aws-sdk/client-eventbridge';
import { AwsCredentialsManager } from '@backstage/integration-aws-node';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { AWS_SDK_CUSTOM_USER_AGENT } from '@aws/aws-core-plugin-for-backstage-common';

export const createAwsEventBridgeEventAction = (options: {
  credsManager: AwsCredentialsManager;
}) => {
  return createTemplateAction({
    id: 'aws:eventbridge:event',
    description:
      'Posts an AWS EventBridge event matching the provided details.',
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
        source: z => z.string({ description: 'The source of the event.' }),
        detail: z =>
          z
            .string({ description: 'A valid JSON object as a string.' })
            .optional(),
        detailObject: z =>
          z.any({ description: 'A valid JSON object.' }).optional(),
        detailType: z =>
          z.string({
            description:
              'Free-form string, with a maximum of 128 characters, used to decide what fields to expect in the event detail.',
          }),
        eventBusName: z =>
          z.string({
            description:
              'The name or ARN of the event bus to receive the event.',
          }),
      },
    },
    async handler(ctx) {
      const {
        accountId,
        region,
        source,
        detail,
        detailObject,
        detailType,
        eventBusName,
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

      let detailPayload: string;

      if (detail) {
        detailPayload = detail;
      } else if (detailObject) {
        detailPayload = JSON.stringify(detailObject);
      } else {
        throw new Error('Either detail or detailObject must be provided.');
      }

      const client = new EventBridgeClient({
        region,
        customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
        credentialDefaultProvider: () => credentialProvider,
      });
      await client.send(
        new PutEventsCommand({
          Entries: [
            {
              Source: source,
              Detail: detailPayload,
              DetailType: detailType,
              EventBusName: eventBusName,
            },
          ],
        }),
      );

      ctx.logger.info(`Event posted`);
    },
  });
};
