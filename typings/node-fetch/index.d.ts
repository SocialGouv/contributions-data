declare module "node-fetch" {
    export default function fetch(
      url: RequestInfo,
      init?: RequestInit
  ): Promise<Response>;
}
