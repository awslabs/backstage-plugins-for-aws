import { Entity, getCompoundEntityRef } from '@backstage/catalog-model';
import {  useApi } from '@backstage/core-plugin-api';
import { ImageDetail } from '@aws-sdk/client-ecr';
import { useAsync } from 'react-use';
import { awsEcrScanApiRef } from '../api';
import { ECR_ANNOTATION } from '../plugin';

export const useImages = (
  entity: Entity,
): { images?: any; error?: Error; loading: boolean } => {
  const api = useApi(awsEcrScanApiRef);
  const componentKey = entity.metadata?.annotations?.[ECR_ANNOTATION] as string;

  const { value, loading, error } = useAsync(() => {
    return api.listEcrImages({
      entityRef: getCompoundEntityRef(entity),
    });
  }, [componentKey]);

  const items = value?.items.sort((a: ImageDetail, b: ImageDetail) => {
    if (a.imagePushedAt === undefined) {
      return 1;
    }
  
    if (b.imagePushedAt === undefined) {
      return -1;
    }
    const a1 = new Date(a.imagePushedAt).getTime();
    const b1 = new Date(b.imagePushedAt).getTime();
    
    return b1 - a1;
  }) as ImageDetail[]

  return {
    images: {
      items,
    },
    loading,
    error,
  };
}