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
  StatusError,
} from '@backstage/core-components';

export const TaskHealthStatus = ({ status }: { status?: string }) => {
  switch (status) {
    case 'HEALTHY':
      return <StatusOK>Healthy</StatusOK>;
    case 'UNHEALTHY':
      return <StatusError>Unhealthy</StatusError>;
    case 'UNKNOWN':
      return <StatusAborted>Unknown</StatusAborted>;
    default:
      return <StatusAborted>Unknown</StatusAborted>;
  }
};
