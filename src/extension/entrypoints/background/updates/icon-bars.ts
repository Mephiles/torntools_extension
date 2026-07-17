import { settings, userdata } from "@common/utils/data/database";
import { hasAPIData } from "@common/utils/functions/api";
import { getNextChainBonus } from "@common/utils/functions/torn";

export async function showIconBars() {
	if (!settings.apiUsage.user.bars || !hasAPIData() || !settings.pages.icon.global) {
		await browser.action.setIcon({ path: browser.runtime.getURL("/images/icon_128.png") });
		return;
	}

	let barCount = 0;
	if (settings.pages.icon.energy) barCount++;
	if (settings.pages.icon.nerve) barCount++;
	if (settings.pages.icon.happy) barCount++;
	if (settings.pages.icon.life) barCount++;
	if (settings.pages.icon.chain && userdata.bars.chain && userdata.bars.chain.current > 0) barCount++;
	if (settings.pages.icon.travel && userdata.travel && userdata.travel.time_left > 0) barCount++;

	const canvas = new OffscreenCanvas(128, 128);

	const canvasContext = canvas.getContext("2d");
	canvasContext.fillStyle = "#fff";
	canvasContext.fillRect(0, 0, canvas.width, canvas.height);

	const padding = 10;
	const barHeight = (canvas.height - (barCount + 1) * 10) / barCount;
	const barWidth = canvas.width - padding * 2;

	const BAR_COLORS = {
		energy: "#7cc833",
		nerve: "#b3382c",
		happy: "#e3e338",
		life: "#7b98ee",
		chain: "#333",
		travel: "#d961ee",
	};

	let y = padding;

	(Object.keys(BAR_COLORS) as (keyof typeof BAR_COLORS)[]).forEach((key) => {
		if (!settings.pages.icon[key] || !userdata.bars[key]) return;
		if (key === "chain" && (!userdata.bars.chain || userdata.bars.chain.current === 0)) return;

		let current: number, maximum: number;
		if (key === "travel") {
			const totalTrip = userdata[key].arrival_at - userdata[key].departed_at;

			current = totalTrip - userdata[key].time_left;
			maximum = totalTrip;
		} else if (key === "chain") {
			current = userdata.bars[key].current;
			maximum = userdata.bars[key].max;

			if (current !== maximum) maximum = getNextChainBonus(current);
		} else {
			current = userdata.bars[key].current;
			maximum = userdata.bars[key].maximum;
		}

		let width = barWidth * (current / maximum);
		width = Math.min(width, barWidth);

		canvasContext.fillStyle = BAR_COLORS[key];
		canvasContext.fillRect(padding, y, width, barHeight);

		y += barHeight + padding;
	});

	await browser.action.setIcon({ imageData: canvasContext.getImageData(0, 0, canvas.width, canvas.height) });
}
