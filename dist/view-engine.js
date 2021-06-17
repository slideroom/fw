"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ViewEngine = exports.makeAndActivate = exports.makeVueComponent = exports.ComponentEventBus = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.prop = prop;
exports.provided = provided;

var _util = require("./util");

var _container = require("./container");

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
var specialMethods = {
    "provide": true
};
var _getTemplateFor = function _getTemplateFor(viewModel) {
    var template = viewModel.__template;
    if (template != null) {
        if (typeof template === "object" && template.__esModule) {
            var templateValue = template.default;
            if (typeof templateValue === "string") {
                return templateValue;
            }
        } else if (typeof template === "string") {
            return template;
        }
    }
    for (var key in __webpack_require__.c) {
        if (!__webpack_require__.c[key].exports) continue;
        var exports = __webpack_require__.c[key].exports;
        if (!exports.__html) continue;
        // need to loop through exports to see if what we exported matches c
        for (var exportKey in exports) {
            if (exports[exportKey] !== viewModel) continue;
            var _template = exports.__html;
            return _template;
        }
    }
    throw new Error("Can't find template for: " + viewModel.name);
};
var makeVueComponent = exports.makeVueComponent = function makeVueComponent(viewModel) {
    var onInstanceCreated = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var overrider = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    var props = getProps(viewModel);
    var provided = getProvided(viewModel);
    return _vue2.default.extend({
        name: (0, _util.kebab)(viewModel.name),
        template: _getTemplateFor(viewModel),
        data: function data() {
            var _this = this;

            var instance = _container.ContainerInstance.get(viewModel, false, function (o) {
                o.use(ComponentEventBus, new ComponentEventBus(_this));
                if (overrider != null) overrider(o);
            });
            if (onInstanceCreated) {
                onInstanceCreated(this, instance);
            }
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

                    if (typeof instance[m] == "function" && m != "constructor" && !specialMethods[m]) {
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

            var needs = Reflect.getMetadata("components", viewModel);
            if (needs) {
                var components = {};
                needs.forEach(function (need) {
                    components[(0, _util.kebab)(need.name)] = makeVueComponent(need);
                });
                Object.assign(this.$options.components, components);
            }
            return instance;
        },
        computed: {},
        props: props,
        inject: provided,
        created: function created() {
            var createdFn = this.$data["created"];
            if (typeof createdFn == "function") {
                createdFn.apply(this, []);
            }
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
};
var makeAndActivate = exports.makeAndActivate = function makeAndActivate(viewModel, where) {
    var activateData = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var overrider = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
    return __awaiter(undefined, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var activateRes, dataCreateResolver, dataCreate, ve;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        activateRes = null;
                        dataCreateResolver = null;
                        dataCreate = new Promise(function (res) {
                            return dataCreateResolver = res;
                        });
                        ve = makeVueComponent(viewModel, function (vue, instance) {
                            if (typeof instance["activate"] == "function") {
                                var activateFn = instance["activate"].bind(instance);
                                activateRes = activateFn(activateData);
                            }
                            dataCreateResolver();
                        }, overrider);

                        new ve().$mount(where);
                        _context.next = 7;
                        return dataCreate;

                    case 7:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));
};

var ViewEngine = exports.ViewEngine = function () {
    function ViewEngine(container) {
        _classCallCheck(this, ViewEngine);

        this.container = container;
        this.components = new Map();
    }

    _createClass(ViewEngine, [{
        key: "getTemplateFor",
        value: function getTemplateFor(c) {
            return _getTemplateFor(c);
        }
    }, {
        key: "registerComponent",
        value: function registerComponent(c) {
            if (this.components.get(c)) return;
            var component = makeVueComponent(c);
            this.components.set(c, true);
            _vue2.default.component((0, _util.kebab)(c.name), component);
        }
    }]);

    return ViewEngine;
}();