export const UNCAUGHT = '<UNCAUGHT>';


export type Interceptor = (
	send: (chain: string | string[], detail?: object) => void,
	chain: string[],
	detail: object,
) => boolean | void;

export interface InterceptRules {
	[spyId: string]: Interceptor | InterceptRules
}

const currentRules: InterceptRules = {};

function isInterceptor(rule: Interceptor | InterceptRules): rule is Interceptor {
	return typeof rule === 'function';
}

function assign(target: InterceptRules, rules: InterceptRules, chain: string[] = []) {
	Object.keys(rules).forEach(spyId => {
		const rule = rules[spyId];
		const exists = target.hasOwnProperty(spyId);

		if (isInterceptor(rule)) {
			exists && console.warn(
				'[react-spy] Oops, the intersection of interceptors.',
				'spy:',
				chain.concat(spyId),
				', current:',
				currentRules[spyId],
				', next:',
				rule,
			);

			target[spyId] = rule;
		} else {
			!exists && (target[spyId] = {});
			assign(<InterceptRules>target[spyId], <InterceptRules>rule);
		}
	});
}

function find(rules: InterceptRules, chain: string[], idx: number, uncaught?: Interceptor): Interceptor | null {
	const id = chain[idx];
	const rule = rules[id];

	uncaught = rules[UNCAUGHT] as Interceptor || uncaught || null;

	if (rule != null) {
		if (isInterceptor(rule)) {
			return rule as Interceptor;
		} else if (chain.length > idx + 1) {
			return find(rule, chain, idx + 1, uncaught);
		}
	}

	return uncaught;
}

export function intercept(rules: InterceptRules) {
	assign(currentRules, rules);
}

export function findInterceptor(chain: string[]): Interceptor | null {
	return find(currentRules, chain, 0) || null;
}
