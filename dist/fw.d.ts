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

}
declare module 'fw/view-engine' {
	import { Container, makerOf, ContainerOverrider } from 'fw/container';
	export class ComponentEventBus {
	    private instance;
	    constructor(instance: any);
	    dispatch(name: string, ...data: any[]): void;
	}
	export function prop(defaultValue: any): (target: any, key: any, descriptor?: any) => void;
	export class View<T> {
	    private viewModel;
	    private template;
	    private activateParams;
	    private r;
	    constructor(viewModel: T, template: string, activateParams?: any);
	    renderTo(element: HTMLElement): void;
	    activate(): Promise<{}>;
	    getRouterSetupFunction(): any;
	    getRouterViewElement(): {
	        node: any;
	        component: any;
	    };
	    remove(kill?: boolean): void;
	}
	export class ViewEngine {
	    private container;
	    private components;
	    constructor(container: Container);
	    private getTemplateFor<T>(c);
	    private setupComponents(c);
	    loadView<T>(c: makerOf<T>, activateParams?: any, overrider?: (o: ContainerOverrider) => void): View<T>;
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
	export interface RouterMiddlware {
	    navigating(route: Route, fullRoute: string): boolean;
	}
	export interface RouterConfig {
	    add(route: string, view: makerOf<any>, data?: any, name?: string): void;
	    addMiddleware(middleware: makerOf<RouterMiddlware>): void;
	    current: string;
	}
	export class RouteMatcher {
	    private routes;
	    private middleware;
	    current: string;
	    add(route: string, view: makerOf<any>, data?: any, name?: any): void;
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
	    view: makerOf<any>;
	    data: any;
	    name: string;
	    constructor(route: string[], view: makerOf<any>, data?: any, name?: string);
	    match(locations: string[]): {
	        match: boolean;
	        remaining: string[];
	        matchedOn: string[];
	    };
	    getParams(locations: string[]): {
	        [key: string]: string;
	    };
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
	export type NVP = {
	    [name: string]: string;
	};
	export class NetworkException<T> {
	    statusCode: number;
	    result: T;
	    url: string;
	    constructor(statusCode: number, result: T, url: string);
	}
	export class Network {
	    private doRequest<T>(method, url, params, headers, content?);
	    private buildParamString(params);
	    post<T>(url: string, headers: NVP, content: any, params?: NVP): Promise<T>;
	    put<T>(url: string, headers: NVP, content: any, params?: NVP): Promise<T>;
	    get<T>(url: string, headers?: NVP, params?: NVP): Promise<T>;
	    delete<T>(url: string, headers?: NVP, params?: NVP): Promise<T>;
	}

}
declare module 'fw/fw' {
	import { makerOf } from 'fw/container';
	export function inject(target: any): void;
	export function needs(...things: any[]): (target: any) => void;
	export class FrameworkConfig {
	    starter: any;
	    startWith(view: Function): void;
	    registerInstance<T>(key: makerOf<T>, instance: T): void;
	    registerComponents(...components: any[]): void;
	    withConfig<T>(configType: makerOf<T>, fileName: string): Promise<T>;
	    useVuePlugin(plugin: {
	        install: Function;
	    }): void;
	}
	export function bootstrap(cb: (fwConfig: FrameworkConfig) => Promise<void>): Promise<void>;

}
declare module 'fw/store' {
	import { makerOf } from 'fw/container';
	import { Subscription } from 'fw/bus';
	export interface HandlerWrapper {
	    handle(method: () => Promise<void> | void, headArgument: any, ...tailArguments: any[]): Promise<void> | void;
	}
	export function handle(fn: any, wrapper?: makerOf<HandlerWrapper>): (target: any, method: any) => void;
	export function waitFor(storeToWaitOn: any): (waiter: any) => void;
	export function dispatch(event: any): Promise<void>;
	export abstract class Store<T> {
	    state: T;
	    private stateSet;
	    private waiters;
	    private localBus;
	    constructor();
	    protected abstract defaultState(): T;
	    protected setState(newState: any): void;
	    wait(): Promise<void>;
	    onStateChanged(cb: () => void): Subscription;
	}

}
declare module 'fw' {
	export { Container, ContainerInstance } from 'fw/container';
	export { Navigator, RouterConfig, Route, ViewRouterLocationChanged } from 'fw/router';
	export { bootstrap, inject, needs, FrameworkConfig } from 'fw/fw';
	export { Bus, Subscription } from 'fw/bus';
	export { dispatch, handle, Store, waitFor } from 'fw/store';
	export { ViewEngine, View, prop, ComponentEventBus } from 'fw/view-engine';
	export { Network, NetworkException, NVP } from 'fw/network';

}
