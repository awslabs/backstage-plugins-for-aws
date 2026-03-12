import { AwsSecurityFinding } from '@aws-sdk/client-securityhub';

export const SEVERITY_INFORMATIONAL_COLOR = '#879596';
export const SEVERITY_MEDIUM_COLOR = '#cc5f21';
export const SEVERITY_HIGH_COLOR = '#ba2e0f';
export const SEVERITY_LOW_COLOR = '#b49116';
export const SEVERITY_CRITICAL_COLOR = '#7d2105';

export const getSeverityColorByName = (severity: string) => {
  switch (severity) {
    case 'CRITICAL':
      return SEVERITY_CRITICAL_COLOR;
    case 'HIGH':
      return SEVERITY_HIGH_COLOR;
    case 'MEDIUM':
      return SEVERITY_MEDIUM_COLOR;
    case 'LOW':
      return SEVERITY_LOW_COLOR;
    default:
      return SEVERITY_INFORMATIONAL_COLOR;
  }
};

export const getSeverityColor = (finding: AwsSecurityFinding) => {
  return getSeverityColorByName(finding.Severity?.Label!);
};
