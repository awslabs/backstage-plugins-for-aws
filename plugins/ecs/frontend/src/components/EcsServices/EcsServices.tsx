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

import React from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  LinearProgress,
  Typography,
} from '@material-ui/core';
import {
  ContentHeader,
  ResponseErrorPanel,
  StatusAborted,
  StatusError,
  StatusOK,
  StatusPending,
  StatusRunning,
  Table,
} from '@backstage/core-components';
import { Service, Task } from '@aws-sdk/client-ecs';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
  ClusterResponse,
  ServicesResponse,
} from '@aws/amazon-ecs-plugin-for-backstage-common';
import humanizeDuration from 'humanize-duration';
import { parse } from '@aws-sdk/util-arn-parser';
import { Entity } from '@backstage/catalog-model';
import { useEcsServices } from '../../hooks';

function formatTime(date: Date | undefined): string {
  if (date) {
    const difference = new Date().getTime() - new Date(date).getTime();
    return `${humanizeDuration(difference, {
      largest: 1,
    })} ago`;
  }

  return '-';
}

function getTaskId(taskArn: string | undefined): string {
  if (taskArn) {
    const { resource } = parse(taskArn);

    const parts = resource.split('/');

    if (parts.length === 3) {
      return parts[2];
    }
  }

  return '-';
}

export const TaskStatus = ({ task }: { task: Task }) => {
  switch (task.lastStatus) {
    case 'PROVISIONING':
      return (
        <>
          <StatusPending /> Provisioning
        </>
      );
    case 'PENDING':
      return (
        <>
          <StatusPending /> Pending
        </>
      );
    case 'ACTIVATING':
      return (
        <>
          <StatusRunning /> Activating
        </>
      );
    case 'RUNNING':
      return (
        <>
          <StatusOK /> Running
        </>
      );
    case 'DEACTIVATING':
      return (
        <>
          <StatusPending /> Deactivating
        </>
      );
    case 'STOPPING':
      return (
        <>
          <StatusPending /> Stopping
        </>
      );
    case 'DEPROVISIONING':
      return (
        <>
          <StatusPending /> Deprovisioning
        </>
      );
    case 'STOPPED':
      return (
        <>
          <StatusAborted /> Stopped
        </>
      );
    case 'DELETED':
      return (
        <>
          <StatusAborted /> Deleted
        </>
      );
    default:
      return (
        <>
          <StatusAborted /> Unknown
        </>
      );
  }
};

export const TaskHealthStatus = ({ task }: { task: Task }) => {
  switch (task.healthStatus) {
    case 'HEALTHY':
      return (
        <>
          <StatusOK /> Healthy
        </>
      );
    case 'UNHEALTHY':
      return (
        <>
          <StatusError /> Unhealthy
        </>
      );
    case 'UNKNOWN':
      return (
        <>
          <StatusAborted /> Unknown
        </>
      );
    default:
      return (
        <>
          <StatusAborted /> Unknown
        </>
      );
  }
};

const generatedColumns = () => {
  return [
    {
      title: 'ID',
      field: 'taskArn',
      render: (row: Partial<Task>) => getTaskId(row.taskArn),
    },
    {
      title: 'Last Status',
      field: 'lastStatus',
      render: (row: Partial<Task>) => <TaskStatus task={row} />,
    },
    {
      title: 'Health Status',
      field: 'healthStatus',
      render: (row: Partial<Task>) => <TaskHealthStatus task={row} />,
    },
    {
      title: 'Started At',
      field: 'startedAt',
      render: (row: Partial<Task>) => formatTime(row.startedAt),
    },
  ];
};

const ClusterSummary = ({ cluster }: { cluster: ClusterResponse }) => {
  let runningTasks = 0;
  let pendingTasks = 0;

  for (const service of cluster.services) {
    runningTasks += service.service.runningCount!;
    pendingTasks += service.service.pendingCount!;
  }

  return (
    <Grid
      container
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={0}
    >
      <Grid
        xs={6}
        item
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        spacing={0}
      >
        <Grid item xs>
          <Typography variant="body1">{cluster.cluster.clusterName}</Typography>
          <Typography color="textSecondary" variant="subtitle1">
            Cluster
          </Typography>
        </Grid>
      </Grid>
      <Grid
        item
        container
        xs={3}
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-end"
        spacing={0}
      >
        <Grid item>
          <StatusOK>{runningTasks} running tasks</StatusOK>
        </Grid>
        <Grid item>
          {pendingTasks > 0 ? (
            <StatusPending>{pendingTasks} tasks pending</StatusPending>
          ) : (
            <StatusPending>No pending tasks</StatusPending>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

const ServiceSummary = ({ service }: { service: Service }) => {
  return (
    <Grid
      container
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={0}
    >
      <Grid
        xs={6}
        item
        container
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-start"
        spacing={0}
      >
        <Grid item xs>
          <Typography variant="body1">{service.serviceName}</Typography>
          <Typography color="textSecondary" variant="subtitle1">
            Service
          </Typography>
        </Grid>
      </Grid>
      <Grid
        item
        container
        xs={3}
        direction="column"
        justifyContent="flex-start"
        alignItems="flex-end"
        spacing={0}
      >
        <Grid item>
          <StatusOK>{service.runningCount} running tasks</StatusOK>
        </Grid>
        <Grid item>
          {service.pendingCount! > 0 ? (
            <StatusPending>{service.pendingCount} tasks pending</StatusPending>
          ) : (
            <StatusPending>No pending tasks</StatusPending>
          )}
        </Grid>
      </Grid>
    </Grid>
  );
};

type EcsServicesWrapperProps = {
  response: ServicesResponse;
};

const EcsServicesWrapper = ({ response }: EcsServicesWrapperProps) => {
  const columns = generatedColumns();

  return (
    <>
      <ContentHeader title="Amazon ECS Services" />
      {response.clusters.map(e => {
        return (
          <Accordion key="{e}">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ClusterSummary cluster={e} />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction="column">
                <Grid item>
                  {e.services.map(s => {
                    return (
                      <Accordion key="{s}">
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <ServiceSummary service={s.service} />
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container direction="column">
                            <Grid item>
                              <Table
                                options={{
                                  paging: true,
                                  search: false,
                                  emptyRowsWhenPaging: false,
                                }}
                                data={s.tasks}
                                columns={columns}
                              />
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </>
  );
};

type EcsServicesProps = {
  entity: Entity;
};

export const EcsServices = ({ entity }: EcsServicesProps) => {
  const { response, loading, error } = useEcsServices({ entity });

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (loading) {
    return <LinearProgress />;
  }

  return <EcsServicesWrapper response={response!} />;
};
