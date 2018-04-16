React Spy
---------
A set of utilities for collecting UX-analytics of your React-application (ex: clicks, shows, errors and etc.)

```
npm i --save react-spy
```

### Features
 - Easy integration with any ui-library (ex: [Ant-Design](./examples/antd/))
 - Full control over the events

---

### API
 - [spy](#spy) — decorator of react-components
  - [spy.send](#spy-send) — send stats from the component and not only
  - [spy.error](#spy-error) — send an error from the component and not only
 - [addSpyObserver](#addSpyObserver) — add observer of events
 - [addSpyErrorObserver](#addSpyErrorObserver) — add observer of errors
 - [intercept](#intercept) — intercepting a chain of events
 - Components
   - [Spy](#Spy)
 - Low Level
   - [broadcast](#broadcast) — broadcast any chain of events
   - [broadcastError](#broadcastError) — broadcast any error

---

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
import {addSpyObserver, addSpyErrorObserver} from 'react-spy';

addSpyObserver(chain => {
	// Send to GA
	ga('send', {
		hitType: 'event',
		eventCategory: chain[0], // ex: "login-form"
		eventAction: chain.slice(1).join('_'), // ex: "forgot_click"
	});
});

// Component Errors
addSpyErrorObserver(({error}) => {
	ga('send', 'exception', {
		exDescription: error.message,
		exFatal: false,
	});
});

ReactDOM.render(<App/>, document.body);
```

---

<a name="spy"></a>
#### `spy<Props>(options)`
Decorate the component to collect analytics

 - `options`
   - **id**: `string | (props, context?) => string` — default `id`
   - **listen**: `string[]` — DOM-events to listen + `error`, `mount` and `unmount`
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

<a name="spy-send"></a>
#### `spy.send(cmp: React.Component, chain: string | string [], detail?: object): void`
Send stats from the component and not only

 - **cmp**: `React.Component` — instance of `React.Component`
 - **chain**: `string | string[]` — name of metric
 - **detail**: `object`

```js
import {spy} from 'react-spy';

export default spy({id: 'parent'})(class Box extends React.Component {
	render() {
		return (
			<button onClick={() => {spy.send(this, 'foo');}}>First</button>
			<button onClick={() => {spy.send(this, ['bar', 'baz'], {val: 123});}}>Second</button>
		);
	}
});

// Somewhere in a code
//   click on <First>:
//     - ["parent", "foo"] {}
//   click on <Second>:
//     - ["parent", "bar", "baz"] {val: 123}
//
// Somewhere in an another place:
//    spy.send(['global', 'label'], {time: 321}):
//      - ["global", "label"] {time: 321}
```

---

<a name="spy-error"></a>
#### `spy.error(cmp: React.Component, chain: string | string [], error: Error): void`
send an error from the component and not only

 - **cmp**: `React.Component` — instance of `React.Component`
 - **chain**: `string | string[]` — name of metric
 - **error**: `Error` — any an error

---

<a name="addSpyObserver"></a>
#### `addSpyObserver(fn: (chain: string[], detail: object) => void): UnsubsriberFn`
Add observer of events for sending to the accounting system of analytics

```ts
import {addSpyObserver} from 'react-spy';

const unsubscribe = addSpyObserver(chain => {
	// Send to GA
	ga('send', {
		hitType: 'event',
		eventCategory: chain[0], // ex: "login-form"
		eventAction: chain.slice(1).join('_'), // ex: "forgot_click"
	});
});

// Somewhere (if you need to)
unsubscribe();
```

---

<a name="addSpyErrorObserver"></a>
#### `addSpyErrorObserver(fn: (detail: ErrorDetail) => void): UnsubsriberFn`
Add observer of component errors

 - `detail`
   - **error**: `Error` — JavaScript error
   - **info**: `object` — React error info
   - **chain** `string[]` — spy `id` chain

```ts
import {addSpyErrorObserver} from 'react-spy';

addSpyErrorObserver(({error, chain}) => {
	// Send to GA
	ga('send', 'exception', {
		exDescription: error.message,
		exFatal: false,
	});

	// For dev
	console.error('[react-spy]', chain.join(' -> '));
	console.error(error);
});
```

---

<a name="intercept"></a>
#### `intercept(rules: InterceptRules)`
Intercepting a chain of events

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

<a name="Spy"></a>
#### `<Spy>...</Spy>`

```jsx
import {Spy} from 'react-spy';

const SomeFragment = ({condition, onShowDetail}) => (
	<div>
		<Spy id="top">
			<Button name="detail" value="Show detail" onClick={onShowDetail}/>
		</Spy>

		{condition &&
			<Spy id="bottom" listen={['mount', 'unmount'}>
				Detail
			</Spy>
		}
	</div>
);

// 1. *click on button* -> ["top", "detail", "click"]
// 2. *mounting* -> ["bottom", "mount"]
```

---

<a name="broadcast"></a>
#### `broadcast(chain: string[], detail?: object)`

```ts
import {broadcast} from 'react-spy';

broadcast(['custom', 'event', 'chain'], {value: 'Wow'});
// or just
//   spy.send(['custom', 'event', 'chain'], {value: 'Wow'})
```

---


<a name="broadcastError"></a>
#### `broadcastError(detail: ErrorDetail)`

 - `detail`
   - **error**: `Error` — JavaScript error
   - **chain** `string[]` — spy `id` chain
   - **info**: `object` — React error info (optional)


```ts
import {broadcastError} from 'react-spy';

broadcastError({
	chain: ['login', 'submit', 'failed'],
	error: new Error('Internal Error'),
});
// or just
//   spy.error('localStorage', new Error('Read'));
//   spy.error(thisReactCmp, 'localStorage', new Error('save'));
```

---


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
