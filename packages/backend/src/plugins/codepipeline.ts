import { createRouter } from '@aws/aws-codepipeline-plugin-for-backstage-backend';
import { PluginEnvironment } from '../types';
import { DefaultAwsCodePipelineService } from '@aws/aws-codepipeline-plugin-for-backstage-backend';
import { CatalogClient } from '@backstage/catalog-client';

export default async function createPlugin(env: PluginEnvironment) {
  const catalogApi = new CatalogClient({ discoveryApi: env.discovery });
  const awsCodePipelineApi = await DefaultAwsCodePipelineService.fromConfig(
    env.config,
    {
      catalogApi,
      logger: env.logger,
    },
  );
  return await createRouter({
    logger: env.logger,
    awsCodePipelineApi,
  });
}
