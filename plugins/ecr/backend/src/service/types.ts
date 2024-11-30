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
  ImageDetail,
  ImageScanFindings,
} from "@aws-sdk/client-ecr"

/** @public */
export type AwsEcrListImagesRequest = {
  componentKey: string;
};

/** @public */
export type AwsEcrListImagesResponse = {
  items: ImageDetail[];
};

export type AwsEcrListScanResultsRequest = {
  componentKey: string;
  imageTag?: string;
  imageDigest?: string;
};

export type AwsEcrListScanResultsResponse = {
  results: ImageScanFindings
};

/** @public */
export interface EcrScanAwsService {
  listEcrImages(
    req: AwsEcrListImagesRequest,
  ): Promise<AwsEcrListImagesResponse>;
  listScanResults(
    req: AwsEcrListScanResultsRequest,
  ): Promise<AwsEcrListScanResultsResponse>;
}