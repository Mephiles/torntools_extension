class FeatureManager {
	constructor() {
		this.containerID = "tt-page-status";
		this.container = null;
		this.features = [];
		this.initialized = [];

		this.popupLoaded = false;
		this.resultQueue = [];

		this.isDisconnected = false;
		this.port = chrome.runtime.connect({ name: "status-check" });
		this.port.onDisconnect.addListener(() => {
			this.features.forEach((feature) => this.executeFunction(feature.cleanup));
			this.isDisconnected = true;
		});
		this.log = async (params, error) => {
			if (error) console.error(...params);
			else console.log(...params);
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

		this.log(["[TornTools] FeatureManager - Registered new feature.", newFeature]).then(() => {});
		this.features.push(newFeature);

		this.startFeature(newFeature).catch((error) => this.log([`[TornTools] FeatureManager - Failed to start "${name}".`, error], true));
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
			this.executeFunction(initialise).catch(() => {});
			this.executeFunction(execute).catch(() => {});
		}

		this.log(["[TornTools] FeatureManager - Adjusted feature.", feature]).then(() => {});
		return feature;
	}

	findFeature(name) {
		return this.features.find((feature) => feature.name === name);
	}

	async startFeature(feature, liveReload) {
		await loadDatabase();
		try {
			if (getValue(feature.enabled)) {
				this.log(["[TornTools] FeatureManager - Starting feature.", feature]).then(() => {});
				if ("requirements" in feature) {
					const requirements = await getValueAsync(feature.requirements);

					if (typeof requirements === "string") {
						await this.executeFunction(feature.cleanup).catch(() => {});

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
					this.log(["[TornTools] FeatureManager - Disabling feature.", feature])
						.then(() => {})
						.then(() => {});
					await this.executeFunction(feature.cleanup);
					if (feature.options.triggerCallback) {
						triggerCustomListener(EVENT_CHANNELS.FEATURE_DISABLED, { name: feature.name });
					}
				}

				this.showResult(feature, "disabled");
			}
		} catch (error) {
			await this.executeFunction(feature.cleanup).catch(() => {});

			this.showResult(feature, "failed");
			this.log([`[TornTools] FeatureManager - Failed to start "${feature.name}".`, error], true).then(() => {});
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
						this.log([`[TornTools] FeatureManager - Failed to start "${feature.name}" during live reload.`, error], true)
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
			if ((await checkDevice()).mobile) return resolve();

			let row = this.container.find(`#tt-page-status-feature-${feature.name.toLowerCase().replaceAll(" ", "-")}`);
			if (row) {
				row.setClass(`tt-page-status-feature ${status}`);
				row.find(".tt-page-status-feature-icon i").setClass(`fas ${getIcon()}`);
				if (options.message) row.find(".tt-page-status-feature-icon i").setAttribute("title", options.message);
			} else {
				row = document.newElement({
					type: "div",
					class: `tt-page-status-feature ${status}`,
					id: `tt-page-status-feature-${feature.name.toLowerCase().replaceAll(" ", "-")}`,
					children: [
						document.newElement({
							type: "span",
							class: "tt-page-status-feature-icon",
							children: [document.newElement({ type: "i", class: `fas ${getIcon()}` })],
						}),
						document.newElement({ type: "span", class: "tt-page-status-feature-icon", text: feature.name }),
					],
					attributes: () => {
						if (options.message) return { title: options.message };
						else return false;
					},
				});

				let scopeElement = this.container.find(`.tt-page-status-content #scope-${feature.scope.toLowerCase().replaceAll(" ", "_")}`);
				if (!scopeElement) {
					const scopeHeading = document.newElement({
						type: "div",
						class: "tt-page-status-scope-heading",
						children: [
							document.newElement({ type: "span", text: `— ${feature.scope} —` }),
							document.newElement({ type: "i", class: "icon fas fa-caret-down" }),
						],
					});
					scopeElement = document.newElement({
						type: "div",
						id: "scope-" + feature.scope.toLowerCase().replaceAll(" ", "_"),
						children: [scopeHeading],
					});
					scopeHeading.addEventListener("click", async (event) => {
						const scopeElementLocal = event.target.closest("[id*='scope-']");
						const addedOrRemoved = scopeElementLocal.classList.toggle("collapsed");
						const closedScopes = (await ttStorage.get("filters")).closedScopes;
						if (addedOrRemoved) closedScopes.push(scopeElementLocal.getAttribute("id").split("scope-")[1].replaceAll("_", " "));
						else {
							const index = closedScopes.indexOf(scopeElementLocal.getAttribute("id").split("scope-")[1].replaceAll("_", " "));
							if (index !== -1) {
								closedScopes.splice(index, 1);
							}
						}
						await ttStorage.change({ filters: { closedScopes: [...new Set(closedScopes)] } });
					});
					this.container.find(".tt-page-status-content").appendChild(scopeElement);
					scopeElement.appendChild(
						document.newElement({
							type: "div",
							class: "tt-page-status-feature features-list",
						})
					);
				}
				scopeElement.find(":scope > .features-list").appendChild(row);
			}

			await this.checkScopes();
		}).catch((error) => {
			this.log([`[TornTools] FeatureManager - Couldn't log result for ${feature.name}`, error, options], true).then(() => {});
		});

		function getIcon() {
			switch (status) {
				case "disabled":
				case "failed":
					return "fa-times-circle";
				case "loaded":
					return "fa-check";
				default:
					return "fa-question-circle";
			}
		}
	}

	display() {
		if (!this.container) return;

		this.container.setClass(
			settings.featureDisplay ? "" : "tt-hidden",
			settings.featureDisplayPosition,
			settings.featureDisplayOnlyFailed ? "only-fails" : "",
			settings.featureDisplayHideDisabled ? "hide-disabled" : ""
		);
		this.checkScopes().then(() => {});
	}

	async createPopup() {
		await loadDatabase();
		if ((await checkDevice()).mobile) return;

		const collapsed = this.containerID in filters.containers ? filters.containers[this.containerID] : false;

		const popupHeader = document.newElement({
			type: "div",
			class: `tt-page-status-header ${collapsed ? "collapsed" : ""}`,
			children: [document.newElement({ type: "span", text: "TornTools activated" }), document.newElement({ type: "i", class: "icon fas fa-caret-down" })],
		});
		const container = document.newElement({
			id: this.containerID,
			type: "div",
			class: `
				${settings.featureDisplay ? "" : "tt-hidden"}
				${settings.featureDisplayPosition} 
				${settings.featureDisplayOnlyFailed ? "only-fails" : ""}
				${settings.featureDisplayHideDisabled ? "hide-disabled" : ""}
			`,
			children: [popupHeader, document.newElement({ type: "div", class: "tt-page-status-content" })],
		});
		document.body.appendChild(container);
		this.container = container;

		popupHeader.onclick = (event) => {
			const toggleResult = event.currentTarget.classList.toggle("collapsed");
			ttStorage.change({ filters: { containers: { [this.containerID]: toggleResult } } });
		};

		this.popupLoaded = true;

		for (const item of this.resultQueue) {
			const [feature, status, options] = item;
			this.showResult(feature, status, options);
		}
		await this.checkScopes();
	}

	async checkScopes() {
		if (!settings.featureDisplay) return;
		let hasContent = false;
		for (const scope of this.container.findAll(".tt-page-status-content > div")) {
			const isEmpty =
				settings.featureDisplayOnlyFailed || settings.featureDisplayHideDisabled
					? [...scope.findAll(".tt-page-status-feature:not(.features-list)")].every(
							(element) =>
								(settings.featureDisplayOnlyFailed && !element.classList.contains("failed")) ||
								(settings.featureDisplayHideDisabled && !element.classList.contains("disabled"))
					  )
					: false;

			if (isEmpty) {
				scope.classList.add("no-content");
			} else {
				scope.classList.remove("no-content");
				hasContent = true;
			}
		}

		this.container.classList[hasContent ? "remove" : "add"]("no-content");

		for (const scope of (await ttStorage.get("filters")).closedScopes) {
			const scopeElement = this.container.find(`.tt-page-status-content > [id*="${scope.replaceAll(" ", "_")}"]`);
			if (scopeElement && !scopeElement.find(":scope > .features-list > .failed")) scopeElement.classList.add("collapsed");
		}
	}
}

const featureManager = new FeatureManager();
