const antd = require('antd-original');
const {spy} = require('react-spy');

module.exports = {
	...antd,

	Button: spy({
		callbacks: {
			onClick(send) {
				send('click');
			},
		},
	})(antd.Button),
};
