React Spy
---------
Collect UX-analytics of your react-application (for ex: clicks, shows, etc.).

```
npm i --save react-spy
```


### Usage
For Example with Google Analytics

```js
// Btn.js
import {spy} from 'react-spy';

const Btn = ({name, value}) => <button name={name}>{value}</button>;
export default spy({
	id: ({name}) => name, // Computed `id` on based component properties
	listen: ['click'],    // DOM-events list
})(Btn);


// LoginForm.js
import {spy} from 'react-spy';

class LoginForm extends React.Component {
	// ...
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
		eventAction: chain.slice(0).join('_'), // ex: "forgot_click"
	});
});

ReactDOM.render(<App/>, document.body);
```


### API
 - [@spy](#spy) — decorator of react-components


---

<a name="spy></a>
#### `@spy<Props>(options)`
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


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
