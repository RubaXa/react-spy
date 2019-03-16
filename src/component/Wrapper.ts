import * as React from 'react';
import spy, {__spy__, __spyDOMNode__, getSpyChain, setupListeners, SpyOptions, Spied} from '../spy/spy';
import {findDOMNode} from 'react-dom';
import {setHiddenField} from '../utils/utils';
import {broadcastError} from '../observer/observer';
export type SpyProps = SpyOptions<Spied> & {children: JSX.Element};

const {isArray} = Array;

class Wrapper extends React.PureComponent<SpyProps> {
	constructor(props: SpyProps, context: object) {
		super(props, context);
		this[__spy__] = props;
	}

	componentWillReceiveProps(newProps: SpyProps) {
		this[__spy__] = newProps;
	}

	componentDidCatch(error: Error, info: object) {
		broadcastError({
			chain: getSpyChain(this),
			error,
			info,
		});
	}

	componentDidMount() {
		const {listen} = this.props;

		if (isArray(listen)) {
			setHiddenField(this, __spyDOMNode__, findDOMNode(this), true);
			setupListeners(this, listen, 'add');
		}
	}

	componentDidUpdate(prevProps: SpyProps) {
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
