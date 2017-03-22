import { makerOf, ContainerInstance } from "./container";
import { ViewEngine } from "./view-engine";

import { ViewRouter, Navigator } from "./router";
import { Bus } from "./bus";
import { Network } from "./network";
import Vue, { PluginObject } from "vue";

export function inject(target) { return; }

export function needs(...things: any[]) {
  return function(target) {
    (Reflect as any).set(target, "components", things);
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
    components.forEach(component => viewEngine.registerComponent(component));
  }

  public async withConfig<T>(configType: makerOf<T>, fileName: string): Promise<T> {
    const n = ContainerInstance.get(Network);
    const res = await n.get(fileName);

    const configInstance = ContainerInstance.get(configType);

    for (let prop of Object.keys(res)) {
      configInstance[prop] = res[prop];
    }

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
