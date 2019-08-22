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
import Middleware from './decorators/middleware';
import Response from './decorators/response';
import Prefix from './decorators/router/prefix';
import Path from './decorators/router/path';
import Method from './decorators/router/method';
import Get from './decorators/router/get';
import Post from './decorators/router/post';
import Put from './decorators/router/put';
import Delete from './decorators/router/delete';
import Head from './decorators/router/head';

type Middleware = ComposeMiddleware<Context>;

export {
  Context,
  Scope,
  Controller,
  Middleware,
  Response,
  Head,
  Get,
  Post,
  Put,
  Delete,
  Path,
  Method,
  Prefix,
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
    this.app.compiler.addCompiler(ControllerCompiler);
    this.server = http.createServer((req, res) => {
      const ctx = new Context(this._app, req, res, {
        cookie: this.app.configs.cookie,
        logger: this.app.logger,
      });
      let _composeCallbacks: Middleware[] = this._middlewares.slice(0);
      const result: any = this.router.lookup(ctx.req, ctx.res, ctx);
      if (res.headersSent) return;
      if (Array.isArray(result) && result.length) _composeCallbacks = _composeCallbacks.concat(result);
      ctx.app.sync('ContextStart', ctx).then(() => Compose(_composeCallbacks)(ctx)).catch((e: ContextError) => {
        if (ctx.listenerCount('ContextError')) return ctx.sync('ContextError', e);
        if (res.headersSent) return ctx.rollback(e);
        ctx.status = (e && e.status) || 500;
        ctx.body = e.message;
        return ctx.rollback(e);
      }).then(() => ctx.commit()).then(() => ctx.app.sync('ContextStop', ctx)).catch((e: ContextError) => {
        if (res.headersSent) return;
        ctx.status = (e && e.status) || 500;
        ctx.body = e.message;
      }).then(() => ctx.responseBody());
    });
  }

  async componentDidCreated() {
    await new Promise((resolve, reject) => {
      this.server.listen(this.app.port, (err?: Error) => {
        if (err) return reject(err);
        resolve();
      });
    });
    await this.app.sync('ServerStarted');
  }

  async componentWillDestroy() {
    await this.app.sync('ServerStopping');
  }

  async componentDidDestroyed() {
    this.server.close();
    await this.app.sync('ServerStopped');
  }
}