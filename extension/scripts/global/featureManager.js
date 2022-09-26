class FeatureManager {
	constructor() {
		this.logPadding = "[TornTools] FeatureManager - ";
		this.containerID = "tt-page-status";
		this.container = null;
		this.features = [];
		this.initialized = [];

		this.popupLoaded = false;
		this.resultQueue = [];
		this.errorCount = 0;

		this.isDisconnected = false;
		this.port = chrome.runtime.connect({ name: "status-check" });
		this.port.onDisconnect.addListener(() => {
			this.features.forEach((feature) => this.executeFunction(feature.cleanup));
			this.isDisconnected = true;
		});
		this.logInfo = async (...params) => {
			params[0] = this.logPadding + params[0];
			console.log(...params);
		};
		this.logError = async (info, error) => {
			this.errorCount = this.errorCount + 1;
			if (Array.isArray(info)) {
				info[0] = this.logPadding + info[0];
			} else {
				info = [this.logPadding + info];
			}
			info.push(error.stack);
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
			if (this.errorCount > 25) this.container.setAttribute("error-count", "25+");
			else {
				this.container.setAttribute("error-count", this.errorCount);
				this.container.find(".error-messages").appendChild(document.newElement({
					type: "div",
					class: "error",
					children: [
						document.newElement({ type: "div", class: "name", text: `${error.name}: ${error.message}` }),
						document.newElement({ type: "pre", class: "stack", text: error.stack })
					]
				}));
			}
		};
	}

	registerFeature(name, scope, enabled, initialise, execute, cleanup, loadListeners, requirements, options) {
		options = {
			triggerCallback: false,
			liveReload: false,
			...options,
		};

		const oldFeature = this.findFeature(name);
		if (oldFeature) throw "Feature already registered.";

		const newFeature = {
			name,
			scope,
			enabled: () => !this.isDisconnected && getValue(enabled),
			initialise,
			execute,
			cleanup,
			loadListeners,
			requirements,
			options,
		};

		this.logInfo("Registered new feature.", newFeature).then(() => {});
		this.features.push(newFeature);

		this.startFeature(newFeature).catch((error) => this.logError(`Failed to start "${name}".`, error));
		this.startLoadListeners(newFeature);

		return newFeature;
	}

	adjustFeature(name, initialise, execute, cleanup) {
		const feature = this.findFeature(name);
		if (!feature) throw "Feature not found.";

		for (const [key, func] of [
			["initialise", initialise],
			["execute", execute],
			["cleanup", cleanup],
		]) {
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

	findFeature(name) {
		return this.features.find((feature) => feature.name === name);
	}

	async startFeature(feature, liveReload) {
		await loadDatabase();
		try {
			if (getValue(feature.enabled)) {
				this.logInfo("Starting feature.", feature).then(() => {});
				if ("requirements" in feature) {
					const requirements = await getValueAsync(feature.requirements);

					if (typeof requirements === "string") {
						await this.executeFunction(feature.cleanup).catch((error) => this.logError(`Failed to (string requirements)cleanup "${feature.name}".`, error));

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
			await this.executeFunction(feature.cleanup).catch((error) => this.logError(`Failed to cleanup in a failed start of "${name}".`, error));

			this.showResult(feature, "failed");
			this.logError(`Failed to start "${feature.name}".`, error).then(() => {});
		}
		feature.hasLoaded = true;
	}

	startLoadListeners(feature) {
		if (!feature.loadListeners) return;

		if (feature.loadListeners.storage) {
			const storageKeys = feature.loadListeners.storage.reduce((previousValue, currentValue) => {
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
			]) {
				if (!(key in storageKeys)) continue;

				storageListeners[key].push((oldSettings) => {
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

					this.startFeature(feature, "liveReload").catch((error) =>
						this.logError(`Failed to start "${feature.name}" during live reload.`, error)
					);
				});
			}
		}

		function rec(parent, path) {
			if (!parent) return false;
			if (path.length > 1) return rec(parent[path[0]], path.slice(1));

			return parent[path[0]];
		}
	}

	async executeFunction(func, liveReload) {
		if (!func) return;

		if (Array.isArray(func)) {
			for (const f of func) {
				await this.executeFunction(f);
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

	showResult(feature, status, options = {}) {
		if (!this.popupLoaded) {
			this.resultQueue.push([feature, status, options]);
			return;
		}

		new Promise(async (resolve) => {
			let row = this.container.find(`[feature-name*="${feature.name}"]`);
			if (row) {
				row.setAttribute("status", status);

				const statusIcon = row.find("i")
				statusIcon.setClass(getIconClass(status));

				if (options.message) statusIcon.setAttribute("title", options.message);
			} else {
				row = document.newElement({
					type: "div",
					class: "tt-feature",
					attributes: { "feature-name": feature.name, status: status },
					children: [
						document.newElement({
							type: "i",
							class: getIconClass(status),
							...(options.message
							    ? { attributes: { title: options.message } }
							    : {})
						}),
						document.newElement({ type: "span", text: feature.name })
					]
				});

				let scopeEl = this.container.find(`[scope*="${feature.scope}"]`);
				if (!scopeEl) {
					scopeEl = document.newElement({
						type: "div",
						attributes: { scope: feature.scope },
						children: [
							document.newElement({ type: "div", text: `— ${feature.scope} —` })
						]
					});
					this.container.find(".tt-features-list").appendChild(scopeEl);
				}
				scopeEl.appendChild(row);
			}
			this.hideEmptyScopes();
		}).catch((error) => {
			this.logError(`Couldn't log result for ${feature.name}: ${JSON.stringify(options)}`, error).then(() => {});
		});

		function getIconClass(status) {
			let className = "fas ";
			switch (status) {
				case "disabled":
				case "failed":
					className += "fa-times-circle";
					break;
				case "loaded":
					className += "fa-check";
					break;
				default:
					className += "fa-question-circle";
			}
			return className;
		}
	}

	display() {
		if (!this.container) return;

		this.container.setClass(
			settings.featureDisplay ? "" : "tt-hidden",
			settings.featureDisplayOnlyFailed ? "only-fails" : "",
			settings.featureDisplayHideDisabled ? "hide-disabled" : ""
		);
		this.hideEmptyScopes();
	}

	async createPopup() {
		await loadDatabase();

		const popup = document.newElement({
			type: "div",
			id: this.containerID,
			attributes: {
				tabindex: 0, // To make :focus-within working on div elements
				"error-count": 0
			},
			children: [
				document.newElement({
					type: "div",
					children: [
						document.newElement({
							type: "button",
							style: { "background-image": `url(${chrome.runtime.getURL("resources/images/icon_128.png")})` },
							events: {
								click: (e) => {
									const title = e.target.matches(`#${this.containerID}`) ? e.target : e.target.closest(`#${this.containerID}`);
									title.classList.toggle("open");
								}
							}
						}),
					]
				}),
				document.newElement({
					type: "div",
					class: "tt-features-list",
					children: [
						document.newElement({ type: "div", class: "error-messages" })
					]
				})
			]
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

		this.container.findAll(".tt-features-list > div[scope]").forEach(scopeDiv => {
			let hideScope = false;
			if (settings.featureDisplayOnlyFailed && scopeDiv.findAll(":scope > .tt-feature[status*='failed']").length === 0) hideScope = true;
			if (settings.featureDisplayHideDisabled && scopeDiv.findAll(":scope > .tt-feature:not([status*='disabled'])").length === 0) hideScope = true;
			scopeDiv.classList[hideScope ? "add" : "remove"]("no-content");
		});
		if (!this.container.find(".tt-features-list > div[scope]:not(.no-content)")) this.container.classList.add("no-content");
		else this.container.classList.remove("no-content");
	}
}

const featureManager = new FeatureManager();
