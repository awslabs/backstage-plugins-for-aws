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

import { StageState } from '@aws-sdk/client-codepipeline';
import { Entity } from '@backstage/catalog-model';
import {
  CardTab,
  InfoCard,
  InfoCardVariants,
  ResponseErrorPanel,
  Table,
  TableColumn,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Box, Grid, LinearProgress, Link } from '@material-ui/core';
import React from 'react';
import { AboutField } from '../AboutField';
import { PipelineStageStatus } from '../PipelineStageStatus';
import { MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import {
  AWS_CODEPIPELINE_ARN_ANNOTATION,
  AWS_CODEPIPELINE_TAGS_ANNOTATION,
  PipelineState,
} from '@aws/aws-codepipeline-plugin-for-backstage-common';
import { usePipelineState } from '../../hooks';
import { isAwsCodePipelineAvailable } from '../../plugin';
import { TabbedContent } from '@aws/aws-core-plugin-for-backstage-react';
import { MissingResources } from '@aws/aws-core-plugin-for-backstage-react';

const PipelineStageTable = ({
  stages,
  paging,
}: {
  stages: StageState[];
  paging: boolean;
}) => {
  const columns: TableColumn[] = [
    {
      title: 'Stage',
      field: 'id',
      render: (row: Partial<StageState>) => {
        return row.stageName;
      },
    },
    {
      title: 'Status',
      field: 'deploymentStatus',
      render: (row: Partial<StageState>) => (
        <PipelineStageStatus status={row.latestExecution?.status} />
      ),
    },
  ];

  return (
    <div>
      <Table
        options={{
          paging: paging,
          search: false,
          toolbar: false,
          padding: 'dense',
        }}
        data={stages}
        columns={columns}
      />
    </div>
  );
};

const PipelineWidgetContent = ({
  pipelineState,
  paging,
}: {
  pipelineState: PipelineState;
  paging: boolean;
}) => {
  const region = pipelineState.pipelineRegion;
  const pipelineUrl = `https://${region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipelineState.pipelineName}/view?region=${region}`;

  return (
    <div>
      <Box sx={{ m: 2 }}>
        <Grid container>
          <AboutField label="Pipeline Name" gridSizes={{ md: 12 }}>
            <Link href={pipelineUrl} target="_blank">
              {pipelineState.pipelineName}
            </Link>
          </AboutField>
        </Grid>
      </Box>
      <PipelineStageTable
        stages={pipelineState.pipelineState.stageStates ?? []}
        paging={paging}
      />
    </div>
  );
};

const TabbedPipelineWidgetContent = ({
  pipelines,
  paging,
}: {
  pipelines: PipelineState[];
  paging: boolean;
}) => {
  return (
    <TabbedContent>
      {pipelines.map(pipeline => (
        <CardTab label={pipeline.pipelineName}>
          <PipelineWidgetContent pipelineState={pipeline} paging={paging} />
        </CardTab>
      ))}
    </TabbedContent>
  );
};

const PipelineStateContent = ({
  entity,
  paging,
}: {
  entity: Entity;
  paging: boolean;
}) => {
  const { response, loading, error } = usePipelineState({ entity });

  if (response) {
    if (response?.pipelines.length === 0) {
      return (
        <Box m={2}>
          <MissingResources />
        </Box>
      );
    }

    if (response.pipelines.length === 1) {
      return (
        <PipelineWidgetContent
          pipelineState={response.pipelines[0]}
          paging={paging}
        />
      );
    }

    return (
      <TabbedPipelineWidgetContent
        pipelines={response.pipelines}
        paging={paging}
      />
    );
  }

  return (
    <Box m={2}>
      {error && <ResponseErrorPanel error={error} />}

      {loading && <LinearProgress />}
    </Box>
  );
};

const PipelineStateWrapper = ({
  entity,
  variant,
  paging,
  title,
}: {
  entity: Entity;
  variant?: InfoCardVariants;
  paging: boolean;
  title?: string;
}) => {
  return (
    <InfoCard title={title ?? 'AWS CodePipeline'} noPadding variant={variant}>
      <PipelineStateContent entity={entity} paging={paging} />
    </InfoCard>
  );
};

export const CodePipelineStateCard = ({
  variant,
  paging = false,
  title,
}: {
  variant?: InfoCardVariants;
  paging?: boolean;
  title?: string;
}) => {
  const { entity } = useEntity();

  if (!isAwsCodePipelineAvailable(entity)) {
    return (
      <MissingAnnotationEmptyState
        annotation={[
          AWS_CODEPIPELINE_ARN_ANNOTATION,
          AWS_CODEPIPELINE_TAGS_ANNOTATION,
        ]}
      />
    );
  }

  return (
    <PipelineStateWrapper
      entity={entity}
      variant={variant}
      paging={paging}
      title={title}
    />
  );
};
