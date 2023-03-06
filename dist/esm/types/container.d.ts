export interface makerOf<T> {
    new (...args: any[]): T;
}
export interface ContainerOverrider {
    use<T>(c: makerOf<T>, instance: T): any;
}
export declare class Container {
    protected instances: Map<any, any>;
    private getServiceTypes;
    get<T>(t: makerOf<T>, setInstance?: boolean, override?: (o: ContainerOverrider) => void): T;
    protected has(t: makerOf<any>): boolean;
    use<T>(key: makerOf<T>, instance: T): void;
}
export declare const ContainerInstance: Container;
