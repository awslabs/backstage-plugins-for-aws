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
import { CostInsightsAwsService } from './types';
import {
  CacheService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { CostInsightsCache } from '../cache';
import { CostInsightsAwsConfig } from '../config';
import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import { Config } from '@backstage/config';

export interface RouterOptions {
  logger: LoggerService;
  costInsightsAwsService: CostInsightsAwsService;
  httpAuth: HttpAuthService;
  cache: CacheService;
  config: CostInsightsAwsConfig;
  rootConfig: Config;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const {
    logger,
    costInsightsAwsService,
    config,
    cache,
    httpAuth,
    rootConfig,
  } = options;

  const router = Router();
  router.use(express.json());

  let cacheClient: CostInsightsCache | undefined;
  if (config.cache.enable) {
    cacheClient = CostInsightsCache.fromConfig(config, { cache, logger });

    router.use((req, res, next) => {
      const cacheKey = req.originalUrl;

      if (cacheClient) {
        cacheClient.get(cacheKey).then(e => {
          if (e) {
            res.send(JSON.parse(e));
          } else {
            const originalJson = res.json;
            res.json = data => {
              if (cacheClient) {
                cacheClient.set(cacheKey, JSON.stringify(data));
              }
              return originalJson.call(res, data);
            };
            next();
          }
        });
      }
    });
  }

  router.get(
    '/v1/entity/:namespace/:kind/:name/:intervals',
    async (request, response) => {
      const { namespace, kind, name, intervals } = request.params;

      const data = await costInsightsAwsService.getCatalogEntityDailyCost({
        entityRef: {
          kind,
          namespace,
          name,
        },
        intervals,
        credentials: await httpAuth.credentials(request),
      });

      response.status(200).json(data);
    },
  );

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });

  const middleware = MiddlewareFactory.create({ logger, config: rootConfig });
  router.use(middleware.error());

  return router;
}

export * from './CostExplorerCostInsightsAwsService';
