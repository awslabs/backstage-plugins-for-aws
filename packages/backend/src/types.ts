import { Config } from '@backstage/config';
import { PermissionEvaluator } from '@backstage/plugin-permission-common';
import { IdentityApi } from '@backstage/plugin-auth-node';
import {
  CacheService,
  DatabaseService,
  DiscoveryService,
  LoggerService,
  SchedulerService,
  UrlReaderService,
} from '@backstage/backend-plugin-api';

export type PluginEnvironment = {
  logger: LoggerService;
  database: DatabaseService;
  cache: CacheService;
  config: Config;
  reader: UrlReaderService;
  discovery: DiscoveryService;
  scheduler: SchedulerService;
  permissions: PermissionEvaluator;
  identity: IdentityApi;
};
