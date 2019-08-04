"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http = require("http");
const Router = require("find-my-way");
const context_1 = require("./context");
exports.Context = context_1.default;
const utils_1 = require("@nelts/utils");
const scope_1 = require("./scope");
exports.Scope = scope_1.default;
const controller_1 = require("./components/controller");
exports.Controller = controller_1.default;
const controller_2 = require("./compilers/controller");
const static_filter_1 = require("./decorators/request/static-filter");
const static_validator_header_1 = require("./decorators/request/static-validator-header");
const static_validator_query_1 = require("./decorators/request/static-validator-query");
const dynamic_filter_1 = require("./decorators/request/dynamic-filter");
const dynamic_loader_1 = require("./decorators/request/dynamic-loader");
const dynamic_validator_body_1 = require("./decorators/request/dynamic-validator-body");
const dynamic_validator_file_1 = require("./decorators/request/dynamic-validator-file");
const response_1 = require("./decorators/response");
exports.Response = response_1.default;
const guard_1 = require("./decorators/request/guard");
exports.Guard = guard_1.default;
const prefix_1 = require("./decorators/router/prefix");
exports.Prefix = prefix_1.default;
const path_1 = require("./decorators/router/path");
exports.Path = path_1.default;
const method_1 = require("./decorators/router/method");
exports.Method = method_1.default;
const get_1 = require("./decorators/router/get");
exports.Get = get_1.default;
const post_1 = require("./decorators/router/post");
exports.Post = post_1.default;
const put_1 = require("./decorators/router/put");
exports.Put = put_1.default;
const delete_1 = require("./decorators/router/delete");
exports.Delete = delete_1.default;
const Dynamic = {
    Filter: dynamic_filter_1.default,
    Loader: dynamic_loader_1.default,
    validator: {
        Body: dynamic_validator_body_1.default,
        File: dynamic_validator_file_1.default,
    }
};
exports.Dynamic = Dynamic;
const Static = {
    Filter: static_filter_1.default,
    validator: {
        Header: static_validator_header_1.default,
        Query: static_validator_query_1.default,
    }
};
exports.Static = Static;
class Http {
    constructor(app) {
        this._middlewares = [];
        this._app = app;
        this.router = Router({
            ignoreTrailingSlash: true,
            defaultRoute(req, res) {
                res.statusCode = 404;
                res.end();
            }
        });
        if (this.app.socket) {
            process.on('message', (message, socket) => {
                switch (message) {
                    case this.app.sticky:
                        this.resumeConnection(socket);
                        break;
                }
            });
        }
    }
    get app() {
        return this._app;
    }
    use(...args) {
        this._middlewares.push(...args);
        return this;
    }
    resumeConnection(socket) {
        if (!this.server)
            return socket.destroy();
        this.server.emit('connection', socket);
        socket.resume();
    }
    async componentWillCreate() {
        this.server = http.createServer((req, res) => {
            const ctx = new context_1.default(this._app, req, res, {
                cookie: this.app.configs.cookie,
                logger: this.app.logger,
            });
            let _composeCallbacks = this._middlewares.slice(0);
            const result = this.router.lookup(ctx.req, ctx.res, ctx);
            if (res.headersSent)
                return;
            if (Array.isArray(result) && result.length)
                _composeCallbacks = _composeCallbacks.concat(result);
            ctx.app.emit('ContextStart').then(() => utils_1.Compose(_composeCallbacks)(ctx)).catch((e) => {
                if (ctx.listenerCount('error'))
                    return ctx.emit('ContextError', e);
                if (res.headersSent)
                    return ctx.rollback(e);
                ctx.status = (e && e.status) || 500;
                ctx.body = e.message;
                return ctx.rollback(e);
            }).then(() => ctx.commit()).then(() => ctx.app.emit('ContextStop', ctx)).catch((e) => {
                if (res.headersSent)
                    return;
                ctx.status = (e && e.status) || 500;
                ctx.body = e.message;
            }).then(() => ctx.responseBody());
        });
        this.app.compiler.addCompiler(controller_2.default);
    }
    async componentDidCreated() {
        await new Promise((resolve, reject) => {
            this.server.listen(this.app.port, (err) => {
                if (err)
                    return reject(err);
                resolve();
            });
        });
        await this.app.emit('ServerStarted');
    }
    async componentWillDestroy() {
        await this.app.emit('ServerStopping');
    }
    async componentDidDestroyed() {
        this.server.close();
        await this.app.emit('ServerStopped');
    }
}
exports.default = Http;
