/// <reference types="node" />
import * as http from 'http';
import * as Router from 'find-my-way';
import WorkerFactory, { WorkerServiceFrameworker } from '@nelts/worker';
import Context from './context';
import { ComposeMiddleware } from '@nelts/utils';
import Scope from './scope';
import Controller from './components/controller';
import { Container, provide as Provide, inject as Inject } from 'injection';
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
declare type Middleware = ComposeMiddleware<Context>;
declare const Dynamic: {
    Filter: typeof DynamicFilter;
    Loader: typeof DynamicLoader;
    validator: {
        Body: typeof DynamicValidatorBody;
        File: typeof DynamicValidatorFile;
    };
};
declare const Static: {
    Filter: typeof StaticFilter;
    validator: {
        Header: typeof StaticValidatorHeader;
        Query: typeof StaticValidatorQuery;
    };
};
export { Provide, Inject, Context, Scope, Controller, Middleware, Response, Guard, Get, Post, Put, Delete, Path, Method, Prefix, Dynamic, Static, };
export default class Http implements WorkerServiceFrameworker {
    private _app;
    private _middlewares;
    private _injector;
    server: http.Server;
    readonly router: Router.Instance<Router.HTTPVersion.V1>;
    constructor(app: WorkerFactory<Http>);
    readonly app: WorkerFactory<Http>;
    readonly injector: Container;
    use(...args: Middleware[]): this;
    private resumeConnection;
    componentWillCreate(): Promise<void>;
    componentDidCreated(): Promise<void>;
    componentWillDestroy(): Promise<void>;
    componentDidDestroyed(): Promise<void>;
}
