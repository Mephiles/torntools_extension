interface InitializeInternalPageOptions {
	sortTables: boolean;
}

function initializeInternalPage(partialOptions: Partial<InitializeInternalPageOptions> = {}) {
	const options: InitializeInternalPageOptions = {
		sortTables: false,
		...partialOptions,
	};

	// Check if the user is on mobile or tablet.
	checkDevice().then(({ mobile, tablet }) => {
		if (mobile) document.body.classList.add("tt-mobile");
		else document.body.classList.remove("tt-mobile");

		if (tablet) document.body.classList.add("tt-tablet");
		else document.body.classList.remove("tt-tablet");
	});

	// Add sorting functionality to tables.
	if (options.sortTables) {
		document.addEventListener("click", (event) => {
			const clickedElement = event.target;
			if (isElementOfTag(clickedElement, "th")) {
				if (clickedElement.getAttribute("class") && clickedElement.getAttribute("class").split(" ").includes("no-sorting")) return;

				const table = findParent(clickedElement, { tag: "TABLE" });
				if (!table || !table.classList.contains("sortable")) return;

				sortTable(table, findAllElements("th", table).indexOf(clickedElement) + 1);
			}
		});
	}
}

interface ConfirmationPopupOptions {
	title: string;
	message: string;
	execute: false | ((message: Element, variables: { [key: string]: any }) => void);
	variables: { [key: string]: any };
}

function loadConfirmationPopup(partialOptions: Partial<ConfirmationPopupOptions> = {}): Promise<{ [key: string]: any }> {
	const options: ConfirmationPopupOptions = {
		title: "Title",
		message: "A message here.",
		execute: false,
		variables: {},
		...partialOptions,
	};

	return new Promise((resolve, reject) => {
		const popup = document.find("#tt-confirmation-popup");
		const message = popup.find(".message");

		document.find("#tt-black-overlay").classList.remove("tt-hidden");
		popup.classList.remove("tt-hidden");

		document.body.classList.add("tt-unscrollable");

		popup.find(".title").textContent = options.title;
		message.innerHTML = options.message;

		if (options.execute) options.execute(message, options.variables);

		popup.find("#popupConfirm").addEventListener("click", () => {
			document.find("#tt-black-overlay").classList.add("tt-hidden");
			popup.classList.add("tt-hidden");

			document.body.classList.remove("tt-unscrollable");

			const data: { [key: string]: any } = {};
			for (const input of findAllElements<HTMLInputElement | HTMLTextAreaElement>("textarea, input", message)) {
				let type = "value";
				if (input.tagName === "INPUT") {
					if (input.type === "checkbox") type = "checked";
				}

				data[input.getAttribute("name")] = input[type];
			}

			resolve(data);
		});
		popup.find("#popupCancel").addEventListener("click", () => {
			document.find("#tt-black-overlay").classList.add("tt-hidden");
			popup.classList.add("tt-hidden");

			document.body.classList.remove("tt-unscrollable");

			reject();
		});
	});
}

interface MessageOptions {
	reload: boolean;
}

function sendMessage(text: string, good: boolean, partialOptions: Partial<MessageOptions> = {}) {
	const options: MessageOptions = {
		reload: false,
		...partialOptions,
	};

	const message = document.find("#message");
	if (!message) return;

	message.classList.remove("tt-hidden");
	message.textContent = text;
	message.style.backgroundColor = good ? "#30e202" : "#ff19199e";
	message.style.maxHeight = message.scrollHeight + "px";

	if (options.reload) {
		setTimeout(() => {
			location.reload();
		}, 1200);
	} else {
		setTimeout(() => {
			message.textContent = "";
			message.classList.add("tt-hidden");
		}, 1500);
	}
}

function getPageTheme(): InternalPageTheme {
	const theme = settings.themes.pages;

	if (theme === "default") {
		if (window.matchMedia) return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
		return "light";
	}

	return theme;
}
