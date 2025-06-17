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

import {
  createLegacyAuthAdapters,
  errorHandler,
} from '@backstage/backend-common';
import express from 'express';
import Router from 'express-promise-router';
import {
  AuthService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { AgentService } from './types';
import {
  ChatRequest,
  GenerateRequest,
  ChatEvent,
  EndSessionRequest,
} from '@aws/genai-plugin-for-backstage-common';

export interface RouterOptions {
  logger: LoggerService;
  agentService: AgentService;
  discovery: DiscoveryService;
  auth?: AuthService;
  httpAuth?: HttpAuthService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, agentService } = options;

  const router = Router();
  router.use(express.json());

  const { httpAuth } = createLegacyAuthAdapters(options);

  router.post('/v1/chat', async (request, response) => {
    const payload = request.body as ChatRequest;

    const credentials = await httpAuth.credentials(request);

    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
    });

    const stream = await agentService.stream(payload.userMessage, {
      ...payload,
      credentials,
    });

    const reader = stream.getReader();

    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        response.write(stringifyEvent(value));

        // @ts-ignore
        response.flush();
      }
    } catch (e: any) {
      logger.error(`Agent stream failed: ${e}`, e);

      response.write(
        stringifyEvent({
          type: 'ErrorEvent',
          message: e.message,
        }),
      );
    } finally {
      reader.releaseLock();
    }

    response.end();
  });

  router.post('/v1/generate', async (request, response) => {
    const payload = request.body as GenerateRequest;

    const credentials = await httpAuth.credentials(request);

    const answer = await agentService.generate(payload.prompt, {
      ...payload,
      credentials,
    });

    response.json({ ...answer });
  });

  router.get('/v1/session/:agent/:sessionId', async (request, response) => {
    const { agent, sessionId } = request.params;

    const credentials = await httpAuth.credentials(request);

    const session = await agentService.getUserSession({
      agentName: agent,
      sessionId,
      credentials,
    });

    if (!session) {
      response.status(404).send();
      return;
    }

    response.json(session);
  });

  router.post('/v1/endSession', async (request, response) => {
    const payload = request.body as EndSessionRequest;

    const credentials = await httpAuth.credentials(request);

    await agentService.endSession({
      ...payload,
      credentials,
    });

    response.status(200).send();
  });

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}

function stringifyEvent(event: ChatEvent) {
  const data = `data: ${JSON.stringify(event)}\n\n`;

  return data;
}
