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

import { Container } from '@aws-sdk/client-ecs';
import {
  OverflowTooltip,
  StructuredMetadataTable,
} from '@backstage/core-components';
import React from 'react';
import { TaskHealthStatus, TaskStatus } from '.';
import { Box } from '@material-ui/core';
import { stringOrDefault } from '../../util';

const overflowMaxWidth = '250px';

const formatContainer = (container: Container) => {
  return {
    ID: stringOrDefault(container.containerArn?.split('/')[3]),
    status: <TaskStatus status={container.lastStatus} />,
    healthStatus: <TaskHealthStatus status={container.healthStatus} />,
    CPU: stringOrDefault(container.cpu),
    memory: stringOrDefault(container.memoryReservation),
    imageURI: (
      <Box maxWidth={overflowMaxWidth}>
        <OverflowTooltip text={stringOrDefault(container.image)} />
      </Box>
    ),
    imageDigest: (
      <Box maxWidth={overflowMaxWidth}>
        <OverflowTooltip text={stringOrDefault(container.imageDigest)} />
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
