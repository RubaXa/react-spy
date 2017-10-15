import React from 'react';
import {Card, Form, Icon, Input, Button, Row, Col} from 'antd';
import {spy, Spy} from 'react-spy';

const FormItem = Form.Item;

function hasErrors(fieldsError) {
	return Object.keys(fieldsError).some(field => fieldsError[field]);
}

class HorizontalLoginForm extends React.Component {
	componentDidMount() {
		// To disabled submit button at the beginning.
		this.props.form.validateFields();
	}

	handleSubmit = (e) => {
		e.preventDefault();
		this.props.form.validateFields((err, values) => {
			if (!err) {
				spy.send(this, ['validation', 'successfully']);
				console.log('Received values of form: ', values);
			}
		});
	}

	render() {
		const {getFieldDecorator, getFieldsError, getFieldError, isFieldTouched} = this.props.form;

		// Only show error after a field is touched.
		const userNameError = isFieldTouched('userName') && getFieldError('userName');
		const passwordError = isFieldTouched('password') && getFieldError('password');

		return (
			<Card title="Login Form" style={{maxWidth: 500, minWidth: 270, margin: '5vw auto'}}>
				<Form onSubmit={this.handleSubmit}>
					<FormItem
						validateStatus={userNameError ? 'error' : ''}
						help={userNameError || ''}
					>
						{getFieldDecorator('userName', {
							rules: [{required: true, message: 'Please input your username!'}],
						})(
							<Input prefix={<Icon type="user" style={{fontSize: 13}}/>} placeholder="Username"/>
						)}
					</FormItem>

					<FormItem
						validateStatus={passwordError ? 'error' : ''}
						help={passwordError || ''}
					>
						{getFieldDecorator('password', {
							rules: [{required: true, message: 'Please input your Password!'}],
						})(
							<Input prefix={<Icon type="lock" style={{fontSize: 13}}/>} type="password"
								   placeholder="Password"/>
						)}
					</FormItem>

					<FormItem>
						<Row gutter={8}>
							<Col span={12}>
								<Button
									spyId="login"
									type="primary"
									htmlType="submit"
									disabled={hasErrors(getFieldsError())}
									style={{width: '100%'}}
									size="large"
								>
									Log in
								</Button>
							</Col>

							<Col span={12}>
								<Spy id="forgot" listen={['click']}>
									<a href="#path-to">Forgot password</a>
								</Spy>
							</Col>
						</Row>
					</FormItem>
				</Form>
			</Card>
		);
	}
}

export default Form.create()(spy({
	id: 'login-form',
	listen: ['mount', 'unmount'],
})(HorizontalLoginForm));
