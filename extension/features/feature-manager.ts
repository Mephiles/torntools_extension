import { factiondata, loadDatabase, localdata, npcs, settings, storageListeners, userdata, version } from "@/utils/common/data/database";
import { requireCondition, requireDOMContentLoaded, requireDOMInteractive, requireElement } from "@/utils/common/functions/requires";
import { checkDevice, elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { arraysEquals, getValueAsync, objectsEquals, toClipboard } from "@/utils/common/functions/utilities";
import { EVENT_CHANNELS, triggerCustomListener } from "@/utils/common/functions/listeners";
import "./feature-manager.css";
import { SOURCE_SERVICE } from "@/utils/services/proxy-services";
import { PHBoldCheck, PHBoldCopy, PHBoldSpinnerGap, PHQuestion, PHXCircle } from "@/utils/common/icons/phosphor-icons";

type FeatureSingleFn = ((liveReload?: boolean) => void) | ((liveReload?: boolean) => Promise<void>) | null;

export enum ExecutionTiming {
	IMMEDIATELY = "IMMEDIATELY",
	DOM_INTERACTIVE = "DOM_INTERACTIVE",
	CONTENT_LOADED = "CONTENT_LOADED",
}

export abstract class Feature {
	readonly name: string;
	readonly scope: string;
	readonly executionTiming: ExecutionTiming;

	protected constructor(name: string, scope: string, executionTiming: ExecutionTiming = ExecutionTiming.CONTENT_LOADED) {
		this.name = name;
		this.scope = scope;
		this.executionTiming = executionTiming;
	}

	precondition(): boolean | Promise<boolean> {
		return true;
	}

	abstract isEnabled(): boolean;
	initialise(): void {}
	execute(liveReload?: boolean): void | Promise<void> {}
	cleanup(): void {}

	storageKeys(): string[] {
		return [];
	}

	requirements(): (boolean | string) | Promise<boolean | string> {
		return true;
	}

	shouldTriggerEvents(): boolean {
		return false;
	}

	shouldLiveReload(): boolean {
		return false;
	}
}

export abstract class DisabledUntilNoticeFeature extends Feature {
	requirements() {
		return "Disabled until further notice.";
	}
}

type FeatureFn = FeatureSingleFn;

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
	private loadedFeatures: string[];

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
		this.loadedFeatures = [];

		window.addEventListener("error", (e) => {
			if (e.error) {
				this.logError("Uncaught window error:", e.error);
			} else {
				// For some reason we are getting an error from Torn here (while scrolling in the chats).
				if (
					e.message === "ResizeObserver loop completed with undelivered notifications." &&
					(e.filename.includes("torn.com/") || e.filename === "") // Firefox has no filename for some reason.
				)
					return;

				this.logError("Uncaught window error:", e);
			}
		});
		window.addEventListener("unhandledrejection", (e) => {
			const error = e.reason instanceof Error ? e.reason : new Error(e.reason);
			this.logError("Uncaught promise rejection:", error);
		});

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
			// Show error messages with the first error.
			requireCondition(() => this.container)
				.then((container) => requireElement(".error-messages", { parent: container }))
				.then((messages) => messages.classList.add("show"));
		}

		this.generateErrorMessage(info, error).then((message) => console.error(...message));

		if (!this.container) {
			this.earlyErrors.push(error);
		} else {
			if (this.errorCount > 25) this.container.setAttribute("error-count", "25+");
			else {
				this.container.setAttribute("error-count", this.errorCount.toString());
				this.addErrorToPopup(error).then(() => {});
			}
		}
	}

	private async generateErrorMessage(info: string | string[], error: any): Promise<string[]> {
		if (Array.isArray(info)) {
			info[0] = this.logPadding + info[0];
		} else {
			info = [this.logPadding + info];
		}
		if (error && typeof error === "object") {
			if (error instanceof Error) {
				info.push(await SOURCE_SERVICE.mappedStack(error.stack));
			} else if (error instanceof ErrorEvent) {
				const location = await SOURCE_SERVICE.fromSource(error.lineno, error.colno);
				info.push(`${error.message} @ ${location.file}:${location.line}`);
			}
		}

		return info;
	}

	private async addErrorToPopup(error: any) {
		if (!this.container) return;

		this.container.setAttribute("error-count", this.errorCount.toString());

		let errorElement: HTMLElement;
		if (error != null && typeof error === "object") {
			if (error instanceof Error) {
				errorElement = elementBuilder({
					type: "div",
					class: "error",
					children: [
						elementBuilder({ type: "div", class: "name", text: `${error.name}: ${error.message}` }),
						elementBuilder({ type: "pre", class: "stack", text: await SOURCE_SERVICE.mappedStack(error.stack) }),
					],
				});
			} else if (error instanceof ErrorEvent) {
				errorElement = elementBuilder({
					type: "div",
					class: "error",
					children: [
						elementBuilder({ type: "div", class: "name", text: error.message }),
						elementBuilder({ type: "pre", class: "stack", text: `${error.filename}:${error.lineno}` }),
					],
				});
			}
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
		this.container.querySelector(".error-messages").appendChild(errorElement);
	}

	private clearEarlyErrors() {
		this.earlyErrors.forEach((error) => this.addErrorToPopup(error));
		this.earlyErrors = [];
	}

	registerFeature(feature: Feature) {
		this.fullyRegisterFeature(feature).catch((error) => {
			this.logError(`Failed to register "${feature.name}".`, error);
			this.showResult(feature, "failed");
		});
	}

	private async fullyRegisterFeature(feature: Feature) {
		const oldFeature = this.findFeature(feature.name);
		if (oldFeature) throw "Feature already registered.";

		if (feature.executionTiming === ExecutionTiming.DOM_INTERACTIVE) {
			await requireDOMInteractive();
		} else if (feature.executionTiming === ExecutionTiming.CONTENT_LOADED) {
			await requireDOMContentLoaded();
		}

		if (
			(feature.precondition.constructor.name === "AsyncFunction" && !(await feature.precondition())) ||
			(feature.precondition.constructor.name !== "AsyncFunction" && !feature.precondition())
		) {
			return;
		}

		this.logInfo("Registered new feature.", feature).then(() => {});
		this.features.push(feature);
		this.showResult(feature, "registered", { message: "Loaded. Starting feature." });

		this.startFeature(feature).catch((error) => this.logError(`Failed to start "${feature.name}".`, error));
		this.startLoadListeners(feature);
	}

	findFeature(name: string): Feature | null {
		return this.features.find((feature) => feature.name === name) ?? null;
	}

	private async startFeature(feature: Feature, liveReload?: boolean) {
		await loadDatabase();
		await checkDevice();
		try {
			if (feature.isEnabled()) {
				this.logInfo("Starting feature.", feature).then(() => {});

				const requirements = await getValueAsync(feature.requirements);
				if (typeof requirements === "string") {
					await this.executeFunction(feature.cleanup).catch((error) =>
						this.logError(`Failed to (string requirements)cleanup "${feature.name}".`, error)
					);

					this.showResult(feature, "information", { message: requirements });
					return;
				}

				if (!this.initialized.includes(feature.name)) {
					await this.executeFunction(feature.initialise);
					this.initialized.push(feature.name);
				}
				if (liveReload && feature.shouldLiveReload()) {
					await this.executeFunction(feature.execute, liveReload);
				} else {
					await this.executeFunction(feature.execute);
				}

				this.showResult(feature, "loaded");

				if (feature.shouldTriggerEvents()) {
					triggerCustomListener(EVENT_CHANNELS.FEATURE_ENABLED, { name: feature.name });
				}
			} else {
				if (this.loadedFeatures.includes(feature.name)) {
					this.logInfo("Disabling feature.", feature).then(() => {});
					await this.executeFunction(feature.cleanup);
					if (feature.shouldTriggerEvents()) {
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
		this.loadedFeatures.push(feature.name);
	}

	startLoadListeners(feature: Feature) {
		const keys = feature.storageKeys();
		if (keys.length === 0) return;

		const storageKeys = keys.reduce<{ [key: string]: string[][] }>((previousValue, currentValue) => {
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

						if (Array.isArray(newValue) && Array.isArray(oldValue)) return !arraysEquals(newValue, oldValue);
						else if (newValue instanceof Object && oldValue instanceof Object) return !objectsEquals(newValue, oldValue);

						return newValue !== oldValue;
					})
				)
					return;

				this.startFeature(feature, true).catch((error) => this.logError(`Failed to start "${feature.name}" during live reload.`, error));
			});
		}

		function rec(parent: { [key: string]: any }, path: string[]) {
			if (!parent) return false;
			if (path.length > 1) return rec(parent[path[0]], path.slice(1));

			return parent[path[0]];
		}
	}

	async executeFunction(func: FeatureFn, liveReload?: boolean) {
		if (!func) return;

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
			let row = this.container.querySelector(`[feature-name*="${feature.name}"]`);
			if (row) {
				row.setAttribute("status", status);

				const statusIcon = row.querySelector("svg");
				const newIcon = getIconElement(status);
				statusIcon.replaceWith(newIcon);

				if (options.message) row.setAttribute("title", options.message);
				else row.removeAttribute("title");
			} else {
				row = elementBuilder({
					type: "div",
					class: "tt-feature",
					attributes: { "feature-name": feature.name, status: status },
					children: [getIconElement(status), elementBuilder({ type: "span", text: feature.name })],
				});

				let scopeEl = this.container.querySelector(`[scope*="${feature.scope}"]`);
				if (!scopeEl) {
					scopeEl = elementBuilder({
						type: "div",
						attributes: { scope: feature.scope },
						children: [elementBuilder({ type: "div", text: `— ${feature.scope} —` })],
					});
					this.container.querySelector(".tt-features-list").appendChild(scopeEl);
				}
				scopeEl.appendChild(row);
			}
			this.hideEmptyScopes();
		}).catch((error) => {
			this.logError(`Couldn't log result for ${feature.name}: ${JSON.stringify(options)}`, error);
		});

		function getIconElement(status: FeatureStatus) {
			switch (status) {
				case "disabled":
				case "failed":
					return PHXCircle();
				case "loaded":
					return PHBoldCheck();
				case "registered":
					return PHBoldSpinnerGap();
				case "information":
				default:
					return PHQuestion();
			}
		}
	}

	display() {
		if (!this.container) return;

		this.container.className = [
			settings.featureDisplay ? "" : "tt-hidden",
			settings.featureDisplayOnlyFailed ? "only-fails" : "",
			settings.featureDisplayHideDisabled ? "hide-disabled" : "",
			settings.featureDisplayHideEmpty ? "hide-empty" : "",
		]
			.filter((c) => !!c)
			.join(" ");
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
							style: { backgroundImage: `url(${browser.runtime.getURL("/images/icon_128.png")})` },
							events: {
								click: (e) => {
									const target = e.target as Element;
									const title = target.matches(`#${this.containerID}`) ? target : target.closest(`#${this.containerID}`);

									title.querySelector("button").style.backgroundImage = title.classList.toggle("open")
										? `url(${browser.runtime.getURL("/images/svg-icons/cross.svg")})`
										: `url(${browser.runtime.getURL("/images/icon_128.png")})`;
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
									attributes: { title: "Click to copy all errors" },
									children: [PHBoldCopy()],
									events: {
										click: () => {
											toClipboard("TornTools " + document.querySelector<HTMLElement>("#tt-page-status .error-messages").innerText);
										},
									},
								}),
							],
						}),
					],
				}),
			],
		});

		if (!document.body) return;

		try {
			document.body.appendChild(popup);
		} catch (error) {
			return;
		}

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
			if (settings.featureDisplayHideDisabled && findAllElements(":scope > .tt-feature:not([status*='disabled'])", scopeDiv).length === 0)
				hideScope = true;
			scopeDiv.classList[hideScope ? "add" : "remove"]("no-content");
		});
		if (!this.container.querySelector(".tt-features-list > div[scope]:not(.no-content)")) this.container.classList.add("no-content");
		else this.container.classList.remove("no-content");
	}

	isEnabled(featureConstructor: Function): boolean {
		const feature = this.features.find((f) => f instanceof featureConstructor);
		if (!feature) return false;

		return feature.isEnabled();
	}
}

export const FEATURE_MANAGER = new FeatureManager();
