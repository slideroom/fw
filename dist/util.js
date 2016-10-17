"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.kebab = kebab;

function kebab(name) {
    return name.replace(/([A-Z])/g, function (match, p1) {
        return "-" + p1.toLowerCase();
    }).replace(/^-/, "");
}