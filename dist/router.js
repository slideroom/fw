"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _util = require("./util");

var _container = require("./container");

var _bus = require("./bus");

var _vue = require("vue");

var _vue2 = _interopRequireDefault(_vue);

// we need a quick router-view component
var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
_vue2["default"].component("router-view", {
    template: "<div class='__router_view'></div>"
});
function arrayEqual(arr1, arr2) {
    if (arr1 == null && arr2 != null) return false;
    if (arr2 == null && arr1 != null) return false;
    if (arr1.length != arr2.length) return false;
    for (var i = 0; i < arr1.length; i++) {
        if (arr1[i] != arr2[i]) return false;
    }
    return true;
}
function parseQueryParams(str) {
    if (str.indexOf("?") == -1) return { withoutQueryParams: str, params: {} };
    var strSplit = str.split("?");
    var paramsSplit = strSplit[1].split("&");
    var params = {};
    paramsSplit.forEach(function (p) {
        var split = p.split("=");
        params[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
    });
    return { withoutQueryParams: strSplit[0], params: params };
}

var RouteMatcher = (function () {
    function RouteMatcher() {
        _classCallCheck(this, RouteMatcher);

        this.routes = [];
        this.middleware = [];
        this.current = "";
    }

    _createClass(RouteMatcher, [{
        key: "add",
        value: function add(route, view) {
            var data = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
            var name = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

            this.routes.push(new Route(route.split("/"), view, data));
        }
    }, {
        key: "addMiddleware",
        value: function addMiddleware(middleware) {
            this.middleware.push(middleware);
        }
    }, {
        key: "matches",
        value: function matches(locations) {
            for (var i = 0; i < this.routes.length; i++) {
                var m = this.routes[i].match(locations);
                if (m.match) {
                    var params = this.routes[i].getParams(locations);
                    var remaining = m.remaining;
                    var matchedOn = m.matchedOn;

                    return { matches: true, remaining: remaining, params: params, route: this.routes[i], matchedOn: matchedOn };
                }
            }
            return null;
        }
    }, {
        key: "canNavigate",
        value: function canNavigate(route, fullRoute) {
            if (this.middleware.length == 0) return true;
            for (var i = 0; i < this.middleware.length; i++) {
                var mw = _container.ContainerInstance.get(this.middleware[i], false);
                var res = mw.navigating(route, fullRoute);
                if (res == false) return false;
            }
            return true;
        }
    }]);

    return RouteMatcher;
})();

exports.RouteMatcher = RouteMatcher;

var NoMatch = { match: false, remaining: [], matchedOn: [] };

var Route = (function () {
    function Route(route, view) {
        var data = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];
        var name = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

        _classCallCheck(this, Route);

        this.route = route;
        this.view = view;
        this.data = data;
        this.name = name;
        this.name = this.name || (0, _util.kebab)(view.name);
    }

    _createClass(Route, [{
        key: "match",
        value: function match(locations) {
            var matchUpTo = 0;
            if (this.route.length > locations.length) return NoMatch;
            for (var i = 0; i < locations.length && i < this.route.length; i++) {
                matchUpTo += 1;
                if (this.route[i].charAt(0) == ":") {
                    // its a param, move along!
                    continue;
                }
                if (this.route[i].toLowerCase() != locations[i].toLowerCase()) return NoMatch;
            }
            var remaining = locations.slice(matchUpTo);
            var matchedOn = locations.slice(0, matchUpTo);
            return { match: true, remaining: remaining, matchedOn: matchedOn };
        }
    }, {
        key: "getParams",
        value: function getParams(locations) {
            var params = {};
            for (var i = 0; i < locations.length && i < this.route.length; i++) {
                if (this.route[i].charAt(0) == ":") {
                    var key = this.route[i].substr(1);
                    params[key] = locations[i];
                }
            }
            return params;
        }
    }]);

    return Route;
})();

exports.Route = Route;

var Navigator = (function () {
    function Navigator() {
        _classCallCheck(this, Navigator);
    }

    _createClass(Navigator, [{
        key: "navigate",
        value: function navigate(where) {
            var queryParams = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

            var paramsStr = "";
            if (queryParams) {
                paramsStr = "?";
                var params = [];
                for (var key in queryParams) {
                    params.push(encodeURIComponent(key) + "=" + encodeURIComponent(queryParams[key]));
                }
                paramsStr += params.join("&");
            }
            document.location.hash = where + paramsStr;
        }
    }]);

    return Navigator;
})();

exports.Navigator = Navigator;

var bus = _container.ContainerInstance.get(_bus.Bus);

var ViewRouterLocationChanged = function ViewRouterLocationChanged(location) {
    _classCallCheck(this, ViewRouterLocationChanged);

    this.location = location;
};

exports.ViewRouterLocationChanged = ViewRouterLocationChanged;

var ViewRouter = (function () {
    function ViewRouter(viewEngine, starter) {
        _classCallCheck(this, ViewRouter);

        this.viewEngine = viewEngine;
        this.starter = starter;
        this.loadedViewsStack = [];
        window.addEventListener('popstate', this.changed.bind(this));
    }

    _createClass(ViewRouter, [{
        key: "start",
        value: function start() {
            return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function callee$2$0() {
                var starterView;
                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            context$3$0.next = 2;
                            return this.runView(this.starter, document.getElementById("root"));

                        case 2:
                            starterView = context$3$0.sent;

                            if (starterView.router) {
                                this.loadedViewsStack.push({
                                    matchedOn: null,
                                    queryParams: null,
                                    router: starterView.router,
                                    routerElement: starterView.routerElement,
                                    routerElementComponent: starterView.routerElementComponent,
                                    view: starterView.view,
                                    viewInstance: starterView.viewInstance
                                });
                            }
                            this.changed();

                        case 5:
                        case "end":
                            return context$3$0.stop();
                    }
                }, callee$2$0, this);
            }));
        }
    }, {
        key: "changed",
        value: function changed() {
            var fullLocation = document.location.hash.replace(/^#\/?/, "");
            // TODO: we probably want to change to to only publish when it was success
            //       example: when middleware runs and it cannot navigate
            bus.publish(new ViewRouterLocationChanged(fullLocation));

            var _parseQueryParams = parseQueryParams(fullLocation);

            var withoutQueryParams = _parseQueryParams.withoutQueryParams;
            var params = _parseQueryParams.params;

            var location = withoutQueryParams.split("/");
            // kick it off and see what happens
            if (this.loadedViewsStack.length > 0) {
                window.scrollTo(0, 0);
                this.runMatching(location, fullLocation, params, this.loadedViewsStack[0], 0);
            }
        }
    }, {
        key: "clearFrom",
        value: function clearFrom(viewStackIndex) {
            if (this.loadedViewsStack.length <= viewStackIndex) return;
            var loadedView = this.loadedViewsStack[viewStackIndex];
            // i need to go through all of the elements above the index and trigger an unrender
            this.loadedViewsStack.forEach(function (v, idx) {
                if (idx > viewStackIndex && v.viewInstance) {
                    v.viewInstance.remove(false);
                }
            });
            if (loadedView.routerElementComponent) {
                loadedView.routerElementComponent.$destroy();
                loadedView.routerElement.innerHTML = "";
            }
            this.loadedViewsStack.splice(viewStackIndex + 1);
        }
    }, {
        key: "runMatching",
        value: function runMatching(location, fullLocation, queryParams, loadedView, viewStackIndex) {
            return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function callee$2$0() {
                var match, hasMoreInStack, nextLView, matchQueryParams, _idx, newElement, idx;

                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            if (!(loadedView.router == null)) {
                                context$3$0.next = 2;
                                break;
                            }

                            return context$3$0.abrupt("return");

                        case 2:
                            match = loadedView.router.matches(location);

                            if (!(match == null || match.matches == false)) {
                                context$3$0.next = 10;
                                break;
                            }

                            if (!(location.length == 0 && loadedView.router.matches([""]))) {
                                context$3$0.next = 8;
                                break;
                            }

                            match = loadedView.router.matches([""]);
                            context$3$0.next = 10;
                            break;

                        case 8:
                            // lets clear the routerView if we need too
                            this.clearFrom(viewStackIndex);
                            return context$3$0.abrupt("return");

                        case 10:
                            if (!(loadedView.router.canNavigate(match.route, fullLocation) == false)) {
                                context$3$0.next = 12;
                                break;
                            }

                            return context$3$0.abrupt("return");

                        case 12:
                            hasMoreInStack = this.loadedViewsStack.length > viewStackIndex + 1;

                            if (!hasMoreInStack) {
                                context$3$0.next = 21;
                                break;
                            }

                            nextLView = this.loadedViewsStack[viewStackIndex + 1];
                            matchQueryParams = JSON.stringify(this.loadedViewsStack.length <= viewStackIndex + 2 ? queryParams : {});

                            if (!(arrayEqual(nextLView.matchedOn, match.matchedOn) && nextLView.queryParams == matchQueryParams)) {
                                context$3$0.next = 21;
                                break;
                            }

                            _idx = viewStackIndex + 1;
                            context$3$0.next = 20;
                            return this.runMatching(match.remaining, fullLocation, queryParams, this.loadedViewsStack[_idx], _idx);

                        case 20:
                            return context$3$0.abrupt("return");

                        case 21:
                            this.clearFrom(viewStackIndex);
                            if (loadedView.router) {
                                loadedView.router.current = match.route.name;
                            }
                            context$3$0.next = 25;
                            return this.runView(match.route.view, loadedView.routerElement, Object.assign({}, match.route.data, queryParams, match.params));

                        case 25:
                            newElement = context$3$0.sent;

                            this.loadedViewsStack.push({
                                matchedOn: match.matchedOn,
                                queryParams: JSON.stringify(match.remaining.length == 0 ? queryParams : {}),
                                router: newElement.router,
                                routerElement: newElement.routerElement,
                                routerElementComponent: newElement.routerElementComponent,
                                view: match.route.view,
                                viewInstance: newElement.viewInstance
                            });
                            idx = viewStackIndex + 1;
                            context$3$0.next = 30;
                            return this.runMatching(match.remaining, fullLocation, queryParams, this.loadedViewsStack[idx], idx);

                        case 30:
                        case "end":
                            return context$3$0.stop();
                    }
                }, callee$2$0, this);
            }));
        }
    }, {
        key: "runView",
        value: function runView(view, where) {
            var params = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

            return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function callee$2$0() {
                var v, routerSetup, didRender, router, setupRes, _v$getRouterViewElement, routerElement, routerElementComponent;

                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            v = this.viewEngine.loadView(view, params);
                            routerSetup = v.getRouterSetupFunction();
                            didRender = false;
                            router = null;

                            if (!routerSetup) {
                                context$3$0.next = 12;
                                break;
                            }

                            router = new RouteMatcher();
                            setupRes = routerSetup(router);

                            if (!(setupRes instanceof Promise)) {
                                context$3$0.next = 12;
                                break;
                            }

                            // go ahead and render the view, so if you wanted to, you can show a loader if you are
                            // doing some sort of code splitting
                            v.renderTo(where);
                            didRender = true;
                            context$3$0.next = 12;
                            return setupRes;

                        case 12:
                            if (!didRender) v.renderTo(where);
                            context$3$0.next = 15;
                            return v.activate();

                        case 15:
                            _v$getRouterViewElement = v.getRouterViewElement();
                            routerElement = _v$getRouterViewElement.node;
                            routerElementComponent = _v$getRouterViewElement.component;
                            return context$3$0.abrupt("return", { view: view, routerElement: routerElement, router: router, routerElementComponent: routerElementComponent, viewInstance: v });

                        case 19:
                        case "end":
                            return context$3$0.stop();
                    }
                }, callee$2$0, this);
            }));
        }
    }]);

    return ViewRouter;
})();

exports.ViewRouter = ViewRouter;

// check to see if there is a root/empty route before we give up

// ok, run the middle ware??

//this.clearFrom(viewStackIndex);

// if the matched on is where we are at, move along