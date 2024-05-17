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

import { Entity } from '@backstage/catalog-model';
import {
  CardTab,
  InfoCard,
  InfoCardVariants,
  ResponseErrorPanel,
  Table,
} from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { Box, Grid, LinearProgress, Link } from '@material-ui/core';
import React from 'react';
import { AboutField } from '../AboutField';
import { MissingAnnotationEmptyState } from '@backstage/plugin-catalog-react';
import {
  AWS_CODEBUILD_ARN_ANNOTATION,
  AWS_CODEBUILD_TAGS_ANNOTATION,
  ProjectResponse,
} from '@aws/aws-codebuild-plugin-for-backstage-common';
import { isAwsCodeBuildAvailable } from '../../plugin';
import {
  MissingResources,
  TabbedContent,
} from '@aws/aws-core-plugin-for-backstage-react';
import { Build } from '@aws-sdk/client-codebuild';
import { BuildStatus } from '../BuildStatus';
import { useProjects } from '../../hooks';
import { formatTime, getDurationFromStringDates } from '../../util';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { generateShortcutLink } from '@aws/aws-core-plugin-for-backstage-common';

const generatedColumns = (
  region: string,
  project: string,
  accountId: string,
  ssoSubdomain?: string,
) => {
  return [
    {
      title: 'Build run',
      field: 'id',
      render: (row: Partial<Build>) => {
        const projectUrl = `https://${region}.console.aws.amazon.com/codesuite/codebuild/${accountId}/projects/${project}/build/${row.id}/?region=${region}`;

        return (
          <Link
            href={
              ssoSubdomain
                ? generateShortcutLink(ssoSubdomain, accountId, projectUrl)
                : projectUrl
            }
            target="_blank"
          >
            #{row.buildNumber}
          </Link>
        );
      },
    },
    {
      title: 'Status',
      field: 'deploymentStatus',
      render: (row: Partial<Build>) => <BuildStatus status={row.buildStatus} />,
    },
    {
      title: 'Duration',
      field: 'duration',
      render: (row: Partial<Build>) => {
        if (row.startTime && row.endTime) {
          return getDurationFromStringDates(row.startTime, row.endTime);
        }

        return '';
      },
    },
  ];
};

const projectMostRecentBuildStatus = (builds: Build[]) => {
  if (builds.length > 0) {
    return <BuildStatus status={builds[0].buildStatus} />;
  }

  return <></>;
};

const projectMostRecentBuildExecuted = (builds: Build[]) => {
  if (builds.length > 0) {
    const build = builds.find(el => el.startTime);

    if (build) {
      return `${formatTime(build.startTime)} ago`;
    }
  }

  return <></>;
};

const projectMostRecentBuildDuration = (builds: Build[]) => {
  if (builds.length > 0) {
    const build = builds.find(el => el.startTime && el.endTime);

    if (build) {
      return getDurationFromStringDates(build.startTime, build.endTime);
    }
  }

  return <></>;
};

export const ProjectWidgetContent = ({
  project,
}: {
  project: ProjectResponse;
}) => {
  const configApi = useApi(configApiRef);
  const ssoSubdomain = configApi.getOptionalString('aws.sso.subdomain');

  const projectUrl = `https://${project.projectRegion}.console.aws.amazon.com/codesuite/codebuild/${project.projectAccountId}/projects/${project.projectName}/?region=${project.projectRegion}`;

  return (
    <div>
      <Box sx={{ m: 2 }}>
        <Grid container>
          <AboutField label="Project Name" gridSizes={{ md: 12 }}>
            <Link
              href={
                ssoSubdomain
                  ? generateShortcutLink(
                      ssoSubdomain,
                      project.projectAccountId,
                      projectUrl,
                    )
                  : projectUrl
              }
              target="_blank"
            >
              {project.projectName}
            </Link>
          </AboutField>
          <AboutField
            label="Most recent build"
            gridSizes={{ xs: 12, sm: 6, lg: 4 }}
          >
            {projectMostRecentBuildStatus(project.builds)}
          </AboutField>
          <AboutField
            label="Last executed"
            gridSizes={{ xs: 12, sm: 6, lg: 4 }}
          >
            {projectMostRecentBuildExecuted(project.builds)}
          </AboutField>
          <AboutField label="Duration" gridSizes={{ xs: 12, sm: 6, lg: 4 }}>
            {projectMostRecentBuildDuration(project.builds)}
          </AboutField>
        </Grid>
      </Box>
      <Table
        options={{
          paging: false,
          search: false,
          toolbar: false,
          padding: 'dense',
        }}
        data={project.builds ?? []}
        columns={generatedColumns(
          project.projectRegion,
          project.project.name!,
          project.projectAccountId,
          ssoSubdomain,
        )}
      />
    </div>
  );
};

const TabbedProjectWidgetContent = ({
  projects,
}: {
  projects: ProjectResponse[];
}) => {
  return (
    <TabbedContent>
      {projects.map(project => (
        <CardTab label={project.projectName}>
          <ProjectWidgetContent project={project} />
        </CardTab>
      ))}
    </TabbedContent>
  );
};

const Project = ({ entity }: { entity: Entity }) => {
  const { response, loading, error } = useProjects({ entity });

  if (response) {
    if (response.projects.length === 0) {
      return (
        <Box m={2}>
          <MissingResources />
        </Box>
      );
    }

    if (response.projects.length === 1) {
      return <ProjectWidgetContent project={response.projects[0]} />;
    }

    return <TabbedProjectWidgetContent projects={response.projects} />;
  }

  return (
    <Box m={2}>
      {error && <ResponseErrorPanel error={error} />}

      {loading && <LinearProgress />}
    </Box>
  );
};

const ProjectWrapper = ({
  entity,
  variant,
  title,
}: {
  entity: Entity;
  variant?: InfoCardVariants;
  title?: string;
}) => {
  return (
    <InfoCard title={title ?? 'AWS CodeBuild'} noPadding variant={variant}>
      <Project entity={entity} />
    </InfoCard>
  );
};

export const CodeBuildProjectCard = ({
  variant,
  title,
}: {
  variant?: InfoCardVariants;
  title?: string;
}) => {
  const { entity } = useEntity();

  if (!isAwsCodeBuildAvailable(entity)) {
    return (
      <MissingAnnotationEmptyState
        annotation={[
          AWS_CODEBUILD_ARN_ANNOTATION,
          AWS_CODEBUILD_TAGS_ANNOTATION,
        ]}
      />
    );
  }

  return <ProjectWrapper entity={entity} variant={variant} title={title} />;
};
