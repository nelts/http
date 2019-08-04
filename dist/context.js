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
    stash(fn) {
        this._stacks.push(fn);
        return this;
    }
    async commit() {
        if (this._stackStatus !== 0)
            return;
        await this.app.emit('ContextResolve', this);
        this._stackStatus = 2;
    }
    async rollback(e) {
        if (this._stackStatus !== 0)
            return;
        const stacks = this._stacks.slice(0);
        let i = stacks.length;
        while (i--)
            await stacks[i]();
        await this.app.emit('ContextReject', e, this);
        this._stackStatus = 1;
    }
}
exports.default = HttpContext;
