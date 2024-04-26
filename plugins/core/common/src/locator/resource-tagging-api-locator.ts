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
import { AwsResourceLocator } from '@aws/aws-core-plugin-for-backstage-common';
import { Config } from '@backstage/config';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { AwsResourceTaggingApiLocatorInstance } from './resource-tagging-api-instance';

export class AwsResourceTaggingApiLocator implements AwsResourceLocator {
  public constructor(
    private readonly instances: AwsResourceTaggingApiLocatorInstance[],
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      logger: Logger;
    },
  ) {
    let regions: (string | undefined)[] = [undefined];
    let accounts: (string | undefined)[] = [undefined];

    const conf = config.getOptionalConfig('aws.locator.resourceTaggingApi');

    if (conf) {
      accounts = conf.getOptionalStringArray('accounts') || [undefined];
      regions = conf.getOptionalStringArray('regions') || [undefined];
    }

    const credsManager = DefaultAwsCredentialsManager.fromConfig(config);

    const instances: AwsResourceTaggingApiLocatorInstance[] = await Promise.all(
      accounts.flatMap(accountId => {
        return regions.map(region => {
          options.logger.debug(`Creating client for ${accountId} - ${region}`);
          return AwsResourceTaggingApiLocatorInstance.create({
            credsManager,
            accountId,
            region,
            logger: options.logger,
          });
        });
      }),
    );

    return new AwsResourceTaggingApiLocator(instances);
  }

  async getResourceArns({
    resourceType,
    tagString,
  }: {
    resourceType: string;
    tagString: string;
  }): Promise<string[]> {
    return (
      await Promise.all(
        this.instances.map(e => e.getResourceArns({ resourceType, tagString })),
      )
    ).flat(1);
  }
}
