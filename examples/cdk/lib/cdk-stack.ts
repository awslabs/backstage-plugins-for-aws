import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as s3assets from 'aws-cdk-lib/aws-s3-assets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import { Construct } from 'constructs';
import * as path from 'path';

export class BackstageSampleStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const ecrRepo = new ecr.Repository(this, 'EcrRepo', {
      emptyOnDelete: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      repositoryName: 'example-website-images',
    });
    cdk.Tags.of(ecrRepo).add('component', 'example-website');

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

    // Create two ECS clusters: staging and production
    const stagingCluster = new ecs.Cluster(this, 'StagingCluster', {
      vpc: vpc,
      clusterName: 'staging-cluster',
    });

    const prodCluster = new ecs.Cluster(this, 'ProdCluster', {
      vpc: vpc,
      clusterName: 'prod-cluster',
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

    // Create Fargate services in both clusters
    const stagingService =
      new ecs_patterns.ApplicationLoadBalancedFargateService(
        this,
        'StagingService',
        {
          serviceName: 'staging-website-service',
          cluster: stagingCluster,
          taskDefinition: taskDef,
          publicLoadBalancer: true,
          desiredCount: 1,
          listenerPort: 80,
          assignPublicIp: true,
        },
      );

    const prodService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      'ProdService',
      {
        serviceName: 'prod-website-service',
        cluster: prodCluster,
        taskDefinition: taskDef,
        publicLoadBalancer: true,
        desiredCount: 1,
        listenerPort: 80,
        assignPublicIp: true,
      },
    );

    cdk.Tags.of(stagingService).add('component', 'example-website');
    cdk.Tags.of(stagingService).add('environment', 'staging');

    cdk.Tags.of(prodService).add('component', 'example-website');
    cdk.Tags.of(prodService).add('environment', 'prod');

    const project = new codebuild.PipelineProject(this, 'Build', {
      projectName: 'example-website-build',
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
      environmentVariables: {
        cluster_name: {
          value: `${stagingCluster.clusterName}`,
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

    const bucketName = `example-website-bucket-${this.account}-${this.region}`;

    const bucket = new s3.Bucket(this, 'SourceBucket', {
      bucketName: bucketName,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const bucketDeployment = new s3deploy.BucketDeployment(this, 'CopySource', {
      sources: [s3deploy.Source.asset(path.join(__dirname, 'website'))],
      destinationBucket: bucket,
      extract: false,
      prune: false,
    });

    const sourceAction = new codepipeline_actions.S3SourceAction({
      actionName: 'Source',
      bucket: bucket,
      bucketKey: cdk.Fn.select(0, bucketDeployment.objectKeys),
      output: sourceOutput,
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: 'codebuild',
      project: project,
      input: sourceOutput,
      outputs: [buildOutput],
    });

    // Deploy to staging service
    const deployToStagingAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployToStaging',
      service: stagingService.service,
      imageFile: new codepipeline.ArtifactPath(
        buildOutput,
        `imagedefinitions.json`,
      ),
    });

    // Deploy to production service
    const deployToProdAction = new codepipeline_actions.EcsDeployAction({
      actionName: 'DeployToProd',
      service: prodService.service,
      imageFile: new codepipeline.ArtifactPath(
        buildOutput,
        `imagedefinitions.json`,
      ),
    });

    const pipeline = new codepipeline.Pipeline(this, 'Pipeline', {
      pipelineName: 'example-website-pipeline',
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
          actions: [deployToStagingAction, deployToProdAction],
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
        resources: [
          `${stagingCluster.clusterArn}`,
          `${prodCluster.clusterArn}`,
        ],
      }),
    );
  }
}
