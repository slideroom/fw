import { makerOf } from "./container.js";
export interface Subscription {
    dispose: () => void;
}
export declare class Bus {
    private listeners;
    subscribe<T>(type: makerOf<T>, cb: (message: T) => void): Subscription;
    publish<T>(message: T): void;
}
//# sourceMappingURL=bus.d.ts.map