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

import { Entity } from '@backstage/catalog-model';

export function getOneOfEntityAnnotations(
  entity: Entity,
  targetAnnotations: string[],
):
  | {
      name: string;
      value: string;
    }
  | undefined {
  if (entity.metadata.annotations) {
    const annotations = Object.keys(entity.metadata.annotations);

    const intersection = annotations.filter(value =>
      targetAnnotations.includes(value),
    );

    if (intersection.length === 1) {
      const match = intersection[0];

      return {
        name: match,
        value: entity.metadata.annotations[match],
      };
    }

    return undefined;
  }

  return undefined;
}
