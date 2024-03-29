# AWC scaffolder actions plugin for Backstage

This is the AWS scaffolder actions plugin for backstage.io.

It provides scaffolder actions to:

1. Create AWS resources using the AWS Cloud Control API
2. Post an event to AWS EventBridge via the `PutEvents` API
3. Publish files to an Amazon S3 bucket
4. Create and publish files to a new AWS CodeCommit repository

## Installing

This guide assumes that you are familiar with the general [Getting Started](../../docs/getting-started.md) documentation and have assumes you have an existing Backstage application.

Install the backend package in your Backstage app:

```shell
yarn workspace backend add @aws/aws-core-plugin-for-backstage-scaffolder-actions
```

### New backend

Add the scaffolder module to the `packages/backend/src/index.ts`:

```typescript
const backend = createBackend();
// ...
backend.add(import('@aws/aws-core-plugin-for-backstage-scaffolder-actions'));
// ...
backend.start();
```

### Old backend

Update the file `packages/backend/src/plugins/scaffolder.ts` to add the scaffolder actions needed, for example:

```typescript
import { CatalogClient } from '@backstage/catalog-client';
import { createRouter } from '@backstage/plugin-scaffolder-backend';
import { Router } from 'express';
import type { PluginEnvironment } from '../types';
import { createBuiltinActions } from '@backstage/plugin-scaffolder-backend';
import { ScmIntegrations } from '@backstage/integration';
import { createAwsCloudControlCreateAction } from '@aws/aws-core-plugin-for-backstage-scaffolder-actions';

export default async function createPlugin(
  env: PluginEnvironment,
): Promise<Router> {
  const catalogClient = new CatalogClient({
    discoveryApi: env.discovery,
  });

  const integrations = ScmIntegrations.fromConfig(env.config);

  const builtInActions = createBuiltinActions({
    integrations,
    catalogClient,
    config: env.config,
    reader: env.reader,
  });

  const actions = [
    ...builtInActions,
    // Add the new scaffolder action along side other custom actions
    createAwsCloudControlCreateAction(),
  ];

  return await createRouter({
    actions,
    logger: env.logger,
    config: env.config,
    database: env.database,
    reader: env.reader,
    catalogClient,
    identity: env.identity,
    permissions: env.permissions,
  });
}
```

## Actions

Each action is documented below.

### AWS Cloud Control - Create resource

This scaffolder action creates AWS resources using the AWS Cloud Control API.

Note: Creating AWS resources using this mechanism is generally discouraged unless for exceptional use-cases. We strongly recommend relying on infrastructure-as-code to create AWS resources, and using this action for anything that is strictly related to bootstrapping a project.

#### Permissions

The IAM role(s) used by Backstage will require the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["cloudcontrol:CreateResource"],
      "Resource": "*"
    }
  ]
}
```

Note: This policy does not reflect least privilege and you should further limit the policy to the appropriate AWS resources.

#### Usage

The scaffolder action can be included in a software template like so:

```yaml
steps:
  - id: create-ecr-repository
    name: Create ECR Repository
    action: aws:cloudcontrol:create
    input:
      typeName: 'AWS::ECR::Repository'
      desiredState: '{"RepositoryName": "${{ parameters.name }}-ecr-repository"}'
      wait: true
      maxWaitTime: 20
```
