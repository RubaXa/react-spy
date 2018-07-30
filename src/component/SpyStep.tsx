import * as React from 'react';
import spy, { withSpy } from '../spy/spy';

export type SpyStepProps = {
	name: string;
	enter?: string | string[];
	leave?: string | string[];
}

const array = [];

@withSpy({
	id: null,
})
export class SpyStep extends React.Component<SpyStepProps, null> {
	private getValue(props: SpyStepProps, type: keyof SpyStepProps): string[] {
		return array.concat(props.name, props[type] == null ? type : props[type]);
	}

	componentDidMount() {
		spy.send(this, this.getValue(this.props, 'enter'));
	}

	componentDidUpdate(prevProps) {
		if (prevProps.name !== this.props.name) {
			spy.send(this, this.getValue(prevProps, 'leave'));
			spy.send(this, this.getValue(this.props, 'enter'));
		}
	}

	componentWillUnmount() {
		spy.send(this, this.getValue(this.props, 'leave'));
	}

	render() {
		return <div/>;
	}
}