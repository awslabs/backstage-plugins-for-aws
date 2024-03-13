# AWS plugins for Backstage

Welcome to the AWS plugins for Backstage project! The goal of this project is to provide granular, composable plugins for [backstage.io](https://backstage.io) that integrate to various AWS services, as well as providing utility functions to make it easier to create custom plugins.

## Usage

To understand how to start using these plugins in your Backstage environment please see the [Getting Started](./docs/getting-started.md) guide.

For detailed documentation regarding each plugin please see below:

| Plugin           | Documentation                            | Description                                                                       |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| Core             | [Link](./plugins/core/README.md)         | Core utilities used by other plugins on unrelated to specific AWS services.       |
| Amazon ECS       | [Link](./plugins/ecs/README.md)          | Shows information related to Amazon Elastic Container Service services and tasks. |
| AWS CodePipeline | [Link](./plugins/codepipeline/README.md) | Show the status of AWS CodePipeline pipelines on the entity page.                 |
| AWS CodeBuild    | [Link](./plugins/codebuild/README.md)    | Show the status of AWS CodeBuild projects on the entity page.                     |

## Security

For information about contributing and reporting security issues, see [CONTRIBUTING](CONTRIBUTING.md).

## License

This project is licensed under the Apache-2.0 License.
