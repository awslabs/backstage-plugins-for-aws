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

import {
  StatusAborted,
  StatusOK,
  StatusPending,
  StatusRunning,
} from '@backstage/core-components';

export const TaskStatus = ({ status }: { status?: string }) => {
  switch (status) {
    case 'PROVISIONING':
      return <StatusPending>Provisioning</StatusPending>;
    case 'PENDING':
      return <StatusPending>Pending</StatusPending>;
    case 'ACTIVATING':
      return <StatusRunning>Activating</StatusRunning>;
    case 'RUNNING':
      return <StatusOK>Running</StatusOK>;
    case 'DEACTIVATING':
      return <StatusPending>Deactivating</StatusPending>;
    case 'STOPPING':
      return <StatusPending>Stopping</StatusPending>;
    case 'DEPROVISIONING':
      return <StatusPending>Deprovisioning</StatusPending>;
    case 'STOPPED':
      return <StatusAborted>Stopped</StatusAborted>;
    case 'DELETED':
      return <StatusAborted>Deleted</StatusAborted>;
    default:
      return <StatusAborted>Unknown</StatusAborted>;
  }
};
