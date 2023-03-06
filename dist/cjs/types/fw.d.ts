import { makerOf } from "./container";
import Vue, { PluginObject } from "vue";
declare module "vue" {
    type PluginObject<T> = (app: Vue.App, ...options: any[]) => any;
}
export declare function inject(target: any): void;
export declare function needs(...things: any[]): (target: any) => void;
export declare class FrameworkConfig {
    starter: null;
    startWith(view: Function): void;
    registerInstance<T>(key: makerOf<T>, instance: T): void;
    registerComponents(components: any[], app: any): void;
    withConfig<T>(configType: makerOf<T>, fileName: string): Promise<T>;
    useVuePlugin<T>(plugin: PluginObject<T> | ((vue: typeof Vue, options?: T) => void), app: any): void;
}
export declare function bootstrap(cb: (fwConfig: FrameworkConfig) => Promise<void>): Promise<void>;
