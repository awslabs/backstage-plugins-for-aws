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

import { Config } from '@backstage/config';
import {
  EcrAwsConfig,
  EcrConfig,
  EcrAwsConfigCache,
} from './types';

export function readEcrConfig(
  config: Config,
): EcrConfig {
  const root = config.getOptionalConfig('aws.ecr');

  return {
    ecr: readEcrAwsConfig(root),
    cache: readEcrAwsConfigCache(root),
  };
}

function readEcrAwsConfig(
  config: Config | undefined,
): EcrAwsConfig {

  return {
    accountId: config?.getOptionalString('accountId'),
    region: config?.getOptionalString('region'),
  };
}

function readEcrAwsConfigCache(
  config: Config | undefined,
): EcrAwsConfigCache {
  const root = config?.getOptionalConfig('cache');

  return {
    enable: root?.getOptionalBoolean('enable') || true,
    defaultTtl: root?.getOptionalNumber('defaultTtl') || 86400000,
    readTimeout: root?.getOptionalNumber('readTimeout') || 1000,
  };
}
