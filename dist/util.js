"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.kebab = kebab;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function kebab(name) {
    return name.replace(/([A-Z])/g, function (match, p1) {
        return "-" + p1.toLowerCase();
    }).replace(/^-/, "");
}

var CloseStack = exports.CloseStack = function () {
    function CloseStack() {
        _classCallCheck(this, CloseStack);

        this.theCloseStack = [];
        document.addEventListener("keydown", this.handleKeyPress.bind(this));
    }

    _createClass(CloseStack, [{
        key: "enroll",
        value: function enroll(cb) {
            var _this = this;

            var newItem = function newItem() {
                cb();
            };
            this.theCloseStack.push(newItem);
            var _close = function _close() {
                var add = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

                var idx = _this.theCloseStack.indexOf(newItem);
                if (idx >= 0) {
                    for (var i = idx + add; i < _this.theCloseStack.length; i++) {
                        _this.theCloseStack[i]();
                    }
                    _this.theCloseStack.splice(idx + add);
                }
            };
            return {
                close: function close() {
                    _close();
                },
                closeAbove: function closeAbove() {
                    _close(1);
                }
            };
        }
    }, {
        key: "handleKeyPress",
        value: function handleKeyPress(e) {
            if (e.keyCode == 27 && this.theCloseStack.length > 0) {
                // just do the top one
                var closer = this.theCloseStack.pop();
                closer();
                e.stopImmediatePropagation();
                e.stopPropagation();
                e.preventDefault();
            }
        }
    }]);

    return CloseStack;
}();