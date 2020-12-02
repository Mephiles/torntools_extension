"use strict";

class DefaultSetting {
	constructor(options) {
		for (let option in options) {
			this[option] = options[option];
		}
	}
}
