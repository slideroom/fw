import { makerOf } from "./container";
export type NVP = {
    [name: string]: string;
};
export declare class NetworkException<T> {
    statusCode: number;
    result: T;
    url: string;
    headers: NVP;
    constructor(statusCode: number, result: T, url: string, headers?: NVP);
}
export interface ResponseContext {
    headers: NVP;
    statusCode: number;
    data: any;
}
export interface NetworkResponseMiddleware {
    onResponse(context: ResponseContext): any;
}
export interface RequestContext {
    addHeader(name: string, value: string): any;
}
export interface NetworkRequestMiddleware {
    onRequest(context: RequestContext): any;
}
export type NetworkMiddleware = NetworkRequestMiddleware | NetworkResponseMiddleware;
export declare class Network {
    private middleware;
    addMiddleware(m: makerOf<NetworkMiddleware>): void;
    private doRequest;
    private buildParamString;
    post<T>(url: string, content: any, params?: NVP): Promise<{
        headers: NVP;
        body: T;
    }>;
    put<T>(url: string, content: any, params?: NVP): Promise<{
        headers: NVP;
        body: T;
    }>;
    patch<T>(url: string, content: any, params?: NVP): Promise<{
        headers: NVP;
        body: T;
    }>;
    get<T>(url: string, params?: NVP): Promise<{
        headers: NVP;
        body: T;
    }>;
    delete<T>(url: string, params?: NVP): Promise<{
        headers: NVP;
        body: T;
    }>;
}
