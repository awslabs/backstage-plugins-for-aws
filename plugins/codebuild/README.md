# AWS CodeBuild plugin for Backstage

This is the AWS CodeBuild plugin for backstage.io.

It provides:

1. Entity content that displays the status of AWS CodeBuild executions related to that specific entity

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
        "codebuild:BatchGetProjects",
        "codebuild:ListBuildsForProject",
        "codebuild:BatchGetBuilds"
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
yarn workspace backend add @aws/aws-codebuild-plugin-for-backstage-backend
```

Create a file `packages/backend/src/plugins/codebuild.ts` with the following content:

```typescript
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
```

Edit `packages/backend/src/index.ts` to register the backend plugin:

```typescript
// ..
import codebuild from './plugins/codebuild';

async function main() {
  // ...
  const codebuildEnv = useHotMemoize(module, () => createEnv('aws-codebuild'));
  // ...
  apiRouter.use('/aws/codebuild', await codebuild(codebuildEnv));
  // ...
}
```

Verify that the backend plugin is running in your Backstage app. You should receive `{"status":"ok"}` when accessing this URL:
`https://<your backstage app>/api/aws/codebuild/health`.

### Frontend package

Install the frontend package in your Backstage app:

```shell
yarn workspace app add @aws/aws-codebuild-plugin-for-backstage
```

Edit `packages/app/src/components/catalog/EntityPage.tsx` to add the AWS CodeBuild card to the entity page:

```typescript
import {
  EntityAwsCodeBuildExecutionsContent,
  isAwsCodeBuildAvailable,
} from '@aws/aws-codebuild-plugin-for-backstage';

// For example in the CI/CD section
const cicdContent = (
  <EntitySwitch>
    <EntitySwitch.Case if={isAwsCodeBuildAvailable}>
      <EntityAwsCodeBuildCard />
    </EntitySwitch.Case>
```

## Entity annotations

There are two annotations that can be used to reference CodeBuild projects for an entity.

The first will retrieve all CodeBuild projects with the matching tags, this is done with the `aws.amazon.com/aws-codebuild-project-tags` annotation:

```yaml
# Example
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  # ...
  annotations:
    aws.amazon.com/aws-codebuild-project-tags: component=myapp
spec:
  type: service
  # ...
```

The alternative is to reference a specific ECS service by ARN, this is done with the `aws.amazon.com/aws-codebuild-project-arn` annotation:

```yaml
# Example
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  # ...
  annotations:
    aws.amazon.com/aws-codebuild-project-arn: arn:aws:codebuild:us-west-2:1234567890:project/myapp-build
spec:
  type: service
  # ...
```
