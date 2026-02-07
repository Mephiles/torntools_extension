// ----------- HELPERS ----------------
type Dispose = () => void;

// ----------- SIGNALS ----------------

interface Signal<T> {
	(): T;
}

interface WritableSignal<T> extends Signal<T> {
	set(value: T): void;
	update(updateFn: (value: T) => T): void;
	asReadonly(): Signal<T>;
}

interface Subscriber {
	/**
	 * When signal value change it calls notify down the graph as something changed
	 */
	notify(): void;
	/**
	 * Mostly for effects to execute the scheduled logic
	 */
	execute(): void;
	/**
	 * Who do I listen to? When no longer accessed the function is called to dispose the link
	 */
	deps: Set<Dispose>;
}

/**
 * Current globally active subscriber for dep tracking
 */
let activeContext: Subscriber = undefined;
/**
 * Effects that are scheduled
 */
const dirtyEffectsSubs = new Set<Subscriber>();
let areEffectsScheduled = false;

function clearSubscriberDeps(sub: Subscriber) {
	sub.deps.forEach((fn) => fn());
	sub.deps.clear();
}

function scheduleEffect(effectSubscriber: Subscriber) {
	dirtyEffectsSubs.add(effectSubscriber);

	if (!areEffectsScheduled) {
		areEffectsScheduled = true;

		queueMicrotask(() => {
			dirtyEffectsSubs.forEach((eff) => eff.execute());
			dirtyEffectsSubs.clear();
			areEffectsScheduled = false;
		});
	}
}

function signal<T>(initialValue: T): WritableSignal<T> {
	let value = initialValue;
	const readerSubs = new Set<Subscriber>();

	const read = () => {
		// Just a simple read
		if (!activeContext) {
			return value;
		}

		const sub = activeContext;

		// Two way linking on first read
		if (!readerSubs.has(sub)) {
			readerSubs.add(sub);
			sub.deps.add(() => readerSubs.delete(sub));
		}

		return value;
	};

	const write = (newValue: T) => {
		if (newValue !== value) {
			value = newValue;
			[...readerSubs].forEach((sub) => sub.notify());
		}
	};

	read.set = write;
	read.update = (fn: (val: T) => T) => read.set(fn(value));
	read.asReadonly = (): Signal<T> => () => read();

	return read;
}

function computed<T>(computation: () => T): Signal<T> {
	let value: T;
	// Tracks whether evaluation needed - essentially memoization
	let isDirty = true;
	// The readers that subscribe to me (computed or effect for example)
	const readerSubs = new Set<Subscriber>();

	const subscriber: Subscriber = {
		notify: () => {
			if (!isDirty) {
				isDirty = true;
				// I am dirty - so my readers are too
				[...readerSubs].forEach((sub) => sub.notify());
			}
		},
		execute: () => {},
		deps: new Set<Dispose>(),
	};

	const evaluateIfNeeded = () => {
		if (!isDirty) {
			return;
		}

		// We want to subscribe only to signals read in this computation
		clearSubscriberDeps(subscriber);

		const prevCtx = activeContext;
		activeContext = subscriber;

		try {
			value = computation();
			isDirty = false;
		} finally {
			activeContext = prevCtx;
		}
	};

	const read = () => {
		// Simple read
		if (!activeContext) {
			evaluateIfNeeded();
			return value;
		}

		const sub = activeContext;

		if (!readerSubs.has(sub)) {
			readerSubs.add(sub);

			sub.deps.add(() => {
				readerSubs.delete(sub);

				// If no readers left - cleanup everyone the depends on me
				// to avoid memory consumption for no reason until read again
				if (readerSubs.size === 0) {
					clearSubscriberDeps(subscriber);
					isDirty = true;
				}
			});
		}

		evaluateIfNeeded();
		return value;
	};

	return read;
}

function effect(callback: () => void): Dispose {
	const execute = () => {
		clearSubscriberDeps(sub);

		const prevCtx = activeContext;
		activeContext = sub;

		try {
			callback();
		} finally {
			activeContext = prevCtx;
		}
	};

	const sub: Subscriber = {
		execute,
		notify: () => scheduleEffect(sub),
		deps: new Set<Dispose>(),
	};

	// First run sync to gather deps for next run
	execute();

	return () => {
		clearSubscriberDeps(sub);
		dirtyEffectsSubs.delete(sub);
	};
}

// ----------- DOM ----------------

type OneOrMany<T> = T | T[];
type Accessor<T> = () => T;
type ValueOrAccessor<T> = T | Accessor<T>;
interface ControlNode {
	__type: "control";
	mount: (parent: Node, anchor?: Node) => Dispose;
}
interface ElementTemplate {
	tag: keyof HTMLElementTagNameMap;
	class?: OneOrMany<ValueOrAccessor<string>>;
	attrs?: Record<string, ValueOrAccessor<string | number | boolean>>;
	events?: Partial<{
		[E in keyof GlobalEventHandlersEventMap]: (e: GlobalEventHandlersEventMap[E]) => void;
	}>;
	children?: Renderable[];
}
type Renderable = ValueOrAccessor<string | number> | ElementTemplate | ControlNode;

function render(item: Renderable, parent: Node, anchor?: Node): Dispose {
	if (item == null || item == undefined) {
		return () => {};
	}

	if (typeof item === "string" || typeof item === "number") {
		parent.insertBefore(document.createTextNode(String(item)), anchor || null);
		return () => {};
	}

	if (typeof item === "function") {
		const textNode = document.createTextNode("");
		parent.insertBefore(textNode, anchor || null);
		return effect(() => (textNode.textContent = String(item() ?? "")));
	}

	if ("__type" in item) {
		return item.mount(parent, anchor);
	}

	if ("tag" in item) {
		const element = document.createElement(item.tag);
		const cleanups: Dispose[] = [];

		const classes = Array.isArray(item.class) ? item.class : !item.class ? undefined : [item.class];

		if (classes && classes.length) {
			cleanups.push(
				effect(() => {
					const classValues = classes.map((classItem) => (typeof classItem === "function" ? classItem() : classItem));
					element.className = classValues.join(" ");
				})
			);
		}

		const attrsEntries = item.attrs ? Object.entries(item.attrs) : undefined;

		if (attrsEntries && attrsEntries.length > 0) {
			attrsEntries.forEach(([key, value]) => {
				if (typeof value === "function") {
					cleanups.push(
						effect(() => {
							if (value() === undefined || value() === null) {
								element.removeAttribute(key);
							} else {
								element.setAttribute(key, String(value()));
							}
						})
					);
				} else {
					element.setAttribute(key, String(value));
				}
			});
		}

		const eventsEntries = item.events ? Object.entries(item.events) : undefined;

		if (eventsEntries && eventsEntries.length) {
			eventsEntries.forEach(([key, fn]) =>
				element.addEventListener(
					key,
					// @ts-expect-error
					fn
				)
			);
		}

		if (item.children) {
			item.children.forEach((child) => cleanups.push(render(child, element)));
		}

		parent.insertBefore(element, anchor || null);

		return () => cleanups.forEach((fn) => fn());
	}

	return () => {};
}

function removeRangeBetween(start: Node, end: Node) {
	let next = start.nextSibling;

	while (next && next !== end) {
		const oldNext = next;
		next = next.nextSibling;
		oldNext.parentNode?.removeChild(oldNext);
	}
}

// TODO: Better type safety?
function conditional(condition: () => boolean, thenBranch: Accessor<Renderable>, elseBranch: Accessor<Renderable>): ControlNode {
	return {
		__type: "control",
		mount: (parent, anchor) => {
			const start = document.createComment("if:start");
			const end = document.createComment("if:end");

			parent.insertBefore(start, anchor || null);
			parent.insertBefore(end, anchor || null);

			let currentDispose: Dispose = undefined;
			let branch: "then" | "else" = undefined;

			const disposeEffect = effect(() => {
				const result = condition();
				const nextBranch = result ? "then" : "else";

				if (nextBranch !== branch) {
					currentDispose?.();
					removeRangeBetween(start, end);

					if (nextBranch === "then") {
						currentDispose = render(thenBranch(), parent, end);
					} else {
						currentDispose = render(elseBranch(), parent, end);
					}

					branch = nextBranch;
				}
			});

			return () => {
				disposeEffect();
				currentDispose?.();
				removeRangeBetween(start, end);
				start.remove();
				end.remove();
			};
		},
	};
}

// TODO: Smart logic with trackBy?
function iterate<T>(list: ValueOrAccessor<T[]>, rowFn: (item: T, index: number) => Renderable): ControlNode {
	return {
		__type: "control",
		mount: (parent, anchor) => {
			const start = document.createComment("for:start");
			const end = document.createComment("for:end");

			parent.insertBefore(start, anchor || null);
			parent.insertBefore(end, anchor || null);

			let rowsDisposeFns: Dispose[] = [];

			const disposeEffect = effect(() => {
				rowsDisposeFns.forEach((fn) => fn());
				rowsDisposeFns = [];
				removeRangeBetween(start, end);

				const listArr = typeof list === "function" ? list() : list;

				listArr.forEach((item, i) => rowsDisposeFns.push(render(rowFn(item, i), parent, end)));
			});

			return () => {
				disposeEffect();
				rowsDisposeFns.forEach((c) => c());
				removeRangeBetween(start, end);
				start.remove();
				end.remove();
			};
		},
	};
}

interface SwitchCase<T> {
	case: T;
	view: Accessor<Renderable>;
}

// TODO: Better type safety?
function switchOn<T>(source: Accessor<T>, cases: SwitchCase<T>[], defaultCase?: Accessor<Renderable>): ControlNode {
	return {
		__type: "control",
		mount: (parent, anchor) => {
			const start = document.createComment("switch:start");
			const end = document.createComment("switch:end");

			parent.insertBefore(start, anchor || null);
			parent.insertBefore(end, anchor || null);

			let currentDispose: Dispose = undefined;
			let activeIndex: number = undefined;

			const disposeEffect = effect(() => {
				const sourceValue = source();
				const newIndex = cases.findIndex((c) => c.case === sourceValue);

				if (newIndex !== activeIndex) {
					currentDispose?.();
					removeRangeBetween(start, end);

					if (newIndex !== -1) {
						currentDispose = render(cases[newIndex].view(), parent, end);
					} else if (defaultCase) {
						currentDispose = render(defaultCase(), parent, end);
					} else {
						currentDispose = undefined;
					}

					activeIndex = newIndex;
				}
			});

			return () => {
				disposeEffect();
				currentDispose?.();
				removeRangeBetween(start, end);
				start.remove();
				end.remove();
			};
		},
	};
}

function createRoot(template: ElementTemplate) {
	return {
		mountAfter: (element: HTMLElement) => render(template, element.parentElement, element.nextSibling),
	};
}

// ----------- EXAMPLE ----------------

function counterComponent(initialValue: number) {
	const count = signal(initialValue);

	const template: ElementTemplate = {
		tag: "div",
		class: "container",
		children: [
			{
				tag: "div",
				class: ["static", () => (count() % 2 === 0 ? "red" : "green")],
				children: ["The counter is: ", () => count()],
			},
			{
				tag: "button",
				children: ["Increase"],
				events: {
					click: () => count.update((c) => c + 1),
				},
			},
		],
	};

	return {
		counter: count.asReadonly(),
		template,
	};
}

const counter1 = counterComponent(0);
const counter2 = counterComponent(2);
const sumCounters = computed(() => counter1.counter() + counter2.counter());

type Tab = "home" | "settings" | "profile";
const tabs: Tab[] = ["home", "settings", "profile"];
const activeTab = signal<Tab>("home");

const root = createRoot({
	tag: "div",
	class: "main-wrapper",
	children: [
		{ tag: "h3", children: ["Counters"] },
		counter1.template,
		counter2.template,
		// Worse perf
		// conditional(
		// 	() => sumCounters() % 2 === 0,
		// 	() => ({
		// 		tag: "div",
		// 		children: ["Sum is even: ", () => sumCounters()],
		// 	}),
		// 	() => ({
		// 		tag: "div",
		// 		children: ["Sum is odd: ", () => sumCounters()],
		// 	})
		// ),
		// Better perf:
		{
			tag: "div",
			children: [
				conditional(
					() => sumCounters() % 2 === 0,
					() => "Sum is even: ",
					() => "Sum is odd: "
				),
				sumCounters,
			],
		},
		{ tag: "h3", children: ["Tabs"] },
		iterate(tabs, (tab) => ({
			tag: "div",
			children: [tab],
			class: () => (tab === activeTab() ? "selected" : undefined),
			events: {
				click: () => activeTab.set(tab),
			},
		})),
		switchOn(activeTab, [
			{ case: "home", view: () => ({ tag: "div", children: ["Home View"] }) },
			{ case: "settings", view: () => ({ tag: "div", children: ["Settings View"] }) },
			{ case: "profile", view: () => ({ tag: "div", children: ["Profile View"] }) },
		]),
	],
});

setTimeout(() => {
	root.mountAfter(document.querySelector<HTMLElement>("#bankInvestment"));
}, 3000);
