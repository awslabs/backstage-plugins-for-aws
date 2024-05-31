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

import React, { useState } from 'react';
import {
  PipelineExecutions,
  PipelineExecutionsResponse,
} from '@aws/aws-codepipeline-plugin-for-backstage-common';
import { LinearProgress, Select } from '@material-ui/core';
import { Box, Typography, Link } from '@material-ui/core';
import {
  Table,
  SubvalueCell,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { PipelineExecutionSummary } from '@aws-sdk/client-codepipeline';
import { PipelineStageStatus } from '../PipelineStageStatus';
import { formatTime } from '../../util';
import { Entity } from '@backstage/catalog-model';
import { usePipelineExecutions } from '../../hooks';
import { MissingResources } from '@aws/aws-core-plugin-for-backstage-react';
import { configApiRef, useApi } from '@backstage/core-plugin-api';
import { generateShortcutLink } from '@aws/aws-core-plugin-for-backstage-common';
import { parse } from '@aws-sdk/util-arn-parser';

const renderTrigger = (
  row: Partial<PipelineExecutionSummary>,
): React.ReactNode => {
  if (row.sourceRevisions === undefined) {
    return (
      <Typography variant="body2" noWrap>
        -
      </Typography>
    );
  }

  let commitMessage = '';

  if (row.sourceRevisions.length > 0) {
    const sourceRevision = row.sourceRevisions[0];

    if (sourceRevision.revisionSummary) {
      switch (sourceRevision.actionName) {
        case 'SourceAction':
          commitMessage = sourceRevision.revisionSummary || '';
          break;
        case 'Source':
          commitMessage = sourceRevision.revisionSummary || '';
          break;
        case 'Checkout': {
          const summary = JSON.parse(sourceRevision.revisionSummary || '{}');

          commitMessage = summary.CommitMessage;
          break;
        }
        default:
          break;
      }
    }

    const subvalue = (
      <>
        {sourceRevision.revisionId?.substring(0, 6) || ''} - {commitMessage}
      </>
    );
    return (
      <SubvalueCell value={sourceRevision.actionName} subvalue={subvalue} />
    );
  }

  return '-';
};

const generatedColumns = (
  pipelineName: string,
  region: string,
  accountId: string,
  ssoSubdomain?: string,
) => {
  return [
    {
      title: 'Execution',
      field: 'Pipeline',

      render: (row: Partial<PipelineExecutionSummary>) => {
        if (row.pipelineExecutionId) {
          const projectUrl = `https://${region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipelineName}/executions/${row.pipelineExecutionId}/timeline?region=${region}`;

          return (
            <>
              <Link
                href={
                  ssoSubdomain
                    ? generateShortcutLink(ssoSubdomain, accountId, projectUrl)
                    : projectUrl
                }
                target="_blank"
              >
                {row.pipelineExecutionId}
              </Link>
            </>
          );
        }
        return <></>;
      },
    },
    {
      title: 'Last Run',
      field: '',
      render: (row: Partial<PipelineExecutionSummary>) =>
        `${formatTime(row.lastUpdateTime)} ago`,
    },
    {
      title: 'Status',
      field: 'status',
      render: (row: Partial<PipelineExecutionSummary>) => {
        if (row.status) {
          return (
            <Box display="flex" alignItems="center">
              <PipelineStageStatus status={row?.status} />
            </Box>
          );
        }
        return <></>;
      },
    },
    {
      title: 'Source Revision',
      field: 'revisions',
      render: (row: Partial<PipelineExecutionSummary>) => renderTrigger(row),
    },
  ];
};

type CodePipelineExecutionsTableProps = {
  response: PipelineExecutions;
};

const CodePipelineExecutionsTable = ({
  response,
}: CodePipelineExecutionsTableProps) => {
  const configApi = useApi(configApiRef);
  const ssoSubdomain = configApi.getOptionalString('aws.sso.subdomain');
  const { accountId } = parse(response.pipelineArn);

  return (
    <Table
      data={response.pipelineExecutions}
      columns={generatedColumns(
        response.pipelineName,
        response.pipelineRegion,
        accountId,
        ssoSubdomain,
      )}
      title="AWS CodePipeline"
    />
  );
};

type CodePipelineExecutionsContentProps = {
  response: PipelineExecutionsResponse;
};

const CodePipelineMultipleExecutionsContent = ({
  response,
}: CodePipelineExecutionsContentProps) => {
  const [selected, setSelected] = useState<PipelineExecutions>(
    response.pipelineExecutions[0],
  );

  return (
    <>
      <Box marginBottom={2}>
        <Select
          data-testid="select-pipeline"
          value={selected.pipelineArn}
          onChange={e =>
            setSelected(
              response.pipelineExecutions.find(
                p => p.pipelineArn === e.target.value,
              )!,
            )
          }
        >
          {response.pipelineExecutions.map(execution => (
            <option key={execution.pipelineArn} value={execution.pipelineArn}>
              {execution.pipelineName}
            </option>
          ))}
        </Select>
      </Box>
      <CodePipelineExecutionsTable response={selected} />
    </>
  );
};

const CodePipelineExecutionsContent = ({
  response,
}: CodePipelineExecutionsContentProps) => {
  if (response?.pipelineExecutions.length === 0) {
    return (
      <>
        <MissingResources />
      </>
    );
  }

  if (response.pipelineExecutions.length === 1) {
    return (
      <>
        <CodePipelineExecutionsTable
          response={response.pipelineExecutions[0]}
        />
      </>
    );
  }

  return <CodePipelineMultipleExecutionsContent response={response} />;
};

type CodePipelineExecutionsProps = {
  entity: Entity;
};

export const CodePipelineExecutions = ({
  entity,
}: CodePipelineExecutionsProps) => {
  const { response, loading, error } = usePipelineExecutions({ entity });

  if (error) {
    return <ResponseErrorPanel error={error} />;
  }

  if (loading) {
    return <LinearProgress />;
  }

  return <CodePipelineExecutionsContent response={response!} />;
};
