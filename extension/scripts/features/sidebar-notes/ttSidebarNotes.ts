(async () => {
	const { hasSidebar } = await checkDevice();
	if (!hasSidebar) return "Not supported on mobiles or tablets!";

	featureManager.registerFeature(
		"Sidebar Notes",
		"sidebar",
		() => settings.pages.sidebar.notes,
		null,
		showNotes,
		removeNotes,
		{
			storage: ["settings.pages.sidebar.notes"],
		},
		null
	);

	async function showNotes() {
		await requireSidebar();

		const { content } = createContainer("Notes", {
			id: "sidebarNotes",
			applyRounding: false,
			contentBackground: false,
			compact: true,
			previousElement: findParent(findElementWithText("h2", "Information"), { partialClass: "sidebar-block_" }),
		});

		content.appendChild(
			elementBuilder({
				type: "textarea",
				class: "notes",
				value: notes.sidebar.text,
				style: { height: notes.sidebar.height },
				events: {
					async mouseup(event) {
						if (!isHTMLElement(event.target) || event.target.style.height === notes.sidebar.height) return;

						console.log("Resized sidebar notes.", event.target.style.height);
						await ttStorage.change({ notes: { sidebar: { height: event.target.style.height } } });
					},
					async change(event) {
						if (!isHTMLElement(event.target)) return;

						await ttStorage.change({ notes: { sidebar: { text: (event.target as HTMLInputElement).value } } });
					},
				},
			})
		);
	}

	function removeNotes() {
		removeContainer("Notes", { id: "sidebarNotes" });
	}

	return true;
})();
