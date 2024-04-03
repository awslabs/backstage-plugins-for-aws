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
import { Logger } from 'winston';
import { AwsCodePipelineService } from './types';
import {
  AuthService,
  DiscoveryService,
  HttpAuthService,
} from '@backstage/backend-plugin-api';

export interface RouterOptions {
  logger: Logger;
  awsCodePipelineApi: AwsCodePipelineService;
  discovery: DiscoveryService;
  auth?: AuthService;
  httpAuth?: HttpAuthService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, awsCodePipelineApi } = options;

  const router = Router();
  router.use(express.json());

  const { httpAuth } = createLegacyAuthAdapters(options);

  router.get(
    '/v1/entity/:namespace/:kind/:name/executions',
    async (request, response) => {
      const { namespace, kind, name } = request.params;

      const services = await awsCodePipelineApi.getPipelineExecutionsByEntity({
        entityRef: {
          kind,
          namespace,
          name,
        },
        credentials: await httpAuth.credentials(request),
      });
      response.status(200).json(services);
    },
  );

  router.get(
    '/v1/entity/:namespace/:kind/:name/state',
    async (request, response) => {
      const { namespace, kind, name } = request.params;

      const services = await awsCodePipelineApi.getPipelineStateByEntity({
        entityRef: {
          kind,
          namespace,
          name,
        },
        credentials: await httpAuth.credentials(request),
      });
      response.status(200).json(services);
    },
  );

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}

export * from './DefaultAwsCodePipelineService';
