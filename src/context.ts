import Context, { ContextOptions, ContextError } from '@nelts/context';
import WorkerFactory from '@nelts/worker';
import Http from './index';
import { IncomingMessage, ServerResponse } from 'http';
import { MessageSendOptions } from '@nelts/messager';

type StackCallback = () => Promise<any>;
type StackStatus = 0 | 1 | 2;

export default class HttpContext<B = any, F = any> extends Context<WorkerFactory<Http>, B, F> {
  private _stacks: StackCallback[] = [];
  private _stackStatus: StackStatus = 0;
  public respond: boolean = true;
  constructor(app: WorkerFactory<Http>, req: IncomingMessage, res: ServerResponse, configs: ContextOptions) {
    super(app, req, res, configs);
  }

  get injector() {
    return this.app.injector;
  }

  get messager() {
    return this.app.messager;
  }

  send(method: string, data?: any, options?: MessageSendOptions) {
    return this.messager.send(method, data, options);
  }

  startJob(name: string, options?: MessageSendOptions) {
    return this.app.startJob(name, options);
  }

  stopJob(name: string, options?: MessageSendOptions) {
    return this.app.stopJob(name, options);
  }

  asyncSend(method: string, data?: any, options?: MessageSendOptions) {
    return this.messager.asyncSend(method, data, options);
  }

  asyncHealth() {
    return this.messager.asyncHealth();
  }

  stash(fn: StackCallback) {
    this._stacks.push(fn);
    return this;
  }

  async commit() {
    if (this._stackStatus !== 0) return;
    await this.sync('ContextResolve');
    this._stackStatus = 2;
  }

  async rollback(e: ContextError) {
    if (this._stackStatus !== 0) return;
    const stacks = this._stacks.slice(0);
    let i = stacks.length;
    while (i--) await stacks[i]();
    await this.sync('ContextReject', e);
    this._stackStatus = 1;
  }
}