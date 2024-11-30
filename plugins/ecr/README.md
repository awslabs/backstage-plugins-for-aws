# ECR AWS plugin for Backstage

This plugin is meant to allow you to view ECR Scan Results for a specific entity within your Backstage UI. 

This requires that where you run Backstage has AWS Credentials that has IAM Permissions to describe images and get ECR scan findings (through enviornment variables, IRSA, etc;).

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
        "ecr:DescribeImages",
        "ecr:DescribeImageScanFindings"
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
yarn workspace backend add @aws/ecr-plugin-for-backstage-backend
```

Add the plugin to the `packages/backend/src/index.ts`:

```typescript
const backend = createBackend();
// ...
backend.add(import('@aws/ecr-plugin-for-backstage-backend'));
// ...
backend.start();
```

### Frontend package

Install the frontend packages in your Backstage app:

```shell
yarn workspace app add @aws/ecr-plugin-for-backstage
```
Edit the `packages/app/src/components/catalog/EntityPage.tsx` and add the imports

```typescript jsx
import {
  EntityEcrScanResultsContent, 
  isAwsEcrScanResultsAvailable 
} from 'plugin-aws-ecr-scan';
```

Then add the following components:

```typescript jsx
  <EntityLayout.Route path="/ecr-scan" title="Image Scan" if={isAwsEcrScanResultsAvailable}>
    <EntityEcrScanResultsContent />
  </EntityLayout.Route>
```

### Configuration

Cost Insights requires minimal configuration in order to run. Add this to `app-config.yaml`:

```yaml
costInsights:
  engineerCost: 200000
```

## Entity annotations

The plugin uses entity annotations to determine what queries to make for a given entity. The `aws.amazon.com/aws-ecr-repository-name` annotation can be added to any catalog entity to attach an ECR Repository to the entity.

It is the users responsibility to ensure all AWS resources are tagged appropriately and that cost allocation tags have been enabled appropriately.

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  # ...
  annotations:
    aws.amazon.com/aws-ecr-repository-name: my-service
spec:
  type: service
  # ...
```

## Configuration

There are configuration options available to control the behavior of the plugin.

```yaml
aws:
  ecr:
    accountId: '1111111111' # (Optional) Use the specified AWS account ID
    region: 'us-west-2' # (Optional) Use the specified AWS region
    cache:
      enable: true # (Optional) Control is caching is enabled, defaults to true
      defaultTtl: 1000 # (Optional) How long responses are cached for in milliseconds, defaults to 1 day
      readTime: 1000 # (Optional) Read timeout when operating with cache in milliseconds, defaults to 1000 ms
```

### Caching

By default the responses from the backend plugin are cached for 1 day in order to improve performance to the user for querying the ECR API. The cache TTL can be configured to a different value or alternatively it can be disabled entirely if needed.
