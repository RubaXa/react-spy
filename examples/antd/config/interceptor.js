function interceptor(superRequire, parentModule) {
	console.log(superRequire, parentModule);

	// function RQ(fileName) {
	// 	interceptor.pushLoader(superRequire);
	// 	const result = Module
	// 		? Module._load(fileName, parentModule)
	// 		: loader(fileName, parentModule);
	//
	// 	interceptor.popLoader(superRequire);
	// 	return result;
	// }
	//
	// Object.getOwnPropertyNames(superRequire).forEach(key => {
	// 	RQ[key] = superRequire[key]
	// });
	//
	// return RQ;
}


module.exports = interceptor;
