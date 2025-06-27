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

import express from 'express';
import Router from 'express-promise-router';
import { AmazonEcrService } from './types';
import { HttpAuthService, LoggerService } from '@backstage/backend-plugin-api';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { Config } from '@backstage/config';

export interface RouterOptions {
  logger: LoggerService;
  ecrAwsService: AmazonEcrService;
  config: Config;
  httpAuth: HttpAuthService;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, ecrAwsService, httpAuth, config } = options;

  const router = Router();
  router.use(express.json());

  router.get('/v1/entity/:namespace/:kind/:name/images', async (req, res) => {
    const { namespace, kind, name } = req.params;

    const images = await ecrAwsService.listEcrImages({
      entityRef: {
        namespace,
        kind,
        name,
      },
      credentials: await httpAuth.credentials(req),
    });
    res.json(images);
  });

  router.get(
    '/v1/entity/:namespace/:kind/:name/findings/:registry/:digest',
    async (req, res) => {
      const { namespace, kind, name, registry, digest } = req.params;

      console.log(`Got ${registry}`);

      const scanResults = await ecrAwsService.listScanResults({
        entityRef: {
          namespace,
          kind,
          name,
        },
        credentials: await httpAuth.credentials(req),
        arn: registry,
        digest: digest,
      });
      res.json(scanResults);
    },
  );

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  return router;
}

export * from './DefaultAmazonEcrService';
