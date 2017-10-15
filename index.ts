import spy from './src/spy/spy';
import {intercept, UNCAUGHT} from './src/intercept/intercept';
import {addSpyObserver} from './src/observer/observer';
import Spy from './src/component/component';

export {
	spy,
	Spy,
	intercept,
	addSpyObserver,
	UNCAUGHT,
};
