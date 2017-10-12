import {createElement, Component, ComponentClass, StatelessComponent} from 'react';
import {findDOMNode} from 'react-dom';
import {object as objectType} from 'prop-types';
import {setHiddenField, toComponentClass} from '../utils/utils';
import {broadcast} from '../observer/observer';

const postfix = Date.now().toString(36);

const __spy__ = `__options-${postfix}__`;
const __spyContext__ = `__context-${postfix}__`;
const __spyDOMNode__ = `__domNode-${postfix}__`;
const __spyHandle__ = `__handle-${postfix}__`;

let cid = 0;
const __cid__ = `__cid-${postfix}__`;

export type ComponentDecorator<P> = (Class: ComponentClass<P> | StatelessComponent<P>) => ComponentClass<P & {spyId?: string}>;

export interface SpyOptions<Props> {
	id?: string | ((props: Props, context) => string);
	propName?: string;
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
	<Props>(options: SpyOptions<Props>): ComponentDecorator<Props>;
	send?: (component: React.Component, chain: string | string[], detail?: object) => void;
}

const spy: ISpy = function spy<Props>(options: SpyOptions<Props> = {}): ComponentDecorator<Props> {
	const {
		listen = [],
		callbacks,
	} = options;
	const hasMountEvent = listen.includes('mount');
	const hasUnmountEvent = listen.includes('unmount');

	return ((OrigComponent: ComponentClass<Props> | StatelessComponent<Props>) => {
		// Создаём наследника и патчим его
		let SpywareComponent = class SpywareComponent extends toComponentClass<Props>(OrigComponent) {
			constructor(props, context) {
				super(props, context);

				setHiddenField(this, __cid__, ++cid);
				setHiddenField(this, __spy__, options);
				setHiddenField(this, __spyHandle__, (evt) => {
					spyHandleEvent(this, evt);
				});
			}
		};

		// Получаем прототип для патчинга
		const proto = SpywareComponent.prototype as (Component & {
			getChildContext();
			childContextTypes: object;
		});

		// Сохраняем оригинальные методы
		const {
			getChildContext,
			componentDidMount,
			componentWillUnmount,
			componentDidUpdate,
		} = proto;

		// Добавляем контекст
		SpywareComponent.contextTypes = {
			...Object(OrigComponent['contextTypes']),
			[__spyContext__]: objectType,
		};

		SpywareComponent.childContextTypes = {
			...Object(OrigComponent['childContextTypes']),
			[__spyContext__]: objectType,
		};

		// Переопределяем функцию получения контекста
		proto.getChildContext = function () {
			let context = getChildContext == null ? {} : getChildContext.call(this);

			if (context == null) {
				context = {};
			}

			context[__spyContext__] = this;

			return context;
		};

		// Количество слушателей
		let listenLength = listen.length;

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

			// Unmunt или есть события отличные от mount/unmount
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
						setupListeners(this, listen, 'update');
					}
				};
			}
		}

		if (callbacks) {
			SpywareComponent = (function (SpywareComponent: ComponentClass<Props>) {
				const F = function() {};
				const keys = Object.keys(callbacks);

				class SpywareComponentWithCallbacks extends Component<Props, null> {
					private _cmp: Component<Props, null>;
					private _send: (chain: string | string[], detail: object) => void;
					private _setCmp: (cmp: Component<Props, null>) => void;

					constructor(props) {
						super(props);

						this._send = (chain: string | string[], detail: object) => {
							send(this._cmp, chain, detail);
						};

						this._setCmp = (cmp) => {
							this._cmp = cmp;
						};
					}

					render() {
						F.prototype = this.props;
						const props = new F;

						props.ref = this._setCmp;

						keys.forEach(name => {
							props[name] = overrideCallback(
								this._send,
								this.props,
								this.props[name],
								callbacks[name],
							)
						});

						return createElement(SpywareComponent, props);
					}
				}

				return SpywareComponentWithCallbacks;
			})(SpywareComponent)
		}

		return SpywareComponent;
	});
};

function send(component: React.Component, chain: string | string[], detail?: object) {
	const id = getSpyId(component);

	if (id != null) {
		const fullChain = [getSpyId(component)].concat(chain);
		const {handle} = component[__spy__];
		let parent = component;

		while (parent = (parent.context && parent.context[__spyContext__])) {
			fullChain.unshift(getSpyId(parent));
			if (isHost(parent)) break;
		}

		if (handle && handle(fullChain) === false) {
			return;
		}

		broadcast(fullChain, detail);
	}
}

// Export
spy.send = send;
export default spy;



//
// Всякие приватные методы
//
function getSpyId(component): string {
	const {id, propName = 'spyId'} = component[__spy__];
	const props = component.props;
	let value = props[propName];

	if (value == null) {
		value = typeof id === 'function' ? id(props, component.context) : id;
	}

	return value;
}

function isHost(component): boolean {
	return component[__spy__].host
}

function spyHandleEvent(component, {type, target}: Event) {
	const cid = component[__cid__];
	let cursor = target as Node;

	do {
		const allListeners = cursor[__spy__];

		if (allListeners) {
			if (allListeners.hasOwnProperty(cid)) {
				break;
			} else if (allListeners.includes(type)) {
				return; // exit
			}
		}
	} while (cursor = cursor.parentNode);

	send(component, type);
}

function setupListeners(component, names, mode: 'add' | 'update' | 'remove') {
	const el = component[__spyDOMNode__];
	const handler = component[__spyHandle__];
	const cid = component[__cid__];
	const allListeners = el[__spy__] || (el[__spy__] = []);

	allListeners[cid] = (mode !== 'remove');

	names.forEach(name => {
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

function overrideCallback(send, props, originalMethod, spyFn) {
	return function (...args) {
		spyFn(send, args, props);

		if (originalMethod) {
			return originalMethod.apply(this, args);
		}
	};
}
