import {findInterceptor} from '../intercept/intercept';

export type ObserverFn = (chain: string[], detail?: object) => void;
export type UnsubsriberFn = () => void;

const observers: ObserverFn[] = [];

export function addSpyObserver(fn: ObserverFn): UnsubsriberFn {
	observers.push(fn);

	return () => {
		observers.splice(observers.indexOf(fn), 1);
	};
}

export function forceBroadcast(chain: string[], detail: object = {}) {
	observers.forEach(fn => {
		fn(chain, detail);
	});
}

export function broadcast(chain: string[], detail: object = {}) {
	const interceptor = findInterceptor(chain);

	if (interceptor === null || interceptor(forceBroadcast, chain, detail) === false) {
		forceBroadcast(chain, detail);
	}
}
