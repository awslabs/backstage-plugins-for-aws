/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Entity } from '@backstage/catalog-model';
import {
  LaunchType,
  AssignPublicIp,
  DeploymentRolloutState,
  SchedulingStrategy,
  DeploymentControllerType,
  PropagateTags,
  Connectivity,
  HealthStatus,
} from '@aws-sdk/client-ecs';
import {
  AWS_ECS_SERVICE_ARN_ANNOTATION,
  AWS_ECS_SERVICE_TAGS_ANNOTATION,
} from '../types';

export function mockEcsCluster(cluster: string) {
  return {
    activeServicesCount: 1,
    capacityProviders: ['FARGATE'],
    clusterArn: `arn:aws:ecs:us-west-2:1234567890:cluster/${cluster}`,
    clusterName: cluster,
    defaultCapacityProviderStrategy: [
      {
        base: 0,
        capacityProvider: 'FARGATE',
        weight: 100,
      },
    ],
    pendingTasksCount: 0,
    registeredContainerInstancesCount: 0,
    runningTasksCount: 1,
    settings: [],
    statistics: [],
    status: 'ACTIVE',
    tags: [],
  };
}

export function mockEcsService(
  service: string,
  cluster: string,
  desiredCount: number,
  runningCount: number,
  pendingCount: number,
) {
  return {
    clusterArn: `arn:aws:ecs:us-west-2:1234567890:cluster/${cluster}`,
    createdAt: new Date(),
    createdBy: 'arn:aws:iam::1234567890:role/SomeRole',
    deploymentConfiguration: {
      deploymentCircuitBreaker: {
        enable: false,
        rollback: false,
      },
      maximumPercent: 200,
      minimumHealthyPercent: 66,
    },
    deploymentController: {
      type: DeploymentControllerType.ECS,
    },
    deployments: [
      {
        createdAt: new Date(),
        desiredCount: 1,
        failedTasks: 0,
        id: 'ecs-svc/8485161018856190923',
        launchType: LaunchType.FARGATE,
        networkConfiguration: {
          awsvpcConfiguration: {
            assignPublicIp: AssignPublicIp.DISABLED,
            securityGroups: ['sg-0b5a37d8956ed8b8b'],
            subnets: [
              'subnet-074fe57bdcc82b24e',
              'subnet-045459243dda22d1b',
              'subnet-0b9b95853df2d6157',
            ],
          },
        },
        pendingCount: 0,
        platformFamily: 'Linux',
        platformVersion: '1.4.0',
        rolloutState: DeploymentRolloutState.COMPLETED,
        rolloutStateReason:
          'ECS deployment ecs-svc/8485161018856190923 completed.',
        runningCount: 1,
        status: 'PRIMARY',
        taskDefinition:
          'arn:aws:ecs:us-west-2:1234567890:task-definition/service1:2',
        updatedAt: new Date(),
      },
    ],
    desiredCount,
    enableECSManagedTags: true,
    enableExecuteCommand: true,
    events: [
      {
        createdAt: new Date(),
        id: 'a1ef07b3-10b4-4947-b721-e617b00f2509',
        message: '(service service1) has reached a steady state.',
      },
    ],
    healthCheckGracePeriodSeconds: 0,
    launchType: LaunchType.FARGATE,
    loadBalancers: [
      {
        containerName: 'application',
        containerPort: 8080,
        targetGroupArn:
          'arn:aws:elasticloadbalancing:us-west-2:1234567890:targetgroup/tg-name/c3d499a1c7c719c5',
      },
    ],
    networkConfiguration: {
      awsvpcConfiguration: {
        assignPublicIp: AssignPublicIp.DISABLED,
        securityGroups: ['sg-0b5a37d8956ed8b8b'],
        subnets: [
          'subnet-074fe57bdcc82b24e',
          'subnet-045459243dda22d1b',
          'subnet-0b9b95853df2d6157',
        ],
      },
    },
    pendingCount,
    placementConstraints: [],
    placementStrategy: [],
    platformFamily: 'Linux',
    platformVersion: 'LATEST',
    propagateTags: PropagateTags.SERVICE,
    roleArn:
      'arn:aws:iam::1234567890:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS',
    runningCount,
    schedulingStrategy: SchedulingStrategy.REPLICA,
    serviceArn: `arn:aws:ecs:us-west-2:1234567890:service/${cluster}/${service}`,
    serviceName: service,
    serviceRegistries: [],
    status: 'ACTIVE',
    taskDefinition: 'arn:aws:ecs:us-west-2:1234567890:task-definition/task:2',
  };
}

export function mockEcsTask(service: string, cluster: string) {
  return {
    attachments: [
      {
        details: [
          {
            name: 'subnetId',
            value: 'subnet-045459243dda22d1b',
          },
          {
            name: 'networkInterfaceId',
            value: 'eni-07deb783d53d7728b',
          },
          {
            name: 'macAddress',
            value: '0a:46:53:40:19:83',
          },
          {
            name: 'privateDnsName',
            value: 'ip-10-0-35-183.us-west-2.compute.internal',
          },
          {
            name: 'privateIPv4Address',
            value: '10.0.35.183',
          },
        ],
        id: '2e106e1b-edb6-4ef6-a5df-8edb17adada6',
        status: 'ATTACHED',
        type: 'ElasticNetworkInterface',
      },
    ],
    attributes: [
      {
        name: 'ecs.cpu-architecture',
        value: 'x86_64',
      },
    ],
    availabilityZone: 'us-west-2c',
    clusterArn: `arn:aws:ecs:us-west-2:1234567890:cluster/${cluster}`,
    connectivity: Connectivity.CONNECTED,
    connectivityAt: new Date(),
    containers: [
      {
        containerArn: `arn:aws:ecs:us-west-2:1234567890:container/${cluster}/b11f3040982e4f7ab2412d9aa0a2645c/5454846d-2159-4842-9bb5-c15db1a1a18c`,
        cpu: '0',
        healthStatus: HealthStatus.UNKNOWN,
        image: '1234567890.dkr.ecr.us-west-2.amazonaws.com/some-image:0d1a26f',
        imageDigest:
          'sha256:768b38622170720b5e12d7a5919a750cfed087679d07f086b840c677a19b57d1',
        lastStatus: 'RUNNING',
        name: 'application',
        networkBindings: [],
        networkInterfaces: [
          {
            attachmentId: '2e106e1b-edb6-4ef6-a5df-8edb17adada6',
            privateIpv4Address: '10.0.35.183',
          },
        ],
        runtimeId: 'b11f3040982e4f7ab2412d9aa0a2645c-524788293',
        taskArn: `arn:aws:ecs:us-west-2:1234567890:task/${cluster}/b11f3040982e4f7ab2412d9aa0a2645c`,
      },
    ],
    cpu: '1024',
    createdAt: new Date(),
    desiredStatus: 'RUNNING',
    enableExecuteCommand: true,
    ephemeralStorage: {
      sizeInGiB: 20,
    },
    group: `service:${service}`,
    healthStatus: HealthStatus.HEALTHY,
    lastStatus: 'RUNNING',
    launchType: LaunchType.FARGATE,
    memory: '4096',
    overrides: {
      containerOverrides: [
        {
          name: 'application',
        },
      ],
      inferenceAcceleratorOverrides: [],
    },
    platformFamily: 'Linux',
    platformVersion: '1.4.0',
    pullStartedAt: new Date(),
    pullStoppedAt: new Date(),
    startedAt: new Date(),
    startedBy: 'ecs-svc/8485161018856190923',
    tags: [],
    taskArn: `arn:aws:ecs:us-west-2:1234567890:task/${cluster}/b11f3040982e4f7ab2412d9aa0a2645c`,
    taskDefinitionArn:
      'arn:aws:ecs:us-west-2:1234567890:task-definition/task:2',
    version: 4,
  };
}

export const mockEntityWithTags: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backstage',
    description: 'backstage.io',
    annotations: {
      [AWS_ECS_SERVICE_TAGS_ANNOTATION]: 'component=test',
    },
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};

export const mockEntityWithArn: Entity = {
  apiVersion: 'backstage.io/v1alpha1',
  kind: 'Component',
  metadata: {
    name: 'backstage',
    description: 'backstage.io',
    annotations: {
      [AWS_ECS_SERVICE_ARN_ANNOTATION]:
        'arn:aws:ecs:us-west-2:1234567890:service/cluster/service',
    },
  },
  spec: {
    lifecycle: 'production',
    type: 'service',
    owner: 'user:guest',
  },
};
