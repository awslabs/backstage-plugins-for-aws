import humanizeDuration from 'humanize-duration';
import { parse } from '@aws-sdk/util-arn-parser';

export function formatTime(date: Date | undefined): string {
  if (date) {
    const difference = new Date().getTime() - new Date(date).getTime();
    return `${humanizeDuration(difference, {
      largest: 1,
      round: true,
    })} ago`;
  }
  return '-';
}

export function getTaskId(taskArn: string | undefined): string {
  if (taskArn) {
    const { resource } = parse(taskArn);
    const parts = resource.split('/');
    if (parts.length === 3) {
      return parts[2];
    }
  }
  return '-';
}

export function getTaskDefinition(
  taskDefinitionArn: string | undefined,
): string {
  if (taskDefinitionArn) {
    const { resource } = parse(taskDefinitionArn);
    const parts = resource.split('/');
    if (parts.length === 2) {
      return parts[1];
    }
  }
  return '-';
}

export const stringOrDefault = (value: string | undefined) =>
  value ? value : '-';
