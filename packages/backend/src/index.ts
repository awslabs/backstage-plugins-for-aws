import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();
backend.add(import('@backstage/plugin-app-backend/alpha'));
backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
backend.add(import('@backstage/plugin-catalog-backend/alpha'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-proxy-backend/alpha'));
backend.add(import('@backstage/plugin-scaffolder-backend/alpha'));
backend.add(import('@backstage/plugin-search-backend/alpha'));
backend.add(import('@backstage/plugin-techdocs-backend/alpha'));

backend.add(import('@aws/amazon-ecs-plugin-for-backstage-backend'));
backend.add(import('@aws/aws-codebuild-plugin-for-backstage-backend'));
backend.add(import('@aws/aws-codepipeline-plugin-for-backstage-backend'));
backend.add(import('@aws/aws-core-plugin-for-backstage-scaffolder-actions'));

backend.add(import('@aws/cost-insights-plugin-for-backstage-backend'));

backend.start();
