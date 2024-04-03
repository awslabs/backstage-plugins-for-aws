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

import { loggerToWinstonLogger } from '@backstage/backend-common';
import {
  createBackendPlugin,
  coreServices,
} from '@backstage/backend-plugin-api';
import { createRouter } from './service/router';
import { catalogServiceRef } from '@backstage/plugin-catalog-node/alpha';
import { DefaultAwsCodeBuildService } from './service/DefaultAwsCodeBuildService';

export const awsCodebuildPlugin = createBackendPlugin({
  pluginId: 'aws-codebuild',
  register(env) {
    env.registerInit({
      deps: {
        logger: coreServices.logger,
        httpRouter: coreServices.httpRouter,
        config: coreServices.rootConfig,
        catalogApi: catalogServiceRef,
        auth: coreServices.auth,
        discovery: coreServices.discovery,
        httpAuth: coreServices.httpAuth,
      },
      async init({
        logger,
        httpRouter,
        config,
        catalogApi,
        auth,
        httpAuth,
        discovery,
      }) {
        const winstonLogger = loggerToWinstonLogger(logger);

        const awsCodeBuildApi = await DefaultAwsCodeBuildService.fromConfig(
          config,
          {
            catalogApi,
            auth,
            httpAuth,
            discovery,
            logger: winstonLogger,
          },
        );
        httpRouter.use(
          await createRouter({
            logger: winstonLogger,
            awsCodeBuildApi,
            discovery,
            auth,
            httpAuth,
          }),
        );
      },
    });
  },
});
