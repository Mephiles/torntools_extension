"use strict";

(async () => {
	featureManager.registerFeature(
		"Sidebar Notes",
		"global",
		() => settings.pages.sidebar.notes,
		null,
		showNotes,
		removeNotes,
		{
			storage: ["settings.pages.sidebar.notes"],
		},
		null // TODO - Check for mobile.
	);

	async function showNotes() {
		if (await checkMobile()) return;
		await requireSidebar();

		const { content } = createContainer("Notes", {
			id: "sidebarNotes",
			applyRounding: false,
			contentBackground: false,
			previousElement: findParent(document.find("h2=Information"), { class: "^=sidebar-block_" }),
		});

		content.appendChild(
			document.newElement({
				type: "textarea",
				class: "notes",
				value: notes.sidebar.text,
				style: { height: notes.sidebar.height },
				events: {
					async mouseup(event) {
						if (event.target.style.height === notes.sidebar.height) return;

						console.log("Resized sidebar notes.", event.target.style.height);
						await ttStorage.change({ notes: { sidebar: { height: event.target.style.height } } });
					},
					async change(event) {
						await ttStorage.change({ notes: { sidebar: { text: event.target.value } } });
					},
				},
			})
		);
	}

	function removeNotes() {
		removeContainer("Notes", { id: "sidebarNotes" });
	}
})();
