"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.FrameworkConfig = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.inject = inject;
exports.needs = needs;
exports.bootstrap = bootstrap;

var _container = require("./container");

var _viewEngine = require("./view-engine");

var _router = require("./router");

var _bus = require("./bus");

var _network = require("./network");

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
function inject(target) {
    return;
}
function needs() {
    for (var _len = arguments.length, things = Array(_len), _key = 0; _key < _len; _key++) {
        things[_key] = arguments[_key];
    }

    return function (target) {
        Reflect.defineMetadata("components", things, target);
    };
}
var viewEngine = new _viewEngine.ViewEngine(_container.ContainerInstance);

var FrameworkConfig = exports.FrameworkConfig = function () {
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
            return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                var n, res, configInstance;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                        switch (_context.prev = _context.next) {
                            case 0:
                                n = _container.ContainerInstance.get(_network.Network);
                                _context.next = 3;
                                return n.get(fileName);

                            case 3:
                                res = _context.sent;
                                configInstance = _container.ContainerInstance.get(configType);

                                Object.keys(res).forEach(function (key) {
                                    configInstance[key] = res[key];
                                });
                                return _context.abrupt("return", configInstance);

                            case 7:
                            case "end":
                                return _context.stop();
                        }
                    }
                }, _callee, this);
            }));
        }
    }, {
        key: "useVuePlugin",
        value: function useVuePlugin(plugin) {
            _vue2.default.use(plugin);
        }
    }]);

    return FrameworkConfig;
}();

function bootstrap(cb) {
    return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
        var fwConfig, bus, viewRouter;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        fwConfig = new FrameworkConfig();
                        bus = _container.ContainerInstance.get(_bus.Bus);
                        _context2.next = 4;
                        return cb(fwConfig);

                    case 4:
                        if (fwConfig.starter != null) {
                            viewRouter = new _router.ViewRouter(viewEngine, fwConfig.starter);

                            _container.ContainerInstance.use(_router.Navigator, new _router.Navigator());
                            viewRouter.start();
                        }

                    case 5:
                    case "end":
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));
}