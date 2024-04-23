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

import { Logger } from 'winston';
import {
  QBusinessClient,
  ChatSyncCommand,
  ListConversationsCommand,
} from '@aws-sdk/client-qbusiness';
import { AmazonQBusinessService } from './types';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { Config } from '@backstage/config';
import {
  ChatSyncResponse,
  ConversationsResponse,
} from '@aws/amazon-qbusiness-plugin-for-backstage-common';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { CatalogApi } from '@backstage/catalog-client';
import {
  AuthService,
  BackstageCredentials,
  DiscoveryService,
  HttpAuthService,
} from '@backstage/backend-plugin-api';
import { createLegacyAuthAdapters } from '@backstage/backend-common';
import { UserEntityV1alpha1 } from '@backstage/catalog-model';

export class DefaultAmazonQBusinessService implements AmazonQBusinessService {
  public constructor(
    private readonly logger: Logger,
    private readonly auth: AuthService,
    private readonly applicationId: string,
    private readonly catalogApi: CatalogApi,
    private readonly client: QBusinessClient,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      catalogApi: CatalogApi;
      discovery: DiscoveryService;
      auth?: AuthService;
      httpAuth?: HttpAuthService;
      logger: Logger;
    },
  ) {
    let region, accountId: string | undefined;

    const conf = config.getConfig('aws.qbusiness');

    const applicationId = conf.getString('applicationId');

    accountId = conf.getOptionalString('accountId');
    region = conf.getOptionalString('region');

    const credsManager = DefaultAwsCredentialsManager.fromConfig(config);

    var credentialProvider: AwsCredentialIdentityProvider;

    if (accountId) {
      credentialProvider = (
        await credsManager.getCredentialProvider({ accountId })
      ).sdkCredentialProvider;
    } else {
      credentialProvider = (await credsManager.getCredentialProvider())
        .sdkCredentialProvider;
    }

    let client = new QBusinessClient({
      region: region,
      customUserAgent: 'amazon-qbusiness-plugin-for-backstage',
      credentialDefaultProvider: () => credentialProvider,
    });

    const { auth } = createLegacyAuthAdapters(options);

    return new DefaultAmazonQBusinessService(
      options.logger,
      auth,
      applicationId,
      options.catalogApi,
      client,
    );
  }

  public async chatSync(options: {
    userMessage: string;
    userEntityRef: string;
    conversationId: string | undefined;
    previousMessageId: string | undefined;
    credentials?: BackstageCredentials;
  }): Promise<ChatSyncResponse> {
    this.logger.debug('Chat sync');

    const userId = await this.getUserId({ ...options });

    const response = await this.client.send(
      new ChatSyncCommand({
        userMessage: options.userMessage,
        conversationId: options.conversationId,
        parentMessageId: options.previousMessageId,
        applicationId: this.applicationId,
        userId,
      }),
    );

    return {
      response,
    };
  }

  public async conversations(options: {
    userEntityRef: string;
    credentials?: BackstageCredentials;
  }): Promise<ConversationsResponse> {
    this.logger.debug('Retrieving conversations');

    const userId = await this.getUserId({ ...options });

    const response = await this.client.send(
      new ListConversationsCommand({
        applicationId: this.applicationId,
        userId,
      }),
    );

    return {
      conversations: response.conversations ?? [],
    };
  }

  private async getUserId(options: {
    userEntityRef: string;
    credentials?: BackstageCredentials;
  }): Promise<string> {
    const userEntity = (await this.catalogApi.getEntityByRef(
      options.userEntityRef,
      options.credentials &&
        (await this.auth.getPluginRequestToken({
          onBehalfOf: options.credentials,
          targetPluginId: 'catalog',
        })),
    )) as UserEntityV1alpha1;

    let userId = 'guest';

    if (userEntity) {
      userId = userEntity.spec.profile?.email!;
    }

    return userId;
  }
}
