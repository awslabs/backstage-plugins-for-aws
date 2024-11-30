import { Entity } from '@backstage/catalog-model';
import {  useApi } from '@backstage/core-plugin-api';
import { useAsync } from 'react-use';
import { awsEcrScanApiRef } from '../api';
import { ECR_ANNOTATION } from '../plugin';


export const useImageScanResults = (
  entity: Entity,
  imageTag: string,
): { results?: any; error?: Error; loading: boolean } => {
  const api = useApi(awsEcrScanApiRef);
  const componentKey = entity.metadata?.annotations?.[ECR_ANNOTATION] as string;

  const { value, loading, error } = useAsync(() => {
    return api.listScanResults({
      componentKey: componentKey,
      imageTag: imageTag,
    });
  }, [componentKey]);

  return {
    results: value,
    loading,
    error,
  };
}