import { kebab } from "./util";
import { Container, makerOf, ContainerOverrider } from "./container";

import Vue, { PropOptions } from "vue";


export class ComponentEventBus {
  constructor(private instance: any) { }

  public dispatch(name: string, ...data: any[]) {
    this.instance.$emit(name, ...data);
  }

  public updateModel(value: any) { this.dispatch("input", value); }
}

type propDef = { key: string, defaultValue: any };

export function prop(defaultValue) {
  return function(target, key, descriptor?) {
    const props: propDef[] = (Reflect as any).getMetadata("view-engine:props", target.constructor) || [];
    props.push({ key, defaultValue });
    (Reflect as any).defineMetadata("view-engine:props", props, target.constructor);
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

class Component<T> {
  constructor(private container: Container, private viewModel: makerOf<T>, private template: string) { }

  public init() {
    const that = this;

    const props = getProps(this.viewModel);

    return Vue.extend({
      template: this.template,
      data: function() {
        const instance = that.container.get(that.viewModel, false, (o) => {
          o.use(ComponentEventBus, new ComponentEventBus(this));
        });

        this.$options.computed = makeComputedObject(instance);

        return instance;
      },
      computed: {},
      props: props,
      created: function() {
        // setup the methods

        (this as any).methods = {};
        for (let m of Object.getOwnPropertyNames(this.$data.constructor.prototype)) {
          if (typeof this.$data[m] == "function" && m != "constructor") {
            const boundFn = this.$data[m].bind(this);
            (this as any).methods[m] = boundFn;
            this[m] = boundFn;
          }
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
  }
}

function hookUpComponentRefs(r, rViewModel) {
  /*
  const myRefedComponents = r.findAllComponents().filter(c => c.parent === r && c.get().ref);
  myRefedComponents.forEach(c => {
    rViewModel[c.get().ref] = c.__instance;
  });
 */
}

export class View<T> {
  private r: Vue = null;

  constructor(private viewModel: T, private template: string, private activateParams = null) { }

  renderTo(element: HTMLElement) {
    const that = this;
    const vm = this.viewModel as any;

    this.r = new Vue({
      el: element,
      template: this.template,
      data: vm,
      computed: makeComputedObject(vm),
      created: function() {
        // setup the methods
        (this as any).methods = {};
        for (let m of Object.getOwnPropertyNames(vm.constructor.prototype)) {
          if (typeof vm[m] == "function" && m != "constructor") {
            const boundFn = vm[m].bind(vm);
            this[m] = boundFn;
            (this as any).methods[m] = boundFn;
          }
        }
      },
      mounted: function() {
        this.$nextTick(() => {
          if (this.$refs)
            Object.assign(this, this.$refs);

          const attachedFn = vm["attached"];
          if (typeof attachedFn === "function") attachedFn.apply(this, []);
        });
      },
      destroyed: function() {
        const detachedFn = vm["detached"];
        if (typeof detachedFn === "function") {
          detachedFn.apply(this, []);
        }
      },
    });
  }

  activate() {
    const vm = this.viewModel as any;

    return new Promise((res, rej) => {
      const activateFn = vm["activate"];
      if (typeof activateFn === "function") {
        const activateRes = activateFn.apply(vm, [this.activateParams]);
        if (activateRes instanceof Promise) {
          activateRes.then(res);
        } else {
          res();
        }
      } else {
        res();
      }
    });
  }

  getRouterSetupFunction() {
    const vm = this.viewModel as any;

    if (typeof vm["registerRoutes"] == "function") {
      return vm["registerRoutes"].bind(vm);
    }

    return null;
  }

  getRouterViewElement() {
    return this.r.$children.find(c => c.$el.children && c.$el.children.length == 1 && c.$el.children[0].className == "__router_view");
  }

  remove() {
    this.r.$destroy();
  }
}

declare var __webpack_require__: any;

export class ViewEngine {
  private components: Map<Function, boolean> = new Map<Function, boolean>();

  constructor(private container: Container) { }

  private getTemplateFor<T>(c: makerOf<T>): string {
    if ((<any>c).__template != null && (typeof (<any>c).__template == "string")) {
      return (<any>c).__template;
    }

    for (let key in __webpack_require__.c) {
      if (!__webpack_require__.c[key].exports) continue;
      const exports = __webpack_require__.c[key].exports;

      if (!exports.__html) continue;

      // need to loop through exports to see if what we exported matches c
      for (let exportKey in exports) {
        if (exports[exportKey] !== c) continue;

        const template = exports.__html;
        return template;
      }
    }

    throw new Error("Can't find template");
  }

  private setupComponents(c: any) {
    const needs = (Reflect as any).getMetadata("components", c);

    if (needs == null) return;

    needs.forEach(need => this.registerComponent(need));
  }

  public loadView<T>(c: makerOf<T>, activateParams = null, overrider?: (o: ContainerOverrider) => void): View<T> {
    const template = this.getTemplateFor(c);
    const viewModel = this.container.get(c, false, overrider);
    this.setupComponents(c);
    return new View(viewModel, template, activateParams);
  }

  public registerComponent<T>(c: makerOf<T>) {
    if (this.components.get(c)) return;

    const template = this.getTemplateFor(c);
    const component = new Component(this.container, c, template);
    this.setupComponents(c);

    this.components.set(c, true);

    Vue.component(kebab(c.name), component.init());
  }
}
