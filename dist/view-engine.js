import { kebab } from "./util";
import { ContainerInstance } from "./container";
import Vue from "vue";
export class ComponentEventBus {
    instance;
    constructor(instance) {
        this.instance = instance;
    }
    dispatch(name, ...data) {
        this.instance.$emit(name, ...data);
    }
    updateModel(value) { this.dispatch("input", value); }
}
export function prop(defaultValue = null) {
    return function (target, key, descriptor) {
        const props = Reflect.getMetadata("view-engine:props", target.constructor) || [];
        props.push({ key, defaultValue });
        Reflect.defineMetadata("view-engine:props", props, target.constructor);
    };
}
export function provided(defaultValue) {
    return function (target, key, descriptor) {
        const props = Reflect.getMetadata("view-engine:provided", target.constructor) || [];
        props.push({ key, defaultValue: defaultValue });
        Reflect.defineMetadata("view-engine:provided", props, target.constructor);
    };
}
function getProps(cl) {
    var props = Reflect.getMetadata("view-engine:props", cl) || [];
    let propObject = {};
    props.forEach(p => {
        propObject[p.key] = {
            default: p.defaultValue,
        };
    });
    return propObject;
}
function getProvided(cl) {
    const provides = Reflect.getMetadata("view-engine:provided", cl) || [];
    if (provides.length == 0) {
        return undefined;
    }
    const injectObject = {};
    provides.forEach(function (p) {
        injectObject[p.key] = {
            from: p.key,
            default: p.defaultValue
        };
    });
    return injectObject;
}
const makeComputedObject = (instance) => {
    const obj = {};
    const proto = Object.getPrototypeOf(instance);
    for (const property of Object.getOwnPropertyNames(proto)) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, property);
        if (descriptor.get != null && descriptor.set != null) {
            obj[property] = {
                get: descriptor.get,
                set: descriptor.set,
            };
        }
        else if (descriptor.get != null) {
            obj[property] = descriptor.get;
        }
    }
    return obj;
};
const specialMethods = {
    "provide": true,
};
const getTemplateFor = (viewModel) => {
    const template = viewModel.__template;
    if (template != null) {
        if (typeof template === "object" && template.__esModule) {
            const templateValue = template.default;
            if (typeof templateValue === "string") {
                return templateValue;
            }
        }
        else if (typeof template === "string") {
            return template;
        }
    }
    for (let key in __webpack_require__.c) {
        if (!__webpack_require__.c[key].exports)
            continue;
        const exports = __webpack_require__.c[key].exports;
        if (!exports.__html)
            continue;
        // need to loop through exports to see if what we exported matches c
        for (let exportKey in exports) {
            if (exports[exportKey] !== viewModel)
                continue;
            const template = exports.__html;
            return template;
        }
    }
    throw new Error(`Can't find template for: ${viewModel.name}`);
};
export const makeVueComponent = (viewModel, onInstanceCreated = null, overrider = null) => {
    const props = getProps(viewModel);
    const provided = getProvided(viewModel);
    return Vue.extend({
        name: kebab(viewModel.name),
        template: getTemplateFor(viewModel),
        data: function () {
            const instance = ContainerInstance.get(viewModel, false, (o) => {
                o.use(ComponentEventBus, new ComponentEventBus(this));
                if (overrider != null)
                    overrider(o);
            });
            if (onInstanceCreated) {
                onInstanceCreated(this, instance);
            }
            this.$options.computed = makeComputedObject(instance);
            const provide = instance.provide;
            if (provide && typeof provide == "function") {
                this.$options.provide = provide;
            }
            this.$options.methods = {};
            for (let m of Object.getOwnPropertyNames(instance.constructor.prototype)) {
                if (this.$options.computed[m] === undefined && typeof instance[m] == "function" && m != "constructor" && !specialMethods[m]) {
                    const boundFn = instance[m].bind(this);
                    this.$options.methods[m] = boundFn;
                    this[m] = boundFn;
                }
            }
            const needs = Reflect.getMetadata("components", viewModel);
            if (needs) {
                const components = {};
                needs.forEach(need => {
                    components[kebab(need.name)] = makeVueComponent(need);
                });
                Object.assign(this.$options.components, components);
            }
            return instance;
        },
        computed: {},
        props: props,
        inject: provided,
        created: function () {
            const createdFn = this.$data["created"];
            if (typeof createdFn == "function") {
                createdFn.apply(this, []);
            }
            this.___propWatcherUnscribers = [];
            for (let propName of Object.getOwnPropertyNames(props)) {
                const propWatcherName = propName + "Changed";
                if (typeof this.$data[propWatcherName] == "function") {
                    const unsub = this.$watch(propName, this[propWatcherName]);
                    this.___propWatcherUnscribers.push(unsub);
                }
            }
        },
        mounted: function () {
            this.$nextTick(() => {
                if (this.$refs)
                    Object.assign(this, this.$refs);
                const attachedFn = this.$data["attached"];
                if (typeof attachedFn === "function") {
                    attachedFn.apply(this, []);
                }
            });
        },
        beforeDestroy: function beforeDestroy() {
            var detachedFn = this.$data["beforeDetach"];
            if (typeof detachedFn === "function") {
                detachedFn.apply(this, []);
            }
        },
        destroyed: function () {
            const detachedFn = this.$data["detached"];
            if (typeof detachedFn === "function") {
                detachedFn.apply(this, []);
            }
            this.___propWatcherUnscribers.forEach(u => u());
        },
    });
};
export const makeAndActivate = async (viewModel, where, activateData = null, overrider = null) => {
    let activateRes = null;
    let dataCreateResolver = null;
    const dataCreate = new Promise((res) => dataCreateResolver = res);
    const ve = makeVueComponent(viewModel, (vue, instance) => {
        if (typeof instance["activate"] == "function") {
            const activateFn = instance["activate"].bind(instance);
            activateRes = activateFn(activateData);
        }
        dataCreateResolver();
    }, overrider);
    new ve().$mount(where);
    await dataCreate;
};
export class ViewEngine {
    container;
    components = new Map();
    constructor(container) {
        this.container = container;
    }
    getTemplateFor(c) {
        return getTemplateFor(c);
    }
    registerComponent(c) {
        if (this.components.get(c))
            return;
        const component = makeVueComponent(c);
        this.components.set(c, true);
        Vue.component(kebab(c.name), component);
    }
}
//# sourceMappingURL=view-engine.js.map