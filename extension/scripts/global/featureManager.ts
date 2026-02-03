interface Window {
	isFeatureManagerLoaded: boolean;
}

type FeatureName = string;
type FeatureScope = string;
type FeatureEnabledFn = () => boolean;
type FeatureSingleFn = ((liveReload?: boolean) => void) | ((liveReload?: boolean) => Promise<void>) | null;
type FeatureFn = FeatureSingleFn | FeatureSingleFn[];
type FeatureLoadListeners = { storage: string[] };
type FeatureRequirementsFn = (() => string | boolean) | (() => Promise<string | boolean>);

interface FeatureOptions {
	triggerCallback: boolean;
	liveReload: boolean;
}

type Feature = {
	name: FeatureName;
	scope: FeatureScope;
	enabled: FeatureEnabledFn;
	initialise: FeatureFn;
	execute: FeatureFn;
	cleanup: FeatureFn;
	loadListeners: FeatureLoadListeners;
	requirements: FeatureRequirementsFn;
	options: FeatureOptions;
	hasLoaded?: boolean;
};
type FeatureStatus = "disabled" | "failed" | "loaded" | "registered" | "information";

interface ResultOptions {
	message?: string;
}

class FeatureManager {
	private readonly logPadding: string;
	private readonly containerID: string;
	private container: null | HTMLElement;
	private features: Feature[];
	private initialized: string[];
	private popupLoaded: boolean;
	private readonly resultQueue: [Feature, FeatureStatus, ResultOptions][];
	private errorCount: number;
	private earlyErrors: any[];

	constructor() {
		this.logPadding = "[TornTools] FeatureManager - ";
		this.containerID = "tt-page-status";
		this.container = null;
		this.features = [];
		this.initialized = [];

		this.popupLoaded = false;
		this.resultQueue = [];
		this.errorCount = 0;
		this.earlyErrors = [];

		// For testing.
		// setTimeout(() => {
		// 	throw Error("abc");
		// }, 6000);
		// setTimeout(() => {
		// 	throw Error("abc");
		// }, 12000);
		window.addEventListener("error", (e) => {
			// debugger;
			this.logError("Uncaught window error:", e.error);
		});
		window.addEventListener("unhandledrejection", (e) => {
			const error = e.reason instanceof Error ? e.reason : new Error(e.reason);
			// debugger;
			this.logError("Uncaught promise rejection:", error);
		});

		window.isFeatureManagerLoaded = true;

		loadDatabase().then(() => {
			if (settings.developer) return;

			console.log(
				"%cTorn%cTools %cis running.",
				"font-size: 30px; font-weight: 600; color: green;",
				"font-size: 30px; font-weight: 600; color: #000;",
				"font-size: 30px;"
			);
		});
	}

	private async logInfo(...params: any[]) {
		if (!settings) {
			loadDatabase().then(() => this.logInfo(params));
			return;
		}
		if (!settings.developer) return;

		params[0] = this.logPadding + params[0];
		console.log(...params);
	}

	private logError(info: string | string[], error: any) {
		if (error?.message === "Maximum cycles reached." && !settings.developer) return;

		this.errorCount = this.errorCount + 1;
		if (this.errorCount === 1) {
			// Show error messages from first error.
			document.find("#tt-page-status .error-messages").classList.add("show");
		}

		if (Array.isArray(info)) {
			info[0] = this.logPadding + info[0];
		} else {
			info = [this.logPadding + info];
		}
		if (error && "stack" in error) {
			info.push(error.stack);
		}
		console.error(...info);
		// this.container.find(".error-messages")
		/*
		<div class="error-messages">
			<div class="error">
				<div class="name">Uncaught Error: Error Name.</div>
				<pre class="stack">	at sample.js:90
					at otherSample.js:100
				</pre>
			</div>
		</div>*/

		if (!this.container) {
			this.earlyErrors.push(error);
		} else {
			if (this.errorCount > 25) this.container.setAttribute("error-count", "25+");
			else {
				this.container.setAttribute("error-count", this.errorCount.toString());
				this.addErrorToPopup(error);
			}
		}
	}

	private addErrorToPopup(error: any) {
		if (!this.container) return;

		this.container.setAttribute("error-count", this.errorCount.toString());

		let errorElement: HTMLElement;
		if (error != null && typeof error === "object") {
			errorElement = elementBuilder({
				type: "div",
				class: "error",
				children: [
					elementBuilder({ type: "div", class: "name", text: `${error.name}: ${error.message}` }),
					elementBuilder({ type: "pre", class: "stack", text: error.stack }),
				],
			});
		} else {
			errorElement = elementBuilder({
				type: "pre",
				class: "error",
				children: [
					elementBuilder({
						type: "div",
						class: "name",
						text: `Unknown error message: ${error}`,
					}),
				],
			});
		}
		this.container.find(".error-messages").appendChild(errorElement);
	}

	private clearEarlyErrors() {
		this.earlyErrors.forEach((error) => this.addErrorToPopup(error));
		this.earlyErrors = [];
	}

	registerFeature(
		name: FeatureName,
		scope: FeatureScope,
		enabled: FeatureEnabledFn,
		initialise: FeatureFn,
		execute: FeatureFn,
		cleanup?: FeatureFn,
		loadListeners?: FeatureLoadListeners,
		requirements?: Feature["requirements"],
		partialOptions?: Partial<FeatureOptions>
	) {
		const options: Feature["options"] = {
			triggerCallback: false,
			liveReload: false,
			...partialOptions,
		};

		const oldFeature = this.findFeature(name);
		if (oldFeature) throw "Feature already registered.";

		const newFeature: Feature = {
			name,
			scope,
			enabled: () => getValue(enabled),
			initialise,
			execute,
			cleanup,
			loadListeners,
			requirements,
			options,
		};

		this.logInfo("Registered new feature.", newFeature).then(() => {});
		this.features.push(newFeature);
		this.showResult(newFeature, "registered", { message: "Loaded. Starting feature." });

		this.startFeature(newFeature).catch((error) => this.logError(`Failed to start "${name}".`, error));
		this.startLoadListeners(newFeature);

		return newFeature;
	}

	adjustFeature(name: FeatureName, initialise: FeatureSingleFn, execute: FeatureSingleFn, cleanup: FeatureSingleFn) {
		const feature = this.findFeature(name);
		if (!feature) throw "Feature not found.";

		for (const [key, func] of [
			["initialise", initialise],
			["execute", execute],
			["cleanup", cleanup],
		] as const) {
			if (!feature[key]) feature[key] = [func];
			else if (Array.isArray(feature[key])) feature[key].push(func);
			else feature[key] = [feature[key], func];
		}

		if (feature.hasLoaded && getValue(feature.enabled)) {
			this.executeFunction(initialise).catch((error) => this.logError(`Failed to (adjust)initialise "${name}".`, error));
			this.executeFunction(execute).catch((error) => this.logError(`Failed to (adjust)start "${name}".`, error));
		}

		this.logInfo("Adjusted feature.", feature).then(() => {});
		return feature;
	}

	findFeature(name: string): Feature | null {
		return this.features.find((feature) => feature.name === name) ?? null;
	}

	async startFeature(feature: Feature, liveReload?: boolean) {
		await loadDatabase();
		try {
			if (getValue(feature.enabled)) {
				this.logInfo("Starting feature.", feature).then(() => {});
				if ("requirements" in feature) {
					const requirements = await getValueAsync(feature.requirements);

					if (typeof requirements === "string") {
						await this.executeFunction(feature.cleanup).catch((error) =>
							this.logError(`Failed to (string requirements)cleanup "${feature.name}".`, error)
						);

						this.showResult(feature, "information", { message: requirements });
						return;
					}
				}

				if (!this.initialized.includes(feature.name)) {
					await this.executeFunction(feature.initialise);
					this.initialized.push(feature.name);
				}
				if (liveReload && feature.options.liveReload) {
					await this.executeFunction(feature.execute, liveReload);
				} else {
					await this.executeFunction(feature.execute);
				}

				this.showResult(feature, "loaded");

				if (feature.options.triggerCallback) {
					triggerCustomListener(EVENT_CHANNELS.FEATURE_ENABLED, { name: feature.name });
				}
			} else {
				if (feature.hasLoaded) {
					this.logInfo("Disabling feature.", feature).then(() => {});
					await this.executeFunction(feature.cleanup);
					if (feature.options.triggerCallback) {
						triggerCustomListener(EVENT_CHANNELS.FEATURE_DISABLED, { name: feature.name });
					}
				}

				this.showResult(feature, "disabled");
			}
		} catch (error) {
			await this.executeFunction(feature.cleanup).catch((error) => this.logError(`Failed to cleanup in a failed start of "${feature.name}".`, error));

			this.showResult(feature, "failed");
			this.logError(`Failed to start "${feature.name}".`, error);
		}
		feature.hasLoaded = true;
	}

	startLoadListeners(feature: Feature) {
		if (!feature.loadListeners) return;

		if (feature.loadListeners.storage) {
			const storageKeys = feature.loadListeners.storage.reduce<{ [key: string]: string[][] }>((previousValue, currentValue) => {
				const path = currentValue.split(".");
				const area = path[0];
				if (!previousValue[area]) previousValue[area] = [];
				previousValue[area].push(path.slice(1));
				return previousValue;
			}, {});

			for (const [key, getter] of [
				["settings", () => settings],
				["userdata", () => userdata],
				["version", () => version],
				["factiondata", () => factiondata],
				["localdata", () => localdata],
				["npcs", () => npcs],
			] as const) {
				if (!(key in storageKeys)) continue;

				storageListeners[key].push((oldSettings: any) => {
					if (
						!storageKeys[key].some((path) => {
							const newValue = rec(getter(), path);
							const oldValue = rec(oldSettings, path);

							if (Array.isArray(newValue) && Array.isArray(oldValue)) return !newValue.equals(oldValue);
							else if (newValue instanceof Object && oldValue instanceof Object) return !newValue.equals(oldValue);

							return newValue !== oldValue;
						})
					)
						return;

					this.startFeature(feature, true).catch((error) => this.logError(`Failed to start "${feature.name}" during live reload.`, error));
				});
			}
		}

		function rec(parent: { [key: string]: any }, path: string[]) {
			if (!parent) return false;
			if (path.length > 1) return rec(parent[path[0]], path.slice(1));

			return parent[path[0]];
		}
	}

	async executeFunction(func: FeatureFn, liveReload?: boolean) {
		if (!func) return;

		if (Array.isArray(func)) {
			for (const f of func) {
				await this.executeFunction(f, liveReload);
			}
			return;
		}

		if (liveReload) {
			if (func.constructor.name === "AsyncFunction") await func(liveReload);
			else func(liveReload);
		} else {
			if (func.constructor.name === "AsyncFunction") await func();
			else func();
		}
	}

	showResult(feature: Feature, status: FeatureStatus, options: ResultOptions = {}) {
		if (!this.popupLoaded) {
			this.resultQueue.push([feature, status, options]);
			return;
		}

		new Promise(async () => {
			let row = this.container.find(`[feature-name*="${feature.name}"]`);
			if (row) {
				row.setAttribute("status", status);

				const statusIcon = row.find("i");
				statusIcon.setClass(getIconClass(status));

				if (options.message) statusIcon.setAttribute("title", options.message);
				else statusIcon.removeAttribute("title");
			} else {
				row = elementBuilder({
					type: "div",
					class: "tt-feature",
					attributes: { "feature-name": feature.name, status: status },
					children: [
						elementBuilder({
							type: "i",
							class: getIconClass(status),
							...(options.message ? { attributes: { title: options.message } } : {}),
						}),
						elementBuilder({ type: "span", text: feature.name }),
					],
				});

				let scopeEl = this.container.find(`[scope*="${feature.scope}"]`);
				if (!scopeEl) {
					scopeEl = elementBuilder({
						type: "div",
						attributes: { scope: feature.scope },
						children: [elementBuilder({ type: "div", text: `— ${feature.scope} —` })],
					});
					this.container.find(".tt-features-list").appendChild(scopeEl);
				}
				scopeEl.appendChild(row);
			}
			this.hideEmptyScopes();
		}).catch((error) => {
			this.logError(`Couldn't log result for ${feature.name}: ${JSON.stringify(options)}`, error);
		});

		function getIconClass(status: FeatureStatus) {
			let className = "fa-solid ";
			switch (status) {
				case "disabled":
				case "failed":
					className += "fa-circle-xmark";
					break;
				case "loaded":
					className += "fa-check";
					break;
				case "registered":
					className += "fa-spinner";
					break;
				case "information":
				default:
					className += "fa-circle-question";
			}
			return className;
		}
	}

	display() {
		if (!this.container) return;

		this.container.setClass(
			settings.featureDisplay ? "" : "tt-hidden",
			settings.featureDisplayOnlyFailed ? "only-fails" : "",
			settings.featureDisplayHideDisabled ? "hide-disabled" : "",
			settings.featureDisplayHideEmpty ? "hide-empty" : ""
		);
		this.hideEmptyScopes();
		this.clearEarlyErrors();
	}

	async createPopup() {
		await loadDatabase();

		const popup = elementBuilder({
			type: "div",
			id: this.containerID,
			attributes: {
				tabindex: "0", // To make :focus-within working on div elements
				"error-count": "0",
			},
			children: [
				elementBuilder({
					type: "div",
					children: [
						elementBuilder({
							type: "button",
							style: { backgroundImage: `url(${chrome.runtime.getURL("resources/images/icon_128.png")})` },
							events: {
								click: (e) => {
									const target = e.target as Element;
									const title = target.matches(`#${this.containerID}`) ? target : target.closest(`#${this.containerID}`);
									if (title.classList.toggle("open"))
										title.find("button").style.backgroundImage = `url(${chrome.runtime.getURL("resources/images/svg-icons/cross.svg")})`;
									else title.find("button").style.backgroundImage = `url(${chrome.runtime.getURL("resources/images/icon_128.png")})`;
								},
							},
						}),
					],
				}),
				elementBuilder({
					type: "div",
					class: "tt-features-list",
					children: [
						elementBuilder({
							type: "div",
							class: "error-messages",
							children: [
								elementBuilder({
									type: "div",
									class: "heading",
									text: "Errors",
									attributes: { title: "Click or touch to copy all errors" },
									children: [elementBuilder({ type: "i", class: "fa-solid fa-copy" })],
									events: {
										click: () => {
											toClipboard("TornTools " + document.find("#tt-page-status .error-messages").innerText);
										},
									},
								}),
							],
						}),
					],
				}),
			],
		});
		document.body.appendChild(popup);
		this.container = popup;

		this.popupLoaded = true;
		this.display();

		for (const item of this.resultQueue) {
			const [feature, status, options] = item;
			this.showResult(feature, status, options);
		}
	}

	hideEmptyScopes() {
		if (!settings.featureDisplay) return;

		findAllElements(".tt-features-list > div[scope]", this.container).forEach((scopeDiv) => {
			let hideScope = false;
			if (settings.featureDisplayOnlyFailed && findAllElements(":scope > .tt-feature[status*='failed']", scopeDiv).length === 0) hideScope = true;
			if (settings.featureDisplayHideDisabled && findAllElements(":scope > .tt-feature:not([status*='disabled'])", scopeDiv).length === 0) hideScope = true;
			scopeDiv.classList[hideScope ? "add" : "remove"]("no-content");
		});
		if (!this.container.find(".tt-features-list > div[scope]:not(.no-content)")) this.container.classList.add("no-content");
		else this.container.classList.remove("no-content");
	}
}

const featureManager = new FeatureManager();

function featureManagerLoaded(): Promise<boolean> {
	return requireCondition(() => window.isFeatureManagerLoaded, { delay: 100 });
}
