import { createRouter } from '@aws/amazon-ecs-plugin-for-backstage-backend';
import { PluginEnvironment } from '../types';
import { DefaultAmazonEcsService } from '@aws/amazon-ecs-plugin-for-backstage-backend';
import { CatalogClient } from '@backstage/catalog-client';

export default async function createPlugin(env: PluginEnvironment) {
  const catalogApi = new CatalogClient({ discoveryApi: env.discovery });
  const amazonEcsApi = await DefaultAmazonEcsService.fromConfig(env.config, {
    catalogApi,
    logger: env.logger,
  });
  return await createRouter({
    logger: env.logger,
    amazonEcsApi,
  });
}
