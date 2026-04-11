type RequireConditionFn = () => any;

interface RequireConditionOptions {
	delay: number;
	maxCycles: number;
}

export function requireCondition(condition: RequireConditionFn, partialOptions: Partial<RequireConditionOptions> = {}): Promise<any> {
	const options: RequireConditionOptions = {
		delay: 50,
		maxCycles: 1000,
		...partialOptions,
	};

	// Preserve stack for throwing later when needed.
	const error = new Error("Maximum cycles reached.");

	return new Promise((resolve, reject) => {
		if (checkCondition()) return;

		let counter = 0;
		const checker = setInterval(() => {
			if (checkCounter(counter++) || checkCondition()) return clearInterval(checker);
		}, options.delay);

		function checkCondition() {
			const response = condition();
			if (!response) return false;

			if (typeof response === "boolean") {
				if (response) resolve(true);
				else reject();
			} else if (typeof response === "object") {
				if (Object.hasOwn(response, "success")) {
					if (response.success === true) resolve(response.value);
					else reject(response.value);
				} else {
					resolve(response);
				}
			}
			return true;
		}

		function checkCounter(count: number) {
			if (options.maxCycles <= 0) return false;

			if (count > options.maxCycles) {
				reject(error);
				return true;
			}
			return false;
		}
	});
}

type RequireElementOptions = {
	invert: boolean;
	parent: Element | Document;
};

export function requireElement(selector: string, attributes: Partial<RequireElementOptions & RequireConditionOptions> = {}) {
	const options: RequireElementOptions = {
		invert: false,
		parent: document,
		...attributes,
	};
	if (attributes.invert) {
		return requireCondition(() => !options.parent.querySelector(selector), attributes);
	} else {
		return requireCondition(() => options.parent.querySelector(selector), attributes);
	}
}

export function requireSidebar(): Promise<any> {
	return requireElement("#sidebar");
}

export function requireContent(): Promise<any> {
	return requireElement(".content-wrapper");
}

export function requireItemsLoaded(): Promise<void> {
	return requireElement(".items-cont[aria-expanded=true] > li > .title-wrap");
}

export function requireChatsLoaded(): Promise<void> {
	return requireElement("#chatRoot [class*='chat-list-button__'], #notes_settings_button");
}

interface ChainedObserver {
	observer: MutationObserver;
	selectorResult: Element;
}

/**
 * Observes a chain of selectors from {@link root} and invokes {@link onReached} once all of them are rendered.
 */
export function observeChain(root: ParentNode, selectorsChain: string[], onReached: (lastChainElement: Element) => () => void) {
	let activeObservers: ChainedObserver[] = [];
	let cleanupFn: () => void;

	function observe(target: ParentNode, index: number) {
		const selector = selectorsChain[index];
		const observer = new MutationObserver(() => {
			const activeObserver = activeObservers[index];
			const selectorResult = target.querySelector(selector) ?? undefined;

			if (selectorResult === activeObserver.selectorResult) {
				return;
			}

			activeObserver.selectorResult = selectorResult;

			if (!selectorResult) {
				const obsolete = activeObservers.splice(index + 1, activeObservers.length - 1);
				obsolete.forEach((activeObserver) => activeObserver.observer.disconnect());
				cleanupFn?.();

				return;
			}

			if (index === selectorsChain.length - 1) {
				cleanupFn = onReached(selectorResult) ?? undefined;

				return;
			}

			observe(selectorResult, index + 1);
		});

		activeObservers.push({
			observer,
			selectorResult: undefined,
		});
		observer.observe(target, { childList: true, subtree: true });
	}

	function disconnect() {
		activeObservers.forEach((activeObserver) => activeObserver.observer.disconnect());
		activeObservers = [];
		cleanupFn?.();
	}

	observe(root, 0);

	return { disconnect };
}

export function requireDOMContentLoaded(): Promise<void> {
	return new Promise((resolve) => {
		if (document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
		} else {
			resolve();
		}
	});
}

export function requireDOMInteractive(): Promise<void> {
	return new Promise((resolve) => {
		if (document.readyState === "loading") {
			document.addEventListener("readystatechange", () => resolve(), { once: true });
		} else {
			resolve();
		}
	});
}
