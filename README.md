React Spy
---------
Collect UX-analytics of your react-application (for ex: clicks, impressions, etc.).

```
npm i --save react-spy
```


### Usage with Google Analytics

```js
// Btn.js
import {spy} from 'react-spy';

const Btn = ({name, value}) => <button name={name}>{value}</button>;
export default spy({
	id: ({name}) => name, // вычесляемое название
	listen: ['click'], // события, которые слушаем
})(Btn);


// LoginForm.js
import {spy} from 'react-spy';

class LoginForm extends React.Component {
	// ...
	render() {
		return (
			<form onSubmit={this.handleEvent}>
				{/* ... */}
				<Btn name="login" value="Войти"/>
				<Btn name="forget" value="Забыл пароль"/>
			</form>
		);
	}
}

export default spy({
	id: "login-form",
	host: true,
})(LoginForm);


// boot.js
import {addSpyObserver} from 'react-spy';

addSpyObserver(function (chain) {
	// Send to GA
	ga('send', {
		hitType: 'event',
		eventCategory: chain[0], // ex: "login-form"
		eventAction: chain.slice(0).join('_'), // ex: "login_forget_click"
	});
});

ReactDOM.render(<App/>, document.body);
```


### API
 - [@spy](#spy) — декоратор реакт-компонентов


---

<a name="spy></a>
#### `@spy<Props>(options)`
Декорировать компонент для сбора статистики

 - `options` — опции шпиона (опционально)
   - **id**: `string | (props, context?) => string` — название радара по умолчанию
   - **host**: `boolean` — корневой
   - **listen**: `string[]` — какие DOM-события слушать + `mount` и `unmount`
   - **callback** — список наблюдаемых callback'ов которые передаются ему через `props`
   - **propName**: `string` — название свойства, отвечающего за `id` шпиона, по умолчанию `spyId`

```js
import {spy} from 'react-spy';

export default spy({
	id: ({name}) => name, // вычесляемое название
	listen: ['click'], // события, которые слушаем
})(function Btn({value}) {
	return <button>{value}</button>;
})

// Где-то в коде
<Btn
	name="login"
	value="Войти"
/>
// *click* -> ["regform", "login"]
```

---


### Development

 - `npm i`
 - `npm test`, [code coverage](./coverage/lcov-report/index.html)
