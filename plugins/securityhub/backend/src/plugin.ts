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
  createBackendPlugin,
  coreServices,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { awsSecurityHubApiServiceRef } from './lib';
import { createGetFindingsByEntityAction } from './actions';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';

export const awsSecurityHubPlugin = createBackendPlugin({
  pluginId: 'aws-securityhub',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
        discovery: coreServices.discovery,
        awsSecurityHubApi: awsSecurityHubApiServiceRef,
        cache: coreServices.cache,
        config: coreServices.rootConfig,
        actionsRegistry: actionsRegistryServiceRef,
      },
      async init({
        logger,
        httpRouter,
        awsSecurityHubApi,
        httpAuth,
        auth,
        discovery,
        cache,
        config,
        actionsRegistry,
      }) {
        const router = await createRouter({
          logger,
          awsSecurityHubApi,
          auth,
          httpAuth,
          discovery,
          cache,
          config,
        });
        httpRouter.use(router as any);
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        createGetFindingsByEntityAction({ actionsRegistry, awsSecurityHubApi });
      },
    });
  },
});
