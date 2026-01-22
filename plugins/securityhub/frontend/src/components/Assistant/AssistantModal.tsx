import { useState } from 'react';
import {
  Button,
  LinearProgress,
  makeStyles,
  Modal,
  Typography,
  Box,
  Divider,
} from '@material-ui/core';
import { MarkdownContent } from '@backstage/core-components';
import { Entity } from '@backstage/catalog-model';
import { useSecurityHubAssistant } from '../../hooks';
import { AwsSecurityFinding } from '@aws-sdk/client-securityhub';

const useStyles = makeStyles(theme => ({
  paper: {
    position: 'absolute',
    width: 800,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    maxHeight: '80vh',
    overflow: 'scroll',
  },
  description: {
    backgroundColor:
      theme.palette.type === 'dark'
        ? theme.palette.background.default
        : '#f0f0f0',
    padding: '10px',
    borderRadius: '5px',
    marginTop: '10px',
    marginBottom: '20px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(2),
    gap: theme.spacing(1),
  },
  remediationSection: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  sectionTitle: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
}));

const AssistantModalContent = ({
  entity,
  finding,
}: {
  entity: Entity;
  finding: AwsSecurityFinding;
}) => {
  const classes = useStyles();
  const [showAIResponse, setShowAIResponse] = useState(false);

  const { response, loading, error } = useSecurityHubAssistant({
    entity,
    finding,
    enabled: showAIResponse,
  });

  return (
    <>
      {/* AWS Remediation Section */}
      {finding.Remediation?.Recommendation && (
        <Box className={classes.remediationSection}>
          <Divider />
          <Typography variant="h6" className={classes.sectionTitle}>
            AWS Remediation Recommendation
          </Typography>
          <Typography paragraph>
            {finding.Remediation.Recommendation.Text}
          </Typography>
          {finding.Remediation.Recommendation.Url && (
            <Button
              variant="outlined"
              color="primary"
              href={finding.Remediation.Recommendation.Url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View Remediation Guide
            </Button>
          )}
        </Box>
      )}

      {/* AI Assistant Section */}
      <Box className={classes.remediationSection}>
        <Divider />
        <Typography variant="h6" className={classes.sectionTitle}>
          AI Assistant
        </Typography>
        {!showAIResponse && (
          <Box>
            <Typography paragraph>
              Get AI-powered analysis and remediation guidance for this finding.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowAIResponse(true)}
            >
              Ask AI
            </Button>
          </Box>
        )}
        {showAIResponse && loading && <LinearProgress />}
        {showAIResponse &&
          !loading &&
          error &&
          (() => {
            const errorMessage =
              'message' in error && typeof error.message === 'string'
                ? error.message
                : 'Failed to get AI assistance. Please try again later.';
            const is501Error = errorMessage.includes('501 Not Implemented');

            return (
              <Box
                mt={2}
                p={2}
                style={{
                  backgroundColor: is501Error ? '#fff3e0' : '#ffebee',
                  borderRadius: '4px',
                  border: is501Error
                    ? '1px solid #ff9800'
                    : '1px solid #ef5350',
                }}
              >
                <Typography
                  variant="subtitle1"
                  style={{
                    fontWeight: 600,
                    color: is501Error ? '#e65100' : '#c62828',
                  }}
                >
                  {is501Error ? 'Setup Required' : 'Error'}
                </Typography>
                <Typography
                  variant="body2"
                  style={{
                    color: is501Error ? '#e65100' : '#c62828',
                    marginTop: '8px',
                  }}
                >
                  {is501Error
                    ? 'AI Assistant is not enabled. Enable it in app-config.yaml under aws.securityHub.agent.enabled'
                    : errorMessage}
                </Typography>
              </Box>
            );
          })()}
        {showAIResponse && !loading && !error && response && (
          <Box mt={1} mb={2}>
            <MarkdownContent content={response.analysis} dialect="gfm" />
          </Box>
        )}
      </Box>
    </>
  );
};

type AssistantModalProps = {
  entity: Entity;
  finding: AwsSecurityFinding;
};

export const AssistantModal = ({ entity, finding }: AssistantModalProps) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        onClick={handleOpen}
        size="small"
      >
        Remediate
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
      >
        <div className={classes.paper}>
          <Typography variant="h5" gutterBottom>
            Finding Details & Remediation
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Finding:
          </Typography>
          <div className={classes.description}>
            <Typography variant="body1">{finding.Title}</Typography>
          </div>
          <Typography variant="body2" paragraph>
            {finding.Description}
          </Typography>
          <AssistantModalContent entity={entity} finding={finding} />
          <div className={classes.modalFooter}>
            <Button variant="contained" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
