import { kebab } from "./util";
import { Container, makerOf, ContainerOverrider } from "./container";

import Vue from "vue";


export class ComponentEventBus {
  constructor(private instance: any) { }

  public dispatch(name: string, ...data: any[]) {
    this.instance.$dispatch(name, ...data);
  }
}

type propDef = { key: string, defaultValue: any };

export function prop(defaultValue) {
  return function(target, key, descriptor?) {
    const props: propDef[] = Reflect.get(target.constructor, "view-engine:props") || [];
    props.push({ key, defaultValue });
    Reflect.set(target.constructor, "view-engine:props", props);
  };
}

function getProps(cl) {
  var props: propDef[] = Reflect.get(cl, "view-engine:props") || [];
  let propObject: { [key: string]: vuejs.PropOption } = {};

  props.forEach(p => {
      propObject[p.key] = {
        default: p.defaultValue,
      };
  });

  return propObject;
}

class Component<T> {
  constructor(private container: Container, private viewModel: makerOf<T>, private template: string) { }

  public init() {
    const that = this;

    const props = getProps(this.viewModel);

    return Vue.extend({
      template: this.template,
      data: function() {
        return that.container.get(that.viewModel, false, (o) => {
          o.use(ComponentEventBus, new ComponentEventBus(this));
        });
      },
      props: props,
      created: function() {
        // setup the methods
        this.methods = {};
        for (let m of Object.getOwnPropertyNames(this.$data.constructor.prototype)) {
          if (typeof this.$data[m] == "function" && m != "constructor") {
            const boundFn = this.$data[m].bind(this);
            this.methods[m] = boundFn;
            this[m] = boundFn;
          }
        }

        this.___propWatcherUnscribers = [];

        for (let propName of Object.getOwnPropertyNames(props)) {
          const propWatcherName = propName + "Changed"
          if (typeof this.$data[propWatcherName] == "function") {
            const unsub = this.$watch(propName, this[propWatcherName]);
            this.___propWatcherUnscribers.push(unsub);
          }
        }
      },
      attached: function() {
        if (this.$els)
          Object.assign(this, this.$els);

        const attachedFn = this.$data["attached"];
        if (typeof attachedFn === "function") {
          attachedFn.apply(this, []);
        }
      },
      destroyed: function() {
        const detachedFn = this.$data["detached"];
        if (typeof detachedFn === "function") {
          detachedFn.apply(this, []);
        }

        this.___propWatcherUnscribers.forEach(u => u());
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
  private r: vuejs.Vue = null;

  constructor(private viewModel: T, private template: string, private activateParams = null) { }

  renderTo(element: HTMLElement) {
    const that = this;
    const vm = this.viewModel as any;

    this.r = new Vue({
      el: element,
      replace: false,
      template: this.template,
      data: vm,
      created: function() {
        // setup the methods
        this.methods = {};
        for (let m of Object.getOwnPropertyNames(vm.constructor.prototype)) {
          if (typeof vm[m] == "function" && m != "constructor") {
            const boundFn = vm[m].bind(vm);
            this[m] = boundFn;
            this.methods[m] = boundFn;
          }
        }
      },
      attached: function() {
        if (this.$els)
          Object.assign(this, this.$els);

        const attachedFn = vm["attached"];
        if (typeof attachedFn === "function") attachedFn.apply(this, []);
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
    const component = this.r.$children.find(c => kebab(c.constructor.name) == "router-view");

    if (!component) return { node: null, component: null };

    return { node: component.$el, component };
  }

  remove(kill = true) {
    this.r.$destroy(kill);
  }
}

declare var __webpack_require__: any;

export class ViewEngine {
  private components: Map<Function, boolean> = new Map<Function, boolean>();

  constructor(private container: Container) { }

  private getTemplateFor<T>(c: makerOf<T>): string {
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
    const needs = (Reflect as any).get(c, "components");

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
