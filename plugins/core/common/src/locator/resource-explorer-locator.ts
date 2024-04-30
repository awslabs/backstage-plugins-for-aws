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
  ResourceExplorer2Client,
  SearchCommand,
} from '@aws-sdk/client-resource-explorer-2';
import { Logger } from 'winston';
import {
  AWS_SDK_CUSTOM_USER_AGENT,
  AwsResourceLocator,
} from '@aws/aws-core-plugin-for-backstage-common';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { Config } from '@backstage/config';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { convertResourceTypeString, parseResourceLocatorTags } from './utils';

export class AwsResourceExplorerLocator implements AwsResourceLocator {
  public constructor(
    private readonly logger: Logger,
    private readonly client: ResourceExplorer2Client,
    private readonly viewArn: string | undefined,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      logger: Logger;
    },
  ) {
    let region: string | undefined;
    let accountId: string | undefined;
    let viewArn: string | undefined;

    const conf = config.getOptionalConfig('aws.locator.resourceExplorer');

    if (conf) {
      viewArn = conf.getOptionalString('viewArn');
      accountId = conf.getOptionalString('accountId');
      region = conf.getOptionalString('region');
    }

    const credsManager = DefaultAwsCredentialsManager.fromConfig(config);

    let credentialProvider: AwsCredentialIdentityProvider;

    if (accountId) {
      credentialProvider = (
        await credsManager.getCredentialProvider({ accountId })
      ).sdkCredentialProvider;
    } else {
      credentialProvider = (await credsManager.getCredentialProvider())
        .sdkCredentialProvider;
    }

    const client = new ResourceExplorer2Client({
      region: region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider,
    });

    return new AwsResourceExplorerLocator(options.logger, client, viewArn);
  }

  async getResourceArns({
    resourceType,
    tagString,
  }: {
    resourceType: string;
    tagString: string;
  }): Promise<string[]> {
    const tagFilters = parseResourceLocatorTags(tagString);

    const convertedResourceType = convertResourceTypeString(resourceType);

    this.logger.debug(`Retrieving resource ARNs for ${convertedResourceType}`);

    const query = `${tagFilters
      .map(e => {
        return `tag:${e.key}=${e.value}`;
      })
      .join(' ')} resourcetype:${convertedResourceType}`.trim();

    this.logger.debug(`Resource explorer query: ${query}`);

    const response = await this.client.send(
      new SearchCommand({
        QueryString: query,
        ViewArn: this.viewArn,
      }),
    );

    return response.Resources!.map(e => e.Arn!);
  }
}
