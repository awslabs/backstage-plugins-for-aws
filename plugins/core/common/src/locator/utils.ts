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

export function parseResourceLocatorTags(
  tagString: string,
): { key: string; value: string }[] {
  return tagString.split(',').map(e => {
    const parts = e.split('=');
    return {
      key: parts[0],
      value: parts[1],
    };
  });
}

export function convertResourceTypeString(resourceType: string): string {
  const parts = resourceType.split('::');

  if (parts.length !== 3) {
    throw new Error(`Invalid resource type ${resourceType}`);
  }

  return `${parts[1].toLowerCase()}:${parts[2].toLowerCase()}`;
}
