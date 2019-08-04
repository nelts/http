import * as net from 'net';
import * as http from 'http';
import * as Router from 'find-my-way';
import WorkerFactory, { WorkerServiceFrameworker } from '@nelts/worker';
import { ContextError } from '@nelts/context';
import Context from './context';
import { Compose, ComposeMiddleware } from '@nelts/utils';
import Scope from './scope';
import Controller from './components/controller';
import ControllerCompiler from './compilers/controller';

import StaticFilter from './decorators/request/static-filter';
import StaticValidatorHeader from './decorators/request/static-validator-header';
import StaticValidatorQuery from './decorators/request/static-validator-query';

import DynamicFilter from './decorators/request/dynamic-filter';
import DynamicLoader from './decorators/request/dynamic-loader';
import DynamicValidatorBody from './decorators/request/dynamic-validator-body';
import DynamicValidatorFile from './decorators/request/dynamic-validator-file';

import Middleware from './decorators/middleware';
import Response from './decorators/response';
import Guard from './decorators/request/guard';

import Prefix from './decorators/router/prefix';
import Path from './decorators/router/path';
import Method from './decorators/router/method';
import Get from './decorators/router/get';
import Post from './decorators/router/post';
import Put from './decorators/router/put';
import Delete from './decorators/router/delete';

type Middleware = ComposeMiddleware<Context>;

const Dynamic = {
  Filter: DynamicFilter,
  Loader: DynamicLoader,
  validator: {
    Body: DynamicValidatorBody,
    File: DynamicValidatorFile,
  }
}

const Static = {
  Filter: StaticFilter,
  validator: {
    Header: StaticValidatorHeader,
    Query: StaticValidatorQuery,
  }
}

export {
  Context,
  Scope,
  Controller,
  Middleware,
  Response,
  Guard,
  Get,
  Post,
  Put,
  Delete,
  Path,
  Method,
  Prefix,
  Dynamic,
  Static,
}

export default class Http implements WorkerServiceFrameworker {
  private _app: WorkerFactory<Http>;
  private _middlewares: Middleware[] = [];
  public server: http.Server;
  public readonly router: Router.Instance<Router.HTTPVersion.V1>;
  constructor(app: WorkerFactory<Http>) {
    this._app = app;
    this.router = Router({
      ignoreTrailingSlash: true,
      defaultRoute(req, res) {
        res.statusCode = 404;
        res.end();
      }
    });
    if (this.app.socket) {
      process.on('message', (message: any, socket: net.Socket) => {
        switch (message) {
          case this.app.sticky: this.resumeConnection(socket); break;
        }
      });
    }
  }

  get app() {
    return this._app;
  }

  use(...args: Middleware[]) {
    this._middlewares.push(...args);
    return this;
  }

  private resumeConnection(socket: net.Socket) {
    if (!this.server) return socket.destroy();
    this.server.emit('connection', socket);
    socket.resume();
  }

  async componentWillCreate() {
    this.server = http.createServer((req, res) => {
      const ctx = new Context(this._app, req, res, {
        cookie: this.app.configs.cookie,
        logger: this.app.logger,
      });
      let _composeCallbacks: Middleware[] = this._middlewares.slice(0);
      const result: any = this.router.lookup(ctx.req, ctx.res, ctx);
      if (res.headersSent) return;
      if (Array.isArray(result) && result.length) _composeCallbacks = _composeCallbacks.concat(result);
      ctx.app.emit('ContextStart').then(() => Compose(_composeCallbacks)(ctx)).catch((e: ContextError) => {
        if (ctx.listenerCount('error')) return ctx.emit('ContextError', e);
        if (res.headersSent) return ctx.rollback(e);
        ctx.status = (e && e.status) || 500;
        ctx.body = e.message;
        return ctx.rollback(e);
      }).then(() => ctx.commit()).then(() => ctx.app.emit('ContextStop', ctx)).catch((e: ContextError) => {
        if (res.headersSent) return;
        ctx.status = (e && e.status) || 500;
        ctx.body = e.message;
      }).then(() => ctx.responseBody());
    });
    this.app.compiler.addCompiler(ControllerCompiler);
  }

  async componentDidCreated() {
    await new Promise((resolve, reject) => {
      this.server.listen(this.app.port, (err?: Error) => {
        if (err) return reject(err);
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