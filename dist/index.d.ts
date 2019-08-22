/// <reference types="node" />
import * as http from 'http';
import * as Router from 'find-my-way';
import WorkerFactory, { WorkerServiceFrameworker } from '@nelts/worker';
import Context from './context';
import { ComposeMiddleware } from '@nelts/utils';
import Scope from './scope';
import Controller from './components/controller';
import Interceptor from './decorators/middleware';
import Response from './decorators/response';
import Prefix from './decorators/router/prefix';
import Path from './decorators/router/path';
import Method from './decorators/router/method';
import Get from './decorators/router/get';
import Post from './decorators/router/post';
import Put from './decorators/router/put';
import Delete from './decorators/router/delete';
import Head from './decorators/router/head';
declare type Middleware = ComposeMiddleware<Context>;
export { Context, Scope, Controller, Interceptor, Response, Head, Get, Post, Put, Delete, Path, Method, Prefix, };
export default class Http implements WorkerServiceFrameworker {
    private _app;
    private _middlewares;
    server: http.Server;
    readonly router: Router.Instance<Router.HTTPVersion.V1>;
    constructor(app: WorkerFactory<Http>);
    readonly app: WorkerFactory<Http>;
    use(...args: Middleware[]): this;
    private resumeConnection;
    componentWillCreate(): Promise<void>;
    componentDidCreated(): Promise<void>;
    componentWillDestroy(): Promise<void>;
    componentDidDestroyed(): Promise<void>;
}
