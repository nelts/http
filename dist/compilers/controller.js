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
            REQUEST_STATIC_VALIDATOR_HEADER: Reflect.getMetadata(namespace_1.default.CONTROLLER_STATIC_VALIDATOR_HEADER, target),
            REQUEST_STATIC_VALIDATOR_QUERY: Reflect.getMetadata(namespace_1.default.CONTROLLER_STATIC_VALIDATOR_QUERY, target),
            REQUEST_STATIC_FILTER: Reflect.getMetadata(namespace_1.default.CONTROLLER_STATIC_FILTER, target),
            REQUEST_DYNAMIC_LOADER: Reflect.getMetadata(namespace_1.default.CONTROLLER_DYNAMIC_LOADER, target),
            REQUEST_DYNAMIC_VALIDATOR_BODY: Reflect.getMetadata(namespace_1.default.CONTROLLER_DYNAMIC_VALIDATOR_BODY, target),
            REQUEST_DYNAMIC_VALIDATOR_FILE: Reflect.getMetadata(namespace_1.default.CONTROLLER_DYNAMIC_VALIDATOR_FILE, target),
            REQUEST_DYNAMIC_FILTER: Reflect.getMetadata(namespace_1.default.CONTROLLER_DYNAMIC_FILTER, target),
            REQUEST_GUARD: Reflect.getMetadata(namespace_1.default.CONTROLLER_GUARD, target),
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
    callbacks.push(async (ctx, next) => {
        const staticValidators = [];
        if (options.REQUEST_STATIC_VALIDATOR_HEADER)
            staticValidators.push(utils_1.AjvChecker(options.REQUEST_STATIC_VALIDATOR_HEADER, ctx.request.headers, 'Header'));
        if (options.REQUEST_STATIC_VALIDATOR_QUERY)
            staticValidators.push(utils_1.AjvChecker(options.REQUEST_STATIC_VALIDATOR_QUERY, ctx.request.query, 'Query'));
        await Promise.all(staticValidators);
        await next();
    });
    addContextLife('ContextStaticValidator');
    if (options.REQUEST_STATIC_FILTER)
        callbacks.push(...options.REQUEST_STATIC_FILTER);
    addContextLife('ContextStaticFilter');
    if (options.REQUEST_DYNAMIC_LOADER) {
        callbacks.push(...options.REQUEST_DYNAMIC_LOADER);
        callbacks.push(async (ctx, next) => {
            if (!ctx.request.body && !ctx.request.files)
                throw new Error('miss body or files, please check `@Dynamic.Loader` is working all right?');
            await next();
        });
    }
    addContextLife('ContextDynamicLoader');
    callbacks.push(async (ctx, next) => {
        const dynamicValidators = [];
        if (options.REQUEST_DYNAMIC_VALIDATOR_BODY && options.REQUEST_DYNAMIC_VALIDATOR_BODY.length) {
            dynamicValidators.push(...options.REQUEST_DYNAMIC_VALIDATOR_BODY.map(fn => fn(ctx.request.body)));
        }
        if (options.REQUEST_DYNAMIC_VALIDATOR_FILE && options.REQUEST_DYNAMIC_VALIDATOR_FILE.length) {
            dynamicValidators.push(...options.REQUEST_DYNAMIC_VALIDATOR_FILE.map(fn => fn(ctx.request.files)));
        }
        await Promise.all(dynamicValidators);
        await next();
    });
    addContextLife('ContextDynamicValidator');
    if (options.REQUEST_DYNAMIC_FILTER)
        callbacks.push(...options.REQUEST_DYNAMIC_FILTER);
    addContextLife('ContextDynamicFilter');
    if (options.REQUEST_GUARD)
        callbacks.push(...options.REQUEST_GUARD);
    addContextLife('ContextGuard');
    if (options.MIDDLEWARE)
        callbacks.push(...options.MIDDLEWARE);
    addContextLife('ContextMiddleware');
    callbacks.push(async (ctx, next) => {
        const object = new controller(plugin);
        await object[property](ctx);
        await next();
    });
    addContextLife('ContextRuntime');
    if (options.RESPONSE)
        callbacks.push(...options.RESPONSE);
    addContextLife('ContextResponse');
    return callbacks;
    function addContextLife(name) {
        callbacks.push(async (ctx, next) => {
            await ctx.app.emit(name, ctx);
            await next();
        });
    }
}
