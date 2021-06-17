import { kebab } from "./util";
import { Container, makerOf, ContainerOverrider, ContainerInstance } from "./container";

import Vue, { PropOptions } from "vue";


export class ComponentEventBus {
  constructor(private instance: any) { }

  public dispatch(name: string, ...data: any[]) {
    this.instance.$emit(name, ...data);
  }

  public updateModel(value: any) { this.dispatch("input", value); }
}

type propDef = { key: string, defaultValue: any };

export function prop(defaultValue = null) {
  return function(target, key, descriptor?) {
    const props: propDef[] = (Reflect as any).getMetadata("view-engine:props", target.constructor) || [];
    props.push({ key, defaultValue });
    (Reflect as any).defineMetadata("view-engine:props", props, target.constructor);
  };
}

export function provided() { // leaving room for defaults, when upgrading vue
  return function(target, key, descriptor?) {
    const props: propDef[] = (Reflect as any).getMetadata("view-engine:provided", target.constructor) || [];
    props.push({ key, defaultValue: null });
    (Reflect as any).defineMetadata("view-engine:provided", props, target.constructor);
  };
}

function getProps(cl) {
  var props: propDef[] = (Reflect as any).getMetadata("view-engine:props", cl) || [];
  let propObject: { [key: string]: PropOptions } = {};

  props.forEach(p => {
      propObject[p.key] = {
        default: p.defaultValue,
      };
  });

  return propObject;
}

function getProvided(cl) {
  var props: propDef[] = (Reflect as any).getMetadata("view-engine:provided", cl) || [];
  if (props.length == 0) return undefined;

  return props.map(p => p.key);
}

const makeComputedObject = (instance: any) => {
  const obj: any = {};
  const proto = Object.getPrototypeOf(instance);

  for (const property of Object.getOwnPropertyNames(proto)) {
    const descriptor = Object.getOwnPropertyDescriptor(proto, property);
    if (descriptor.get != null && descriptor.set != null) {
      obj[property] = {
        get: descriptor.get,
        set: descriptor.set,
      };
    } else if (descriptor.get != null) {
      obj[property] = descriptor.get;
    }
  }

  return obj;
};

const specialMethods = {
  "provide": true,
};


declare var __webpack_require__: any;
const getTemplateFor = (viewModel: makerOf<any>): string => {
  const template = (<any>viewModel).__template;
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
    if (!__webpack_require__.c[key].exports) continue;
    const exports = __webpack_require__.c[key].exports;

    if (!exports.__html) continue;

    // need to loop through exports to see if what we exported matches c
    for (let exportKey in exports) {
      if (exports[exportKey] !== viewModel) continue;

      const template = exports.__html;
      return template;
    }
  }

  throw new Error(`Can't find template for: ${viewModel.name}`);
};

export const makeVueComponent = (
  viewModel: makerOf<any>,
  onInstanceCreated: (vue: Vue, instance: any) => void = null,
  overrider: (o: ContainerOverrider) => void = null,
): typeof Vue => {
  const props = getProps(viewModel);
  const provided = getProvided(viewModel);

  return Vue.extend({
    name: kebab(viewModel.name),
    template: getTemplateFor(viewModel),
    data: function() {
      const instance = ContainerInstance.get(viewModel, false, (o) => {
        o.use(ComponentEventBus, new ComponentEventBus(this));

        if (overrider != null)
          overrider(o);
      });

      if (onInstanceCreated) {
        onInstanceCreated(this, instance);
      }

      this.$options.computed = makeComputedObject(instance);

      const provide = (instance as any).provide;
      if (provide && typeof provide == "function") {
        this.$options.provide = provide;
      }

      this.$options.methods = {};
      for (let m of Object.getOwnPropertyNames(instance.constructor.prototype)) {
        if (typeof instance[m] == "function" && m != "constructor" && !specialMethods[m]) {
          const boundFn = instance[m].bind(this);
          this.$options.methods[m] = boundFn;
          (this as any)[m] = boundFn;
        }
      }

      const needs = (Reflect as any).getMetadata("components", viewModel);
      if (needs) {
        const components: { [name: string]: any } = {};
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
    created: function() {
      const createdFn = this.$data["created"];
      if (typeof createdFn == "function") {
        createdFn.apply(this, []);
      }

      (this as any).___propWatcherUnscribers = [];

      for (let propName of Object.getOwnPropertyNames(props)) {
        const propWatcherName = propName + "Changed"
        if (typeof this.$data[propWatcherName] == "function") {
          const unsub = this.$watch(propName, this[propWatcherName]);
          (this as any).___propWatcherUnscribers.push(unsub);
        }
      }
    },
    mounted: function() {
      this.$nextTick(() => {
        if (this.$refs)
          Object.assign(this, this.$refs);

        const attachedFn = this.$data["attached"];
        if (typeof attachedFn === "function") {
          attachedFn.apply(this, []);
        }
      });
    },
    destroyed: function() {
      const detachedFn = this.$data["detached"];
      if (typeof detachedFn === "function") {
        detachedFn.apply(this, []);
      }

      (this as any).___propWatcherUnscribers.forEach(u => u());
    },
  });
};

export const makeAndActivate = async (
  viewModel: makerOf<any>,
  where: Element,
  activateData: any = null,
  overrider: (o: ContainerOverrider) => void = null,
) => {
    let activateRes: any = null;
    let dataCreateResolver: () => void = null;
    const dataCreate = new Promise<void>((res) => dataCreateResolver = res);

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
  private components: Map<Function, boolean> = new Map<Function, boolean>();

  constructor(public container: Container) { }

  private getTemplateFor<T>(c: makerOf<T>): string {
    return getTemplateFor(c);
  }

  public registerComponent<T>(c: makerOf<T>) {
    if (this.components.get(c)) return;

    const component = makeVueComponent(c);

    this.components.set(c, true);

    Vue.component(kebab(c.name), component);
  }
}
