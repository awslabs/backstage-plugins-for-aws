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
  Paper,
  Typography,
} from '@material-ui/core';
import {
  InfoCard,
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

import { Entity } from '@backstage/catalog-model';
import { useEcsServices } from '../../hooks';
import { MissingResources } from '@aws/aws-core-plugin-for-backstage-react';
import { EcsTaskDrawer } from '../EcsDrawer/EcsTaskDrawer';
import { formatTime, getTaskDefinition } from '../../util';

export const TaskStatus = ({ status }: { status?: string }) => {
  switch (status) {
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

export const TaskHealthStatus = ({ status }: { status?: string }) => {
  switch (status) {
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
      field: 'id',
      width: '100',
      render: (row: Partial<Task>) => <EcsTaskDrawer task={row} />,
    },
    {
      title: 'Task Definition',
      field: 'taskDefinition',
      width: '100',
      render: (row: Partial<Task>) => getTaskDefinition(row.taskDefinitionArn),
    },
    {
      title: 'Last Status',
      field: 'lastStatus',
      width: '100',
      render: (row: Partial<Task>) => <TaskStatus status={row.lastStatus} />,
    },
    {
      title: 'Health Status',
      field: 'healthStatus',
      width: '100',
      render: (row: Partial<Task>) => (
        <TaskHealthStatus status={row.healthStatus} />
      ),
    },
    {
      title: 'Started At',
      field: 'startedAt',
      width: '100',
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
        alignItems="flex-start"
        spacing={0}
      >
        <Grid item>
          {runningTasks > 0 ? (
            <StatusOK>{runningTasks} running tasks</StatusOK>
          ) : (
            <StatusOK>No running tasks</StatusOK>
          )}
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
        <Grid item xs style={{ width: '100%' }}>
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
        alignItems="flex-start"
        spacing={0}
      >
        <Grid item>
          {service.runningCount! > 0 ? (
            <StatusOK>{service.runningCount} running tasks</StatusOK>
          ) : (
            <StatusOK>No running tasks</StatusOK>
          )}
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

type EcsServicesContentProps = {
  response: ServicesResponse;
};

const EcsServicesContent = ({ response }: EcsServicesContentProps) => {
  const columns = generatedColumns();

  return (
    <>
      {response.clusters.map(e => {
        return (
          <Accordion key="{e}" elevation={0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ClusterSummary cluster={e} />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction="column">
                <Grid item>
                  {e.services.map(s => {
                    return (
                      <Accordion key="{s}" elevation={0}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <ServiceSummary service={s.service} />
                        </AccordionSummary>
                        <AccordionDetails>
                          <Grid container direction="column">
                            <Grid item>
                              <Table
                                options={{
                                  paging: true,
                                  emptyRowsWhenPaging: false,
                                  toolbar: false,
                                }}
                                data={s.tasks}
                                columns={columns}
                                components={{
                                  Container: props => (
                                    <Paper {...props} elevation={0} />
                                  ),
                                }}
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

const EcsServicesWrapper = ({ response }: EcsServicesContentProps) => {
  const hasClusters = response.clusters.length > 0;

  return (
    <>
      {hasClusters ? (
        <InfoCard title="Amazon ECS Services">
          <EcsServicesContent response={response} />
        </InfoCard>
      ) : (
        <MissingResources />
      )}
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
