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
  StatusRunning,
  StatusOK,
  StatusAborted,
  StatusError,
} from '@backstage/core-components';
import { StatusType } from '@aws-sdk/client-codebuild';

export const BuildStatus = ({ status }: { status: string | undefined }) => {
  switch (status) {
    case StatusType.IN_PROGRESS:
      return <StatusRunning>In progress</StatusRunning>;
    case StatusType.FAULT:
      return <StatusError>Fault</StatusError>;
    case StatusType.TIMED_OUT:
      return <StatusError>Timed out</StatusError>;
    case StatusType.FAILED:
      return <StatusError>Failed</StatusError>;
    case StatusType.SUCCEEDED:
      return <StatusOK>Succeeded</StatusOK>;
    case StatusType.STOPPED:
      return <StatusAborted>Stopped</StatusAborted>;
    default:
      return <StatusAborted>Unknown</StatusAborted>;
  }
};
