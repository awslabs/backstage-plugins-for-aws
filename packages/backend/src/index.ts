import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();
backend.add(import('@backstage/plugin-app-backend'));
backend.add(import('@backstage/plugin-auth-backend'));
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@backstage/plugin-catalog-backend-module-scaffolder-entity-model'),
);
backend.add(import('@backstage/plugin-proxy-backend'));
backend.add(import('@backstage/plugin-scaffolder-backend'));
backend.add(import('@backstage/plugin-search-backend'));
backend.add(import('@backstage/plugin-search-backend-module-catalog'));
backend.add(import('@backstage/plugin-search-backend-module-techdocs'));
backend.add(import('@backstage/plugin-techdocs-backend'));

backend.add(import('@aws/amazon-ecs-plugin-for-backstage-backend'));
backend.add(import('@aws/aws-codebuild-plugin-for-backstage-backend'));
backend.add(import('@aws/aws-codepipeline-plugin-for-backstage-backend'));
backend.add(import('@aws/aws-core-plugin-for-backstage-scaffolder-actions'));
backend.add(import('@aws/amazon-ecr-plugin-for-backstage-backend'));

backend.add(import('@aws/cost-insights-plugin-for-backstage-backend'));

backend.add(import('@aws/genai-plugin-for-backstage-backend'));
backend.add(import('@aws/genai-plugin-langgraph-agent-for-backstage'));

backend.start();
