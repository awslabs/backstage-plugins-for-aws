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
  CostInsightsAwsConfig,
  CostInsightsAwsConfigCache,
  CostInsightsAwsConfigCostExplorer,
  CostInsightsAwsConfigEntityGroup,
} from './types';

export function readCostInsightsAwsConfig(
  config: Config,
): CostInsightsAwsConfig {
  const root = config.getOptionalConfig('aws.costInsights');

  return {
    costExplorer: readCostInsightsAwsConfigCostExplorer(root),
    entityGroups: readCostInsightsAwsConfigEntityGroups(root),
    cache: readCostInsightsAwsConfigCache(root),
  };
}

function readCostInsightsAwsConfigCostExplorer(
  config: Config | undefined,
): CostInsightsAwsConfigCostExplorer {
  const root = config?.getOptionalConfig('costExplorer');

  return {
    accountId: root?.getOptionalString('accountId'),
    region: root?.getOptionalString('region'),
  };
}

function readCostInsightsAwsConfigCache(
  config: Config | undefined,
): CostInsightsAwsConfigCache {
  const root = config?.getOptionalConfig('cache');

  return {
    enable: root?.getOptionalBoolean('enable') || true,
    defaultTtl: root?.getOptionalNumber('defaultTtl') || 86400000,
    readTimeout: root?.getOptionalNumber('readTimeout') || 1000,
  };
}

function readCostInsightsAwsConfigEntityGroups(
  config: Config | undefined,
): CostInsightsAwsConfigEntityGroup[] {
  if (config) {
    return (
      config.getOptionalConfigArray('entityGroups')?.map(group => ({
        kind: group.getString('kind'),
        groups: group.getConfigArray('groups')?.map(g => ({
          name: g.getString('name'),
          key: g.getString('key'),
          type: g.getString('type'),
        })),
      })) || []
    );
  }

  return [];
}
