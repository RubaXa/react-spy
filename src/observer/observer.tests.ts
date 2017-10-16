import {addSpyErrorObserver, addSpyObserver, broadcast, broadcastError} from './observer';

it('addSpyObserver', () => {
	const log = [];
	const unsubsribe = addSpyObserver((chain, detail) => {
		log.push(chain, detail);
	});

	afterEach(() => {
		unsubsribe();
	});

	broadcast(['foo']);
	broadcast(['bar'], {val: 1});

	expect(log).toEqual([
		['foo'],
		{},
		['bar'],
		{val: 1},
	]);
});


it('addSpyErrorObserver', () => {
	const log = [];
	const detail = {error: new Error('OK'), info: {}, chain: []};
	const unerr = addSpyErrorObserver(({error, info, chain}) => {
		log.push(error, info, chain);
	});

	afterEach(() => {
		unerr();
	});

	broadcastError(detail);

	expect(log).toEqual([
		detail.error,
		detail.info,
		detail.chain,
	]);
});
