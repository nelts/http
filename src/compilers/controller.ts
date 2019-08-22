import 'reflect-metadata';
import * as path from 'path';
import * as globby from 'globby';
import { WorkerPlugin } from '@nelts/worker';
import { RequireDefault, ComposeMiddleware, AjvChecker, Compose } from '@nelts/utils';
import ControllerComponent from '../components/controller';
import DecoratorNameSpace from '../decorators/namespace';
import { CallBackType } from '../scope';
import Http from '../index';
import Context from '../context';
import { MiddlewareType } from '../decorators/middleware';
import { ResponseType } from '../decorators/response';

type ControllerConstructor<T extends WorkerPlugin<Http>> = { new(app: T): ControllerComponent<T> };

interface DecoratorAllowMapsInterface<C> {
  MIDDLEWARE: MiddlewareType<C>,
  RESPONSE: ResponseType<C>,
}

export default async function Controller<T extends WorkerPlugin<Http>, C extends Context>(plugin: T) {
  const cwd = plugin.source;
  const files = await globby([
    'controller/**/*.ts', 
    'controller/**/*.js', 
    '!controller/**/*.d.ts', 
  ], { cwd });
  files.forEach((file: string) => render<T, C>(plugin, path.resolve(cwd, file)));
}

function render<T extends WorkerPlugin<Http>, C extends Context>(plugin: T, file: string) {
  let fileExports = RequireDefault<CallBackType<T> | ControllerConstructor<T>>(file);
  const Scoped: boolean = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_SCOPED, fileExports);
  if (Scoped) fileExports = (<CallBackType<T>>fileExports)(plugin);
  const controllerPrefix = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_PREFIX, fileExports) || '/';
  const controllerProperties = Object.getOwnPropertyNames(fileExports.prototype);
  const app = plugin.app;

  for (let i = 0; i < controllerProperties.length; i++) {
    const property = controllerProperties[i];
    const target = fileExports.prototype[property];
    if (property === 'constructor') continue;

    const paths = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_PATH, target) || '/';
    const methods = Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_METHOD, target) || [];
    if (!methods.length) continue;

    const CurrentRouterPath = !paths.startsWith('/') ? '/' + paths : paths;
    const CurrentRouterPrefix = controllerPrefix.endsWith('/') 
      ? controllerPrefix.substring(0, controllerPrefix.length - 1)
      : controllerPrefix;

    const decoratorAllowMaps: DecoratorAllowMapsInterface<C> = {
      MIDDLEWARE: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_MIDDLEWARE, target),
      RESPONSE: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_RESPONSE, target),
    }

    app.frameworker.router.on(methods, CurrentRouterPrefix + CurrentRouterPath, function (req, res, params) {
      const ctx: C = this;
      ctx.setParams(params);
      return addComposeCallback<C, T>(decoratorAllowMaps, fileExports as ControllerConstructor<T>, plugin, property);
    })
  }
}

function addComposeCallback<C extends Context, T extends WorkerPlugin<Http>>(
  options: DecoratorAllowMapsInterface<C>,
  controller: ControllerConstructor<T>,
  plugin: T,
  property: string
) {
  const callbacks: ComposeMiddleware<C>[] = [];

  // 逻辑中间件
  if (options.MIDDLEWARE) callbacks.push(...options.MIDDLEWARE);

  // 广播`ContextMiddleware`生命周期
  addContextLife('ContextMiddleware');

  // 逻辑处理
  callbacks.push(async (ctx, next) => {
    const object: any = new controller(plugin);
    const result = await object[property](ctx);
    if (result !== undefined) ctx.body = result;
    await next();
  });

  // 广播`ContextRuntime`生命周期
  addContextLife('ContextRuntime');

  // 最终输出处理中间件
  if (options.RESPONSE) callbacks.push(...options.RESPONSE);

  // 广播`ContextResponse`生命周期
  addContextLife('ContextResponse');

  return callbacks;

  function addContextLife(name: string) {
    callbacks.push(async (ctx, next) => {
      await ctx.sync(name);
      await next();
    })
  }
}