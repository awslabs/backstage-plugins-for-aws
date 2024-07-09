import { Container } from '@aws-sdk/client-ecs';
import {
  OverflowTooltip,
  StructuredMetadataTable,
} from '@backstage/core-components';
import React from 'react';
import { TaskHealthStatus, TaskStatus } from '../EcsServices';
import { Box } from '@material-ui/core';

const overflowMaxWidth = '250px';

const formatContainer = (container: Container) => {
  return {
    ID: container.containerArn?.split('/')[3] || '-',
    status: <TaskStatus status={container.lastStatus} />,
    healthStatus: <TaskHealthStatus status={container.healthStatus} />,
    CPU: container.cpu ?? '-',
    memory: container.memoryReservation ?? '-',
    imageURI: (
      <Box maxWidth={overflowMaxWidth}>
        <OverflowTooltip text={container.image} />
      </Box>
    ),
    imageDigest: (
      <Box maxWidth={overflowMaxWidth}>
        <OverflowTooltip text={container.imageDigest} />
      </Box>
    ),
  };
};

type EcsContainerProps = {
  container: Container;
};

export const EcsContainer = ({ container }: EcsContainerProps) => {
  return <StructuredMetadataTable metadata={formatContainer(container)} />;
};
