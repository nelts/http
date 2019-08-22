"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const path = require("path");
const globby = require("globby");
const utils_1 = require("@nelts/utils");
const namespace_1 = require("../decorators/namespace");
async function Controller(plugin) {
    const cwd = plugin.source;
    const files = await globby([
        'controller/**/*.ts',
        'controller/**/*.js',
        '!controller/**/*.d.ts',
    ], { cwd });
    files.forEach((file) => render(plugin, path.resolve(cwd, file)));
}
exports.default = Controller;
function render(plugin, file) {
    let fileExports = utils_1.RequireDefault(file);
    const Scoped = Reflect.getMetadata(namespace_1.default.CONTROLLER_SCOPED, fileExports);
    if (Scoped)
        fileExports = fileExports(plugin);
    const controllerPrefix = Reflect.getMetadata(namespace_1.default.CONTROLLER_PREFIX, fileExports) || '/';
    const controllerProperties = Object.getOwnPropertyNames(fileExports.prototype);
    const app = plugin.app;
    for (let i = 0; i < controllerProperties.length; i++) {
        const property = controllerProperties[i];
        const target = fileExports.prototype[property];
        if (property === 'constructor')
            continue;
        const paths = Reflect.getMetadata(namespace_1.default.CONTROLLER_PATH, target) || '/';
        const methods = Reflect.getMetadata(namespace_1.default.CONTROLLER_METHOD, target) || [];
        if (!methods.length)
            continue;
        const CurrentRouterPath = !paths.startsWith('/') ? '/' + paths : paths;
        const CurrentRouterPrefix = controllerPrefix.endsWith('/')
            ? controllerPrefix.substring(0, controllerPrefix.length - 1)
            : controllerPrefix;
        const decoratorAllowMaps = {
            MIDDLEWARE: Reflect.getMetadata(namespace_1.default.CONTROLLER_MIDDLEWARE, target),
            RESPONSE: Reflect.getMetadata(namespace_1.default.CONTROLLER_RESPONSE, target),
        };
        app.frameworker.router.on(methods, CurrentRouterPrefix + CurrentRouterPath, function (req, res, params) {
            const ctx = this;
            ctx.setParams(params);
            return addComposeCallback(decoratorAllowMaps, fileExports, plugin, property);
        });
    }
}
function addComposeCallback(options, controller, plugin, property) {
    const callbacks = [];
    if (options.MIDDLEWARE)
        callbacks.push(...options.MIDDLEWARE);
    addContextLife('ContextMiddleware');
    callbacks.push(async (ctx, next) => {
        const object = new controller(plugin);
        const result = await object[property](ctx);
        if (result !== undefined)
            ctx.body = result;
        await next();
    });
    addContextLife('ContextRuntime');
    if (options.RESPONSE)
        callbacks.push(...options.RESPONSE);
    addContextLife('ContextResponse');
    return callbacks;
    function addContextLife(name) {
        callbacks.push(async (ctx, next) => {
            await ctx.sync(name);
            await next();
        });
    }
}
