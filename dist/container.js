class ContainerOverride {
    overrideMap = new Map();
    use(c, instance) {
        this.overrideMap.set(c, instance);
    }
    get(c) {
        return this.overrideMap.get(c);
    }
}
export class Container {
    instances = new Map();
    getServiceTypes(t) {
        return Reflect.getMetadata("design:paramtypes", t) || [];
    }
    get(t, setInstance = true, override) {
        if (this.instances.get(t))
            return this.instances.get(t);
        const overrider = new ContainerOverride();
        if (override) {
            override(overrider);
        }
        const injectedTypes = this.getServiceTypes(t).map(tt => {
            const overrideType = overrider.get(tt);
            if (overrideType)
                return overrideType;
            return this.get(tt);
        });
        const instance = new (Function.prototype.bind.apply(t, [null, ...injectedTypes]));
        if (setInstance)
            this.use(t, instance);
        return instance;
    }
    has(t) {
        return this.instances.get(t) != null;
    }
    use(key, instance) {
        this.instances.set(key, instance);
    }
}
export const ContainerInstance = new Container();
//# sourceMappingURL=container.js.map