declare module 'fw/container' {
	export interface makerOf<T> {
	    new (...args: any[]): T;
	}
	export interface ContainerOverrider {
	    use<T>(c: makerOf<T>, instance: T): any;
	}
	export class Container {
	    protected instances: Map<any, any>;
	    private getServiceTypes<T>(t);
	    get<T>(t: makerOf<T>, setInstance?: boolean, override?: (o: ContainerOverrider) => void): T;
	    protected has(t: makerOf<any>): boolean;
	    use<T>(key: makerOf<T>, instance: T): void;
	}
	export const ContainerInstance: Container;

}
declare module 'fw/util' {
	export function kebab(name: string): string;
	export class CloseStack {
	    private theCloseStack;
	    constructor();
	    enroll(cb: () => void): {
	        close: () => void;
	        closeAbove: () => void;
	    };
	    private handleKeyPress(e);
	}

}
declare module 'fw/view-engine' {
	import { Container, makerOf, ContainerOverrider } from 'fw/container';
	export class ComponentEventBus {
	    private instance;
	    constructor(instance: any);
	    dispatch(name: string, ...data: any[]): void;
	    updateModel(value: any): void;
	}
	export function prop(defaultValue?: any): (target: any, key: any, descriptor?: any) => void;
	export function provided(): (target: any, key: any, descriptor?: any) => void;
	export const makeVueComponent: (viewModel: makerOf<any>, onInstanceCreated?: (vue: any, instance: any) => void, overrider?: (o: ContainerOverrider) => void) => any;
	export const makeAndActivate: (viewModel: makerOf<any>, where: Element, activateData?: any, overrider?: (o: ContainerOverrider) => void) => Promise<void>;
	export class ViewEngine {
	    container: Container;
	    private components;
	    constructor(container: Container);
	    private getTemplateFor<T>(c);
	    registerComponent<T>(c: makerOf<T>): void;
	}

}
declare module 'fw/bus' {
	import { makerOf } from 'fw/container';
	export interface Subscription {
	    dispose: () => void;
	}
	export class Bus {
	    private listeners;
	    subscribe<T>(type: makerOf<T>, cb: (message: T) => void): Subscription;
	    publish<T>(message: T): void;
	}

}
declare module 'fw/router' {
	import { makerOf } from 'fw/container';
	import { ViewEngine } from 'fw/view-engine';
	export type viewMaker<T> = makerOf<T> | {
	    (): Promise<makerOf<T>>;
	} | {
	    (): Promise<{
	        default: makerOf<T>;
	    }>;
	};
	export interface RouterMiddlware {
	    navigating(route: Route, fullRoute: string): boolean;
	}
	export interface RouterConfig {
	    add(route: string, view: viewMaker<any>, data?: any, name?: string): void;
	    addMiddleware(middleware: makerOf<RouterMiddlware>): void;
	    current: string;
	    fullLocation: string;
	    params: any;
	}
	export class RouteMatcher {
	    private routes;
	    private middleware;
	    current: string;
	    fullLocation: string;
	    params: any;
	    add(route: string, view: viewMaker<any>, data?: any, name?: any): void;
	    addMiddleware(middleware: makerOf<RouterMiddlware>): void;
	    matches(locations: string[]): {
	        matches: boolean;
	        remaining: string[];
	        params: any;
	        route: Route;
	        matchedOn: string[];
	    };
	    canNavigate(route: Route, fullRoute: string): boolean;
	}
	export class Route {
	    private route;
	    view: viewMaker<any>;
	    data: any;
	    name: string;
	    constructor(route: string[], view: viewMaker<any>, data?: any, name?: string);
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
	export class Navigator {
	    constructor();
	    navigate(where: string, queryParams?: any): void;
	}
	export class ViewRouterLocationChanged {
	    location: string;
	    constructor(location: string);
	}
	export class ViewRouter {
	    private viewEngine;
	    private starter;
	    private loadedViewsStack;
	    constructor(viewEngine: ViewEngine, starter: makerOf<any>);
	    start(): Promise<void>;
	    private changed();
	    private clearFrom(viewStackIndex);
	    private runMatching(location, fullLocation, queryParams, loadedView, viewStackIndex);
	    private runView(view, where, params?);
	}

}
declare module 'fw/network' {
	import { makerOf } from 'fw/container';
	export type NVP = {
	    [name: string]: string;
	};
	export class NetworkException<T> {
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
	export class Network {
	    private middleware;
	    addMiddleware(m: makerOf<NetworkMiddleware>): void;
	    private doRequest<T>(method, url, params, content?);
	    private buildParamString(params);
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

}
declare module 'fw/fw' {
	import { makerOf } from 'fw/container';
	import Vue, { PluginObject } from "vue";
	export function inject(target: any): void;
	export function needs(...things: any[]): (target: any) => void;
	export class FrameworkConfig {
	    starter: any;
	    startWith(view: Function): void;
	    registerInstance<T>(key: makerOf<T>, instance: T): void;
	    registerComponents(...components: any[]): void;
	    withConfig<T>(configType: makerOf<T>, fileName: string): Promise<T>;
	    useVuePlugin<T>(plugin: PluginObject<T> | ((vue: typeof Vue, options?: T) => void)): void;
	}
	export function bootstrap(cb: (fwConfig: FrameworkConfig) => Promise<void>): Promise<void>;

}
declare module 'fw' {
	export { Container, ContainerInstance } from 'fw/container';
	export { Navigator, RouterConfig, Route, ViewRouterLocationChanged } from 'fw/router';
	export { bootstrap, inject, needs, FrameworkConfig } from 'fw/fw';
	export { Bus, Subscription } from 'fw/bus';
	export { ViewEngine, prop, ComponentEventBus, provided, makeVueComponent, makeAndActivate } from 'fw/view-engine';
	export { Network, NetworkException, NVP, NetworkMiddleware, NetworkRequestMiddleware, NetworkResponseMiddleware, RequestContext, ResponseContext } from 'fw/network';
	export { kebab, CloseStack } from 'fw/util';

}
