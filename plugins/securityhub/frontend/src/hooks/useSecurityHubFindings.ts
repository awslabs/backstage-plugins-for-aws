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

import { useAsyncRetry } from 'react-use';
import { useApi } from '@backstage/core-plugin-api';
import { awsSecurityHubApiRef } from '../api';
import type { Entity } from '@backstage/catalog-model';
import { getCompoundEntityRef } from '@backstage/catalog-model';
import { AwsSecurityFinding } from '@aws-sdk/client-securityhub';

export function useSecurityHubFindings({ entity }: { entity: Entity }) {
  const awsSecurityHubApi = useApi(awsSecurityHubApiRef);

  const {
    loading,
    value: response,
    error,
    retry,
  } = useAsyncRetry<AwsSecurityFinding[] | undefined>(async () => {
    return await awsSecurityHubApi.getFindingsByEntity({
      entity: getCompoundEntityRef(entity),
    });
  }, []);

  return { loading, response, error, retry } as const;
}
