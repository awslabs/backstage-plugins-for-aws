import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';

export class BackstageSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ecrRepo = new ecr.Repository(this, 'EcrRepo', {
      emptyOnDelete: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      repositoryName: 'example-website-images',
    });

    const vpc = new ec2.Vpc(this, 'Vpc', {
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      natGateways: 1,
      maxAzs: 3,
    });

    const cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: vpc,
      clusterName: 'example-website-cluster',
    });

    const logging = new ecs.AwsLogDriver({
      streamPrefix: 'ecs-logs',
    });

    const taskrole = new iam.Role(this, 'EcsTaskRole', {
      roleName: 'example-website-task',
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    const executionRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ['*'],
      actions: [
        'ecr:getauthorizationtoken',
        'ecr:batchchecklayeravailability',
        'ecr:getdownloadurlforlayer',
        'ecr:batchgetimage',
        'logs:createlogstream',
        'logs:putlogevents',
      ],
    });

    const taskDef = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      taskRole: taskrole,
    });

    taskDef.addToExecutionRolePolicy(executionRolePolicy);

    const baseImage = 'public.ecr.aws/nginx/nginx:1.25';
    const container = taskDef.addContainer('app', {
      image: ecs.ContainerImage.fromRegistry(baseImage),
      memoryLimitMiB: 256,
      cpu: 256,
      logging,
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    const fargateService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        'ecs-service',
        {
          serviceName: 'example-website-service',
          cluster: cluster,
          taskDefinition: taskDef,
          publicLoadBalancer: true,
          desiredCount: 1,
          listenerPort: 80,
          assignPublicIp: true,
        },
      );
    cdk.Tags.of(fargateService).add('component', 'example-website');

    const repo = new codecommit.Repository(this, 'Repo', {
      repositoryName: 'example-website-repository',
    });

    const project = new codebuild.PipelineProject(this, 'Build', {
      projectName: 'example-website-pipeline',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
      environmentVariables: {
        cluster_name: {
          value: `${cluster.clusterName}`,
        },
        ecr_repo_uri: {
          value: `${ecrRepo.repositoryUri}`,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'env',
              'export tag=latest',
              "export account_id=$(echo $CODEBUILD_BUILD_ARN | cut -f5 -d ':')",
            ],
          },
          build: {
            commands: [
              'docker pull public.ecr.aws/nginx/nginx:1.25',
              `docker tag public.ecr.aws/nginx/nginx:1.25 $ecr_repo_uri:$tag`,
              'aws ecr get-login-password | docker login --username AWS --password-stdin $account_id.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
              'docker push $ecr_repo_uri:$tag',
            ],
          },
          post_build: {
            commands: [
              'echo "in post-build stage"',
              'printf \'[{"name":"app","imageUri":"%s"}]\' $ecr_repo_uri:$tag > imagedefinitions.json',
              'pwd; ls -al; cat imagedefinitions.json',
            ],
          },
        },
        artifacts: {
          files: ['imagedefinitions.json'],
        },
      }),
    });
    cdk.Tags.of(project).add('component', 'example-website');

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();
    const sourceAction = new codepipeline_actions.CodeCommitSourceAction({
      actionName: 'Source',
      repository: repo,
      output: sourceOutput,
      trigger: codepipeline_actions.CodeCommitTrigger.POLL,
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'codebuild',
      project: project,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'deployAction',
      service: fargateService.service,
      imageFile: new codepipeline.ArtifactPath(
        buildOutput,
        `imagedefinitions.json`,
      ),
    });

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      stages: [
        {
          stageName: 'source',
          actions: [sourceAction],
        },
        {
          stageName: 'build',
          actions: [buildAction],
        },
        {
          stageName: 'deploy-to-ecs',
          actions: [deployAction],
        },
      ],
    });
    cdk.Tags.of(pipeline).add('component', 'example-website');

    ecrRepo.grantPullPush(project.role!);
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ecs:describecluster',
          'ecr:getauthorizationtoken',
          'ecr:batchchecklayeravailability',
          'ecr:batchgetimage',
          'ecr:getdownloadurlforlayer',
        ],
        resources: [`${cluster.clusterArn}`],
      }),
    );
  }
}
