/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { assertError } from '@backstage/errors';
import { Logger } from 'winston';
import { CacheService } from '@backstage/backend-plugin-api';
import { CostInsightsAwsConfig } from '../config';

const KEY_PREFIX = 'cost-insights:';

export class CostInsightsCache {
  protected readonly cache: CacheService;
  protected readonly logger: Logger;
  protected readonly readTimeout: number;

  private constructor({
    cache,
    logger,
    readTimeout,
  }: {
    cache: CacheService;
    logger: Logger;
    readTimeout: number;
  }) {
    this.cache = cache;
    this.logger = logger;
    this.readTimeout = readTimeout;
  }

  static fromConfig(
    config: CostInsightsAwsConfig,
    { cache, logger }: { cache: CacheService; logger: Logger },
  ) {
    return new CostInsightsCache({
      cache: cache.withOptions({ defaultTtl: config.cache.defaultTtl }),
      logger,
      readTimeout: config.cache.readTimeout,
    });
  }

  async get(path: string): Promise<string | undefined> {
    try {
      const response = (await Promise.race([
        this.cache.get(`${KEY_PREFIX}${path}`),
        new Promise(cancelAfter => setTimeout(cancelAfter, this.readTimeout)),
      ])) as string | undefined;

      if (response !== undefined) {
        this.logger.debug(`Cache hit: ${path}`);
        return response;
      }

      this.logger.debug(`Cache miss: ${path}`);
      return response;
    } catch (e) {
      assertError(e);
      this.logger.warn(`Error getting cache entry ${path}: ${e.message}`);
      this.logger.debug(e.stack);
      return undefined;
    }
  }

  async set(path: string, data: string): Promise<void> {
    this.logger.debug(`Writing cache entry for ${path}`);
    this.cache
      .set(`${KEY_PREFIX}${path}`, data)
      .catch(e => this.logger.error('write error', e));
  }
}
