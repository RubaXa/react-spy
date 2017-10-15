import * as React from 'react';
import spy, {__spy__, __spyDOMNode__, setupListeners, SpyOptions} from '../spy/spy';
import {findDOMNode} from 'react-dom';
import {setHiddenField} from '../utils/utils';

export type SpyProps = SpyOptions<{}> & {children: JSX.Element};

const {isArray} = Array;

class Wrapper extends React.PureComponent<SpyProps, null> {
	constructor(props, context) {
		super(props, context);
		this[__spy__] = props;
	}

	componentWillReceiveProps(newProps) {
		this[__spy__] = newProps;
	}

	componentDidMount() {
		const {listen} = this.props;

		if (isArray(listen)) {
			setHiddenField(this, __spyDOMNode__, findDOMNode(this), true);
			setupListeners(this, listen, 'add');
		}
	}

	componentDidUpdate(prevProps) {
		const {listen} = this.props;

		isArray(prevProps.listen) && setupListeners(this, prevProps.listen, 'remove');
		this[__spyDOMNode__] = findDOMNode(this);
		isArray(listen) && setupListeners(this, listen, 'add');
	}

	componentWillUnmount() {
		const {listen} = this.props;
		isArray(listen) && setupListeners(this, listen, 'remove');
	}

	render() {
		return this.props.children;
	}
}


export default spy<SpyProps>({})(Wrapper);
