# Amazon Elastic Container Service plugin for Backstage

This is the Amazon Elastic Container Service plugin for backstage.io.

It provides:

1. Entity content that displays the status of Amazon ECS services related to that specific entity

(IMAGE)

The plugin consists of the following packages:

- `frontend`: The frontend plugin package installed in Backstage
- `backend`: The backend plugin package installed in Backstage
- `common`: Types and utilities shared between the packages

## Installing

This guide assumes that you are familiar with the general [Getting Started](../../docs/getting-started.md) documentation and have assumes you have an existing Backstage application.

### Permissions

The IAM role(s) used by Backstage will require the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeServicesCommand",
        "ecs:ListTasksCommand",
        "ecs:DescribeTasksCommand",
        "ecs:DescribeClustersCommand"
      ],
      "Resource": "*"
    }
  ]
}
```

Note: This policy does not reflect least privilege and you should further limit the policy to the appropriate AWS resources.

### Backend package

Install the backend package in your Backstage app:

```shell
yarn workspace backend add @aws/amazon-ecs-plugin-for-backstage-backend
```

Create a file `packages/backend/src/plugins/ecs.ts` with the following content:

```typescript
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
```

Edit `packages/backend/src/index.ts` to register the backend plugin:

```typescript
// ..
import ecs from './plugins/ecs';

async function main() {
  // ...
  const ecsEnv = useHotMemoize(module, () => createEnv('amazon-ecs'));
  // ...
  apiRouter.use('/aws/ecs', await ecs(ecsEnv));
  // ...
}
```

Verify that the backend plugin is running in your Backstage app. You should receive `{"status":"ok"}` when accessing this URL:
`https://<your backstage app>/api/aws/ecs/health`.

### Frontend package

Install the frontend package in your Backstage app:

```shell
yarn workspace app add @aws/amazon-ecs-plugin-for-backstage
```

Edit `packages/app/src/components/catalog/EntityPage.tsx` to add an Amazon ECS service tab to the entity page:

```typescript
import { EntityAmazonEcsServicesContent } from '@aws/amazon-ecs-plugin-for-backstage';

{/* ... */}

const serviceEntityPage = (
  <EntityLayout>
    {/* ... */}
    <EntityLayout.Route path="/ecs" title="Amazon ECS">
      <EntityAmazonEcsServicesContent />
    </EntityLayout.Route>
  </EntityLayout>
  {/* ... */}
);
```

## Entity annotations

There are two annotations that can be used to reference ECS services for an entity.

The first will retrieve all ECS services with the matching tags, this is done with the `aws.amazon.com/amazon-ecs-service-tags` annotation:

```yaml
# Example
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  # ...
  annotations:
    aws.amazon.com/amazon-ecs-service-tags: component=myapp,environment=prod
spec:
  type: service
  # ...
```

The alternative is to reference a specific ECS service by ARN, this is done with the `aws.amazon.com/amazon-ecs-service-arn` annotation:

```yaml
# Example
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  # ...
  annotations:
    aws.amazon.com/amazon-ecs-service-arn: arn:aws:ecs:us-west-2:1234567890:service/cluster1/myapp-service
spec:
  type: service
  # ...
```
