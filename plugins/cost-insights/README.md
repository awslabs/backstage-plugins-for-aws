# Cost Insights AWS plugin for Backstage

This is the AWS implementation of the [Cost Insights plugin](https://github.com/backstage/community-plugins/tree/main/workspaces/cost-insights/plugins/cost-insights) for Backstage. It provides an implementation of the `CostInsightsApi` interface that uses the AWS Cost Explorer API to retrieve data regarding AWS infrastructure costs.

Note: Each request to the AWS Cost Explorer API will incur a cost of $0.01 so plan usage accordingly. See the Caching section below for information on how this is mitigated.

Currently the following features of Cost Insights are **NOT** implemented:

1. [Products](https://github.com/backstage/community-plugins/tree/main/workspaces/cost-insights/plugins/cost-insights#products-optional)
2. [Metrics](https://github.com/backstage/community-plugins/tree/main/workspaces/cost-insights/plugins/cost-insights#metrics-optional)
3. [Alerts](https://github.com/backstage/community-plugins/tree/main/workspaces/cost-insights/plugins/cost-insights#alerts)

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
      "Action": ["ce:GetCostAndUsage"],
      "Resource": "*"
    }
  ]
}
```

Note: This policy does not reflect least privilege and you should further limit the policy to the appropriate AWS resources.

### Backend package

Install the backend package in your Backstage app:

```shell
yarn workspace backend add @aws/cost-insights-plugin-for-backstage-backend
```

Add the plugin to the `packages/backend/src/index.ts`:

```typescript
const backend = createBackend();
// ...
backend.add(import('@aws/cost-insights-plugin-for-backstage-backend'));
// ...
backend.start();
```

### Frontend package

Install the frontend packages in your Backstage app:

```shell
yarn workspace app add @backstage-community/plugin-cost-insights @aws/cost-insights-plugin-for-backstage
```

Edit `packages/app/src/App.tsx` to register the `costInsightsAwsPlugin` plugin:

```typescript
// ...
import { costInsightsAwsPlugin } from '@aws/cost-insights-plugin-for-backstage';

const app = createApp({
  apis,
  plugins: [costInsightsAwsPlugin],
  components: {
  //...
```

Follow the [Cost Insights plugin documentation](https://github.com/backstage/community-plugins/tree/main/workspaces/cost-insights/plugins/cost-insights) to add it to the navigation menu.

The `EntityCostInsightsContent` component can also be used to add a 'Cost Insights' tab to any Backstage entity which provides cost information in the context of that entity. This is useful to see costs related to a give application, team or anything else stored in the Backstage catalog.

It will be necessary to customize each entity screen appropriately in order to add this tab. This documentation will not cover all of these but will provide an example of adding this tab to the `Component` entity kind.

Edit `packages/app/src/components/catalog/EntityPage.tsx` to add the 'Cost Insights' tab to the Component entity page:

```tsx
import { EntityCostInsightsContent } from '@backstage-community/plugin-cost-insights';

{
  /* ... */
}

const serviceEntityPage = (
  <EntityLayout>
    {
      /* ... */
    }
    <EntityLayout.Route path="/costs" title="Cost Insights">
      <EntityCostInsightsContent />
    </EntityLayout.Route>
  </EntityLayout>
  {
    /* ... */
  }
);
```

### Configuration

Cost Insights requires minimal configuration in order to run. Add this to `app-config.yaml`:

```yaml
costInsights:
  engineerCost: 200000
```

## Entity annotations

The plugin uses entity annotations to determine what queries to make for a given entity. The `aws.amazon.com/cost-insights-tags` annotation can be added to any catalog entity to filter costs based on [AWS cost allocation tags](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/cost-alloc-tags.html) applied to the respective AWS resources.

It is the users responsibility to ensure all AWS resources are tagged appropriately and that cost allocation tags have been enabled appropriately.

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  # ...
  annotations:
    aws.amazon.com/cost-insights-tags: component=myapp,environment=prod
spec:
  type: service
  # ...
```

This allows flexibility regarding how costs are retrieved for different entities. For example a `Group` entity might look like this:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Group
metadata:
  name: guests
  annotations:
    aws.amazon.com/cost-insights-tags: owner=guests
spec:
  type: team
```

The `aws.amazon.com/cost-insights-cost-categories` annotation can also be used to map an entity to [AWS cost categories](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/manage-cost-categories.html):

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  # ...
  annotations:
    aws.amazon.com/cost-insights-cost-categories: myapp-category
spec:
  type: service
  # ...
```

In order for costs to display you must have added the `EntityCostInsightsContent` component to the respective entity page as outlined above.

## Configuration

There are configuration options available to control the behavior of the plugin.

```yaml
aws:
  costInsights:
    costExplorer:
      accountId: '1111111111' # (Optional) Use the specified AWS account ID
      region: 'us-west-2' # (Optional) Use the specified AWS region
    cache:
      enable: true # (Optional) Control is caching is enabled, defaults to true
      defaultTtl: 1000 # (Optional) How long responses are cached for in milliseconds, defaults to 1 day
      readTime: 1000 # (Optional) Read timeout when operating with cache in milliseconds, defaults to 1000 ms
    entityGroups: # (Optional) Additional tabs to show for specific entities (see below)
      - kind: Component
        groups:
          - name: service
            type: DIMENSION
            key: SERVICE
          - name: environment
            type: TAG
            key: environment
```

### Multi-account configuration

The plugin relies on [consolidated billing](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/consolidated-billing.html) in order to support multi-account scenarios. In this setup you should use the `accountId` parameter to configure the plugin to query the management account.

```yaml
aws:
  costInsights:
    costExplorer:
      accountId: '1111111111' # Management account ID
```

Review the documentation regarding [controlling access to Cost Explorer](https://docs.aws.amazon.com/cost-management/latest/userguide/ce-access.html) and configure the Backstage authentication to AWS appropriately.

### Caching

By default the responses from the backend plugin are cached for 1 day in order to reduce costs to the user for querying the Cost Explorer API and to improve performance. The cache TTL can be configured to a different value or alternatively it can be disabled entirely if needed.

### Entity groups

By default the entity cost view will only show the "total cost" of a given entity for the specified period and matching the given tags or cost categories. The `entityGroups` configuration parameter can be used to add tabs that group data in different ways, for example breaking down the cost by AWS service or AWS account. This configuration can be provided per entity "kind" in Backstage so that it is possible to display appropriate tabs for the respective entity types.

```yaml
aws:
  costInsights:
    entityGroups:
      - kind: Component # This will apply the Component entity kind
        groups:
          - name: service # This tab will group costs by AWS service
            type: DIMENSION
            key: SERVICE
          - name: environment # This tab will group costs by an 'environment' tag on the AWS resources
            type: TAG
            key: environment
      - kind: Group # This will apply the Group entity kind
        groups:
          - name: service # This tab will group costs by AWS account
            type: DIMENSION
            key: LINKED_ACCOUNT
          - name: component # This tab will group costs by an 'component' tag on the AWS resources
            type: TAG
            key: component
```

See the [Cost Explorer documentation](https://docs.aws.amazon.com/aws-cost-management/latest/APIReference/API_GetCostAndUsage.html#awscostmanagement-GetCostAndUsage-request-GroupBy) for the available values that can be used to group cost data.

Note that grouping by AWS tags requires that the tags be already be applied to the respective AWS resources and configured as cost allocation tags. It is the users responsibility to apply tags to the AWS resources using the appropriate mechanism for their situation such as infrastructure-as-code, the AWS CLI etc.
