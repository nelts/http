"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("@nelts/context");
class HttpContext extends context_1.default {
    constructor(app, req, res, configs) {
        super(app, req, res, configs);
        this._stacks = [];
        this._stackStatus = 0;
        this.respond = true;
    }
    get injector() {
        return this.app.frameworker.injector;
    }
    get messager() {
        return this.app.messager;
    }
    send(method, data, options) {
        return this.messager.send(method, data, options);
    }
    startJob(name, options) {
        return this.app.startJob(name, options);
    }
    stopJob(name, options) {
        return this.app.stopJob(name, options);
    }
    asyncSend(method, data, options) {
        return this.messager.asyncSend(method, data, options);
    }
    asyncHealth() {
        return this.messager.asyncHealth();
    }
    stash(fn) {
        this._stacks.push(fn);
        return this;
    }
    async commit() {
        if (this._stackStatus !== 0)
            return;
        await this.emit('ContextResolve');
        this._stackStatus = 2;
    }
    async rollback(e) {
        if (this._stackStatus !== 0)
            return;
        const stacks = this._stacks.slice(0);
        let i = stacks.length;
        while (i--)
            await stacks[i]();
        await this.emit('ContextReject', e);
        this._stackStatus = 1;
    }
}
exports.default = HttpContext;
