import { WorkerPlugin } from '@nelts/worker';
import { MessageSendOptions } from '@nelts/messager';
import Http from '../index';
export default class Controller<T extends WorkerPlugin<Http>> {
  public readonly app: T;
  constructor(plugin: T) {
    this.app = plugin;
  }

  get logger() {
    return this.app.logger;
  }

  get messager() {
    return this.app.messager;
  }

  send(method: string, data?: any, options?: MessageSendOptions) {
    return this.messager.send(method, data, options);
  }

  asyncSend(method: string, data?: any, options?: MessageSendOptions) {
    return this.messager.asyncSend(method, data, options);
  }

  asyncHealth() {
    return this.messager.asyncHealth();
  }
}