import { elementBuilder } from "@common/utils/functions/dom";
import { findElement } from "@common/utils/functions/find-elements";
import styles from "./profile-page.module.css";

function buildProfileTitleBar() {
	let element = findElement(`.${styles.titleBar}`, true);
	if (!element) {
		element = elementBuilder({
			type: "div",
			class: styles.titleBar,
		});

		const title = findElement(".content-title");
		title.insertAdjacentElement("afterend", element);

		element.insertAdjacentElement("afterend", elementBuilder({ type: "hr", class: "page-head-delimiter" }));
	}

	return element;
}

export function appendToBuildProfileTitleBar(element: Element) {
	buildProfileTitleBar().appendChild(element);
}
