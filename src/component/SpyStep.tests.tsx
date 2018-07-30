import * as React from 'react';
import spy, { Spied } from '../spy/spy';
import { SpyStep } from './SpyStep';
import { mount } from 'enzyme';
import { addSpyObserver } from '../..';

it('SpyStep', () => {
	type Props = Spied & {step: string};

	const log = [];
	const Form = spy<Props>({
		id: 'login',
	})(class extends React.Component<Props, null> {
		render() {
			return (<div><SpyStep name={this.props.step}/>{this.props.step}</div>);
		}
	});

	const unsubsribe = addSpyObserver((chain) => {
		log.push(chain);
	});

	const form = mount(<Form step="foo"/>);
	expect(form.text()).toBe('foo');

	form.setProps({step: 'bar'});
	expect(form.text()).toBe('bar');

	form.setProps({step: 'qux'});
	expect(form.text()).toBe('qux');

	form.unmount();

	expect(log).toEqual([
		['login', 'foo', 'enter'],
		['login', 'foo', 'leave'],

		['login', 'bar', 'enter'],
		['login', 'bar', 'leave'],

		['login', 'qux', 'enter'],
		['login', 'qux', 'leave'],
	]);
	unsubsribe();
});