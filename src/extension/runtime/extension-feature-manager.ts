import { factiondata, filters, loadDatabase, localdata, npcs, settings, storageListeners, userdata, version } from "@common/utils/data/database";
import { checkDevice, elementBuilder } from "@common/utils/functions/dom";
import { EVENT_CHANNELS, triggerCustomListener } from "@common/utils/functions/events";
import { findAllElements, findElement } from "@common/utils/functions/find-elements";
import { requireCondition, requireDOMContentLoaded, requireDOMInteractive, requireElement } from "@common/utils/functions/requires";
import { arraysEquals, objectsEquals, toClipboard } from "@common/utils/functions/utilities";
import { PHBoldCheck, PHBoldCopy, PHBoldSpinnerGap, PHQuestion, PHXCircle } from "@common/utils/icons/phosphor-icons";
import { SOURCE_SERVICE } from "@extension/services/proxy-services";
import { ExecutionTiming } from "@features/feature";
import type { Feature } from "@features/feature";
import "./extension-feature-manager.css";
import type { FeatureManager } from "@features/feature-manager";

type FeatureSingleFn = (() => void) | (() => Promise<void>) | null;

type FeatureFn = FeatureSingleFn;

type FeatureStatus = "disabled" | "failed" | "loaded" | "registered" | "information";

interface ResultOptions {
	message?: string;
}

export class ExtensionFeatureManager implements FeatureManager {
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
			this.logError("Uncaught promise rejection:", e.reason);
		});

		loadDatabase().then(() => {
			if (settings.developer) return;

			console.log(
				"%cTorn%cTools %cis running.",
				"font-size: 30px; font-weight: 600; color: green;",
				"font-size: 30px; font-weight: 600; color: #000;",
				"font-size: 30px;",
			);
		});
	}

	private logInfo(...params: any[]) {
		if (!settings) {
			loadDatabase().then(() => this.logInfo(...params));
			return;
		}
		if (!settings.developer) return;

		params[0] = this.logPadding + params[0];
		console.log(...params);
	}

	private logError(info: string | string[], error: any) {
		if (error?.message === "Extension context invalidated.") return;
		if (error?.message === "Maximum cycles reached." && !settings.developer) return;

		this.errorCount = this.errorCount + 1;
		if (this.errorCount === 1) {
			// Show error messages with the first error.
			requireCondition(() => this.container)
				.then((container) => requireElement(".error-messages", { parent: container }))
				.then((messages) => messages.classList.add("show"));
		}

		this.generateErrorMessage(info, error)
			.then((message) => console.error(...message))
			.catch(() => {});

		if (!this.container) {
			this.earlyErrors.push(error);
		} else if (this.errorCount <= 25) {
			this.container.setAttribute("error-count", this.errorCount.toString());
			this.addErrorToPopup(error).catch((err) => console.error(err));
		} else {
			this.container.setAttribute("error-count", "25+");
		}
	}

	private async generateErrorMessage(info: string | string[], error: any): Promise<string[]> {
		if (Array.isArray(info)) {
			info[0] = this.logPadding + info[0];
		} else {
			info = [this.logPadding + info];
		}
		if (error) {
			if (typeof error === "object") {
				if (error instanceof Error) {
					info.push(await SOURCE_SERVICE.mappedStack(error.stack));
				} else if (error instanceof ErrorEvent) {
					const location = await SOURCE_SERVICE.fromSource(error.lineno, error.colno);
					const formattedLocation = location ? `${location.file}:${location.line}` : `${error.filename}:${error.lineno}`;
					info.push(`${error.message} @ ${formattedLocation}`);
				}
			} else {
				info.push(error);
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
				const location = await SOURCE_SERVICE.fromSource(error.lineno, error.colno);
				const formattedLocation = location ? `${location.file}:${location.line}` : `${error.filename}:${error.lineno}`;

				errorElement = elementBuilder({
					type: "div",
					class: "error",
					children: [
						elementBuilder({ type: "div", class: "name", text: error.message }),
						elementBuilder({ type: "pre", class: "stack", text: formattedLocation }),
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
		findElement(".error-messages", this.container).appendChild(errorElement);
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

		if (!(await feature.precondition())) {
			return;
		}

		this.logInfo("Registered new feature.", feature);
		this.features.push(feature);
		this.showResult(feature, "registered", { message: "Loaded. Starting feature." });

		this.startFeature(feature).catch((error) => this.logError(`Failed to start "${feature.name}".`, error));
		this.startLoadListeners(feature);
	}

	findFeature(name: string): Feature | null {
		return this.features.find((feature) => feature.name === name) ?? null;
	}

	private async startFeature(feature: Feature) {
		await Promise.all([loadDatabase(), feature.requiresScreenInformation() ? checkDevice() : Promise.resolve()]);
		try {
			if (feature.isEnabled()) {
				this.logInfo("Starting feature.", feature);

				const requirements = await feature.requirements();
				if (typeof requirements === "string") {
					this.showResult(feature, "information", { message: requirements });
					return;
				}

				if (!this.initialized.includes(feature.name)) {
					await this.executeFunction(feature.initialise);
					this.initialized.push(feature.name);
				}
				await this.executeFunction(feature.execute);

				this.loadedFeatures.push(feature.name);
				this.showResult(feature, "loaded");

				if (feature.shouldTriggerEvents()) {
					triggerCustomListener(EVENT_CHANNELS.FEATURE_ENABLED, { name: feature.name });
				}
			} else {
				this.showResult(feature, "disabled");
			}
		} catch (error) {
			this.showResult(feature, "failed");
			this.logError(`Failed to start "${feature.name}".`, error);
		}
	}

	private async reloadFeature(feature: Feature) {
		if (!feature.isEnabled()) return;

		try {
			this.logInfo("Reload feature.", feature);

			await this.executeFunction(feature.reload);

			if (feature.shouldTriggerEvents()) {
				triggerCustomListener(EVENT_CHANNELS.FEATURE_RELOADED, { name: feature.name });
			}
		} catch (error) {
			this.showResult(feature, "failed");
			this.logError(`Failed to reload "${feature.name}".`, error);
		}
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
			["filters", () => filters],
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

				const outcome = this.loadedFeatures.includes(feature.name) ? this.reloadFeature(feature) : this.startFeature(feature);

				outcome.catch((error) => this.logError(`Failed to start or reload "${feature.name}" during an update.`, error));
			});
		}

		function rec(parent: { [key: string]: any }, path: string[]) {
			if (!parent) return undefined;
			if (path.length > 1) return rec(parent[path[0]], path.slice(1));

			return parent[path[0]];
		}
	}

	async executeFunction(func: FeatureFn) {
		await func?.();
	}

	showResult(feature: Feature, status: FeatureStatus, options: ResultOptions = {}) {
		if (!this.popupLoaded) {
			this.resultQueue.push([feature, status, options]);
			return;
		}

		void (async () => {
			let row = findElement(`[feature-name="${feature.name}"]`, this.container, true);
			if (row) {
				row.setAttribute("status", status);

				const statusIcon = findElement("svg", row);
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

				let scopeEl = findElement(`[scope*="${feature.scope}"]`, this.container, true);
				if (!scopeEl) {
					scopeEl = elementBuilder({
						type: "div",
						attributes: { scope: feature.scope },
						children: [elementBuilder({ type: "div", text: `— ${feature.scope} —` })],
					});
					findElement(".tt-features-list", this.container).appendChild(scopeEl);
				}
				scopeEl.appendChild(row);
			}
			this.hideEmptyScopes();
		})().catch((error) => {
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

									findElement("button", title).style.backgroundImage = title.classList.toggle("open")
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
											toClipboard(`TornTools ${findElement("#tt-page-status .error-messages").innerText}`);
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
		} catch {
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

		findAllElements(".tt-features-list > div[scope]", this.container!).forEach((scopeDiv) => {
			let hideScope = false;
			if (settings.featureDisplayOnlyFailed && findAllElements(":scope > .tt-feature[status*='failed']", scopeDiv).length === 0) hideScope = true;
			if (settings.featureDisplayHideDisabled && findAllElements(":scope > .tt-feature:not([status*='disabled'])", scopeDiv).length === 0)
				hideScope = true;
			scopeDiv.classList[hideScope ? "add" : "remove"]("no-content");
		});
		if (!findElement(".tt-features-list > div[scope]:not(.no-content)", this.container!, true)) this.container!.classList.add("no-content");
		else this.container!.classList.remove("no-content");
	}

	isEnabled(featureConstructor: new () => Feature): boolean {
		const feature = this.features.find((f) => f instanceof featureConstructor);
		if (!feature) return false;

		return feature.isEnabled();
	}
}
