import {Component, ComponentClass, StatelessComponent} from 'react';

export function toComponentClass<P>(Target: ComponentClass<P> | StatelessComponent<P>): ComponentClass<P> {
	if (Target.prototype.render) {
		return Target as ComponentClass<P>;
	} else {
		class Spyware extends Component<P> {
			render() {
				return (Target as Function)(this.props, this.context);
			}
		}

		Spyware['childContextTypes'] = Target['childContextTypes'];

		return Spyware;
	}
}

export function setHiddenField(tgrget: object, name: string, value: any, writable = false) {
	Object.defineProperty(tgrget, name, {
		configurable: false,
		writable,
		value,
	});
}

export function isComponent(x: any): boolean {
	return x && (typeof x === 'function' || x.render);
}