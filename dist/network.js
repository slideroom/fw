"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Network = exports.NetworkException = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _container = require("./container");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NetworkException = exports.NetworkException = function NetworkException(statusCode, result, url) {
    _classCallCheck(this, NetworkException);

    this.statusCode = statusCode;
    this.result = result;
    this.url = url;
};

function parseResponse(res) {
    try {
        return res ? JSON.parse(res) : null;
    } catch (err) {
        return null;
    }
}
var isResponseMiddleware = function isResponseMiddleware(instance) {
    return instance.onResponse && typeof instance.onResponse == "function";
};
var isRequestMiddleware = function isRequestMiddleware(instance) {
    return instance.onRequest && typeof instance.onRequest == "function";
};

var ARequestContext = function () {
    function ARequestContext(request) {
        _classCallCheck(this, ARequestContext);

        this.request = request;
    }

    _createClass(ARequestContext, [{
        key: "addHeader",
        value: function addHeader(name, value) {
            this.request.setRequestHeader(name, value);
        }
    }]);

    return ARequestContext;
}();

var AResponseContext = function () {
    function AResponseContext(request, data) {
        _classCallCheck(this, AResponseContext);

        this.request = request;
        this.data = data;
        this.headers = {};
        this.statusCode = 0;
        this.statusCode = request.status;
        this.parseHeaders();
    }

    _createClass(AResponseContext, [{
        key: "parseHeaders",
        value: function parseHeaders() {
            var res = {};
            this.request.getAllResponseHeaders().trim().split("\n").forEach(function (line) {
                var index = line.indexOf(":");
                var key = line.slice(0, index).trim().toLowerCase();
                var value = line.slice(index + 1).trim();
                res[key] = value;
            });
            this.headers = res;
        }
    }]);

    return AResponseContext;
}();

var Network = exports.Network = function () {
    function Network() {
        _classCallCheck(this, Network);

        this.middleware = [];
    }

    _createClass(Network, [{
        key: "addMiddleware",
        value: function addMiddleware(m) {
            this.middleware.push(m);
        }
    }, {
        key: "doRequest",
        value: function doRequest(method, url, params, content) {
            var _this = this;

            return new Promise(function (res, rej) {
                var p = new XMLHttpRequest();
                p.open(method, url + _this.buildParamString(params), true);
                p.setRequestHeader("Content-Type", "application/json");
                p.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
                if (_this.middleware.length > 0) {
                    // build context;
                    var requestContext = new ARequestContext(p);
                    _this.middleware.forEach(function (m) {
                        var requestInstance = _container.ContainerInstance.get(m);
                        if (isRequestMiddleware(requestInstance)) {
                            requestInstance.onRequest(requestContext);
                        }
                    });
                }
                // TODO: look at this again when there is no network/bad domain
                //p.addEventListener("readystatechange", (e) => {
                //  const { response, status } = p;
                //  if (!(status >= 200 && status < 300)) {
                //    let parsedRes = parseResponse(response);
                //    rej(new NetworkException(status, parsedRes, url));
                //  }
                //});
                p.addEventListener("loadend", function (e) {
                    var response = p.response,
                        status = p.status;

                    var parsedRes = parseResponse(response);
                    if (_this.middleware.length > 0) {
                        // build context;
                        var responseContext = new AResponseContext(p, parsedRes);
                        _this.middleware.reverse().forEach(function (m) {
                            var instance = _container.ContainerInstance.get(m);
                            if (isResponseMiddleware(instance)) {
                                instance.onResponse(responseContext);
                            }
                        });
                    }
                    if (status >= 200 && status < 300) {
                        res(parsedRes);
                    } else {
                        rej(new NetworkException(status, parsedRes, url));
                    }
                });
                p.send(content ? JSON.stringify(content) : undefined);
            });
        }
    }, {
        key: "buildParamString",
        value: function buildParamString(params) {
            if (params == null) return "";
            var pairs = [];
            for (var key in params) {
                if (params[key] != null) {
                    pairs.push(encodeURIComponent(key) + "=" + encodeURIComponent(params[key]));
                }
            }
            if (pairs.length > 0) return "?" + pairs.join("&");else return "";
        }
    }, {
        key: "post",
        value: function post(url, content) {
            var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            return this.doRequest("POST", url, params, content);
        }
    }, {
        key: "put",
        value: function put(url, content) {
            var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

            return this.doRequest("PUT", url, params, content);
        }
    }, {
        key: "get",
        value: function get(url) {
            var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            return this.doRequest("GET", url, params);
        }
    }, {
        key: "delete",
        value: function _delete(url) {
            var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            return this.doRequest("DELETE", url, params);
        }
    }]);

    return Network;
}();