import { makerOf } from "./container.js";
import Vue, { PluginObject } from "vue";
export declare function inject(target: any): void;
export declare function needs(...things: any[]): (target: any) => void;
export declare class FrameworkConfig {
    starter: any;
    startWith(view: Function): void;
    registerInstance<T>(key: makerOf<T>, instance: T): void;
    registerComponents(...components: any[]): void;
    withConfig<T>(configType: makerOf<T>, fileName: string): Promise<T>;
    useVuePlugin<T>(plugin: PluginObject<T> | ((vue: typeof Vue, options?: T) => void)): void;
}
export declare function bootstrap(cb: (fwConfig: FrameworkConfig) => Promise<void>): Promise<void>;
//# sourceMappingURL=fw.d.ts.map