export interface Config {
  aws?: {
    sso?: {
      /**
       * @visibility frontend
       */
      subdomain: string;
    };
  };
}
