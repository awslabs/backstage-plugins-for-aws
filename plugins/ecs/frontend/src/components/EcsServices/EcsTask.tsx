import { KeyValuePair, Task } from '@aws-sdk/client-ecs';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import React, { useContext } from 'react';
import { formatTime, getTaskDefinition, getTaskId } from '../../shared/utils';
import IconButton from '@material-ui/core/IconButton';
import Close from '@material-ui/icons/Close';
import { StructuredMetadataTable } from '@backstage/core-components';
import { TaskContext } from '../EcsTaskProvider/ecsTaskProvider';
import { TaskStatus } from './EcsServices';
import { Box } from '@material-ui/core';
import { EcsContainer } from '../EcsMetadata/EcsContainer';

const formatTaskOverview = (task: Task) => {
  return {
    id: getTaskId(task.taskArn),
    lastStatus: <TaskStatus status={task.lastStatus} />,
    desiredStatus: <TaskStatus status={task.desiredStatus} />,
    createdAt: formatTime(task.createdAt),
  };
};

const stringOrDefault = (value: string | undefined) => (value ? value : '-');

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

export const EcsTaskDetails = ({
  toggleDrawer,
}: {
  toggleDrawer: (open: boolean) => void;
}) => {
  const { task } = useContext(TaskContext);

  if (!task) {
    return null;
  }

  return (
    <Grid
      container
      direction="column"
      justifyContent="space-between"
      alignItems="flex-start"
      spacing={2}
      style={{ position: 'relative' }}
    >
      <Grid item container direction="column" alignItems="flex-end">
        <Grid
          item
          container
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Grid item xs={11}>
            <Typography variant="h5">Task {getTaskId(task.taskArn)}</Typography>
          </Grid>
          <Grid item xs={1} style={{ textAlign: 'end' }}>
            <IconButton
              key="dismiss"
              title="Close the drawer"
              onClick={() => toggleDrawer(false)}
              color="inherit"
              size="small"
            >
              <Close />
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
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
  );
};
