import { ContainerInstance } from "./container";
import { ViewEngine, makeVueComponent } from "./view-engine";
import { kebab } from "./util";
import { ViewRouter, Navigator } from "./router";
import { Bus } from "./bus";
import { Network } from "./network";
import Vue from "vue";
export function inject(target) { return; }
export function needs(...things) {
    return function (target) {
        Reflect.defineMetadata("components", things, target);
    };
}
const viewEngine = new ViewEngine(ContainerInstance);
export class FrameworkConfig {
    starter = null;
    startWith(view) {
        this.starter = view;
    }
    registerInstance(key, instance) {
        ContainerInstance.use(key, instance);
    }
    registerComponents(...components) {
        components.forEach(component => {
            Vue.component(kebab(component.name), makeVueComponent(component));
        });
    }
    async withConfig(configType, fileName) {
        const n = ContainerInstance.get(Network);
        const { body } = await n.get(fileName);
        const configInstance = ContainerInstance.get(configType);
        Object.keys(body).forEach(key => {
            configInstance[key] = body[key];
        });
        return configInstance;
    }
    useVuePlugin(plugin) {
        Vue.use(plugin);
    }
}
export async function bootstrap(cb) {
    const fwConfig = new FrameworkConfig();
    const bus = ContainerInstance.get(Bus);
    await cb(fwConfig);
    if (fwConfig.starter != null) {
        const viewRouter = new ViewRouter(viewEngine, fwConfig.starter);
        ContainerInstance.use(Navigator, new Navigator());
        viewRouter.start();
    }
}
//# sourceMappingURL=fw.js.map