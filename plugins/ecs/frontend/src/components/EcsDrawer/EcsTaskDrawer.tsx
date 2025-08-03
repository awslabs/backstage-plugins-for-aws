/**
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { KeyValuePair, Task } from '@aws-sdk/client-ecs';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import {
  formatTime,
  getTaskDefinition,
  getTaskId,
  stringOrDefault,
} from '../../util';
import { StructuredMetadataTable } from '@backstage/core-components';
import { Box } from '@material-ui/core';
import { EcsContainer } from '../EcsServices/EcsContainer';
import { EcsDrawer } from './EcsDrawer';
import { TaskStatus } from '../EcsTaskStatus';

const formatTaskOverview = (task: Task) => {
  return {
    ID: getTaskId(task.taskArn),
    lastStatus: <TaskStatus status={task.lastStatus} />,
    desiredStatus: <TaskStatus status={task.desiredStatus} />,
    createdAt: formatTime(task.createdAt),
  };
};

const formatTaskConfiguration = (task: Task) => {
  let attachmentDetails: KeyValuePair[] | undefined;

  if (task.attachments) {
    if (task.attachments.length > 0) {
      attachmentDetails = task.attachments[0].details;
    }
  }

  return {
    CPU: stringOrDefault(task.cpu),
    memory: stringOrDefault(task.memory),
    platformVersion: task.platformVersion,
    capacityProvider: stringOrDefault(task.capacityProviderName),
    launchType: stringOrDefault(task.launchType),
    containerInstanceID: stringOrDefault(
      task.containerInstanceArn?.split('/')[1],
    ),
    taskDefinition: stringOrDefault(getTaskDefinition(task.taskDefinitionArn)),
    taskGroup: stringOrDefault(task.group),
    ENI_ID: stringOrDefault(
      attachmentDetails?.find(e => e.name === 'networkInterfaceId')?.value,
    ),
    subnetID: stringOrDefault(
      attachmentDetails?.find(e => e.name === 'subnetId')?.value,
    ),
    privateIPAddress: stringOrDefault(
      attachmentDetails?.find(e => e.name === 'privateIPv4Address')?.value,
    ),
  };
};

export const EcsTaskDrawer = ({ task }: { task: Task }) => {
  if (!task) {
    return null;
  }

  const taskId = getTaskId(task.taskArn);

  return (
    <EcsDrawer label={<div>{taskId}</div>} title={`Task ID ${taskId}`}>
      <Grid
        container
        direction="column"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
        style={{ position: 'relative' }}
      >
        <Grid item xs={12} spacing={0}>
          <Typography>
            <Box component="span" fontWeight="fontWeightMedium">
              Overview
            </Box>
          </Typography>
        </Grid>
        <Grid container item xs={12} spacing={0}>
          <StructuredMetadataTable metadata={formatTaskOverview(task)} />
        </Grid>
        <Grid item xs={12} spacing={0}>
          <Typography>
            <Box component="span" fontWeight="fontWeightMedium">
              Configuration
            </Box>
          </Typography>
        </Grid>
        <Grid container item xs={12} spacing={0}>
          <StructuredMetadataTable metadata={formatTaskConfiguration(task)} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="h5">Containers</Typography>
        </Grid>
        {task.containers?.map(container => (
          <>
            <Grid item xs={12} spacing={0}>
              <Typography>
                <Box component="span" fontWeight="fontWeightMedium">
                  {container.name}
                </Box>
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <EcsContainer container={container} />
            </Grid>
          </>
        ))}
      </Grid>
    </EcsDrawer>
  );
};
