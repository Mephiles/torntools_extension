import { usingFirefox } from "@common/utils/functions/browser";
import { getParentContext } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import { TO_MILLIS } from "@common/utils/functions/utilities";

type RequireConditionFn<T = any> = () => T | { value: NonNullable<T>; success: boolean };

interface RequireConditionOptions {
	delay: number;
	maxCycles: number;
}

/**
 * Firefox doesn't fire `unhandledrejection` for rejections from content scripts
 * (https://bugzilla.mozilla.org/show_bug.cgi?id=1632270), so we dispatch it ourselves.
 * A rejection counts as handled once someone attaches an `onRejected` handler.
 */
class UnhandledRejectionPromise<T> extends Promise<T> {
	private handled = false;

	// oxlint-disable-next-line unicorn/no-thenable -- observing handlers is the point here
	override then<TResult1 = T, TResult2 = never>(
		onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
		onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
	): Promise<TResult1 | TResult2> {
		if (onrejected) this.handled = true;

		return super.then(onfulfilled, onrejected);
	}

	trackUnhandledRejections() {
		// Bypasses our own `then`, so this doesn't mark the rejection as handled.
		super.then(undefined, (reason: unknown) => {
			window.setTimeout(() => {
				if (this.handled) return;

				window.dispatchEvent(new PromiseRejectionEvent("unhandledrejection", { promise: this, reason }));
			});
		});

		return this;
	}
}

function createRequirePromise<T>(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void): Promise<T> {
	if (typeof window === "undefined" || !usingFirefox()) return new Promise<T>(executor);

	return new UnhandledRejectionPromise<T>(executor).trackUnhandledRejections();
}

export function requireCondition<T = any>(condition: RequireConditionFn<T>, partialOptions: Partial<RequireConditionOptions> = {}): Promise<NonNullable<T>> {
	const options: RequireConditionOptions = {
		delay: 50,
		maxCycles: 100,
		...partialOptions,
	};

	// Preserve stack for throwing later when needed.
	const error = new Error("Maximum cycles reached.");

	return createRequirePromise<NonNullable<T>>((resolve, reject) => {
		if (checkCondition()) return;

		let counter = 0;
		const checker = setInterval(() => {
			if (checkCounter(counter++) || checkCondition()) return clearInterval(checker);
		}, options.delay);

		function checkCondition() {
			const response = condition();
			if (!response) return false;

			if (typeof response === "boolean") {
				if (response) resolve(response);
				else reject();
			} else if (typeof response === "object") {
				if ("success" in response) {
					if (response.success) resolve(response.value);
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
	const element = findElement(listener.selector, listener.parent, true);

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

export class RequireElementConditionError extends Error {
	selector: string;
	parent: string | null;
	timeout: number;

	constructor(selector: string, parent: string | null, inverted: boolean, timeout: number) {
		super(`Element with selector ${selector} was expected to ${inverted ? "disappear" : "appear"} but didn't.`);
		this.name = "RequireElementConditionError";
		this.selector = selector;
		this.parent = parent;
		this.timeout = timeout;
	}
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
	const error = new RequireElementConditionError(selector, getParentContext(options.parent), options.invert, options.timeout);

	return createRequirePromise<T | true>((resolve, reject) => {
		const element = findElement<T>(selector, options.parent, true);
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

export function requireElementOptionally<T extends Element = HTMLElement>(
	selector: string,
	attributes?: Partial<Omit<RequireElementOptions, "invert">>,
): Promise<T | null> {
	return requireElement<T>(selector, attributes).catch(() => null);
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
	selectorResult: Element | undefined;
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
			const selectorResult = findElement(selector, target, true) ?? undefined;

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
