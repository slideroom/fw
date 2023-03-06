import * as Vue from 'vue';
import Vue__default, { PluginObject } from 'vue';

interface makerOf<T> {
    new (...args: any[]): T;
}
interface ContainerOverrider {
    use<T>(c: makerOf<T>, instance: T): any;
}
declare class Container {
    protected instances: Map<any, any>;
    private getServiceTypes;
    get<T>(t: makerOf<T>, setInstance?: boolean, override?: (o: ContainerOverrider) => void): T;
    protected has(t: makerOf<any>): boolean;
    use<T>(key: makerOf<T>, instance: T): void;
}
declare const ContainerInstance: Container;

declare class ComponentEventBus {
    private instance;
    constructor(instance: any);
    dispatch(name: string, ...data: any[]): void;
    updateModel(value: any): void;
}
declare function prop(defaultValue?: null): (target: any, key: any, descriptor?: any) => void;
declare function provided(defaultValue: any): (target: any, key: any, descriptor?: any) => void;
declare const makeVueComponent: (viewModel: makerOf<any>, onInstanceCreated?: (vue: Vue, instance: any) => void, overrider?: (o: ContainerOverrider) => void) => Vue.App<Element>;
declare const makeAndActivate: (viewModel: makerOf<any>, where: Element, activateData?: any, overrider?: (o: ContainerOverrider) => void) => Promise<void>;
declare class ViewEngine {
    container: Container;
    private components;
    constructor(container: Container);
    private getTemplateFor;
    registerComponent<T>(c: makerOf<T>, app: any): void;
}

type viewMaker<T> = makerOf<T> | {
    (): Promise<makerOf<T>>;
} | {
    (): Promise<{
        default: makerOf<T>;
    }>;
};
interface RouterMiddlware {
    navigating(route: Route, fullRoute: string): boolean;
}
interface RouterConfig {
    add(route: string, view: viewMaker<any>, data?: any, name?: string): void;
    addMiddleware(middleware: makerOf<RouterMiddlware>): void;
    current: string;
    fullLocation: string;
    params: any;
}
declare class Route {
    private route;
    view: viewMaker<any>;
    data: null;
    name: string;
    constructor(route: string[], view: viewMaker<any>, data?: null, name?: string);
    match(locations: string[]): {
        match: boolean;
        remaining: string[];
        matchedOn: string[];
    };
    getParams(locations: string[]): {
        [key: string]: string;
    };
    loadView(): Promise<makerOf<any>>;
}
declare class Navigator {
    constructor();
    navigate(where: string, queryParams?: null): void;
}
declare class ViewRouterLocationChanged {
    location: string;
    constructor(location: string);
}

declare module "vue" {
    type PluginObject<T> = (app: Vue__default.App, ...options: any[]) => any;
}
declare function inject(target: any): void;
declare function needs(...things: any[]): (target: any) => void;
declare class FrameworkConfig {
    starter: null;
    startWith(view: Function): void;
    registerInstance<T>(key: makerOf<T>, instance: T): void;
    registerComponents(components: any[], app: any): void;
    withConfig<T>(configType: makerOf<T>, fileName: string): Promise<T>;
    useVuePlugin<T>(plugin: PluginObject<T> | ((vue: typeof Vue__default, options?: T) => void), app: any): void;
}
declare function bootstrap(cb: (fwConfig: FrameworkConfig) => Promise<void>): Promise<void>;

interface Subscription {
    dispose: () => void;
}
declare class Bus {
    private listeners;
    subscribe<T>(type: makerOf<T>, cb: (message: T) => void): Subscription;
    publish<T>(message: T): void;
}

type NVP = {
    [name: string]: string;
};
declare class NetworkException<T> {
    statusCode: number;
    result: T;
    url: string;
    headers: NVP;
    constructor(statusCode: number, result: T, url: string, headers?: NVP);
}
interface ResponseContext {
    headers: NVP;
    statusCode: number;
    data: any;
}
interface NetworkResponseMiddleware {
    onResponse(context: ResponseContext): any;
}
interface RequestContext {
    addHeader(name: string, value: string): any;
}
interface NetworkRequestMiddleware {
    onRequest(context: RequestContext): any;
}
type NetworkMiddleware = NetworkRequestMiddleware | NetworkResponseMiddleware;
declare class Network {
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

declare function kebab(name: string): string;
declare class CloseStack {
    private theCloseStack;
    constructor();
    enroll(cb: () => void): {
        close: () => void;
        closeAbove: () => void;
    };
    private handleKeyPress;
}

export { Bus, CloseStack, ComponentEventBus, Container, ContainerInstance, FrameworkConfig, NVP, Navigator, Network, NetworkException, NetworkMiddleware, NetworkRequestMiddleware, NetworkResponseMiddleware, RequestContext, ResponseContext, Route, RouterConfig, Subscription, ViewEngine, ViewRouterLocationChanged, bootstrap, inject, kebab, makeAndActivate, makeVueComponent, needs, prop, provided };
//# sourceMappingURL=index.d.ts.map
