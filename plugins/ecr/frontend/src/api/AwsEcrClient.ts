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
    const queryString = new URLSearchParams();
    queryString.append("componentKey", req.componentKey)
    const urlSegment = `v1/images?${queryString}`;

    const items = await this.get<any>(urlSegment);
    return { 
      items: items.items
    };
  }
  public async listScanResults(req: any): Promise<any> {
    const queryString = new URLSearchParams();
    queryString.append("componentKey", req.componentKey)
    queryString.append("imageTag", req.imageTag as string)
    const urlSegment = `v1/images/results?${queryString}`;

    const results = await this.get<any>(urlSegment);

    return { 
      results: results.results
    };  
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