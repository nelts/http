/// <reference types="node" />
import Context, { ContextOptions, ContextError } from '@nelts/context';
import WorkerFactory from '@nelts/worker';
import Http from './index';
import { IncomingMessage, ServerResponse } from 'http';
declare type StackCallback = () => Promise<any>;
export default class HttpContext<B = any, F = any> extends Context<WorkerFactory<Http>, B, F> {
    private _stacks;
    private _stackStatus;
    respond: boolean;
    constructor(app: WorkerFactory<Http>, req: IncomingMessage, res: ServerResponse, configs: ContextOptions);
    stash(fn: StackCallback): this;
    commit(): Promise<void>;
    rollback(e: ContextError): Promise<void>;
}
export {};
