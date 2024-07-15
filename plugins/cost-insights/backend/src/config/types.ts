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

export type CostInsightsAwsConfig = {
  cache: CostInsightsAwsConfigCache;
  entityGroups: CostInsightsAwsConfigEntityGroup[];
  costExplorer: CostInsightsAwsConfigCostExplorer;
};

export type CostInsightsAwsConfigCache = {
  enable: boolean;
  defaultTtl: number;
  readTimeout: number;
};

export type CostInsightsAwsConfigEntityGroup = {
  kind: string;
  groups: CostInsightsAwsConfigGroup[];
};

export type CostInsightsAwsConfigGroup = {
  name: string;
  key: string;
  type: string;
};

export type CostInsightsAwsConfigCostExplorer = {
  accountId: string | undefined;
  region: string | undefined;
};
