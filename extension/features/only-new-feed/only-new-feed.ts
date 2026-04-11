import { FEATURE_MANAGER, Feature } from "@/features/feature-manager";
import { localdata, settings } from "@/utils/common/data/database";
import { ttStorage } from "@/utils/common/data/storage";
import { elementBuilder, findAllElements } from "@/utils/common/functions/dom";
import { addXHRListener } from "@/utils/common/functions/listeners";
import { requireElement } from "@/utils/common/functions/requires";
import { PHEye, PHEyeSlash } from "@/utils/common/icons/phosphor-icons";
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

		await handleFeeds();
	});
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
		feedElement.querySelector(".title-toggle").appendChild(hideButton);
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
		await handleFeeds();
	}

	cleanup() {
		cleanupFeeds();
	}
}
