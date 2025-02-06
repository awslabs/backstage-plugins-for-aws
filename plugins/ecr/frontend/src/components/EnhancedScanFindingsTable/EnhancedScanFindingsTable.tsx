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

import React from 'react';
import { Table } from '@backstage/core-components';
import { EnhancedImageScanFinding } from '@aws-sdk/client-ecr';

const generatedColumns = () => {
  return [
    {
      title: 'Name',
      field: '',

      render: (row: Partial<EnhancedImageScanFinding>) => {
        return row.packageVulnerabilityDetails?.vulnerabilityId;
      },
    },
    {
      title: 'Severity',
      field: 'severity',
    },
    {
      title: 'Description',
      field: 'description',
    },
    {
      title: 'Fix available',
      field: 'fixAvailable',
    },
  ];
};

export const EnhancedScanFindingsTable = ({
  digest,
  findings,
}: {
  digest: string;
  findings: EnhancedImageScanFinding[];
}) => {
  return (
    <Table
      title={`Findings for ${digest.substring(0, 18)}`}
      data={findings}
      columns={generatedColumns()}
    />
  );
};
