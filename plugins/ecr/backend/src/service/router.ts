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
import { EcrScanAwsService } from './types';
import {
  AuthService,
  CacheService,
  coreServices,
  createServiceFactory,
  createServiceRef,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { EcrCache } from '../cache';
import { EcrConfig, readEcrConfig } from '../config';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { EcrAwsService } from './EcrAwsService';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';

export interface RouterOptions {
  logger: LoggerService;
  ecrAwsService: EcrScanAwsService;
  discovery: DiscoveryService;
  auth?: AuthService;
  httpAuth?: HttpAuthService;
  cache: CacheService;
  config: EcrConfig;
}

export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, ecrAwsService, config, cache } = options;

  const router = Router();
  router.use(express.json());

  const { httpAuth } = createLegacyAuthAdapters(options);

  let cacheClient: EcrCache | undefined;
  if (config.cache.enable) {
    cacheClient = EcrCache.fromConfig(config, { cache, logger });

    router.use((req, res, next) => {
      const cacheKey = req.originalUrl;

      console.log(`Cache key ${cacheKey}`);

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

  router.get('/v1/images', async (req, res) => {
    try {
      const componentKey = req.query.componentKey as string;
      logger.info(`Grabbing Images for ${componentKey}`)
      const images = await ecrAwsService.listEcrImages(
        {
          componentKey,
        })
        res.json(images);
      } catch (error) {
        logger.error(error)
        res.json({
          error: error,
        })
      }
  })

  router.get('/v1/images/results', async (req, res) => {
    try {
      const componentKey = req.query.componentKey as string;
      const imageTag = req.query?.imageTag as string;
      logger.info(`Grabbing Scan Results for ${componentKey}:${imageTag}`)
      const scanResults = await ecrAwsService.listScanResults(
        {
          componentKey,
          imageTag,
        })
        res.json(scanResults);
      } catch (error) {
        logger.error(error)
        res.json({
          error: error,
        })
      }
   })

  router.get('/health', (_, response) => {
    logger.info('PONG!');
    response.json({ status: 'ok' });
  });
  router.use(errorHandler());
  return router;
}

export const ecrAwsServiceRef =
  createServiceRef<EcrScanAwsService>({
    id: 'ecr-aws.api',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {
          logger: coreServices.logger,
          config: coreServices.rootConfig,
          catalogApi: catalogServiceRef,
          auth: coreServices.auth,
          discovery: coreServices.discovery,
          httpAuth: coreServices.httpAuth,
        },
        async factory({
          logger,
          config,
          catalogApi,
          auth,
          httpAuth,
          discovery,
        }) {
          const pluginConfig = readEcrConfig(config);

          const impl = await EcrAwsService.fromConfig(
            pluginConfig,
            {
              catalogApi,
              auth,
              httpAuth,
              discovery,
              logger,
              credentialsManager:
                DefaultAwsCredentialsManager.fromConfig(config),
            },
          );

          return impl;
        },
      }),
  });


export * from './EcrAwsService';
