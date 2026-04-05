import { ttStorage } from "@/utils/common/data/storage";
import { TO_MILLIS } from "@/utils/common/functions/utilities";
import { dropDecimals } from "@/utils/common/functions/formatting";

export type DatabaseUsage = { [minute: number]: { [location: string]: number } };

export class TornToolsUsage {
	usage: DatabaseUsage;

	constructor() {
		this.usage = {};
	}

	async add(location: string) {
		const minute = dropDecimals(Date.now() / TO_MILLIS.MINUTES);
		if (!(minute in this.usage)) this.usage[minute] = {};
		if (!(location in this.usage[minute])) this.usage[minute][location] = 0;

		this.usage[minute][location] += 1;
		await ttStorage.set({ usage: this.usage });
	}

	async refresh() {
		const last24HrsMinute = dropDecimals((Date.now() - 24 * TO_MILLIS.HOURS) / TO_MILLIS.MINUTES);

		Object.keys(this.usage).forEach((minute) => {
			if (parseInt(minute) < last24HrsMinute) delete this.usage[parseInt(minute)];
		});

		await ttStorage.set({ usage: this.usage });
	}

	async clear() {
		this.usage = {};
		await ttStorage.set({ usage: {} });
	}
}

export const ttUsage = new TornToolsUsage();
