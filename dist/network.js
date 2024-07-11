import { ContainerInstance } from "./container";
export class NetworkException {
    statusCode;
    result;
    url;
    headers;
    constructor(statusCode, result, url, headers = {}) {
        this.statusCode = statusCode;
        this.result = result;
        this.url = url;
        this.headers = headers;
    }
}
function parseResponse(res) {
    try {
        return res ? JSON.parse(res) : null;
    }
    catch (err) {
        return null;
    }
}
const isResponseMiddleware = (instance) => {
    return (instance.onResponse &&
        typeof instance.onResponse == "function");
};
const isRequestMiddleware = (instance) => {
    return (instance.onRequest &&
        typeof instance.onRequest == "function");
};
class ARequestContext {
    request;
    constructor(request) {
        this.request = request;
    }
    addHeader(name, value) {
        this.request.setRequestHeader(name, value);
    }
}
class AResponseContext {
    request;
    data;
    headers = {};
    statusCode = 0;
    constructor(request, data) {
        this.request = request;
        this.data = data;
        this.statusCode = request.status;
        this.parseHeaders();
    }
    parseHeaders() {
        const res = {};
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
    middleware = [];
    addMiddleware(m) {
        this.middleware.push(m);
    }
    doRequest(method, url, params, content) {
        return new Promise((res, rej) => {
            const p = new XMLHttpRequest();
            p.open(method, url + this.buildParamString(params), true);
            // if content is FormData, do nothing, just let the browser do it's thing
            // otherwise, set this thing to json
            if (!(content instanceof FormData)) {
                p.setRequestHeader("Content-Type", "application/json");
            }
            p.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
            if (this.middleware.length > 0) {
                // build context;
                const requestContext = new ARequestContext(p);
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
                const responseContext = new AResponseContext(p, parsedRes);
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
                }
                else {
                    rej(new NetworkException(status, parsedRes, url, responseContext.headers));
                }
            });
            if (content) {
                p.send(content instanceof FormData ? content : JSON.stringify(content));
            }
            else {
                p.send();
            }
        });
    }
    buildParamString(params) {
        if (params == null)
            return "";
        const pairs = [];
        for (let key in params) {
            if (params[key] != null) {
                pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
            }
        }
        if (pairs.length > 0)
            return `?${pairs.join("&")}`;
        else
            return "";
    }
    post(url, content, params = null) {
        return this.doRequest("POST", url, params, content);
    }
    put(url, content, params = null) {
        return this.doRequest("PUT", url, params, content);
    }
    patch(url, content, params = null) {
        return this.doRequest("PATCH", url, params, content);
    }
    get(url, params = null) {
        return this.doRequest("GET", url, params);
    }
    delete(url, params = null) {
        return this.doRequest("DELETE", url, params);
    }
}
//# sourceMappingURL=network.js.map