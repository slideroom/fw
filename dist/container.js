"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ContainerOverride = function () {
    function ContainerOverride() {
        _classCallCheck(this, ContainerOverride);

        this.overrideMap = new Map();
    }

    _createClass(ContainerOverride, [{
        key: "use",
        value: function use(c, instance) {
            this.overrideMap.set(c, instance);
        }
    }, {
        key: "get",
        value: function get(c) {
            return this.overrideMap.get(c);
        }
    }]);

    return ContainerOverride;
}();

var Container = exports.Container = function () {
    function Container() {
        _classCallCheck(this, Container);

        this.instances = new Map();
    }

    _createClass(Container, [{
        key: "getServiceTypes",
        value: function getServiceTypes(t) {
            return Reflect.getMetadata("design:paramtypes", t) || [];
        }
    }, {
        key: "get",
        value: function get(t) {
            var _this = this;

            var setInstance = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
            var override = arguments[2];

            if (this.instances.get(t)) return this.instances.get(t);
            var overrider = new ContainerOverride();
            if (override) {
                override(overrider);
            }
            var injectedTypes = this.getServiceTypes(t).map(function (tt) {
                var overrideType = overrider.get(tt);
                if (overrideType) return overrideType;
                return _this.get(tt);
            });
            var instance = new (Function.prototype.bind.apply(t, [null].concat(_toConsumableArray(injectedTypes))))();
            if (setInstance) this.use(t, instance);
            return instance;
        }
    }, {
        key: "has",
        value: function has(t) {
            return this.instances.get(t) != null;
        }
    }, {
        key: "use",
        value: function use(key, instance) {
            this.instances.set(key, instance);
        }
    }]);

    return Container;
}();

var ContainerInstance = exports.ContainerInstance = new Container();