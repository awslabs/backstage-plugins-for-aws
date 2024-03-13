import { createRouter } from '@aws/aws-codebuild-plugin-for-backstage-backend';
import { PluginEnvironment } from '../types';
import { DefaultAwsCodeBuildService } from '@aws/aws-codebuild-plugin-for-backstage-backend';
import { CatalogClient } from '@backstage/catalog-client';

export default async function createPlugin(env: PluginEnvironment) {
  const catalogApi = new CatalogClient({ discoveryApi: env.discovery });
  const awsCodeBuildApi = await DefaultAwsCodeBuildService.fromConfig(
    env.config,
    {
      catalogApi,
      logger: env.logger,
    },
  );
  return await createRouter({
    logger: env.logger,
    awsCodeBuildApi,
  });
}
