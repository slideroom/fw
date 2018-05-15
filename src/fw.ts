import { makerOf, ContainerInstance } from "./container";
import { ViewEngine, makeVueComponent } from "./view-engine";
import { kebab } from "./util";

import { ViewRouter, Navigator } from "./router";
import { Bus } from "./bus";
import { Network } from "./network";
import Vue, { PluginObject } from "vue";

export function inject(target) { return; }

export function needs(...things: any[]) {
  return function(target) {
    (Reflect as any).defineMetadata("components", things, target);
  }
}

const viewEngine = new ViewEngine(ContainerInstance);

export class FrameworkConfig {
  public starter = null;

  public startWith(view: Function) {
    this.starter = view;
  }

  public registerInstance<T>(key: makerOf<T>, instance: T) {
    ContainerInstance.use(key, instance);
  }

  public registerComponents(...components: any[]) {
    components.forEach(component => {
      Vue.component(kebab(component.name), makeVueComponent(component));
    });
  }

  public async withConfig<T>(configType: makerOf<T>, fileName: string): Promise<T> {
    const n = ContainerInstance.get(Network);
    const res = await n.get(fileName);

    const configInstance = ContainerInstance.get(configType);

    Object.keys(res).forEach(key => {
      configInstance[key] = res[key];
    });

    return configInstance;
  }

  public useVuePlugin<T>(plugin: PluginObject<T> | ((vue: typeof Vue, options?: T) => void)) {
    Vue.use(plugin);
  }
}

export async function bootstrap(cb: (fwConfig: FrameworkConfig) => Promise<void>) {
  const fwConfig = new FrameworkConfig();

  const bus = ContainerInstance.get(Bus);

  await cb(fwConfig);

  if (fwConfig.starter != null) {
    const viewRouter = new ViewRouter(viewEngine, fwConfig.starter);
    ContainerInstance.use(Navigator, new Navigator());
    viewRouter.start();
  }
}
