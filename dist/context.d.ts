/// <reference types="node" />
import Context, { ContextOptions, ContextError } from '@nelts/context';
import WorkerFactory from '@nelts/worker';
import Http from './index';
import { IncomingMessage, ServerResponse } from 'http';
import { MessageSendOptions } from '@nelts/messager';
declare type StackCallback = () => Promise<any>;
export default class HttpContext<B = any, F = any> extends Context<WorkerFactory<Http>, B, F> {
    private _stacks;
    private _stackStatus;
    respond: boolean;
    constructor(app: WorkerFactory<Http>, req: IncomingMessage, res: ServerResponse, configs: ContextOptions);
    readonly messager: import("@nelts/messager").Worker<WorkerFactory<Http>>;
    send(method: string, data?: any, options?: MessageSendOptions): number;
    startJob(name: string, auto?: boolean, run?: boolean): Promise<any>;
    asyncSend(method: string, data?: any, options?: MessageSendOptions): Promise<any>;
    asyncHealth(): Promise<any>;
    stash(fn: StackCallback): this;
    commit(): Promise<void>;
    rollback(e: ContextError): Promise<void>;
}
export {};
