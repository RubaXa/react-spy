import 'antd/dist/antd.css';
import './index.css';

import React from 'react';
import ReactDOM from 'react-dom';
import {addSpyObserver} from 'react-spy';
import App from './App';

addSpyObserver(chain => {
	console.info('[react-spy]', chain.join(' -> '));
});

ReactDOM.render(<App/>, document.getElementById('root'));
