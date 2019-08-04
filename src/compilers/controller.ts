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

import { StaticFilterType } from '../decorators/request/static-filter';
import { DynamicLoaderType } from '../decorators/request/dynamic-loader';
import { DynamicValidatorBodyType } from '../decorators/request/dynamic-validator-body';
import { DynamicValidatorFileType } from '../decorators/request/dynamic-validator-file';
import { DynamicFilterType } from '../decorators/request/dynamic-filter';
import { GuarderType} from '../decorators/request/guard';
import { MiddlewareType } from '../decorators/middleware';
import { ResponseType } from '../decorators/response';

type ControllerConstructor<T extends WorkerPlugin<Http>> = { new(app: T): ControllerComponent<T> };

interface DecoratorAllowMapsInterface<C> {
  REQUEST_STATIC_VALIDATOR_HEADER: object,
  REQUEST_STATIC_VALIDATOR_QUERY: object,
  REQUEST_STATIC_FILTER: StaticFilterType<C>,
  REQUEST_DYNAMIC_LOADER: DynamicLoaderType<C>,
  REQUEST_DYNAMIC_VALIDATOR_BODY: DynamicValidatorBodyType,
  REQUEST_DYNAMIC_VALIDATOR_FILE: DynamicValidatorFileType,
  REQUEST_DYNAMIC_FILTER: DynamicFilterType<C>,
  REQUEST_GUARD: GuarderType<C>,
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
      REQUEST_STATIC_VALIDATOR_HEADER: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_STATIC_VALIDATOR_HEADER, target),
      REQUEST_STATIC_VALIDATOR_QUERY: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_STATIC_VALIDATOR_QUERY, target),
      REQUEST_STATIC_FILTER: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_STATIC_FILTER, target),
      REQUEST_DYNAMIC_LOADER: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_LOADER, target),
      REQUEST_DYNAMIC_VALIDATOR_BODY: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_VALIDATOR_BODY, target),
      REQUEST_DYNAMIC_VALIDATOR_FILE: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_VALIDATOR_FILE, target),
      REQUEST_DYNAMIC_FILTER: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_DYNAMIC_FILTER, target),
      REQUEST_GUARD: Reflect.getMetadata(DecoratorNameSpace.CONTROLLER_GUARD, target),
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
  // 校验 headers 和 querys 的参数是否合法
  callbacks.push(async (ctx, next) => {
    const staticValidators = [];
    if (options.REQUEST_STATIC_VALIDATOR_HEADER) staticValidators.push(AjvChecker(options.REQUEST_STATIC_VALIDATOR_HEADER, ctx.request.headers, 'Header'));
    if (options.REQUEST_STATIC_VALIDATOR_QUERY) staticValidators.push(AjvChecker(options.REQUEST_STATIC_VALIDATOR_QUERY, ctx.request.query, 'Query'));
    await Promise.all(staticValidators);
    await next();
  });

  // 广播`ContextStaticValidator`生命周期
  addContextLife('ContextStaticValidator');

  // 静态参数最终处理
  if (options.REQUEST_STATIC_FILTER) callbacks.push(...options.REQUEST_STATIC_FILTER);

  // 广播`ContextStaticFilter`生命周期
  addContextLife('ContextStaticFilter');

  // 如何获取动态参数中间件
  if (options.REQUEST_DYNAMIC_LOADER) {
    callbacks.push(...options.REQUEST_DYNAMIC_LOADER);
    callbacks.push(async (ctx, next) => {
      if (!ctx.request.body && !ctx.request.files) throw new Error('miss body or files, please check `@Dynamic.Loader` is working all right?');
      await next();
    });
  }

  // 广播`ContextDynamicLoader`生命周期
  addContextLife('ContextDynamicLoader');

  // 校验动态参数
  callbacks.push(async (ctx, next) => {
    const dynamicValidators = [];
    if (options.REQUEST_DYNAMIC_VALIDATOR_BODY && options.REQUEST_DYNAMIC_VALIDATOR_BODY.length) {
      dynamicValidators.push(...options.REQUEST_DYNAMIC_VALIDATOR_BODY.map(fn => fn(ctx.request.body)));
    }
    if (options.REQUEST_DYNAMIC_VALIDATOR_FILE && options.REQUEST_DYNAMIC_VALIDATOR_FILE.length) {
      dynamicValidators.push(...options.REQUEST_DYNAMIC_VALIDATOR_FILE.map(fn => fn(ctx.request.files)));
    }
    await Promise.all(dynamicValidators);
    await next();
  });

  // 广播`ContextDynamicValidator`生命周期
  addContextLife('ContextDynamicValidator');

  // 动态参数最终处理
  if (options.REQUEST_DYNAMIC_FILTER) callbacks.push(...options.REQUEST_DYNAMIC_FILTER);

  // 广播`ContextDynamicFilter`生命周期
  addContextLife('ContextDynamicFilter');

  // 守卫中间件
  if (options.REQUEST_GUARD) callbacks.push(...options.REQUEST_GUARD);

  // 广播`ContextGuard`生命周期
  addContextLife('ContextGuard');

  // 逻辑中间件
  if (options.MIDDLEWARE) callbacks.push(...options.MIDDLEWARE);

  // 广播`ContextMiddleware`生命周期
  addContextLife('ContextMiddleware');

  // 逻辑处理
  callbacks.push(async (ctx, next) => {
    const object: any = new controller(plugin);
    await object[property](ctx);
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
      await ctx.app.emit(name, ctx);
      await next();
    })
  }
}