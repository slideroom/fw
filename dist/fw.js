"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

exports.inject = inject;
exports.needs = needs;
exports.bootstrap = bootstrap;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _container = require("./container");

var _viewEngine = require("./view-engine");

var _router = require("./router");

var _bus = require("./bus");

var _network = require("./network");

var _vue = require("vue");

var _vue2 = _interopRequireDefault(_vue);

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
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};

function inject(target) {
    return;
}

function needs() {
    for (var _len = arguments.length, things = Array(_len), _key = 0; _key < _len; _key++) {
        things[_key] = arguments[_key];
    }

    return function (target) {
        Reflect.set(target, "components", things);
    };
}

var viewEngine = new _viewEngine.ViewEngine(_container.ContainerInstance);

var FrameworkConfig = (function () {
    function FrameworkConfig() {
        _classCallCheck(this, FrameworkConfig);

        this.starter = null;
    }

    _createClass(FrameworkConfig, [{
        key: "startWith",
        value: function startWith(view) {
            this.starter = view;
        }
    }, {
        key: "registerInstance",
        value: function registerInstance(key, instance) {
            _container.ContainerInstance.use(key, instance);
        }
    }, {
        key: "registerComponents",
        value: function registerComponents() {
            for (var _len2 = arguments.length, components = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                components[_key2] = arguments[_key2];
            }

            components.forEach(function (component) {
                return viewEngine.registerComponent(component);
            });
        }
    }, {
        key: "withConfig",
        value: function withConfig(configType, fileName) {
            return __awaiter(this, void 0, Promise, regeneratorRuntime.mark(function callee$2$0() {
                var n, res, configInstance, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, prop;

                return regeneratorRuntime.wrap(function callee$2$0$(context$3$0) {
                    while (1) switch (context$3$0.prev = context$3$0.next) {
                        case 0:
                            n = _container.ContainerInstance.get(_network.Network);
                            context$3$0.next = 3;
                            return n.get(fileName);

                        case 3:
                            res = context$3$0.sent;
                            configInstance = _container.ContainerInstance.get(configType);
                            _iteratorNormalCompletion = true;
                            _didIteratorError = false;
                            _iteratorError = undefined;
                            context$3$0.prev = 8;

                            for (_iterator = Object.keys(res)[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                                prop = _step.value;

                                configInstance[prop] = res[prop];
                            }
                            context$3$0.next = 16;
                            break;

                        case 12:
                            context$3$0.prev = 12;
                            context$3$0.t0 = context$3$0["catch"](8);
                            _didIteratorError = true;
                            _iteratorError = context$3$0.t0;

                        case 16:
                            context$3$0.prev = 16;
                            context$3$0.prev = 17;

                            if (!_iteratorNormalCompletion && _iterator["return"]) {
                                _iterator["return"]();
                            }

                        case 19:
                            context$3$0.prev = 19;

                            if (!_didIteratorError) {
                                context$3$0.next = 22;
                                break;
                            }

                            throw _iteratorError;

                        case 22:
                            return context$3$0.finish(19);

                        case 23:
                            return context$3$0.finish(16);

                        case 24:
                            return context$3$0.abrupt("return", configInstance);

                        case 25:
                        case "end":
                            return context$3$0.stop();
                    }
                }, callee$2$0, this, [[8, 12, 16, 24], [17,, 19, 23]]);
            }));
        }
    }, {
        key: "useVuePlugin",
        value: function useVuePlugin(plugin) {
            _vue2["default"].use(plugin);
        }
    }]);

    return FrameworkConfig;
})();

exports.FrameworkConfig = FrameworkConfig;

function bootstrap(cb) {
    return __awaiter(this, void 0, void 0, regeneratorRuntime.mark(function callee$1$0() {
        var fwConfig, bus, viewRouter;
        return regeneratorRuntime.wrap(function callee$1$0$(context$2$0) {
            while (1) switch (context$2$0.prev = context$2$0.next) {
                case 0:
                    fwConfig = new FrameworkConfig();
                    bus = _container.ContainerInstance.get(_bus.Bus);
                    context$2$0.next = 4;
                    return cb(fwConfig);

                case 4:
                    if (fwConfig.starter != null) {
                        viewRouter = new _router.ViewRouter(viewEngine, fwConfig.starter);

                        _container.ContainerInstance.use(_router.Navigator, new _router.Navigator());
                        viewRouter.start();
                    }

                case 5:
                case "end":
                    return context$2$0.stop();
            }
        }, callee$1$0, this);
    }));
}