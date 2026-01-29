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

import { createLegacyAuthAdapters } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { AwsSecurityHubService } from './types';
import {
  AuthService,
  CacheService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { DefaultAgentClient } from '@aws/genai-plugin-for-backstage-common';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { Config } from '@backstage/config';

const PROMPT_TEMPLATE = `
Your task is to help provide information and remediate the AWS Security Hub finding with ID '{findingId}' for the following Backstage entity: {entityRef}

Finding Details:
- Title: {title}
- Description: {description}
- Severity: {severity}
- Types: {types}
- Workflow Status: {workflowStatus}
- Record State: {recordState}
- Account ID: {accountId}
- Region: {region}
- Resource Type: {resourceType}
- Resource ID: {resourceId}
- Last Updated: {lastUpdated}

Do not include information about any other findings except the ID specified above.

Do not mention the finding ID in the response, and do not mention that you have been asked to summarize in the response.

Structure your answer clearly into two different section:

1. Analysis: A summary of the nature of the finding and how it could be exploited
2. Remediation: A recommendation for remediation of the finding in 150 words. Use a code example where appropriate

The answer should always be formatted as Markdown and use code fences where appropriate.
`;

export interface RouterOptions {
  logger: LoggerService;
  awsSecurityHubApi: AwsSecurityHubService;
  discovery: DiscoveryService;
  auth: AuthService;
  httpAuth?: HttpAuthService;
  cache: CacheService;
  config: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, auth, discovery, awsSecurityHubApi, cache, config } = options;

  const router = Router();
  router.use(express.json());

  const agentClient = new DefaultAgentClient(discovery);

  // Get agent configuration from app-config.yaml
  const agentEnabled =
    config.getOptionalBoolean('aws.securityHub.agent.enabled') ?? true;
  const agentName =
    config.getOptionalString('aws.securityHub.agent.name') ?? 'security-hub';

  const { httpAuth } = createLegacyAuthAdapters(options);

  router.get(
    '/v1/entity/:namespace/:kind/:name/findings',
    async (request, response) => {
      const { namespace, kind, name } = request.params;

      const findings = await awsSecurityHubApi.getFindingsByEntity({
        entityRef: {
          kind,
          namespace,
          name,
        },
        credentials: await httpAuth.credentials(request),
      });
      response.status(200).json(findings);
    },
  );

  router.post(
    '/v1/entity/:namespace/:kind/:name/assistant',
    async (request, response) => {
      try {
        // Check if agent is enabled
        if (!agentEnabled) {
          response.status(501).json({
            message:
              'AI Assistant is not enabled. Enable it in app-config.yaml under aws.securityHub.agent.enabled',
          });
          return;
        }

        const { namespace, kind, name } = request.params;
        const { finding } = request.body;

        if (!finding || !finding.Id) {
          response.status(400).json({
            message: 'Finding data is required',
          });
          return;
        }

        const cacheKey = `${namespace}/${kind}/${name}/${finding.Id}`;

        const cacheHit = await cache.get(cacheKey);

        if (cacheHit) {
          response.status(200).json(cacheHit);
          return;
        }

        const prompt = PROMPT_TEMPLATE.replace(
          '{entityRef}',
          `${namespace}/${kind}/${name}`,
        )
          .replace('{findingId}', finding.Id)
          .replace('{title}', finding.Title || 'N/A')
          .replace('{description}', finding.Description || 'N/A')
          .replace('{severity}', finding.Severity?.Label || 'N/A')
          .replace('{types}', finding.Types?.join(', ') || 'N/A')
          .replace('{workflowStatus}', finding.Workflow?.Status || 'N/A')
          .replace('{recordState}', finding.RecordState || 'N/A')
          .replace('{accountId}', finding.AwsAccountId || 'N/A')
          .replace('{region}', finding.Resources?.[0]?.Region || 'N/A')
          .replace('{resourceType}', finding.Resources?.[0]?.Type || 'N/A')
          .replace('{resourceId}', finding.Resources?.[0]?.Id || 'N/A')
          .replace('{lastUpdated}', finding.UpdatedAt || 'N/A');

        const credentials = await httpAuth.credentials(request);

        const agentResponse = await agentClient.generate(
          {
            agentName,
            prompt,
          },
          await auth.getPluginRequestToken({
            onBehalfOf: credentials,
            targetPluginId: 'aws-genai',
          }),
        );

        // Check if the response contains an error
        if ((agentResponse as any).error) {
          response.status(500).json({
            message: (agentResponse as any).error.message || 'AI service error',
          });
          return;
        }

        const result = {
          analysis: agentResponse.output || 'Analysis not available',
        };

        cache.set(cacheKey, result);
        response.status(200).json(result);
      } catch (error) {
        logger.error('Failed to generate AI response', error as Error);
        response.status(500).json({
          message:
            error instanceof Error
              ? error.message
              : 'Failed to generate AI response',
        });
      }
    },
  );

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  return router as any;
}

export * from './DefaultAwsSecurityHubService';
