"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var NetworkException = function NetworkException(statusCode, result, url) {
    _classCallCheck(this, NetworkException);

    this.statusCode = statusCode;
    this.result = result;
    this.url = url;
};

exports.NetworkException = NetworkException;

function parseResponse(res) {
    try {
        return res ? JSON.parse(res) : null;
    } catch (err) {
        return null;
    }
}

var Network = (function () {
    function Network() {
        _classCallCheck(this, Network);
    }

    _createClass(Network, [{
        key: "doRequest",
        value: function doRequest(method, url, params, headers, content) {
            var _this = this;

            return new Promise(function (res, rej) {
                var p = new XMLHttpRequest();
                p.open(method, url + _this.buildParamString(params), true);
                p.setRequestHeader("Content-Type", "application/json");
                p.setRequestHeader("Accept", "application/json, text/javascript, */*; q=0.01");
                for (var key in headers) {
                    p.setRequestHeader(key, headers[key]);
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
                    var response = p.response;
                    var status = p.status;

                    var parsedRes = parseResponse(response);
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
        value: function post(url, headers, content) {
            if (headers === undefined) headers = {};
            var params = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

            return this.doRequest("POST", url, params, headers, content);
        }
    }, {
        key: "put",
        value: function put(url, headers, content) {
            if (headers === undefined) headers = {};
            var params = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

            return this.doRequest("PUT", url, params, headers, content);
        }
    }, {
        key: "get",
        value: function get(url) {
            var headers = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
            var params = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

            return this.doRequest("GET", url, params, headers);
        }
    }, {
        key: "delete",
        value: function _delete(url) {
            var headers = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
            var params = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

            return this.doRequest("DELETE", url, params, headers);
        }
    }]);

    return Network;
})();

exports.Network = Network;