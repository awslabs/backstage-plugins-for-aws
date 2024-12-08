import { DiscoveryApi, IdentityApi } from "@backstage/core-plugin-api";
import { AwsEcrScanApi } from "./AwsEcrApi";

export class AwsEcrClient implements AwsEcrScanApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly identityApi: IdentityApi;

  public constructor(options: {
    discoveryApi: DiscoveryApi;
    identityApi: IdentityApi;
  }) {
    this.discoveryApi = options.discoveryApi;
    this.identityApi = options.identityApi;
  }
  public async listEcrImages(req: any): Promise<any> {
    try {
      const urlSegment = `v1/entity/${encodeURIComponent(
        req.entityRef.namespace,
      )}/${encodeURIComponent(req.entityRef.kind)}/${encodeURIComponent(
        req.entityRef.name,
      )}/images`;
  
  
      const items = await this.get<any>(urlSegment);
      if (!items.items) {
        return { items: [] };
      }
      return { 
        items: items.items
      };
    } catch (error) {
      console.error(error);
      return { items: [] };
    }
  }
  public async listScanResults(req: any): Promise<any> {
    try {
      const queryString = new URLSearchParams();
      queryString.append("imageTag", req.imageTag as string)
      const urlSegment = `v1/entity/${encodeURIComponent(
        req.entityRef.namespace,
      )}/${encodeURIComponent(req.entityRef.kind)}/${encodeURIComponent(
        req.entityRef.name,
      )}/results?${queryString}`;
  
      const results = await this.get<any>(urlSegment);
      if (!results.results) {
        return { results: {} };
      }
      return { 
        results: results.results
      };  
    } catch (error) {
      console.error(error);
      return { results: {} };
    }
  }

  private async get<T>(path: string): Promise<T> {
    const baseUrl = `${await this.discoveryApi.getBaseUrl('ecr-aws')}/`;
    const url = new URL(path, baseUrl);

    const { token: idToken } = await this.identityApi.getCredentials();
    const response = await fetch(url.toString(), {
      headers: idToken ? { Authorization: `Bearer ${idToken}` } : {},
    });

    if (!response.ok) {
      throw Error(response.statusText);
    }

    return response.json() as Promise<T>;
  }

}