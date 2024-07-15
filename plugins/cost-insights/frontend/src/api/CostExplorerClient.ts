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

import {
  CostInsightsApi,
  ProductInsightsOptions,
  Alert,
} from '@backstage-community/plugin-cost-insights';
import {
  Cost,
  Entity,
  Group,
  MetricData,
  Project,
} from '@backstage-community/plugin-cost-insights-common';
import dateFormat from 'dateformat';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { parseEntityRef } from '@backstage/catalog-model';
import { CatalogApi } from '@backstage/plugin-catalog-react';

export class CostExplorerClient implements CostInsightsApi {
  public constructor(
    private readonly discoveryApi: DiscoveryApi,
    private readonly fetchApi: FetchApi,
    private readonly catalogApi: CatalogApi,
  ) {}

  private async get<T>(path: string): Promise<T> {
    const baseUrl = await this.discoveryApi.getBaseUrl('cost-insights-aws');

    const url = `${baseUrl}/${path}`;

    const response = await this.fetchApi.fetch(url);

    if (!response.ok) {
      throw await ResponseError.fromResponse(response);
    }

    return response.json() as Promise<T>;
  }

  async getLastCompleteBillingDate(): Promise<string> {
    const yesterday = new Date(new Date().setDate(new Date().getDate() - 1));

    return dateFormat(yesterday, 'yyyy-mm-dd');
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    return (
      await this.catalogApi.getEntities({
        filter: {
          kind: 'Group',
          ['relations.hasMember']: [`user:default/${userId}`],
        },
      })
    ).items.map(e => {
      return {
        id: `group:${e.metadata.name}`,
        name: e.metadata.name,
      };
    });
  }

  // No default implementation
  async getGroupProjects(_: string): Promise<Project[]> {
    return [];
  }

  // No default implementation
  async getAlerts(_: string): Promise<Alert[]> {
    return [];
  }

  // No default implementation
  async getDailyMetricData(_: string, __: string): Promise<MetricData> {
    throw new Error('Not implemented');
  }

  // Default implementation assumes groups are Group catalog entities, delegates to getCatalogEntityDailyCost
  async getGroupDailyCost(group: string, intervals: string): Promise<Cost> {
    return this.getCatalogEntityDailyCost(group, intervals);
  }

  async getProjectDailyCost(_: string, __: string): Promise<Cost> {
    throw new Error('Not implemented');
  }

  // @ts-ignore
  async getCatalogEntityDailyCost(
    catalogEntityRef: string,
    intervals: string,
  ): Promise<Cost> {
    const entityRef = parseEntityRef(catalogEntityRef);
    const urlSegment = `v1/entity/${entityRef.namespace}/${entityRef.kind}/${
      entityRef.name
    }/${encodeURIComponent(intervals)}`;

    const service = await this.get<Cost>(urlSegment);

    return service;
  }

  async getProductInsights(_: ProductInsightsOptions): Promise<Entity> {
    throw new Error('Not implemented');
  }
}
