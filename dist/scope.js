"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const namespace_1 = require("./decorators/namespace");
function Scope(callback) {
    const _callback = (plu) => callback(plu);
    Reflect.defineMetadata(namespace_1.default.CONTROLLER_SCOPED, true, _callback);
    return _callback;
}
exports.default = Scope;
