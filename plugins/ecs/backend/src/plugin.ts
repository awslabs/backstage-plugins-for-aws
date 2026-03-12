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
import { amazonEcsServiceRef, createRouter } from './service/router';
import {
  createGetServiceResourcesByEntityAction,
  createGetServicesByEntityAction,
} from './actions';
import { actionsRegistryServiceRef } from '@backstage/backend-plugin-api/alpha';

export const amazonEcsPlugin = createBackendPlugin({
  pluginId: 'amazon-ecs',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
        httpAuth: coreServices.httpAuth,
        amazonEcsApi: amazonEcsServiceRef,
        actionsRegistry: actionsRegistryServiceRef,
      },
      async init({
        logger,
        httpRouter,
        httpAuth,
        amazonEcsApi,
        config,
        actionsRegistry,
      }) {
        httpRouter.use(
          await createRouter({
            config,
            logger,
            amazonEcsApi,
            httpAuth,
          }),
        );
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });

        createGetServicesByEntityAction({ actionsRegistry, amazonEcsApi });
        createGetServiceResourcesByEntityAction({
          actionsRegistry,
          amazonEcsApi,
        });
      },
    });
  },
});
