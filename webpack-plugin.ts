// Based on https://github.com/webpack/webpack/blob/master/lib/NormalModuleReplacementPlugin.js

import {writeFileSync} from 'fs'
import {join} from 'path';

export default class ReactSpyPatcherPlugin {
	constructor(private libraries: string[]) {
	}

	apply(compiler) {
		function patcher() {
		}

		function resolver(result, callback) {
			if (!result) {
				return callback();
			}

			const exists = this.libraries.some(name => result.request.search(name) === 0);
			exists && patcher(result);
			return callback(null, result);
		}

		compiler.plugin('normal-module-factory', (nmf) => {
			console.log('RUN');
			nmf.plugin('before-resolve', resolver);
			nmf.plugin('after-resolve', resolver);
		});

		compiler.plugin('compile', () => {
			console.log('DONE');
		});
	}
}

// module.exports = function () {
// 	return new NormalModuleReplacementPlugin(/^lodash/, (resource) => {
// 		const patchedName = path.join(__dirname, `node_modules/patched-${resource.request.replace('/', '-')}`);
//
// 		if (!resource.contextInfo.issuer.includes('node_modules/patched')) {
// 			fs.writeFileSync(patchedName + '.js', `
// 				const target = require('${resource.request}');
//				
// 				module.exports = Object.keys(target).reduce((obj, name) => {
// 					obj[name] = function (...args) {
// 						console.log('call', name, args);
// 						return target[name].apply(this, args);
// 					};
// 					return obj;
// 				}, {__esModule: true});
// 			`);
//
// 			resource.request = patchedName;
// 		}
// 	})
// };
