"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const namespace_1 = require("../namespace");
const utils_1 = require("@nelts/utils");
function StaticValidatorQuery(...args) {
    const types = utils_1.AjvStringFormat(args);
    return (target, property, descriptor) => {
        Reflect.defineMetadata(namespace_1.default.CONTROLLER_STATIC_VALIDATOR_QUERY, types, descriptor.value);
    };
}
exports.default = StaticValidatorQuery;
