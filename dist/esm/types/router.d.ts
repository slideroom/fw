import { makerOf } from "./container";
import { ViewEngine } from "./view-engine";
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
export declare class RouteMatcher {
    private routes;
    private middleware;
    current: string;
    fullLocation: string;
    params: any;
    add(route: string, view: viewMaker<any>, data?: null, name?: null): void;
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
export declare class Route {
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
export declare class Navigator {
    constructor();
    navigate(where: string, queryParams?: null): void;
}
export declare class ViewRouterLocationChanged {
    location: string;
    constructor(location: string);
}
export declare class ViewRouter {
    private viewEngine;
    private starter;
    private loadedViewsStack;
    constructor(viewEngine: ViewEngine, starter: makerOf<any>);
    start(): Promise<void>;
    private changed;
    private clearFrom;
    private runMatching;
    private runView;
}
