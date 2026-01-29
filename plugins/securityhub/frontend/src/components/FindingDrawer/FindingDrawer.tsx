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

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { ChangeEvent, useState } from 'react';
import { StructuredMetadataTable } from '@backstage/core-components';
import {
  Box,
  Button,
  Chip,
  createStyles,
  Drawer,
  makeStyles,
  Theme,
  withStyles,
} from '@material-ui/core';
import { AwsSecurityFinding } from '@aws-sdk/client-securityhub';
import { getSeverityColor } from '../constants';
import Link from '@material-ui/core/Link';

const getSecurityHubFindingUrl = (
  region: string | undefined,
): string | null => {
  if (!region) return null;
  return `https://console.aws.amazon.com/securityhub/v2/home?region=${region}`;
};

const formatFindingOverview = (finding: AwsSecurityFinding) => {
  const region = finding.Resources?.[0]?.Region;
  const findingUrl = getSecurityHubFindingUrl(region);

  return {
    ID: findingUrl ? (
      <Link href={findingUrl} target="_blank" rel="noopener noreferrer">
        {finding.Id}
      </Link>
    ) : (
      finding.Id
    ),
    Types: finding.Types?.join(','),
    WorkflowStatus: finding.Workflow?.Status,
    RecordState: finding.RecordState,
    AccountID: finding.AwsAccountId,
    LastUpdated: finding.UpdatedAt,
  };
};

const formatResources = (finding: AwsSecurityFinding) => {
  if (!finding.Resources || finding.Resources.length === 0) {
    return {};
  }

  const resource = finding.Resources[0];

  return {
    Type: resource.Type,
    ID: resource.Id,
  };
};

const useDrawerStyles = makeStyles((theme: Theme) =>
  createStyles({
    paper: {
      width: '50%',
      justifyContent: 'space-between',
      padding: theme.spacing(2.5),
    },
  }),
);

const DrawerButton = withStyles({
  root: {
    padding: '6px 5px',
  },
  label: {
    textTransform: 'none',
  },
})(Button);

export interface FindingDrawerProps {
  open?: boolean;
  finding: AwsSecurityFinding;
  onClose?: () => void;
}

export const FindingDrawer = ({
  open,
  finding,
  onClose,
}: FindingDrawerProps) => {
  const classes = useDrawerStyles();
  const [isOpen, setIsOpen] = useState<boolean>(open ?? false);

  const toggleDrawer = (e: ChangeEvent<{}>, newValue: boolean) => {
    e.stopPropagation();
    setIsOpen(newValue);
    if (!newValue && onClose) {
      onClose();
    }
  };

  // Update internal state when open prop changes
  if (open !== undefined && open !== isOpen) {
    setIsOpen(open);
  }

  if (!finding) {
    return null;
  }

  return (
    <>
      <DrawerButton
        onClick={event => {
          setIsOpen(true);
          event.stopPropagation();
        }}
        style={{ width: '100%', textAlign: 'left', justifyContent: 'left' }}
      >
        {finding.Title}
      </DrawerButton>
      <Drawer
        classes={{
          paper: classes.paper,
        }}
        anchor="right"
        open={isOpen}
        onClose={(e: any) => toggleDrawer(e, false)}
        onClick={event => event.stopPropagation()}
      >
        <Grid>
          <Grid item xs={12} spacing={0}>
            <Typography variant="h6">
              <Box component="span" fontWeight="fontWeightMedium">
                Finding: {finding.Title}
              </Box>
            </Typography>
            <Typography paragraph>{finding.Description}</Typography>

            <Chip
              label={finding.Severity?.Label}
              color="primary"
              style={{ backgroundColor: getSeverityColor(finding) }}
            />
            <Chip label={finding.Workflow?.Status} />
          </Grid>
          <Grid container item xs={12} spacing={0}>
            <Typography variant="h6">
              <Box component="span" fontWeight="fontWeightMedium">
                Overview
              </Box>
            </Typography>
          </Grid>
          <Grid container item xs={12} spacing={0}>
            <StructuredMetadataTable
              metadata={formatFindingOverview(finding)}
            />
          </Grid>

          {finding.Resources && finding.Resources.length > 0 && (
            <>
              <Grid container item xs={12} spacing={0}>
                <Typography variant="h6">
                  <Box component="span" fontWeight="fontWeightMedium">
                    Resources
                  </Box>
                </Typography>
              </Grid>
              <Grid container item xs={12} spacing={0}>
                <StructuredMetadataTable metadata={formatResources(finding)} />
              </Grid>
            </>
          )}
        </Grid>
      </Drawer>
    </>
  );
};
