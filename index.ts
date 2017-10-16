import spy from './src/spy/spy';
import {intercept, UNCAUGHT} from './src/intercept/intercept';
import {addSpyObserver, addSpyErrorObserver} from './src/observer/observer';
import Spy from './src/component/component';

export {
	spy,
	Spy,
	intercept,
	addSpyObserver,
	addSpyErrorObserver,
	UNCAUGHT,
};
