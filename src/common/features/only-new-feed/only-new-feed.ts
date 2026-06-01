import { Feature } from "@features/feature";
import { FEATURE_MANAGER, ttStorage } from "@utils/context";
import { localdata, settings } from "@utils/data/database";

import { elementBuilder, findAllElements, getHashParameters } from "@utils/functions/dom";
import { addXHRListener } from "@utils/functions/listeners";
import { requireElement } from "@utils/functions/requires";
import { PHEye, PHEyeSlash } from "@utils/icons/phosphor-icons";
import styles from "./only-new-feed.module.css";

export interface StoredHiddenFeeds {
	[key: string]: boolean;
}

function initialise() {
	addXHRListener(async ({ detail: { page, xhr } }) => {
		if (!FEATURE_MANAGER.isEnabled(OnlyNewFeedFeature)) return;

		if (page !== "forums") return;

		const params = new URLSearchParams(xhr.requestBody);
		const step = params.get("step");
		if (step !== "updates") return;

		console.log("DKK XHR handle");
		await handleFeeds();
	});
}

async function startFeature() {
	const params = getHashParameters();
	if (params.has("p") && params.get("p") !== "main") return;

	await handleFeeds();
}

const FEEDS = [
	{ id: "my-Threads", selector: "#my-threads" },
	{ id: "subscribed-threads", selector: "#subs-threads" },
	{ id: "feed", selector: "#feed-threads" },
	{ id: "friends", selector: "#friends-threads" },
];

async function handleFeeds() {
	await requireElement("#updates");

	FEEDS.forEach(({ id, selector }) => {
		const feedElement = document.querySelector(selector);
		if (!feedElement) return;

		const isHiddenInitially = localdata.feedHidden[id] ?? false;
		if (isHiddenInitially) {
			feedElement.classList.add(styles.onlyShowNewPosts);
			handleHiddenElements(feedElement);
		}

		const parent = feedElement.querySelector(".title-toggle");
		if (!parent || parent.querySelector(`.${styles.onlyNewFeedButton}`)) return;

		const hideButton = elementBuilder({
			type: "button",
			class: [styles.onlyNewFeedButton],
			children: [isHiddenInitially ? PHEyeSlash() : PHEye()],
			events: {
				async click(event) {
					event.stopPropagation();

					await toggleFeed(id, hideButton, feedElement);
				},
			},
		});
		parent.appendChild(hideButton);
	});
}

async function toggleFeed(id: string, hideButton: HTMLElement, feedElement: Element) {
	const iconElement = hideButton.querySelector("svg");
	const isHidden = feedElement.classList.toggle(styles.onlyShowNewPosts);

	if (isHidden) {
		iconElement.replaceWith(PHEyeSlash());
	} else {
		iconElement.replaceWith(PHEye());
	}
	await ttStorage.change({ localdata: { feedHidden: { [id]: isHidden } } });

	handleHiddenElements(feedElement);
}

function handleHiddenElements(feedElement: Element) {
	if (feedElement.querySelector(`.${styles.nothingToShow}`)) return;

	feedElement.querySelector(".panel-scrollbar").appendChild(
		elementBuilder({
			type: "div",
			class: styles.nothingToShow,
			text: "Nothing left to show here.",
		}),
	);
}

function cleanupFeeds() {
	findAllElements(`${styles.onlyNewFeedButton}`).forEach((e) => e.remove());
	findAllElements(`${styles.nothingToShow}`).forEach((e) => e.remove());
	findAllElements(`${styles.onlyShowNewPosts}`).forEach((e) => e.classList.remove(styles.onlyShowNewPosts));
}

export default class OnlyNewFeedFeature extends Feature {
	constructor() {
		super("Only New Feed", "forums");
	}

	isEnabled() {
		return settings.pages.forums.onlyNewFeedButton;
	}

	storageKeys() {
		return ["settings.pages.forums.onlyNewFeedButton"];
	}

	initialise() {
		initialise();
	}

	async execute() {
		await startFeature();
	}

	cleanup() {
		cleanupFeeds();
	}
}
