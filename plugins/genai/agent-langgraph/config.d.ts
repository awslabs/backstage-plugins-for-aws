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

export interface Config {
  genai?: {
    /**
     * (Optional) Memory store to use
     */
    memory?: string;

    /**
     * (Optional) Limit the number of graph supersteps
     */
    recursionLimit?: number;

    langfuse?: {
      /**
       * (Required) LangFuse base URL
       */
      baseUrl: number;
      /**
       * (Optional) LangFuse public key
       */
      publicKey: string;
      /**
       * (Optional) LangFuse secret key
       */
      secretKey: string;
      /**
       * (Optional) LangFuse flush batch size
       */
      flushAt?: number;
    };
    agents?: {
      [name: string]: {
        langgraph?: {
          /**
           * (Required) Maximum tokens to retain in context sent to the model
           */
          messagesMaxTokens: number;
          /**
           * (Optional) Maximum tokens that will be returned by the model
           */
          maxTokens?: number;
          /**
           * (Optional) Model temperature
           */
          temperature?: number;
          /**
           * (Optional) Model topP
           */
          topP?: number;
          /**
           * (Optional) Specific configuration for Amazon Bedrock
           */
          bedrock?: {
            /**
             * (Required) Region to use to access Amazon Bedrock API
             */
            region: string;
            /**
             * (Required) Amazon Bedrock model ID to use
             * @see https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html
             */
            modelId: string;
          };
          /**
           * (Optional) Specific configuration for OpenAI
           */
          openai?: {
            /**
             * (Required) OpenAI API key for authentication
             * @visibility secret
             */
            apiKey: string;
            /**
             * (Optional) Name of the OpenAI model to use
             */
            modelName?: string;
            /**
             * (Optional) Base URL of the OpenAI API
             */
            baseUrl?: string;
          };
        };
      };
    };
  };
}
