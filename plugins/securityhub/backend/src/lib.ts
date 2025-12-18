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
  coreServices,
  createServiceFactory,
  createServiceRef,
} from '@backstage/backend-plugin-api';
import { AwsSecurityHubService, DefaultAwsSecurityHubService } from './service';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';

export const awsSecurityHubApiServiceRef =
  createServiceRef<AwsSecurityHubService>({
    id: 'aws-securityhub.api',
    defaultFactory: async service =>
      createServiceFactory({
        service,
        deps: {
          logger: coreServices.logger,
          config: coreServices.rootConfig,
          catalogApi: catalogServiceRef,
          auth: coreServices.auth,
          discovery: coreServices.discovery,
          httpAuth: coreServices.httpAuth,
        },
        async factory({
          logger,
          config,
          catalogApi,
          auth,
          httpAuth,
          discovery,
        }) {
          const impl = await DefaultAwsSecurityHubService.fromConfig(config, {
            catalogApi,
            auth,
            httpAuth,
            discovery,
            logger,
          });

          return impl;
        },
      }),
  });
