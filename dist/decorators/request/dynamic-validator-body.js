"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const namespace_1 = require("../namespace");
const utils_1 = require("@nelts/utils");
function DynamicValidatorBody(schema) {
    return (target, property, descriptor) => {
        let schemas = Reflect.getMetadata(namespace_1.default.CONTROLLER_DYNAMIC_VALIDATOR_BODY, descriptor.value);
        if (!schemas)
            schemas = [];
        if (typeof schema === 'function') {
            schemas.push(schema);
        }
        else {
            schemas.push(data => utils_1.AjvChecker(schema, data, 'Body'));
        }
        Reflect.defineMetadata(namespace_1.default.CONTROLLER_DYNAMIC_VALIDATOR_BODY, schemas, descriptor.value);
    };
}
exports.default = DynamicValidatorBody;
