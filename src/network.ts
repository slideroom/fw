import { ContainerInstance, makerOf } from "./container";

export type NVP = { [name: string]: string };

export class NetworkException<T> {
  constructor(
    public statusCode: number,
    public result: T,
    public url: string,
    public headers: NVP = {},
  ) {}
}

function parseResponse(res) {
  try {
    return res ? JSON.parse(res) : null;
  } catch (err) {
    return null;
  }
}

export interface ResponseContext {
  headers: NVP;
  statusCode: number;
  data: any;
}

export interface NetworkResponseMiddleware {
  onResponse(context: ResponseContext);
}

export interface RequestContext {
  addHeader(name: string, value: string);
}

export interface NetworkRequestMiddleware {
  onRequest(context: RequestContext);
}

export type NetworkMiddleware =
  | NetworkRequestMiddleware
  | NetworkResponseMiddleware;

const isResponseMiddleware = (
  instance: NetworkMiddleware,
): instance is NetworkResponseMiddleware => {
  return (
    (instance as any).onResponse &&
    typeof (instance as any).onResponse == "function"
  );
};

const isRequestMiddleware = (
  instance: NetworkMiddleware,
): instance is NetworkRequestMiddleware => {
  return (
    (instance as any).onRequest &&
    typeof (instance as any).onRequest == "function"
  );
};

class ARequestContext implements RequestContext {
  constructor(private request: XMLHttpRequest) {}

  addHeader(name: string, value: string) {
    this.request.setRequestHeader(name, value);
  }
}

class AResponseContext implements ResponseContext {
  public headers: NVP = {};
  public statusCode: number = 0;

  constructor(private request: XMLHttpRequest, public data: any) {
    this.statusCode = request.status;
    this.parseHeaders();
  }

  private parseHeaders() {
    const res: NVP = {};

    this.request.getAllResponseHeaders().trim().split("\n").forEach(line => {
      const index = line.indexOf(":");
      const key = line.slice(0, index).trim().toLowerCase();
      const value = line.slice(index + 1).trim();

      res[key] = value;
    });

    this.headers = res;
  }
}

export class Network {
  private middleware: makerOf<NetworkMiddleware>[] = [];

  public addMiddleware(m: makerOf<NetworkMiddleware>) {
    this.middleware.push(m);
  }

  private doRequest<T>(
    method: string,
    url: string,
    params: NVP,
    content?: any,
  ): Promise<{ headers: NVP, body: T }> {
    return new Promise((res, rej) => {
      const p = new XMLHttpRequest();
      p.open(method, url + this.buildParamString(params), true);
      p.setRequestHeader("Content-Type", "application/json");
      p.setRequestHeader(
        "Accept",
        "application/json, text/javascript, */*; q=0.01",
      );

      if (this.middleware.length > 0) {
        // build context;
        const requestContext: RequestContext = new ARequestContext(p);

        this.middleware.forEach(m => {
          const requestInstance = ContainerInstance.get(m);
          if (isRequestMiddleware(requestInstance)) {
            requestInstance.onRequest(requestContext);
          }
        });
      }

      // TODO: look at this again when there is no network/bad domain
      //p.addEventListener("readystatechange", (e) => {
      //  const { response, status } = p;

      //  if (!(status >= 200 && status < 300)) {
      //    let parsedRes = parseResponse(response);
      //    rej(new NetworkException(status, parsedRes, url));
      //  }
      //});

      p.addEventListener("loadend", e => {
        const { response, status } = p;

        const parsedRes = parseResponse(response);

        // build context;
        const responseContext: ResponseContext = new AResponseContext(
          p,
          parsedRes,
        );

        if (this.middleware.length > 0) {
          this.middleware.reverse().forEach(m => {
            const instance = ContainerInstance.get(m);
            if (isResponseMiddleware(instance)) {
              instance.onResponse(responseContext);
            }
          });
        }

        if (status >= 200 && status < 300) {
          res({ body: parsedRes, headers: responseContext.headers });
        } else {
          rej(new NetworkException(status, parsedRes, url, responseContext.headers));
        }
      });

      p.send(content ? JSON.stringify(content) : undefined);
    });
  }

  private buildParamString(params: NVP) {
    if (params == null) return "";

    const pairs = [];

    for (let key in params) {
      if (params[key] != null) {
        pairs.push(
          encodeURIComponent(key) + "=" + encodeURIComponent(params[key]),
        );
      }
    }

    if (pairs.length > 0) return `?${pairs.join("&")}`;
    else return "";
  }

  public post<T>(
    url: string,
    content: any,
    params: NVP = null,
  ): Promise<{ headers: NVP; body: T }> {
    return this.doRequest<T>("POST", url, params, content);
  }

  public put<T>(
    url: string,
    content: any,
    params: NVP = null,
  ): Promise<{ headers: NVP; body: T }> {
    return this.doRequest<T>("PUT", url, params, content);
  }

  public get<T>(
    url: string,
    params: NVP = null,
  ): Promise<{ headers: NVP; body: T }> {
    return this.doRequest<T>("GET", url, params);
  }

  public delete<T>(
    url: string,
    params: NVP = null,
  ): Promise<{ headers: NVP; body: T }> {
    return this.doRequest<T>("DELETE", url, params);
  }
}
