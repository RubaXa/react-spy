import {intercept, UNCAUGHT} from './intercept';
import {addSpyObserver, broadcast} from '../observer/observer';

it('intercept', () => {
	const log = [];
	const unsubscribe = addSpyObserver((chain) => {
		log.push(chain)
	});

	afterEach(() => {
		unsubscribe();
	});

	intercept({
		'login-form': {
			forgot(send, chain) {
				send(chain.concat('!'));
			},

			[UNCAUGHT](send, chain) {
				send(chain.concat('UNCAUGHT'));
				return false;
			}
		},
	});

	broadcast(['login-form', 'forgot', 'click']);
	broadcast(['login-form', 'login', 'click']);

	expect(log).toEqual([
		['login-form', 'forgot', 'click', '!'],
		['login-form', 'login', 'click', 'UNCAUGHT'],
		['login-form', 'login', 'click'],
	]);
});
