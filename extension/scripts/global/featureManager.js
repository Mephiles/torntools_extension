class FeatureManager {
	/*
        feature = {
            name: string,
            enabled: boolean,
            func: function,
            runWhenDisabled: boolean,
            scope: string
        }
    */

	constructor() {
		this.containerID = "tt-page-status";
		this.features = [];
		this.initialized = [];

		this.popupLoaded = false;
		this.resultQueue = [];
	}

	display() {
		let container = document.find(`#${this.containerID}`);
		if (!container) return;

		container.setClass(
			settings.featureDisplay ? "" : "hidden",
			settings.featureDisplayPosition,
			settings.featureDisplayOnlyFails ? "only-fails" : "",
			settings.featureDisplayHideDisabled ? "hide-disabled" : ""
		);
	}

	async createPopup() {
		if (await checkMobile()) return;

		let collapsed = this.containerID in filters.containers ? filters.containers[this.containerID] : false;

		document.body.appendChild(
			document.newElement({
				id: this.containerID,
				type: "div",
				class: settings.featureDisplayPosition,
				children: [
					document.newElement({
						type: "div",
						class: `tt-page-status-header ${collapsed ? "collapsed" : ""}`,
						children: [
							document.newElement({
								type: "span",
								text: "TornTools activated",
							}),
							document.newElement({
								type: "i",
								class: "icon fas fa-caret-down",
							}),
						],
					}),
					document.newElement({
						type: "div",
						class: "tt-page-status-content",
					}),
				],
			})
		);

		document.find(".tt-page-status-header").onclick = () => {
			let toggleResult = document.find(".tt-page-status-header").classList.toggle("collapsed");
			ttStorage.change({ filters: { containers: { [this.containerID]: toggleResult } } });
		};

		this.popupLoaded = true;

		if (this.resultQueue.length > 0) {
			for (let item of this.resultQueue) this.addResult(item);
		}
	}

	new(feature) {
		console.log("Adding feature:", feature);
		// Check if feature is in list
		let updated = false;
		for (let _feature of this.features) {
			if (_feature.name === feature.name) {
				console.log("	updating previous entry");
				this.features[this.features.indexOf(_feature)] = feature; // update previous entry
				updated = true;
			}
		}

		if (!updated) {
			this.features.push(feature);
		}
	}

	findFeatureByName(name) {
		return this.features.filter((feature) => feature.name === name)[0];
	}

	async load(name) {
		console.log("this.features", this.features);
		console.log("Loading feature:", name);
		let feature = this.findFeatureByName(name);
		console.log("feature:", feature);

		// Feature is disabled
		if (!feature.enabled) {
			console.log("Feature disabled:", feature.name);
			this.addResult({ enabled: false, name: feature.name, scope: feature.scope, status: "disabled" });
			if (feature.runWhenDisabled) feature.func();
			return;
		}

		// Feature enabled but no func to run
		if (!feature.func) {
			this.addResult({ success: true, name: feature.name, scope: feature.scope, status: "loaded" });
			return;
		}

		await new Promise((resolve, reject) => {
			feature
				.func()
				.then(() => {
					console.log("Successfully loaded feature:", feature.name);
					this.addResult({ success: true, name: feature.name, scope: feature.scope, status: "loaded" });
					return resolve();
				})
				.catch((error) => {
					console.error("Feature failed to load:", error);
					this.addResult({ success: false, name: feature.name, scope: feature.scope, status: "failed" });
					return resolve();
				});
		});
	}

	reload(name) {
		console.log("Reloading feature:", name);
		// let feature = this.findFeatureByName(name);
		this.load(name);
	}

	async addResult(options) {
		if (await checkMobile()) return;

		if (!this.popupLoaded) {
			this.resultQueue.push(options);
			return;
		}

		let row;
		if (document.find(`#tt-page-status-feature-${options.name.toLowerCase().replace(/ /g, "-")}`)) {
			row = document.find(`#tt-page-status-feature-${options.name.toLowerCase().replace(/ /g, "-")}`);
		} else {
			row = document.newElement({
				type: "div",
				class: `tt-page-status-feature ${options.status}`,
				id: `tt-page-status-feature-${options.name.toLowerCase().replace(/ /g, "-")}`,
			});

			if (!document.find(`.tt-page-status-content #scope-${options.scope}`)) {
				let scopeElement = document.newElement({
					type: "div",
					id: "scope-" + options.scope,
				});
				scopeElement.appendChild(
					document.newElement({
						type: "div",
						class: "tt-page-status-scope-heading",
						text: `— ${options.scope} —`,
					})
				);
				document.find(".tt-page-status-content").appendChild(scopeElement);
			}
			document.find(`.tt-page-status-content #scope-${options.scope}`).appendChild(row);
		}

		if (options.enabled === false)
			row.innerHTML = `<span class="tt-page-status-feature-icon disabled"><i class="fas fa-times-circle"></i></span><span class="tt-page-status-feature-text">${options.name}</span>`;
		else if (options.success)
			row.innerHTML = `<span class="tt-page-status-feature-icon success"><i class="fas fa-check"></i></span><span class="tt-page-status-feature-text">${options.name}</span>`;
		else
			row.innerHTML = `<span class="tt-page-status-feature-icon failed"><i class="fas fa-times-circle"></i></span><span class="tt-page-status-feature-text">${options.name}</span>`;
	}

	removeResult(name) {
		document.find(`.tt-page-status-feature-${name.toLowerCase().replace(/ /g, " - ")}`).remove();
	}

	clear() {
		for (let element of document.findAll(".tt-page-status-feature")) {
			element.remove();
		}
	}

	/*
	 *	New feature manager code
	 */

	registerFeature(name, scope, enabled, initialise, execute, cleanup, loadListeners) {
		const oldFeature = this.findFeature(name);
		if (oldFeature) throw "Feature already registered.";

		const newFeature = { name, scope, enabled, initialise, execute, cleanup, loadListeners };

		console.log("[TornTools] FeatureManager - Registered new feature.", newFeature);
		this.features.push(newFeature);

		this.startFeature(newFeature).catch((error) => console.error(`[TornTools] FeatureManager - Failed to start "${name}."`, error));
		this.startLoadListeners(newFeature);
	}

	findFeature(name) {
		return this.features.find((feature) => feature.name === name);
	}

	async startFeature(feature) {
		try {
			console.log("[TornTools] FeatureManager - Starting feature.", feature);
			if (feature.enabled && (typeof feature.enabled !== "function" || feature.enabled())) {
				if (!this.initialized.includes(feature.name)) {
					await this.executeFunction(feature.initialise);
					this.initialized.push(feature.name);
				}
				await this.executeFunction(feature.execute);

				this.addResult({ success: true, name: feature.name, scope: feature.scope, status: "loaded" }).catch((error) =>
					console.error(`[TornTools] FeatureManager - Couldn't log result for ${feature.name}`, error)
				);
			} else {
				await this.executeFunction(feature.cleanup);

				this.addResult({ enabled: false, name: feature.name, scope: feature.scope, status: "disabled" }).catch((error) =>
					console.error(`[TornTools] FeatureManager - Couldn't log result for ${feature.name}`, error)
				);
			}
		} catch (error) {
			this.addResult({ success: false, name: feature.name, scope: feature.scope, status: "failed" }).catch((error2) =>
				console.error(`[TornTools] FeatureManager - Couldn't log result for ${feature.name}`, error2)
			);
		}
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

			if (storageKeys.settings) {
				storageListeners.settings.push((oldSettings) => {
					if (!storageKeys.settings.some((path) => rec(settings, path) !== rec(oldSettings, path))) return;

					this.startFeature(feature);
				});
			}
		}

		function rec(parent, path) {
			if (!parent) return false;
			if (path.length > 1) return rec(parent[path[0]], path.slice(1));

			return parent[path[0]];
		}
	}

	async executeFunction(func) {
		if (!func) return;

		if (func.constructor.name === "AsyncFunction") func().catch(() => {});
		else func();
	}
}

const featureManager = new FeatureManager();
