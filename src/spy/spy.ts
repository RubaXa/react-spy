import {Component, ComponentClass, StatelessComponent} from 'react';
import {findDOMNode} from 'react-dom';
import {Requireable, object as objectType, string as stringType} from 'prop-types';
import {setHiddenField, toComponentClass, isComponent} from '../utils/utils';
import {broadcast, broadcastError} from '../observer/observer';

let cid = 0;
const F = function () {};
const postfix = Date.now().toString(36);

const __spy__ = `__spy:options-${postfix}__`;
const __spyProp__ = `__spy:prop-${postfix}__`;
const __spyContext__ = `__spy:context-${postfix}__`;
const __spyContextParent__ = `__spy:context-parent-${postfix}__`;
const __spyDOMNode__ = `__spy:domNode-${postfix}__`;
const __spyHandle__ = `__spy:handle-${postfix}__`;
const __spyLocalSend__ = `__spy:localSend-${postfix}__`;

const __cid__ = `__cid-${postfix}__`;
const __props__ = `__props-${postfix}__`;
const __patchedProps__ = `__patchedProps-${postfix}__`;
const __usePatchedProps__ = `__usePatchedProps-${postfix}__`;

export type Spied = {
	spyId?: string;
}

export type CmpClass<P> = ComponentClass<P> | StatelessComponent<P>;
export type SpywareClass<P extends Spied> = ComponentClass<P>;
export type ComponentDecorator<P> = (Class: CmpClass<P>) => SpywareClass<P & Spied>;

export interface SpyOptions<Props extends object> {
	id?: string | ((props: Props, context: object) => string);
	propName?: keyof Props;
	host?: boolean;
	listen?: string[];
	handle?: (chain: string[]) => boolean | void;
	callbacks?: {
		[name: string]: (
			send: (chain: string | string[], detail?: object) => void,
			args?: any[],
			props?: Props,
		) => void;
	};
}

export interface ISpy {
	<Props extends object>(options: SpyOptions<Props>): ComponentDecorator<Props>;

	send(chain: string | string[], detail?: object): void;
	send(component: Component, chain: string | string[], detail?: object): void;
	send(component: Component<any, null>, chain: string | string[], detail?: object): void;
	send(component: Component<any, any>, chain: string | string[], detail?: object): void;

	error(chain: string | string[], error: Error): void;
	error(component: Component, chain: string | string[], error: Error): void;

	contextTypes?(): {
		'__REACT:SPY:PRIVATE:CTX__': Requireable<object>,
		'__REACT:SPY:PRIVATE:CTX:FLAG__': Requireable<string>,
	};
}

const spy = function spy<Props extends Spied>(options: SpyOptions<Props> = {}): ComponentDecorator<Props> {
	const {
		listen = [],
		callbacks = {},
	} = options;
	const hasErrorEvent = listen.indexOf('error') > -1;
	const hasMountEvent = listen.indexOf('mount') > -1;
	const hasUnmountEvent = listen.indexOf('unmount') > -1;
	const callbackKeys = Object.keys(callbacks);
	let propNameDefined = true;

	if (!options.propName) {
		options.propName = 'spyId';
		propNameDefined = true;
	}

	return ((OrigComponent: CmpClass<Props>) => {
		// Создаём наследника и патчим его
		class SpywareComponent extends toComponentClass<Props>(OrigComponent) {
			constructor(props, context: object) {
				super(props, context);

				setHiddenField(this, __cid__, ++cid);
				setHiddenField(this, __spy__, options, true);
				setHiddenField(this, __spyHandle__, (evt) => {
					spyHandleEvent(this, evt);
				});
				setHiddenField(this, __spyLocalSend__, (chain: string | string[], detail: object) => {
					send(this, chain, detail);
				});
			}
		}

		// Получаем прототип для патчинга
		const proto = SpywareComponent.prototype as (Component & {
			getChildContext();
			componentDidCatch(error: Error, info: object);
			childContextTypes: object;
		});

		// Сохраняем оригинальные методы
		const {
			render,
			getChildContext,
			componentDidCatch,
			componentDidMount,
			componentWillUnmount,
			componentDidUpdate,
		} = proto;

		SpywareComponent.displayName = `Spy(${OrigComponent.displayName || OrigComponent['name']})`;

		// Добавляем в propsType
		SpywareComponent.propTypes = {
			...Object(OrigComponent['propTypes']),
			[options.propName]: stringType,
		};

		// Запрашиваем контекст
		SpywareComponent.contextTypes = {
			...Object(OrigComponent['contextTypes']),
			[__spyContext__]: objectType,
		};

		// Обновляем контекст для детишек
		SpywareComponent.childContextTypes = {
			...Object(OrigComponent['childContextTypes']),
			[__spyContext__]: objectType,
		};

		// Переопределяем функцию получения контекста
		proto.getChildContext = function () {
			let context = getChildContext == null ? {} : getChildContext.call(this);

			(context == null) && (context = {});
			context[__spyContext__] = this;

			return context;
		};

		proto.render = function () {
			// Потому что нельзя сразу возвращать `patchedProps`, React ругается
			this[__usePatchedProps__] = true;
			return render.call(this);
		};

		// Патчим объекта так, чтобы можно было переписать props, а то они заморожены
		Object.defineProperty(proto, 'props', {
			configurable: false,

			get() {
				return this[this[__usePatchedProps__] ? __patchedProps__ : __props__];
			},

			set(origProps) {
				if (this[__patchedProps__] !== origProps) {
					const patchedProps = {
						...origProps,
						[__spyProp__]: {
							options,
							context: this.context,
						},
					};

					if (!propNameDefined) {
						delete patchedProps[options.propName];
					}

					if (callbackKeys.length) {
						// Override callbacks
						callbackKeys.forEach(name => {
							patchedProps[name] = overrideCallback(
								this[__spyLocalSend__],
								origProps,
								origProps[name],
								callbacks[name],
							);
						});
					}

					this[__props__] = origProps;
					this[__patchedProps__] = patchedProps;
				}
			}
		});

		// Количество слушателей
		let listenLength = listen.length;

		if (hasErrorEvent) {
			listenLength--;
			proto.componentDidCatch = function (error, info) {
				broadcastError({
					chain: getSpyChain(this),
					error,
					info,
				});
				componentDidCatch && componentDidCatch.call(this, error, info);
			};
		}

		if (listenLength) {
			// Так можно понять если у нас события помимо mount/unmount
			listenLength -= (+hasMountEvent + +hasUnmountEvent);

			// Mount или есть события отличные от mount/unmount
			if (listenLength || hasMountEvent) {
				proto.componentDidMount = function () {
					if (listenLength) {
						setHiddenField(this, __spyDOMNode__, findDOMNode(this), true);
						setupListeners(this, listen, 'add');
					}

					componentDidMount && componentDidMount.call(this);
					hasMountEvent && send(this, 'mount');
				};
			}

			// Unmount или есть события отличные от mount/unmount
			if (listenLength || hasUnmountEvent) {
				proto.componentWillUnmount = function () {
					if (listenLength) {
						setupListeners(this, listen, 'remove');
						this[__spyDOMNode__] = null;
					}

					componentWillUnmount && componentWillUnmount.call(this);
					hasUnmountEvent && send(this, 'unmount');
				};
			}

			// Обновляем события отличные от mount/unmount
			if (listenLength) {
				proto.componentDidUpdate = function () {
					componentDidUpdate && componentDidUpdate.apply(this, arguments);
					const newEl = findDOMNode(this);
					const prevEl = this[__spyDOMNode__];

					if (newEl !== prevEl) {
						setupListeners(this, listen, 'remove');
						this[__spyDOMNode__] = newEl;
						setupListeners(this, listen, 'add');
					}
				};
			}
		}

		return SpywareComponent;
	});
} as ISpy;

function getSpyChain(component: React.Component) {
	const descr = getSpyDescr(component);
	const chain = [];

	if (descr !== null) {
		let parent = descr;

		while (parent = (parent.context && parent.context[__spyContext__])) {
			const nextDescr = getSpyDescr(parent);

			if (nextDescr !== null) {
				(nextDescr.id != null) && chain.unshift(nextDescr.id);
				if (isHost(parent)) break;
			}
		}

		(descr.id != null) && chain.push(descr.id);
	}

	return chain;
}

function send(chain: string | string[], detail?: object): void;
function send(component: React.Component, chain: string | string[], detail?: object): void;
function send(): void {
	if (isComponent(arguments[0])) {
		const component = arguments[0];
		const chain = arguments[1];
		const detail = arguments[2];
		let rootChain = getSpyChain(component);

		if (rootChain.length) {
			const {handle} = getSpyOptions(component);

			rootChain = rootChain.concat(chain);

			if (handle && handle(rootChain) === false) {
				return;
			}

			broadcast(rootChain, detail);
		}
	} else {
		broadcast([].concat(arguments[0]), arguments[1]);
	}
}

function error(chain: string | string[], error: Error): void;
function error(component: React.Component, chain: string | string[], error: Error): void;
function error(): void {
	if (isComponent(arguments[0])) {
		const rootChain = getSpyChain(arguments[0]);
		const chain = arguments[1];
		const error = arguments[2];


		if (rootChain.length) {
			broadcastError({
				chain: rootChain.concat(chain),
				error,
			});
		} else {
			broadcastError({
				chain: ['UNKNOWN'].concat(chain),
				error,
			});
		}
	} else {
		broadcastError({
			chain: [].concat(arguments[0]),
			error: arguments[1],
		});
	}
}

function contextTypes() {
	return {
		[__spyContext__ as '__REACT:SPY:PRIVATE:CTX__']: objectType,
		[__spyContextParent__ as '__REACT:SPY:PRIVATE:CTX:FLAG__']: stringType,
	};
}

// Export
spy.send = send;
spy.error = error;
spy.contextTypes = contextTypes;

export {
	__spy__,
	__spyDOMNode__,
	__spyHandle__,
	getSpyChain,
};
export default spy;



//
// Всякие приватные методы
//
function getSpyOptions(component): SpyOptions<object> {
	if (component.hasOwnProperty(__spy__)) {
		return component[__spy__];
	} else if (component.props.hasOwnProperty(__spyProp__)) {
		return component.props[__spyProp__].options;
	}

	return {};
}

function getSpyDescr(component): null | {id: string; options: object; context: object;} {
	let context = null;
	let options = null;
	let value = null;

	if (component.context && component.context.hasOwnProperty(__spyContextParent__)) {
		component = component.context[__spyContext__] ;
		if (component == null) {
			return null;
		}
	}

	if (component.hasOwnProperty(__spy__)) {
		options = component[__spy__];
		context = component.context;
	} else if (component.props.hasOwnProperty(__spyProp__)) {
		options = component.props[__spyProp__].options;
		context = component.props[__spyProp__].context;
	}

	if (options !== null) {
		const {id, propName} = options;
		const props = component.hasOwnProperty(__props__) ? component[__props__] : component.props;
		value = props[propName];

		if (value == null) {
			value = typeof id === 'function' ? id(props, component.context) : id;
		}

		return {
			id: value,
			options,
			context,
		}
	}

	return null;
}

function isHost(component: any): boolean {
	return component[__spy__].host;
}

function spyHandleEvent(component: any, {type, target}: Event) {
	const cid = component[__cid__];
	let cursor = target as Node;

	do {
		const allListeners = cursor[__spy__];

		if (allListeners) {
			if (allListeners.hasOwnProperty(cid)) {
				break;
			} else if (allListeners.indexOf(type) > -1) {
				return; // exit
			}
		}
	} while (cursor = cursor.parentNode);

	send(component, type);
}

export function setupListeners(component: any, names: string[], mode: 'add' | 'remove') {
	const el = component[__spyDOMNode__];
	const cid = component[__cid__];
	const handler = component[__spyHandle__];
	const allListeners = el[__spy__] || (el[__spy__] = []);

	allListeners[cid] = (mode !== 'remove');

	names.forEach(name => {
		if (name === 'mount' || name === 'unmount' || name === 'error') {
			return;
		}

		if (mode === 'add') {
			allListeners.push(name);
		} else if (mode === 'remove') {
			const idx = allListeners.indexOf(name);
			(idx > -1) && allListeners.splice(idx, 1);
		}

		(mode != 'add') && el.removeEventListener(name, handler, true);
		(mode != 'remove') && el.addEventListener(name, handler, true);
	});
}

function overrideCallback(send: Function, props: object, originalMethod: Function, spyFn: Function) {
	return function (...args: any[]) {
		spyFn(send, args, props);
		return originalMethod && originalMethod.apply(this, args);
	};
}


/**
 * Component decorator
 */
export function withSpy<P extends object>(options: SpyOptions<P>) {
	return function withSpyDecor<CMP extends ComponentClass<P>>(Component: CMP) {
		return spy<P>(options)(Component) as any;
	};
}