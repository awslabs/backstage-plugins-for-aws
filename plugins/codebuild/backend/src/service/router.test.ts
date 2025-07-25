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

import express from 'express';
import request from 'supertest';

import { createRouter } from './router';
import { AwsCodeBuildService } from './types';
import { mockServices } from '@backstage/backend-test-utils';
import { ConfigReader } from '@backstage/config';

describe('createRouter', () => {
  let app: express.Express;
  const mockService: jest.Mocked<AwsCodeBuildService> = {
    getProjectsByEntity: jest.fn(),
  };

  beforeAll(async () => {
    const router = await createRouter({
      logger: mockServices.logger.mock(),
      awsCodeBuildApi: mockService,
      httpAuth: mockServices.httpAuth.mock(),
      config: new ConfigReader({}),
    });
    app = express().use(router);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('GET /health', () => {
    it('returns ok', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toEqual(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
