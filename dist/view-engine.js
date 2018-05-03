"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ViewEngine = exports.View = exports.ComponentEventBus = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.prop = prop;
exports.provided = provided;

var _util = require("./util");

var _vue = require("vue");

var _vue2 = _interopRequireDefault(_vue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ComponentEventBus = exports.ComponentEventBus = function () {
    function ComponentEventBus(instance) {
        _classCallCheck(this, ComponentEventBus);

        this.instance = instance;
    }

    _createClass(ComponentEventBus, [{
        key: "dispatch",
        value: function dispatch(name) {
            var _instance;

            for (var _len = arguments.length, data = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
                data[_key - 1] = arguments[_key];
            }

            (_instance = this.instance).$emit.apply(_instance, [name].concat(data));
        }
    }, {
        key: "updateModel",
        value: function updateModel(value) {
            this.dispatch("input", value);
        }
    }]);

    return ComponentEventBus;
}();

function prop() {
    var defaultValue = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;

    return function (target, key, descriptor) {
        var props = Reflect.getMetadata("view-engine:props", target.constructor) || [];
        props.push({ key: key, defaultValue: defaultValue });
        Reflect.defineMetadata("view-engine:props", props, target.constructor);
    };
}
function provided() {
    return function (target, key, descriptor) {
        var props = Reflect.getMetadata("view-engine:provided", target.constructor) || [];
        props.push({ key: key, defaultValue: null });
        Reflect.defineMetadata("view-engine:provided", props, target.constructor);
    };
}
function getProps(cl) {
    var props = Reflect.getMetadata("view-engine:props", cl) || [];
    var propObject = {};
    props.forEach(function (p) {
        propObject[p.key] = {
            default: p.defaultValue
        };
    });
    return propObject;
}
function getProvided(cl) {
    var props = Reflect.getMetadata("view-engine:provided", cl) || [];
    if (props.length == 0) return undefined;
    return props.map(function (p) {
        return p.key;
    });
}
var makeComputedObject = function makeComputedObject(instance) {
    var obj = {};
    var proto = Object.getPrototypeOf(instance);
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = Object.getOwnPropertyNames(proto)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var property = _step.value;

            var descriptor = Object.getOwnPropertyDescriptor(proto, property);
            if (descriptor.get != null && descriptor.set != null) {
                obj[property] = {
                    get: descriptor.get,
                    set: descriptor.set
                };
            } else if (descriptor.get != null) {
                obj[property] = descriptor.get;
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return obj;
};

var Component = function () {
    function Component(container, viewModel, template) {
        _classCallCheck(this, Component);

        this.container = container;
        this.viewModel = viewModel;
        this.template = template;
    }

    _createClass(Component, [{
        key: "init",
        value: function init() {
            var that = this;
            var props = getProps(this.viewModel);
            var provided = getProvided(this.viewModel);
            return _vue2.default.extend({
                template: this.template,
                data: function data() {
                    var _this = this;

                    var instance = that.container.get(that.viewModel, false, function (o) {
                        o.use(ComponentEventBus, new ComponentEventBus(_this));
                    });
                    this.$options.computed = makeComputedObject(instance);
                    var provide = instance.provide;
                    if (provide && typeof provide == "function") {
                        this.$options.provide = provide;
                    }
                    this.$options.methods = {};
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = Object.getOwnPropertyNames(instance.constructor.prototype)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var m = _step2.value;

                            if (typeof instance[m] == "function" && m != "constructor" && m != "provide") {
                                var boundFn = instance[m].bind(this);
                                this.$options.methods[m] = boundFn;
                                this[m] = boundFn;
                            }
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2.return) {
                                _iterator2.return();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }

                    return instance;
                },
                computed: {},
                props: props,
                inject: provided,
                created: function created() {
                    this.___propWatcherUnscribers = [];
                    var _iteratorNormalCompletion3 = true;
                    var _didIteratorError3 = false;
                    var _iteratorError3 = undefined;

                    try {
                        for (var _iterator3 = Object.getOwnPropertyNames(props)[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                            var propName = _step3.value;

                            var propWatcherName = propName + "Changed";
                            if (typeof this.$data[propWatcherName] == "function") {
                                var unsub = this.$watch(propName, this[propWatcherName]);
                                this.___propWatcherUnscribers.push(unsub);
                            }
                        }
                    } catch (err) {
                        _didIteratorError3 = true;
                        _iteratorError3 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion3 && _iterator3.return) {
                                _iterator3.return();
                            }
                        } finally {
                            if (_didIteratorError3) {
                                throw _iteratorError3;
                            }
                        }
                    }
                },
                mounted: function mounted() {
                    var _this2 = this;

                    this.$nextTick(function () {
                        if (_this2.$refs) Object.assign(_this2, _this2.$refs);
                        var attachedFn = _this2.$data["attached"];
                        if (typeof attachedFn === "function") {
                            attachedFn.apply(_this2, []);
                        }
                    });
                },
                destroyed: function destroyed() {
                    var detachedFn = this.$data["detached"];
                    if (typeof detachedFn === "function") {
                        detachedFn.apply(this, []);
                    }
                    this.___propWatcherUnscribers.forEach(function (u) {
                        return u();
                    });
                }
            });
        }
    }]);

    return Component;
}();

function hookUpComponentRefs(r, rViewModel) {
    /*
    const myRefedComponents = r.findAllComponents().filter(c => c.parent === r && c.get().ref);
    myRefedComponents.forEach(c => {
      rViewModel[c.get().ref] = c.__instance;
    });
    */
}

var View = exports.View = function () {
    function View(viewModel, template) {
        var activateParams = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

        _classCallCheck(this, View);

        this.viewModel = viewModel;
        this.template = template;
        this.activateParams = activateParams;
        this.r = null;
    }

    _createClass(View, [{
        key: "renderTo",
        value: function renderTo(element) {
            var that = this;
            var vm = this.viewModel;
            this.r = new _vue2.default({
                el: element,
                template: this.template,
                data: vm,
                computed: makeComputedObject(vm),
                created: function created() {
                    // setup the methods
                    this.methods = {};
                    var _iteratorNormalCompletion4 = true;
                    var _didIteratorError4 = false;
                    var _iteratorError4 = undefined;

                    try {
                        for (var _iterator4 = Object.getOwnPropertyNames(vm.constructor.prototype)[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                            var m = _step4.value;

                            if (typeof vm[m] == "function" && m != "constructor") {
                                var boundFn = vm[m].bind(vm);
                                this[m] = boundFn;
                                this.methods[m] = boundFn;
                            }
                        }
                    } catch (err) {
                        _didIteratorError4 = true;
                        _iteratorError4 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                _iterator4.return();
                            }
                        } finally {
                            if (_didIteratorError4) {
                                throw _iteratorError4;
                            }
                        }
                    }
                },
                mounted: function mounted() {
                    var _this3 = this;

                    this.$nextTick(function () {
                        if (_this3.$refs) Object.assign(_this3, _this3.$refs);
                        var attachedFn = vm["attached"];
                        if (typeof attachedFn === "function") attachedFn.apply(_this3, []);
                    });
                },
                destroyed: function destroyed() {
                    var detachedFn = vm["detached"];
                    if (typeof detachedFn === "function") {
                        detachedFn.apply(this, []);
                    }
                }
            });
        }
    }, {
        key: "activate",
        value: function activate() {
            var _this4 = this;

            var vm = this.viewModel;
            return new Promise(function (res, rej) {
                var activateFn = vm["activate"];
                if (typeof activateFn === "function") {
                    var activateRes = activateFn.apply(vm, [_this4.activateParams]);
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
    }, {
        key: "getRouterSetupFunction",
        value: function getRouterSetupFunction() {
            var vm = this.viewModel;
            if (typeof vm["registerRoutes"] == "function") {
                return vm["registerRoutes"].bind(vm);
            }
            return null;
        }
    }, {
        key: "getRouterViewElement",
        value: function getRouterViewElement() {
            return this.r.$children.find(function (c) {
                return c.$el.children && c.$el.children.length == 1 && c.$el.children[0].className == "__router_view";
            });
        }
    }, {
        key: "remove",
        value: function remove() {
            this.r.$destroy();
        }
    }]);

    return View;
}();

var ViewEngine = exports.ViewEngine = function () {
    function ViewEngine(container) {
        _classCallCheck(this, ViewEngine);

        this.container = container;
        this.components = new Map();
    }

    _createClass(ViewEngine, [{
        key: "getTemplateFor",
        value: function getTemplateFor(c) {
            if (c.__template != null && typeof c.__template == "string") {
                return c.__template;
            }
            for (var key in __webpack_require__.c) {
                if (!__webpack_require__.c[key].exports) continue;
                var exports = __webpack_require__.c[key].exports;
                if (!exports.__html) continue;
                // need to loop through exports to see if what we exported matches c
                for (var exportKey in exports) {
                    if (exports[exportKey] !== c) continue;
                    var template = exports.__html;
                    return template;
                }
            }
            throw new Error("Can't find template");
        }
    }, {
        key: "setupComponents",
        value: function setupComponents(c) {
            var _this5 = this;

            var needs = Reflect.getMetadata("components", c);
            if (needs == null) return;
            needs.forEach(function (need) {
                return _this5.registerComponent(need);
            });
        }
    }, {
        key: "loadView",
        value: function loadView(c) {
            var activateParams = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
            var overrider = arguments[2];

            var template = this.getTemplateFor(c);
            var viewModel = this.container.get(c, false, overrider);
            this.setupComponents(c);
            return new View(viewModel, template, activateParams);
        }
    }, {
        key: "registerComponent",
        value: function registerComponent(c) {
            if (this.components.get(c)) return;
            var template = this.getTemplateFor(c);
            var component = new Component(this.container, c, template);
            this.setupComponents(c);
            this.components.set(c, true);
            _vue2.default.component((0, _util.kebab)(c.name), component.init());
        }
    }]);

    return ViewEngine;
}();