type RequireConditionFn = () => any;

interface RequireConditionOptions {
	delay: number;
	maxCycles: number;
}

function requireCondition(condition: RequireConditionFn, partialOptions: Partial<RequireConditionOptions> = {}): Promise<any> {
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
				if (response.hasOwnProperty("success")) {
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

function requireElement(selector: string, attributes: Partial<RequireElementOptions & RequireConditionOptions> = {}) {
	const options: RequireElementOptions = {
		invert: false,
		parent: document,
		...attributes,
	};
	if (attributes.invert) {
		return requireCondition(() => !options.parent.find(selector), attributes);
	} else {
		return requireCondition(() => options.parent.find(selector), attributes);
	}
}

function requireSidebar(): Promise<any> {
	return requireElement("#sidebar");
}

function requireContent(): Promise<any> {
	return requireElement(".content-wrapper");
}

function requireItemsLoaded(): Promise<any> {
	return requireElement(".items-cont[aria-expanded=true] > li > .title-wrap");
}

function requireChatsLoaded(): Promise<any> {
	return requireElement("#chatRoot [class*='chat-list-button__'], #notes_settings_button");
}

function requireFeatureManager(): Promise<void> {
	return new Promise((resolve) => {
		const featureManagerIntervalID = setInterval(() => {
			while (typeof featureManager === "undefined") {}

			clearInterval(featureManagerIntervalID);
			resolve();
		}, 100);
	});
}

interface ChainedObserver {
	observer: MutationObserver;
	selectorResult: Element;
}

/**
 * Observes a chain of selectors from {@link root} and invokes {@link onReached} once all of them are rendered.
 */
function observeChain(root: HTMLElement, selectorsChain: string[], onReached: (lastChainElement: Element) => () => void) {
	let activeObservers: ChainedObserver[] = [];
	let cleanupFn: () => void | undefined = undefined;

	function observe(target: Element, index: number) {
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
