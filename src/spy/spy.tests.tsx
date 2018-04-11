import spy from './spy';
import * as React from 'react';
import {mount} from 'enzyme';

interface Props {
}

interface OnProps {
	onClick?: (evt) => {}
}

describe('Component', () => {
	const id = 'box';

	class Box extends React.Component<Props, null> {
		render() {
			return (<div className="js-click">FOO</div>);
		}
	}

	it('listen: mount/unmount', () => {
		const log = [];
		const Spyware = spy<Props>({
			listen: ['mount', 'unmount'],
			handle: (chain: string[]) => {log.push(chain);}
		})(Box);

		mount(<Spyware spyId={id}/>).unmount();
		expect(log).toEqual([
			[id, 'mount'],
			[id, 'unmount'],
		]);
	});

	it('listen: click', () => {
		const log = [];
		const Spyware = spy<Props>({
			listen: ['click'],
			handle: (chain: string[]) => {log.push(chain);}
		})(Box);

		const wrapper = mount(<Spyware spyId={id}/>);
		wrapper.find('.js-click').getDOMNode().dispatchEvent(new Event('click'));
		expect(log).toEqual([[id, 'click']]);
	});
});


describe('Stateless', () => {
	const Box: React.StatelessComponent<Props> = () => (<div className="js-click">BAR</div>);
	const id = 'stateless'

	it('listen: mount/unmount', () => {
		const log = [];
		const Spyware = spy<Props>({
			listen: ['mount', 'unmount'],
			handle: (chain: string[]) => {log.push(chain);}
		})(Box);

		mount(<Spyware spyId={id}/>).unmount();
		expect(log).toEqual([
			[id, 'mount'],
			[id, 'unmount'],
		]);
	});
});


it('Nestend', () => {
	const log = [];
	const options = (id, events = []) => ({
		id,
		listen: ['click', ...events],
		handle: (chain) => {log.push(chain)}
	});
	const Qux = spy(options('qux'))(class extends React.Component<Props, null> {
		render() {
			return <div className="js-qux">OK</div>;
		}
	});

	const Bar = spy(options('bar'))(class extends React.Component<Props, null> {
		render() {
			return <div className="js-bar"><Qux/></div>;
		}
	});

	const Foo = spy(options('foo', ['dblclick']))(class extends React.Component<Props, null> {
		render() {
			return <div className="js-foo"><Bar/></div>;
		}
	});

	const wrapper = mount(<Foo/>);

	wrapper.find('.js-qux').getDOMNode().dispatchEvent(new Event('click'));
	wrapper.find('.js-bar').getDOMNode().dispatchEvent(new Event('click'));
	wrapper.find('.js-qux').getDOMNode().dispatchEvent(new Event('dblclick'));

	expect(log).toEqual([
		['foo', 'bar', 'qux', 'click'],
		['foo', 'bar', 'click'],
		['foo', 'dblclick'],
	]);
});

it('callbacks', () => {
	const log = [];
	const Foo = spy<OnProps>({
		id: 'foo',
		handle(chain) {log.push(chain)},
		callbacks: {
			onClick(send, [{type}]) {
				send(['wow', type])
			}
		}
	})(class extends React.Component<OnProps, null> {
		render() {
			return <div className="js-click" onClick={this.props.onClick}>123</div>;
		}
	});

	mount(<Foo/>).find('.js-click').simulate('click');

	expect(log).toEqual([
		['foo', 'wow', 'click'],
	]);
});

it('custom', () => {
	const log = [];
	const Foo = spy<Props>({
		id: 'foo',
		handle(chain) {log.push(chain)},
	})(class extends React.Component<OnProps, null> {
		private handleEvent: () => void;

		constructor(props, context) {
			super(props, context);
			this.handleEvent = () => {
				spy.send(this, ['custom', 'press']);
			};
		}

		render() {
			return <div className="js-click" onClick={this.handleEvent}>123</div>;
		}
	});

	mount(<Foo/>).find('.js-click').simulate('click');

	expect(log).toEqual([
		['foo', 'custom', 'press'],
	]);
});

it('InHOC', () => {
	const log = [];

	class First extends React.Component<{}, null> {
		render() {
			return <div className="js-click" onClick={() => {
				spy.send(this, ['click']);
			}}></div>;
		}
	}

	class Second extends React.Component<{}, null> {
		render() {
			return <First {...this.props}/>
		}
	}

	const Third = spy({
		id: 'third',
		handle(chain) {log.push(chain)},
	})(Second);

	mount(<Third/>).find('.js-click').simulate('click');
	expect(log).toEqual([
		['third', 'click'],
	]);
});

//
// it('decorator', () => {
// 	const log = [];
//
// 	@spy<Props>({handle(chain) {log.push(chain)}})
// 	class Foo extends React.Component<Props, null> {
// 		render() {
// 			return <div className="js-click">123</div>;
// 		}
// 	}
//
// 	const wrapper = mount(<Foo spyId="xxx"/>);
//
// 	wrapper.find('.js-click').simulate('click');
//
// 	expect(log).toEqual([
// 		['xxx', 'click'],
// 	]);
// });
