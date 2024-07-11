import { kebab } from "./util.js";
import { ContainerInstance } from "./container.js";
import { makeVueComponent } from "./view-engine.js";
import { Bus } from "./bus.js";
import Vue from "vue";
// we need a quick router-view component
Vue.component("router-view", {
    functional: true,
    render: function (_, ctx) {
        ctx.data.routerView = true;
        const h = ctx.parent.$createElement;
        const component = ctx.parent._routeComponent;
        return h(component, ctx.data, ctx.children);
    },
});
function arrayEqual(arr1, arr2) {
    if (arr1 == null && arr2 != null)
        return false;
    if (arr2 == null && arr1 != null)
        return false;
    if (arr1.length != arr2.length)
        return false;
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i])
            return false;
    }
    return true;
}
function parseQueryParams(str) {
    if (str.indexOf("?") == -1)
        return { withoutQueryParams: str, params: {} };
    const strSplit = str.split("?");
    const paramsSplit = strSplit[1].split("&");
    let params = {};
    paramsSplit.forEach(p => {
        const split = p.split("=");
        params[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
    });
    return { withoutQueryParams: strSplit[0], params };
}
export class RouteMatcher {
    routes = [];
    middleware = [];
    current = "";
    fullLocation = "";
    params = null;
    add(route, view, data = null, name = null) {
        this.routes.push(new Route(route.split("/"), view, data));
    }
    addMiddleware(middleware) {
        this.middleware.push(middleware);
    }
    matches(locations) {
        for (let i = 0; i < this.routes.length; i++) {
            const m = this.routes[i].match(locations);
            if (m.match) {
                const params = this.routes[i].getParams(locations);
                const { remaining, matchedOn } = m;
                return {
                    matches: true,
                    remaining,
                    params,
                    route: this.routes[i],
                    matchedOn,
                };
            }
        }
        return null;
    }
    canNavigate(route, fullRoute) {
        if (this.middleware.length == 0)
            return true;
        for (let i = 0; i < this.middleware.length; i++) {
            const mw = ContainerInstance.get(this.middleware[i], false);
            const res = mw.navigating(route, fullRoute);
            if (res == false)
                return false;
        }
        return true;
    }
}
const NoMatch = { match: false, remaining: [], matchedOn: [] };
export class Route {
    route;
    view;
    data;
    name;
    constructor(route, view, data = null, name = null) {
        this.route = route;
        this.view = view;
        this.data = data;
        this.name = name;
    }
    match(locations) {
        let matchUpTo = 0;
        if (this.route.length > locations.length)
            return NoMatch;
        for (let i = 0; i < locations.length && i < this.route.length; i++) {
            matchUpTo += 1;
            if (this.route[i].charAt(0) == ":") {
                // its a param, move along!
                continue;
            }
            if (this.route[i].toLowerCase() != locations[i].toLowerCase())
                return NoMatch;
        }
        const remaining = locations.slice(matchUpTo);
        const matchedOn = locations.slice(0, matchUpTo);
        return { match: true, remaining, matchedOn };
    }
    getParams(locations) {
        let params = {};
        for (let i = 0; i < locations.length && i < this.route.length; i++) {
            if (this.route[i].charAt(0) == ":") {
                const key = this.route[i].substr(1);
                params[key] = locations[i];
            }
        }
        return params;
    }
    async loadView() {
        if (this.view.__template) {
            this.name = this.name || kebab(this.view.name);
            return this.view;
        }
        else {
            // maybe it is a promise?
            let res = this.view();
            if (res instanceof Promise) {
                res = await res;
            }
            if (res.default && res.default.__template)
                res = res.default;
            this.name = this.name || kebab(res.name);
            return res;
        }
    }
}
export class Navigator {
    constructor() { }
    navigate(where, queryParams = null) {
        let paramsStr = "";
        if (queryParams) {
            paramsStr = "?";
            let params = [];
            for (let key in queryParams) {
                params.push(`${encodeURIComponent(key)}=${encodeURIComponent(queryParams[key])}`);
            }
            paramsStr += params.join("&");
        }
        document.location.hash = where + paramsStr;
    }
}
const bus = ContainerInstance.get(Bus);
export class ViewRouterLocationChanged {
    location;
    constructor(location) {
        this.location = location;
    }
}
const iEVersion = () => {
    const ua = window.navigator.userAgent;
    const msie = ua.indexOf("MSIE ");
    if (msie > 0) {
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
    const trident = ua.indexOf('Trident/');
    if (trident > 0) {
        const rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
    const edge = ua.indexOf('Edge/');
    if (edge > 0) {
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }
    return -1;
};
export class ViewRouter {
    viewEngine;
    starter;
    loadedViewsStack = [];
    constructor(viewEngine, starter) {
        this.viewEngine = viewEngine;
        this.starter = starter;
        if (iEVersion() == 11) {
            window.addEventListener("hashchange", this.changed.bind(this));
        }
        else {
            window.addEventListener("popstate", this.changed.bind(this));
        }
    }
    async start() {
        const starterView = await this.runView(this.starter, document.getElementById("root"));
        if (starterView.router) {
            this.loadedViewsStack.push({
                matchedOn: null,
                queryParams: null,
                router: starterView.router,
                destroy: starterView.destroy,
                view: starterView.view,
                component: starterView.component,
                vueInstance: starterView.vueInstance,
            });
        }
        this.changed();
    }
    changed() {
        const fullLocation = document.location.hash.replace(/^#\/?/, "");
        // TODO: we probably want to change to to only publish when it was success
        //       example: when middleware runs and it cannot navigate
        bus.publish(new ViewRouterLocationChanged(fullLocation));
        const { withoutQueryParams, params } = parseQueryParams(fullLocation);
        const location = withoutQueryParams.split("/");
        // kick it off and see what happens
        if (this.loadedViewsStack.length > 0) {
            window.scrollTo(0, 0);
            this.loadedViewsStack.forEach(lv => {
                if (lv.router != null)
                    lv.router.fullLocation = fullLocation;
            });
            this.runMatching(location, fullLocation, params, this.loadedViewsStack[0], 0);
        }
    }
    clearFrom(viewStackIndex) {
        if (this.loadedViewsStack.length <= viewStackIndex)
            return;
        const loadedView = this.loadedViewsStack[viewStackIndex];
        // i need to go through all of the elements above the index and trigger an unrender
        this.loadedViewsStack.forEach((v, idx) => {
            if (idx > viewStackIndex && v.destroy) {
                v.destroy();
            }
        });
        this.loadedViewsStack.splice(viewStackIndex + 1);
    }
    async runMatching(location, fullLocation, queryParams, loadedView, viewStackIndex) {
        if (loadedView.router == null)
            return;
        loadedView.router.fullLocation = fullLocation;
        let match = loadedView.router.matches(location);
        if (match == null || match.matches == false) {
            // check to see if there is a root/empty route before we give up
            if (location.length == 0 && loadedView.router.matches([""])) {
                match = loadedView.router.matches([""]);
            }
            else {
                // lets clear the routerView if we need too
                this.clearFrom(viewStackIndex);
                return;
            }
        }
        // ok, run the middle ware??
        if (loadedView.router.canNavigate(match.route, fullLocation) == false) {
            //this.clearFrom(viewStackIndex);
            return;
        }
        // if the matched on is where we are at, move along
        const hasMoreInStack = this.loadedViewsStack.length > viewStackIndex + 1;
        if (hasMoreInStack) {
            const nextLView = this.loadedViewsStack[viewStackIndex + 1];
            const matchQueryParams = JSON.stringify(this.loadedViewsStack.length <= viewStackIndex + 2 ? queryParams : {});
            if (arrayEqual(nextLView.matchedOn, match.matchedOn) &&
                nextLView.queryParams == matchQueryParams) {
                const idx = viewStackIndex + 1;
                await this.runMatching(match.remaining, fullLocation, queryParams, this.loadedViewsStack[idx], idx);
                return;
            }
        }
        this.clearFrom(viewStackIndex);
        const view = await match.route.loadView();
        loadedView.router.current = match.route.name;
        loadedView.router.params = Object.assign({}, match.route.data, queryParams, match.params);
        const newElement = await this.runView(view, loadedView.vueInstance, Object.assign({}, match.route.data, queryParams, match.params));
        this.loadedViewsStack.push({
            matchedOn: match.matchedOn,
            queryParams: JSON.stringify(match.remaining.length == 0 ? queryParams : {}),
            router: newElement.router,
            view: match.route.view,
            destroy: newElement.destroy,
            component: newElement.component,
            vueInstance: newElement.vueInstance,
        });
        const idx = viewStackIndex + 1;
        await this.runMatching(match.remaining, fullLocation, queryParams, this.loadedViewsStack[idx], idx);
    }
    async runView(view, where, params = null) {
        let router = null;
        let setupRes = null;
        let activateRes = null;
        let vueInstance = null;
        let dataCreateResolver = null;
        const dataCreate = new Promise((res) => dataCreateResolver = res);
        const component = makeVueComponent(view, (vue, instance) => {
            vueInstance = vue;
            if (typeof instance["activate"] == "function") {
                const activateFn = instance["activate"].bind(instance);
                activateRes = activateFn(params);
            }
            if (typeof instance["registerRoutes"] == "function") {
                const routerSetup = instance["registerRoutes"].bind(instance);
                router = new RouteMatcher();
                setupRes = routerSetup(router);
            }
            dataCreateResolver();
        });
        if (where instanceof Vue) {
            where._routeComponent = component;
            where.$forceUpdate();
        }
        else {
            new component().$mount(where);
        }
        await dataCreate;
        if (setupRes instanceof Promise) {
            await setupRes;
        }
        if (activateRes instanceof Promise) {
            await activateRes;
        }
        return {
            router,
            component,
            view,
            vueInstance,
            destroy: () => {
                if (where instanceof Vue) {
                    where._routeComponent = null;
                    where.$forceUpdate();
                }
            },
        };
        /*
    
        const v = this.viewEngine.loadView(view, params);
    
        const routerSetup = v.getRouterSetupFunction();
    
        let didRender = false;
    
        let router: RouteMatcher = null;
        if (routerSetup) {
          router = new RouteMatcher();
          const setupRes = routerSetup(router);
          if (setupRes instanceof Promise) {
            // go ahead and render the view, so if you wanted to, you can show a loader if you are
            // doing some sort of code splitting
            if (where instanceof Vue)
              v.renderIn(where);
            else
              v.renderTo(where);
    
            didRender = true;
    
            await setupRes;
          }
        }
    
        if (!didRender) {
          if (where instanceof Vue)
            v.renderIn(where);
          else
            v.renderTo(where);
        }
    
        await v.activate();
    
        const routerElementComponent = v.getRouterViewComponent();
    
        return { view, router, routerElementComponent, viewInstance: v };
        */
    }
}
//# sourceMappingURL=router.js.map