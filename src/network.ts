export type NVP = { [name: string]: string };

export class NetworkException<T> {
  constructor(public statusCode: number, public result: T, public url: string) { }
}

function parseResponse(res) {
  try {
    return res ? JSON.parse(res) : null;
  } catch (err) {
    return null;
  }
}

export class Network {
  private doRequest<T>(method: string, url: string, params: NVP, headers: NVP, content?: any): Promise<T> {
    return new Promise((res, rej) => {
      let p = new XMLHttpRequest();
      p.open(method, url + this.buildParamString(params), true);
      p.setRequestHeader("Content-Type", "application/json");
      p.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
      for (let key in headers) {
        p.setRequestHeader(key, headers[key]);
      }

      // TODO: look at this again when there is no network/bad domain
      //p.addEventListener("readystatechange", (e) => {
      //  const { response, status } = p;

      //  if (!(status >= 200 && status < 300)) {
      //    let parsedRes = parseResponse(response);
      //    rej(new NetworkException(status, parsedRes, url));
      //  }
      //});

      p.addEventListener("loadend", (e) => {
        const { response, status } = p;

        let parsedRes = parseResponse(response);

        if (status >= 200 && status < 300) {
          res(parsedRes);
        } else {
          rej(new NetworkException(status, parsedRes, url));
        }
      });

      p.send(content ? JSON.stringify(content) : undefined);
    });
  }

  private buildParamString(params: NVP) {
    if (params == null) return "";

    let pairs = [];

    for (let key in params) {
      if (params[key]) {
        pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
      }
    }

    if (pairs.length > 0)
      return `?${pairs.join("&")}`;
    else
      return "";
  }

  public post<T>(url: string, headers: NVP = {}, content: any, params: NVP = null): Promise<T> {
    return this.doRequest<T>("POST", url, params, headers, content);
  }

  public put<T>(url: string, headers: NVP = {}, content: any, params: NVP = null): Promise<T> {
    return this.doRequest<T>("PUT", url, params, headers, content);
  }

  public get<T>(url: string, headers: NVP = {}, params: NVP = null): Promise<T> {
    return this.doRequest<T>("GET", url, params, headers);
  }

  public delete<T>(url: string, headers: NVP = {}, params: NVP = null): Promise<T> {
    return this.doRequest<T>("DELETE", url, params, headers);
  }
}
