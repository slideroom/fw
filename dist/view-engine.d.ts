import { Container, makerOf, ContainerOverrider } from "./container.js";
import Vue from "vue";
export declare class ComponentEventBus {
    private instance;
    constructor(instance: any);
    dispatch(name: string, ...data: any[]): void;
    updateModel(value: any): void;
}
export declare function prop(defaultValue?: any): (target: any, key: any, descriptor?: any) => void;
export declare function provided(defaultValue: any): (target: any, key: any, descriptor?: any) => void;
export declare const makeVueComponent: (viewModel: makerOf<any>, onInstanceCreated?: (vue: Vue, instance: any) => void, overrider?: (o: ContainerOverrider) => void) => typeof Vue;
export declare const makeAndActivate: (viewModel: makerOf<any>, where: Element, activateData?: any, overrider?: (o: ContainerOverrider) => void) => Promise<void>;
export declare class ViewEngine {
    container: Container;
    private components;
    constructor(container: Container);
    private getTemplateFor;
    registerComponent<T>(c: makerOf<T>): void;
}
//# sourceMappingURL=view-engine.d.ts.map