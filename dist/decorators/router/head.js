"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const method_1 = require("./method");
const path_1 = require("./path");
function Head(path) {
    return (target, property, descriptor) => {
        path && path_1.default(path)(target, property, descriptor);
        method_1.default('HEAD')(target, property, descriptor);
    };
}
exports.default = Head;
