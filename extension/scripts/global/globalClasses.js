"use strict";

class DefaultSetting {
	constructor(options) {
		for (const option in options) {
			this[option] = options[option];
		}
	}
}
