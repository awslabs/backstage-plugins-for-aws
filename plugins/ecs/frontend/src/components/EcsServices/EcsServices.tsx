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

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Grid,
  LinearProgress,
  Link as LinkCore,
  Paper,
  Typography,
} from '@material-ui/core';
import {
  InfoCard,
  ResponseErrorPanel,
  StatusOK,
  StatusPending,
  Table,
} from '@backstage/core-components';
import { Service, Task } from '@aws-sdk/client-ecs';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import {
  ClusterResponse,
  ServicesResponse,
} from '@aws/amazon-ecs-plugin-for-backstage-common';

import { Entity } from '@backstage/catalog-model';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { parse } from '@aws-sdk/util-arn-parser';
import { generateShortcutLink } from '@aws/aws-core-plugin-for-backstage-common';
import { useEcsServices } from '../../hooks';
import { MissingResources } from '@aws/aws-core-plugin-for-backstage-react';
import { EcsTaskDrawer } from '../EcsDrawer/EcsTaskDrawer';
import { formatTime, getTaskDefinition } from '../../util';
import { TaskStatus } from '../EcsTaskStatus';
import { TaskHealthStatus } from '../EcsTaskHealthStatus';

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

const ClusterSummary = ({
  cluster,
  ssoSubdomain,
}: {
  cluster: ClusterResponse;
  ssoSubdomain?: string;
}) => {
  let runningTasks = 0;
  let pendingTasks = 0;

  for (const service of cluster.services) {
    runningTasks += service.service.runningCount!;
    pendingTasks += service.service.pendingCount!;
  }

  const consoleUrl = getClusterConsoleUrl(
    cluster.cluster.clusterArn,
    ssoSubdomain,
  );

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
          <Typography variant="body1">
            {consoleUrl ? (
              <LinkCore
                href={consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
              >
                {cluster.cluster.clusterName}
              </LinkCore>
            ) : (
              cluster.cluster.clusterName
            )}
          </Typography>
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

function getClusterConsoleUrl(
  clusterArn: string | undefined,
  ssoSubdomain?: string,
): string | undefined {
  if (!clusterArn) return undefined;

  let arn;
  try {
    arn = parse(clusterArn);
  } catch (error) {
    return undefined;
  }

  const { region, accountId, resource } = arn;
  const parts = resource.split('/');
  if (parts.length !== 2) return undefined;

  const [, clusterName] = parts;
  const projectUrl = `https://${region}.console.aws.amazon.com/ecs/v2/clusters/${clusterName}?region=${region}`;

  if (ssoSubdomain) {
    return generateShortcutLink(ssoSubdomain, accountId, projectUrl);
  }
  return projectUrl;
}

function getServiceConsoleUrl(
  service: Service,
  ssoSubdomain?: string,
): string | undefined {
  if (!service.serviceArn) return undefined;

  let arn;
  try {
    arn = parse(service.serviceArn);
  } catch (error) {
    return undefined;
  }

  const { region, accountId, resource } = arn;
  const parts = resource.split('/');
  if (parts.length !== 3) return undefined;

  const [, clusterName, serviceName] = parts;
  const projectUrl = `https://${region}.console.aws.amazon.com/ecs/v2/clusters/${clusterName}/services/${serviceName}?region=${region}`;

  if (ssoSubdomain) {
    return generateShortcutLink(ssoSubdomain, accountId, projectUrl);
  }
  return projectUrl;
}

const ServiceSummary = ({
  service,
  ssoSubdomain,
}: {
  service: Service;
  ssoSubdomain?: string;
}) => {
  const consoleUrl = getServiceConsoleUrl(service, ssoSubdomain);

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
          <Typography variant="body1">
            {consoleUrl ? (
              <LinkCore
                href={consoleUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
              >
                {service.serviceName}
              </LinkCore>
            ) : (
              service.serviceName
            )}
          </Typography>
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
  ssoSubdomain?: string;
};

const EcsServicesContent = ({
  response,
  ssoSubdomain,
}: EcsServicesContentProps) => {
  const columns = generatedColumns();

  return (
    <>
      {response.clusters.map(e => {
        return (
          <Accordion key="{e}" elevation={0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <ClusterSummary cluster={e} ssoSubdomain={ssoSubdomain} />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container direction="column">
                <Grid item>
                  {e.services.map(s => {
                    return (
                      <Accordion key="{s}" elevation={0}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <ServiceSummary
                            service={s.service}
                            ssoSubdomain={ssoSubdomain}
                          />
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

const EcsServicesWrapper = ({
  response,
  ssoSubdomain,
}: EcsServicesContentProps) => {
  const hasClusters = response.clusters.length > 0;

  return (
    <>
      {hasClusters ? (
        <InfoCard title="Amazon ECS Services">
          <EcsServicesContent response={response} ssoSubdomain={ssoSubdomain} />
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
  const configApi = useApi(configApiRef);
  const ssoSubdomain = configApi.getOptionalString('aws.sso.subdomain');
  const { response, loading, error } = useEcsServices({ entity });

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (loading) {
    return <LinearProgress />;
  }

  return (
    <EcsServicesWrapper response={response!} ssoSubdomain={ssoSubdomain} />
  );
};
