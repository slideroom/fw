"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ViewRouter = exports.ViewRouterLocationChanged = exports.Navigator = exports.Route = exports.RouteMatcher = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _util = require("./util");

var _container = require("./container");

var _viewEngine = require("./view-engine");

var _bus = require("./bus");

var _vue = require("vue");

var _vue2 = _interopRequireDefault(_vue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

// we need a quick router-view component
_vue2.default.component("router-view", {
    functional: true,
    render: function render(_, ctx) {
        var h = ctx.parent.$createElement;
        var component = ctx.parent._routeComponent;
        return h(component, ctx.data, ctx.children);
    }
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

var RouteMatcher = exports.RouteMatcher = function () {
    function RouteMatcher() {
        _classCallCheck(this, RouteMatcher);

        this.routes = [];
        this.middleware = [];
        this.current = "";
        this.fullLocation = "";
        this.params = null;
    }

    _createClass(RouteMatcher, [{
        key: "add",
        value: function add(route, view) {
            var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
            var name = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

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
                    var remaining = m.remaining,
                        matchedOn = m.matchedOn;

                    return {
                        matches: true,
                        remaining: remaining,
                        params: params,
                        route: this.routes[i],
                        matchedOn: matchedOn
                    };
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
}();

var NoMatch = { match: false, remaining: [], matchedOn: [] };

var Route = exports.Route = function () {
    function Route(route, view) {
        var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var name = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

        _classCallCheck(this, Route);

        this.route = route;
        this.view = view;
        this.data = data;
        this.name = name;
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
    }, {
        key: "loadView",
        value: function loadView() {
            return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                var res;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                if (!this.view.__template) {
                                    _context.next = 5;
                                    break;
                                }

                                this.name = this.name || (0, _util.kebab)(this.view.name);
                                return _context.abrupt("return", this.view);

                            case 5:
                                // maybe it is a promise?
                                res = this.view();

                                if (!(res instanceof Promise)) {
                                    _context.next = 10;
                                    break;
                                }

                                _context.next = 9;
                                return res;

                            case 9:
                                res = _context.sent;

                            case 10:
                                if (res.default && res.default.__template) res = res.default;
                                this.name = this.name || (0, _util.kebab)(res.name);
                                return _context.abrupt("return", res);

                            case 13:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }]);

    return Route;
}();

var Navigator = exports.Navigator = function () {
    function Navigator() {
        _classCallCheck(this, Navigator);
    }

    _createClass(Navigator, [{
        key: "navigate",
        value: function navigate(where) {
            var queryParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

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
}();

var bus = _container.ContainerInstance.get(_bus.Bus);

var ViewRouterLocationChanged = exports.ViewRouterLocationChanged = function ViewRouterLocationChanged(location) {
    _classCallCheck(this, ViewRouterLocationChanged);

    this.location = location;
};

var iEVersion = function iEVersion() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");
    if (msie > 0) {
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }
    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }
    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
        return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }
    return -1;
};

var ViewRouter = exports.ViewRouter = function () {
    function ViewRouter(viewEngine, starter) {
        _classCallCheck(this, ViewRouter);

        this.viewEngine = viewEngine;
        this.starter = starter;
        this.loadedViewsStack = [];
        if (iEVersion() == 11) {
            window.addEventListener("hashchange", this.changed.bind(this));
        } else {
            window.addEventListener("popstate", this.changed.bind(this));
        }
    }

    _createClass(ViewRouter, [{
        key: "start",
        value: function start() {
            return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                var starterView;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                _context2.next = 2;
                                return this.runView(this.starter, document.getElementById("root"));

                            case 2:
                                starterView = _context2.sent;

                                if (starterView.router) {
                                    this.loadedViewsStack.push({
                                        matchedOn: null,
                                        queryParams: null,
                                        router: starterView.router,
                                        destroy: starterView.destroy,
                                        view: starterView.view,
                                        component: starterView.component,
                                        vueInstance: starterView.vueInstance
                                    });
                                }
                                this.changed();

                            case 5:
                            case "end":
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            }));
        }
    }, {
        key: "changed",
        value: function changed() {
            var fullLocation = document.location.hash.replace(/^#\/?/, "");
            // TODO: we probably want to change to to only publish when it was success
            //       example: when middleware runs and it cannot navigate
            bus.publish(new ViewRouterLocationChanged(fullLocation));

            var _parseQueryParams = parseQueryParams(fullLocation),
                withoutQueryParams = _parseQueryParams.withoutQueryParams,
                params = _parseQueryParams.params;

            var location = withoutQueryParams.split("/");
            // kick it off and see what happens
            if (this.loadedViewsStack.length > 0) {
                window.scrollTo(0, 0);
                this.loadedViewsStack.forEach(function (lv) {
                    if (lv.router != null) lv.router.fullLocation = fullLocation;
                });
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
                if (idx > viewStackIndex && v.destroy) {
                    v.destroy();
                }
            });
            this.loadedViewsStack.splice(viewStackIndex + 1);
        }
    }, {
        key: "runMatching",
        value: function runMatching(location, fullLocation, queryParams, loadedView, viewStackIndex) {
            return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
                var match, hasMoreInStack, nextLView, matchQueryParams, _idx, view, newElement, idx;

                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                if (!(loadedView.router == null)) {
                                    _context3.next = 2;
                                    break;
                                }

                                return _context3.abrupt("return");

                            case 2:
                                loadedView.router.fullLocation = fullLocation;
                                match = loadedView.router.matches(location);

                                if (!(match == null || match.matches == false)) {
                                    _context3.next = 11;
                                    break;
                                }

                                if (!(location.length == 0 && loadedView.router.matches([""]))) {
                                    _context3.next = 9;
                                    break;
                                }

                                match = loadedView.router.matches([""]);
                                _context3.next = 11;
                                break;

                            case 9:
                                // lets clear the routerView if we need too
                                this.clearFrom(viewStackIndex);
                                return _context3.abrupt("return");

                            case 11:
                                if (!(loadedView.router.canNavigate(match.route, fullLocation) == false)) {
                                    _context3.next = 13;
                                    break;
                                }

                                return _context3.abrupt("return");

                            case 13:
                                // if the matched on is where we are at, move along
                                hasMoreInStack = this.loadedViewsStack.length > viewStackIndex + 1;

                                if (!hasMoreInStack) {
                                    _context3.next = 22;
                                    break;
                                }

                                nextLView = this.loadedViewsStack[viewStackIndex + 1];
                                matchQueryParams = JSON.stringify(this.loadedViewsStack.length <= viewStackIndex + 2 ? queryParams : {});

                                if (!(arrayEqual(nextLView.matchedOn, match.matchedOn) && nextLView.queryParams == matchQueryParams)) {
                                    _context3.next = 22;
                                    break;
                                }

                                _idx = viewStackIndex + 1;
                                _context3.next = 21;
                                return this.runMatching(match.remaining, fullLocation, queryParams, this.loadedViewsStack[_idx], _idx);

                            case 21:
                                return _context3.abrupt("return");

                            case 22:
                                this.clearFrom(viewStackIndex);
                                _context3.next = 25;
                                return match.route.loadView();

                            case 25:
                                view = _context3.sent;

                                if (loadedView.router) {
                                    loadedView.router.current = match.route.name;
                                    loadedView.router.params = match.params;
                                    loadedView.router.fullLocation = fullLocation;
                                }
                                _context3.next = 29;
                                return this.runView(view, loadedView.vueInstance, Object.assign({}, match.route.data, queryParams, match.params));

                            case 29:
                                newElement = _context3.sent;

                                this.loadedViewsStack.push({
                                    matchedOn: match.matchedOn,
                                    queryParams: JSON.stringify(match.remaining.length == 0 ? queryParams : {}),
                                    router: newElement.router,
                                    view: match.route.view,
                                    destroy: newElement.destroy,
                                    component: newElement.component,
                                    vueInstance: newElement.vueInstance
                                });
                                idx = viewStackIndex + 1;
                                _context3.next = 34;
                                return this.runMatching(match.remaining, fullLocation, queryParams, this.loadedViewsStack[idx], idx);

                            case 34:
                            case "end":
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        }
    }, {
        key: "runView",
        value: function runView(view, where) {
            var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                var router, setupRes, activateRes, vueInstance, dataCreateResolver, dataCreate, component;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                router = null;
                                setupRes = null;
                                activateRes = null;
                                vueInstance = null;
                                dataCreateResolver = null;
                                dataCreate = new Promise(function (res) {
                                    return dataCreateResolver = res;
                                });
                                component = (0, _viewEngine.makeVueComponent)(view, function (vue, instance) {
                                    vueInstance = vue;
                                    if (typeof instance["registerRoutes"] == "function") {
                                        var routerSetup = instance["registerRoutes"].bind(instance);
                                        router = new RouteMatcher();
                                        setupRes = routerSetup(router);
                                    }
                                    if (typeof instance["activate"] == "function") {
                                        var activateFn = instance["activate"].bind(instance);
                                        activateRes = activateFn(params);
                                    }
                                    dataCreateResolver();
                                });

                                if (where instanceof _vue2.default) {
                                    where._routeComponent = component;
                                    where.$forceUpdate();
                                } else {
                                    new component().$mount(where);
                                }
                                _context4.next = 10;
                                return dataCreate;

                            case 10:
                                if (!(setupRes instanceof Promise)) {
                                    _context4.next = 13;
                                    break;
                                }

                                _context4.next = 13;
                                return setupRes;

                            case 13:
                                if (!(activateRes instanceof Promise)) {
                                    _context4.next = 16;
                                    break;
                                }

                                _context4.next = 16;
                                return activateRes;

                            case 16:
                                return _context4.abrupt("return", {
                                    router: router,
                                    component: component,
                                    view: view,
                                    vueInstance: vueInstance,
                                    destroy: function destroy() {
                                        if (where instanceof _vue2.default) {
                                            where._routeComponent = null;
                                            where.$forceUpdate();
                                        }
                                    }
                                });

                            case 17:
                            case "end":
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            })
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
            );
        }
    }]);

    return ViewRouter;
}();