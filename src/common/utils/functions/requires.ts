import { TO_MILLIS } from "@common/utils/functions/utilities";

type RequireConditionFn = () => any;

interface RequireConditionOptions {
	delay: number;
	maxCycles: number;
}

export function requireCondition(condition: RequireConditionFn, partialOptions: Partial<RequireConditionOptions> = {}): Promise<any> {
	const options: RequireConditionOptions = {
		delay: 50,
		maxCycles: 100,
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
	timeout: number;
	observerOptions: {
		childList: boolean;
		subtree: boolean;
	};
};

function checkListener(listener: PendingListener, entry: ObserverEntry): boolean {
	const element = listener.parent.querySelector<Element>(listener.selector);

	const matched = listener.invert ? !element : !!element;
	if (!matched) return false;

	if (listener.timeoutId) clearTimeout(listener.timeoutId);
	entry.listeners.delete(listener);

	listener.resolve(listener.invert ? true : element);

	cleanupEntryIfEmpty(entry);
	return true;
}

function cleanupEntryIfEmpty(entry: ObserverEntry) {
	if (entry.listeners.size > 0) return;

	entry.observer.disconnect();
	observerRegistry.delete(entry.parent);
}

function removeListenerFromRegistry(listener: PendingListener) {
	const entry = observerRegistry.get(listener.parent);
	if (!entry) return;

	entry.listeners.delete(listener);
	cleanupEntryIfEmpty(entry);
}

export function requireElement<T extends Element = HTMLElement>(selector: string, attributes?: Partial<Omit<RequireElementOptions, "invert">>): Promise<T>;
export function requireElement(selector: string, attributes?: Partial<RequireElementOptions & { invert: true }>): Promise<true>;
export function requireElement<T extends Element = HTMLElement>(selector: string, attributes: Partial<RequireElementOptions> = {}): Promise<T | true> {
	const options: RequireElementOptions = {
		invert: false,
		parent: document,
		timeout: TO_MILLIS.SECONDS * 5,
		observerOptions: {
			childList: true,
			subtree: true,
		},
		...attributes,
	};

	// Preserve stack for throwing later when needed.
	const error = new Error("Maximum cycles reached.");

	return new Promise((resolve, reject) => {
		const element = options.parent.querySelector<T>(selector);
		if (options.invert && !element) {
			resolve(true);
			return;
		} else if (!options.invert && element) {
			resolve(element);
			return;
		}

		const timeoutId =
			options.timeout > 0
				? window.setTimeout(() => {
						removeListenerFromRegistry(listener);
						reject(error);
					}, options.timeout)
				: null;

		const listener: PendingListener = {
			selector,
			invert: options.invert,
			parent: options.parent,
			resolve,
			reject,
			timeoutId,
		};

		const entry = getOrCreateObserverEntry(options.parent);
		entry.listeners.add(listener);
	});
}

interface ObserverEntry {
	parent: Element | Document;
	observer: MutationObserver;
	listeners: Set<PendingListener>;
}

interface PendingListener {
	selector: string;
	invert: boolean;
	parent: Element | Document;
	resolve: (value: any) => void;
	reject: (reason: any) => void;
	timeoutId: ReturnType<typeof setTimeout> | null;
}

const observerRegistry = new Map<Element | Document, ObserverEntry>();

function getOrCreateObserverEntry(parent: Element | Document): ObserverEntry {
	const existing = observerRegistry.get(parent);
	if (existing) return existing;

	const observer = new MutationObserver(() => {
		const entry = observerRegistry.get(parent);
		if (!entry) return;

		entry.listeners.forEach((listener) => checkListener(listener, entry));
	});

	const entry: ObserverEntry = { parent, observer, listeners: new Set() };
	observerRegistry.set(parent, entry);
	observer.observe(parent, { childList: true, subtree: true });

	return entry;
}

export function requireSidebar() {
	return requireElement("#sidebar");
}

export function requireContent() {
	return requireElement(".content-wrapper");
}

export function requireItemsLoaded() {
	return requireElement(".items-cont[aria-expanded=true] > li > .title-wrap");
}

export function requireChatsLoaded() {
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
