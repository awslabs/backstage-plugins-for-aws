# Locating resources

Several of the plugins in this project need to find AWS resources to perform their function, for example the ECS plugin needs to find all of the ECS services for a given Backstage entity. Although easy in simpler AWS setups, this becomes more complex as the number of AWS accounts in an organization increases and resources are distributed across them. We want to be able to find AWS resources:

- Quickly: This affects page load time and end-user experience
- Efficiently: Using appropriate AWS APIs to reduce overall API call volume where possible

The mechanism documented here is designed to provide this functionality.

## Resource locators

There are three resource locator mechanisms available:

| Name                 | Description                                         |
| -------------------- | --------------------------------------------------- |
| `resourceTaggingApi` | (Default) Using the AWS Resource Groups Tagging API |
| `resourceExplorer`   | Using the AWS Resource Explorer API                 |
| `awsConfig`          | Using the AWS Config service                        |

By default plugins will use the [AWS Resource Groups Tagging API](https://docs.aws.amazon.com/resourcegroupstagging/latest/APIReference/overview.html) to locate resource in the same AWS account that Backstage is running. This requires no configuration on the part of the Backstage administrator and will work for simpler setups, for example within a single account.

## What resource locator should I use?

The following are general guidelines, please raise a GitHub issue to discuss specific use-cases:

- Users with a smaller number of AWS accounts can use the `resource-tagging-api` locator. It is your judgement at what point this becomes difficult to maintain.
- If your organization already has AWS Config enabled and an [aggregator](https://docs.aws.amazon.com/config/latest/developerguide/aggregate-data.html) configured then the `aws-config` locator is the next logical option. Before choosing this option please review the [AWS Config pricing structure](https://aws.amazon.com/config/pricing/).
- Otherwise you should use the `resource-explorer` locator.

## Configuring resource locators

The section details how to setup and configure the various resource locator mechanisms.

### Resource Tagging API

This resource locator is used by default and does not require any configuration. By default it will query the API using the AWS account based on the IAM credentials provided to Backstage and the default region provided (for example with `AWS_REGION`/`AWS_DEFAULT_REGION`).

If you wish to extend this to multiple AWS regions/accounts you can provide additional configuration:

```yaml
aws:
  locator:
    resourceTaggingApi:
      # Add each AWS account you wish to search
      accounts:
        - '1111111111'
        - '2222222222'
      # Add each AWS region you wish to search
      regions:
        - us-east-1
        - eu-west-2
```

Note if you provide the `accounts` or `regions` values the default account and region are no longer used and should also be listed if you want to retain the behavior of locating resources in that account and region.

Backstage will attempt to assume an IAM role in each account using the [default AWS credential mechanism](https://github.com/backstage/backstage/tree/master/packages/integration-aws-node). This role must have the following IAM permissions added:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["tag:GetResources"],
      "Resource": "*"
    }
  ]
}
```

### Resource Explorer API

This resource locator uses the [AWS Resource Explorer API](https://docs.aws.amazon.com/resource-explorer/latest/apireference/Welcome.html) which is a resource search and discovery service.

To use this resource locator across multiple AWS accounts you must [turn on multi-account search](https://docs.aws.amazon.com/resource-explorer/latest/userguide/manage-service-multi-account.html) in the Resource Explorer service.

```yaml
aws:
  locator:
    type: resourceExplorer
    resourceExplorer:
      # (Optional) Resource Explorer API calls will be made to this AWS account
      account: 1111111111
      # (Optional) Resource Explorer API calls will be made to this AWS region
      region: us-west-2
      # (Optional) Resource Explorer API view that should be queried
      viewArn: <arn>
```

Please review the [quotas for the Resource Explorer service](https://docs.aws.amazon.com/resource-explorer/latest/userguide/quotas.html).

### AWS Config

TODO
