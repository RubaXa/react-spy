import * as React from 'react';
import spy, { withSpy } from '../spy/spy';

export type SpyStepProps = {
	name: string;
	host?: boolean;
	enter?: string | string[];
	leave?: string | string[];
}

const array = [];

@withSpy({
	id: null,
})
export class SpyStep extends React.Component<SpyStepProps, {}> {
	private send(type: keyof SpyStepProps, props: SpyStepProps = this.props): void {
		const chain = array.concat(
			props.name,
			props[type] == null ? type : props[type],
		);

		if (props.host) {
			spy.send(chain);
		} else {
			spy.send(this, chain);
		}
	}

	componentDidMount() {
		this.send('enter');
	}

	componentDidUpdate(prevProps: SpyStepProps) {
		if (prevProps.name !== this.props.name) {
			this.send('leave', prevProps);
			this.send('enter');
		}
	}

	componentWillUnmount() {
		this.send('leave');
	}

	render() {
		return <div/>;
	}
}