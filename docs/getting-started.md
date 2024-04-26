# Getting started

This document aims to get you started with consuming the Backstage plugins in this project.

## Prerequisites

These instructions assume you already have a working Backstage application that you can install the plugins in. If this isn't the case, refer to the Backstage [Getting Started](https://backstage.io/docs/getting-started/) documentation.

## AWS credentials

Most of the plugins in this project require AWS credentials in order to access AWS APIs. By default, the plugins rely on the [default behavior of the AWS SDK for Javascript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/modules/_aws_sdk_credential_provider_node.html) to determine the AWS credentials that it uses to authenticate an identity to use with AWS APIs.

The plugins that runs in your Backstage app search for credentials in the following order:

1. Environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)
1. SSO credentials from the token cache
1. Web identity token credentials (including running in an Amazon EKS cluster using IAM roles for service accounts)
1. Shared credentials and config ini files (`~/.aws/credentials`, `~/.aws/config`)
1. Amazon Elastic Container Service (Amazon ECS) task metadata service
1. Amazon Elastic Compute Cloud (Amazon EC2) instance metadata service

We recommend that you don't hard-code long lived AWS credentials in your production Backstage application configuration. Hard-coding credentials is risky and might expose your access key ID and secret access key.

Instead, we recommend that you use short lived AWS credentials for your production Backstage application by deploying it to Amazon ECS, Amazon Elastic Kubernetes Service (Amazon EKS), or Amazon EC2. For more information about deploying Backstage to Amazon EKS using a Helm chart or to Amazon ECS on AWS Fargate using the AWS Cloud Development Kit (CDK), see [Deploying Backstage](https://backstage.io/docs/deployment/) in the Backstage documentation.

## IAM permissions

Each plugin requires different IAM permissions in order to function, these requirements are documented with each plugin.

The minimum recommended permissions for the Backstage IAM role are:

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

## Installing the plugins

You've now covered the minimum pre-requisites to start using the plugins. Proceed to the documentation for the relevant plugin or follow the [tutorial](./tutorial.md) for a step-by-step guide to installing your first plugin.

## Cross-account usage

When using the tag-based annotations to reference AWS resources for entities by default the plugins are configured to use the AWS Resource Groups Tagging API to lookup AWS resources only in the same account as the AWS IAM credentials Backstage is using. If you wish to locate AWS resources across multiple AWS accounts please see the [Locating Resources](./locating-resources.md) documentation.
