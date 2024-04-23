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
import { amazonEcsApiRef } from '../api';
import { ServicesResponse } from '@aws/amazon-ecs-plugin-for-backstage-common';
import type { Entity } from '@backstage/catalog-model';
import { getCompoundEntityRef } from '@backstage/catalog-model';

export function useEcsServices({ entity }: { entity: Entity }) {
  const amazonEcsApi = useApi(amazonEcsApiRef);

  const {
    loading,
    value: response,
    error,
    retry,
  } = useAsyncRetry<ServicesResponse | undefined>(async () => {
    return await amazonEcsApi.getServicesByEntity({
      entity: getCompoundEntityRef(entity),
    });
  }, []);

  return { loading, response, error, retry } as const;
}
