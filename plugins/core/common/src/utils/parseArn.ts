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

const ARN_REGEX =
  /^arn:([^:\n]*):([^:\n]*):([^:\n]*):([^:\n]*):(([^:\/\n]*)[:\/])?(.*)$/;

export function parseArn(arn: string): {
  partition: string;
  service: string;
  region: string;
  accountId: string;
  resourceType?: string;
  resource: string;
} {
  const match = arn.match(ARN_REGEX);

  if (!match) throw new Error(`Invalid ARN: ${arn}`);

  const [, partition, service, region, accountId, , resourceType, resource] =
    match;

  return {
    partition,
    service,
    region,
    accountId,
    resourceType,
    resource,
  };
}
