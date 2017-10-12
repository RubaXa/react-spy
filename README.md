React Spy
---------
Collect UX-analytics of your react-application (for ex: clicks, shows, etc.).

```
npm i --save react-spy
```


### Usage
For example with Google Analytics

```js
// Btn.js
import {spy} from 'react-spy';

const Btn = ({name, value}) => (<button name={name}>{value}</button>);
export default spy({
	id: ({name}) => name, // Computed `id` on based component properties
	listen: ['click'],    // DOM-events list
})(Btn);


// LoginForm.js
import {spy} from 'react-spy';

class LoginForm extends React.Component {
	// ...
	handleSubmit(evt) {
		evt.preventDefault();
		try {
			await api.login(this.getFormData());
			spy.send(this, 'success');
		} catch (err) {
			spy.send(this, 'failed', err);
		}
	}

	render() {
		return (
			<form onSubmit={this.handleEvent}>
				{/* ... */}
				<Btn name="login" value="Sign In"/>
				<Btn name="forgot" value="Forgot password"/>
			</form>
		);
	}
}

export default spy({
	id: "login-form",
	host: true,
	listen: ['mount', 'unmount'],
})(LoginForm);


// boot.js
import {addSpyObserver} from 'react-spy';

addSpyObserver(function (chain) {
	// Send to GA
	ga('send', {
		hitType: 'event',
		eventCategory: chain[0], // ex: "login-form"
		eventAction: chain.slice(1).join('_'), // ex: "forgot_click"
	});
});

ReactDOM.render(<App/>, document.body);
```


### API
 - [spy](#spy) — decorator of react-components
 - [addSpyObserver](#addSpyObserver) — add observer of events
 - [intercept](#intercept) — intercepting the chain of events

---

<a name="spy"></a>
#### `spy<Props>(options)`
Decorate the component to collect analytics

 - `options`
   - **id**: `string | (props, context?) => string` — default `id`
   - **listen**: `string[]` — DOM-events to listen + `mount` and `unmount`
   - **callbacks** — list of observed callbacks that are passed to it via `props`
   - **propName**: `string` — name of the property responsible for the spy's `id`, by default` spyId`
   - **host**: `boolean`

```js
import {spy} from 'react-spy';

export default spy({
	id: ({name}) => name,
	listen: ['click'],
})(function Btn({value}) {
	return <button>{value}</button>;
})

// Somewhere in the code
<Btn
	name="login"
	value="Sign in"
/>
// *click* -> ["login", "click"]
```

---

<a name="addSpyObserver"></a>
#### `addSpyObserver(fn: (chain: string[], detail: object) => void): UnsubsriberFn`
Add observer of events for sending to the accounting system of analytics

```ts
import {addSpyObserver} from 'react-spy';

const unsubscribe = addSpyObserver(function (chain) {
	// Send to GA
	ga('send', {
		hitType: 'event',
		eventCategory: chain[0],
		eventAction: chain.slice(0).join('_'),
	});
});

// Somewhere
unsubscribe();
```

---

<a name="intercept"></a>
#### `intercept(rules: InterceptRules)`
Intercepting the chain of events

```ts
import {intercept, UNCAUGHT} from 'react-spy';

intercept({
	'login-form': {
		// Interception of all chains, ex:
		//  - ["login-form", "forgot", "mount"]
		//  - ["login-form", "forgot", "click"]
		//  - etc
		'forgot'(send, chain, detail) {
			send(chain.concat('additional-id'));
		},

		// Processing of non-intercepted chains, ex:
		//  - ["login-form", "login", "click"]
		[UNCAUGHT](send, chain) {
			send(chain.concat('UNCAUGHT'));
			return false; // continue;
		}
	},
});
```

---


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
