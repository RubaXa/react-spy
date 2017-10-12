import {addSpyObserver, broadcast} from './observer';

it('core', () => {
	const log = [];
	const unsubsribe = addSpyObserver((chain, detail) => {
		log.push(chain, detail);
	});

	broadcast(['foo']);
	broadcast(['bar'], {val: 1});

	unsubsribe();

	expect(log).toEqual([
		['foo'],
		{},
		['bar'],
		{val: 1},
	]);
});
