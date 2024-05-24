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

import { errorHandler } from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import { Logger } from 'winston';
import { AmazonBedrockAgentService } from './types';
import { ChatSyncRequest } from '@aws/amazon-bedrock-plugin-for-backstage-common';

export interface RouterOptions {
  logger: Logger;
  amazonBedrockAgentApi: AmazonBedrockAgentService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, amazonBedrockAgentApi } = options;

  const router = Router();
  router.use(express.json());

  router.post('/v1/agents/chat', async (request, response) => {
    const payload = request.body as ChatSyncRequest;

    const responsePayload = await amazonBedrockAgentApi.chatSync({
      ...payload,
    });
    response.status(200).json(responsePayload);
  });

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}

export * from './DefaultAmazonBedrockAgentService';
