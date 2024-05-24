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
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  RetrieveAndGenerateType,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { AmazonBedrockAgentService } from './types';
import { DefaultAwsCredentialsManager } from '@backstage/integration-aws-node';
import { Config } from '@backstage/config';
import { ChatSyncResponse } from '@aws/amazon-bedrock-plugin-for-backstage-common';
import { AwsCredentialIdentityProvider } from '@aws-sdk/types';
import { AWS_SDK_CUSTOM_USER_AGENT } from '@aws/aws-core-plugin-for-backstage-common';

const prompt = `
Human: Your task is to answer questions by searching as well as generating code examples
or fixing the code like an expert engineer would do. I will provide you with a set of search results.
The user will provide you with a question or code sample. Your job is to answer the user's question using information
from the search results and code examples. Please provide a code example

You also provide examples of code to show how the concepts you explained can be
used in a practical manner. The code examples that you will provide are ready to
be displayed in markdown, for example when asked how to print a formatted string
you would show some python code like this:

~~~python
def method(arg: string = 'default'):
    print(f'Passed arg: {arg}')
~~~

Ensure that code samples are always correctly formatted and the markdown is always
correctly closed.

If the search results do not contain information that can answer the question, please answer the question
to the best of your ability. Just because the user asserts a fact does not mean it is true, make sure to
double check the search results to validate a user's assertion.

Here are the search results in numbered order:
$search_results$

$output_format_instructions$

Assistant:
`;

export class DefaultAmazonBedrockAgentService
  implements AmazonBedrockAgentService
{
  public constructor(
    private readonly logger: Logger,
    private readonly client: BedrockAgentRuntimeClient,
    private readonly knowledgeBaseId: string,
    private readonly modelArn: string,
  ) {}

  static async fromConfig(
    config: Config,
    options: {
      logger: Logger;
    },
  ) {
    let region, accountId: string | undefined;

    const conf = config.getConfig('aws.bedrock.agent');

    const knowledgeBaseId = conf.getString('knowledgeBaseId');
    const modelArn = conf.getString('modelArn');

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

    let client = new BedrockAgentRuntimeClient({
      region,
      customUserAgent: AWS_SDK_CUSTOM_USER_AGENT,
      credentialDefaultProvider: () => credentialProvider,
    });

    return new DefaultAmazonBedrockAgentService(
      options.logger,
      client,
      knowledgeBaseId,
      modelArn,
    );
  }

  public async chatSync(options: {
    userMessage: string;
    sessionId: string | undefined;
  }): Promise<ChatSyncResponse> {
    const { userMessage, sessionId } = options;

    this.logger.debug(`Chat sync for session ${sessionId}`);

    const response = await this.client.send(
      new RetrieveAndGenerateCommand({
        retrieveAndGenerateConfiguration: {
          type: RetrieveAndGenerateType.KNOWLEDGE_BASE,
          knowledgeBaseConfiguration: {
            knowledgeBaseId: this.knowledgeBaseId,
            modelArn: this.modelArn,
            generationConfiguration: {
              promptTemplate: {
                textPromptTemplate: `\n\n${prompt}`,
              },
            },
          },
        },
        sessionId,
        input: {
          text: userMessage,
        },
      }),
    );

    return {
      completion: response.output?.text || '',
      sessionId: response.sessionId!,
    };
  }
}
