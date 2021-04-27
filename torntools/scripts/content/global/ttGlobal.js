requireDatabase().then(() => {
	console.log("Loading Global Script");

	// Add TT Black overlay
	doc.find("body").appendChild(doc.new({ type: "div", class: "tt-black-overlay" }));

	if (settings.pages.global.miniprofile_last_action) {
		addFetchListener((event) => {
			if (!event.detail) return;
			const { page, json, fetch } = event.detail;

			const params = new URL(fetch.url).searchParams;
			const step = params.get("step");

			if (page === "profiles" && step === "getUserNameContextMenu") {
				showMiniprofileInformation(json);
			}
		});
	}

	if (settings.scripts.no_confirm.revives) {
		injectXHR();

		addReviveListener();
	}

	if (settings.pages.global.show_toggle_chat) {
		showToggleChat();
	}

	if (settings.developer) {
		showCustomConsole();
	}

	aliasUsers();

	const year = new Date().getUTCFullYear();
	const now = Date.now();
	if (Date.UTC(year, 3, 5, 12) <= now && Date.UTC(year, 3, 25, 12) >= now) easterEggs();

	requireNavbar().then(async () => {
		let _flying = await isFlying();

		// Mark Body with Mobile class
		if (mobile) doc.find("body").classList.add("tt-mobile");

		// Create a section in Information tab for future info added
		if (!mobile) addInformationSection();

		// Make Areas collapsible
		if (!doc.find("[class='header-arrow']") && !mobile) {
			let areas_i = doc.new({ type: "i", class: "tt-title-icon-torn fas fa-caret-down" });
			let areas_header = doc.find("h2=Areas");
			areas_header.classList.add("tt-title-torn");
			areas_header.appendChild(areas_i);
			if (settings.pages.global.collapse_areas) areas_header.classList.add("collapsed");

			areas_header.addEventListener("click", () => {
				areas_header.classList.toggle("collapsed");
				let collapsed = areas_header.classList.contains("collapsed");

				ttStorage.change({ settings: { pages: { global: { collapse_areas: collapsed } } } });
			});
		}

		// Update notification
		if (updated && settings.update_notification && !mobile) {
			addUpdateNotification();
		}

		// Custom links
		if (custom_links.length > 0) {
			addCustomLinks();
		}

		// Notes
		if (settings.pages.global.notes && !mobile) {
			addNotesBox();
		}

		// Remove icons that are hidden
		function hideIcons(observer) {
			observer.disconnect();

			for (let icon of doc.findAll("#sidebarroot [class*='status-icons_'] > li")) {
				let name = icon.getAttribute("class").split("_")[0];
				if (hide_icons.includes(name)) {
					icon.parentElement.appendChild(icon);
				}
			}

			observer.observe(doc.find("#sidebarroot [class*='status-icons_']"), { childList: true });
		}

		hideIcons(new MutationObserver((_, observer) => hideIcons(observer)));

		// Vault balance
		if (settings.pages.global.vault_balance && !mobile) {
			displayVaultBalance();
		}

		// OC ready time
		if (settings.pages.global.oc_time && !mobile) {
			displayOCtime();
		}

		// Content margin
		if (mobile && !_flying && custom_links.length > 0) {
			console.log("here");
			doc.find("div[role='main']").classList.add("tt-modified");
		}

		// Links for Energy and Nerve
		if (!mobile) {
			doc.find("#barEnergy [class*='bar-name_']").classList.add("tt-text-link");
			doc.find("#barNerve [class*='bar-name_']").classList.add("tt-text-link");
			doc.find("#barEnergy [class*='bar-name_']").onclick = () => {
				window.location.href = "https://www.torn.com/gym.php";
			};
			doc.find("#barNerve [class*='bar-name_']").onclick = () => {
				window.location.href = "https://www.torn.com/crimes.php";
			};
		}

		highlightRefills();

		// NUKE REVIVE SCRIPT
		if (settings.pages.global.enable_central_revive) nukeReviveScript();

		// Global time reducer
		setInterval(() => {
			for (let time of doc.findAll("*[seconds-down]")) {
				let seconds = parseInt(time.getAttribute("seconds-down"));
				seconds--;

				if (seconds <= 0) {
					time.removeAttribute("seconds-down");
					time.innerText = "Ready";
					continue;
				}

				time.innerText = timeUntil(seconds * 1000);
				time.setAttribute("seconds-down", seconds);
			}
		}, 1000);

		// Update time increaser
		setInterval(() => {
			for (let time of doc.findAll("*[seconds-up]")) {
				let seconds = parseInt(time.getAttribute("seconds-up"));
				seconds++;

				time.innerText = timeUntil(seconds * 1000);
				time.setAttribute("seconds-up", seconds);
			}
		}, 1000);

		if (userdata.faction.faction_id && settings.pages.global.highlight_chain_timer && settings.pages.global.highlight_chain_length >= 10)
			chainTimerHighlight();

		hideGymHighlight();

		if (settings.pages.profile.show_chain_warning) {
			let miniProfilesObserver = new MutationObserver(chainBonusWatch);
			miniProfilesObserver.observe(doc.body, { childList: true });
			chainBonusWatch();
		}

		if (settings.pages.global.show_settings_areas_link && !mobile) ttSettingsLink();

		if (settings.pages.global.npc_loot_info) showNpcLoot();

		upkeepMoreThan();
	});

	chatsLoaded().then(() => {
		if (shouldDisable()) return;

		// Chat highlight
		let highlights = { ...chat_highlight };
		for (let key in highlights) {
			if (!(key in HIGHLIGHT_PLACEHOLDERS)) continue;

			highlights[HIGHLIGHT_PLACEHOLDERS[key].value()] = highlights[key];
		}

		if (doc.find(".chat-box-content_2C5UJ .overview_1MoPG .message_oP8oM")) {
			manipulateChat(highlights);

			if (settings.pages.global.find_chat) {
				addChatFilters();
				addPeopleBoxFilter();
			}
			if (settings.pages.global.trade_chat_timer) tradeChatPostTimer();
			if (settings.pages.global.autocomplete_chat) addChatUsernameAutocomplete();
			if (Object.keys(users_alias).length) aliasUsersChat();
		}

		doc.addEventListener("click", (event) => {
			if (!hasParent(event.target, { class: "chat-box_Wjbn9" })) {
				return;
			}

			manipulateChat(highlights);
			if (settings.pages.global.find_chat) {
				addChatFilters();
				addPeopleBoxFilter();
			}
			if (settings.pages.global.trade_chat_timer) tradeChatPostTimer();
			if (settings.pages.global.autocomplete_chat) addChatUsernameAutocomplete();
			if (Object.keys(users_alias).length) aliasUsersChat();
		});

		let chat_observer = new MutationObserver((mutationsList) => {
			for (let mutation of mutationsList) {
				if (mutation.addedNodes[0] && mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains("message_oP8oM")) {
					let message = mutation.addedNodes[0];

					applyChatHighlights(message, highlights);
					if (settings.pages.global.block_zalgo) removeZalgoText(message);
					if (Object.keys(users_alias).length) aliasUsersChat(message);
				}
			}
		});
		chat_observer.observe(doc.find("#chatRoot"), { childList: true, subtree: true });
	});
});

function chatsLoaded() {
	return requireElement(".overview_1MoPG");
}

function addCustomLinks() {
	if (mobile) {
		let areas_custom = doc.new({
			type: "div",
			class: "areas___2pu_3 areasWrapper areas-mobile___3zY0z torntools-mobile", // FIXME - Use right classes.
		});
		let div = doc.new({ type: "div" });
		let swipe_container = doc.new({ type: "div", class: "swiper-container swiper-container-horizontal" });
		let swipe_wrapper = doc.new({
			type: "div",
			class: "swiper-wrapper swiper___nAyWO", // FIXME - Use right classes.
			attributes: { style: "transform: translate3d(0px, 0px, 0px); transition-duration: 0ms;" },
		});
		let swipe_button_left = doc.new({
			type: "div",
			class: "swiper-button___3lZ1n button-prev___2x-Io swiper-button-disabled", // FIXME - Use right classes.
		});
		let swipe_button_right = doc.new({ type: "div", class: "swiper-button___3lZ1n button-next___1hJxo" });
		// FIXME - Use right classes.

		for (let link of custom_links) {
			let slide = doc.new({ type: "div", class: "swiper-slide slide___1oBWA" }); // FIXME - Use right classes.
			let area = doc.new({ type: "div", class: "area-mobile___1XJcq" }); // FIXME - Use right classes.
			let area_row = doc.new({ type: "div", class: "area-row___1VM_l torntools-mobile" }); // FIXME - Use right classes.
			let a = doc.new({
				type: "a",
				href: link.href,
				class: "mobileLink___33zU1 sidebarMobileLink torntools-mobile", // FIXME - Use right classes.
				text: link.text,
				attributes: { target: link.new_tab ? "_blank" : "" },
			});

			area_row.appendChild(a);
			area.appendChild(area_row);
			slide.appendChild(area);
			swipe_wrapper.appendChild(slide);
		}

		swipe_container.appendChild(swipe_wrapper);
		swipe_container.appendChild(swipe_button_left);
		swipe_container.appendChild(swipe_button_right);
		div.appendChild(swipe_container);
		areas_custom.appendChild(div);

		doc.find("#sidebar [class*='content_']").insertBefore(areas_custom, doc.find("#sidebar [class*='content_'] [class*='user-information-mobile_']"));
	} else {
		let custom_links_section = navbar.newSection("Custom Links", { next_element_heading: "Areas" });

		for (let link of custom_links) {
			navbar.newCell(link.text, {
				parent_element: custom_links_section,
				href: link.href,
				link_target: link.new_tab ? "_blank" : "",
			});
		}

		doc.find("#sidebar").insertBefore(custom_links_section, findParent(doc.find("h2=Areas"), { class: "^=sidebar-block_" }));
	}
}

function addNotesBox() {
	let notes_section = navbar.newSection("Notes", { next_element_heading: "Areas" });
	let cell = doc.new({ type: "div", class: "area-desktop___2N3Jp" }); // FIXME - Use right classes.
	let inner_div = doc.new({ type: "div", class: "area-row___1VM_l" }); // FIXME - Use right classes.
	let textbox = doc.new({ type: "textarea", class: "tt-nav-textarea", value: notes.text || "" });
	// [class*='
	if (notes.height) {
		textbox.style.height = notes.height;
	}

	inner_div.appendChild(textbox);
	cell.appendChild(inner_div);
	notes_section.find(".tt-content").appendChild(cell);

	doc.find("#sidebar").insertBefore(notes_section, findParent(doc.find("h2=Areas"), { class: "^=sidebar-block_" }));

	textbox.addEventListener("change", () => {
		ttStorage.set({ notes: { text: textbox.value, height: textbox.style.height } });
	});
	textbox.addEventListener("mouseup", () => {
		if (textbox.style.height !== notes.height) {
			console.log("resize");
			console.log(textbox.style.height);
			ttStorage.set({ notes: { text: textbox.value, height: textbox.style.height } });
		}
	});
}

function addUpdateNotification() {
	let version_text = `TornTools updated: ${chrome.runtime.getManifest().version}`;
	let settings_page_url = chrome.runtime.getURL("/views/settings/settings.html");

	let cell = doc.new({ type: "div", class: "area-desktop___2N3Jp" }); // FIXME - Use right classes.
	let inner_div = doc.new({ type: "div", class: "area-row___1VM_l" }); // FIXME - Use right classes.
	let a = doc.new({
		type: "a",
		class: "desktopLink___1p2Dr", // FIXME - Use right classes.
		href: settings_page_url,
		attributes: { target: "_blank", style: "background-color: #B8E28F; min-height: 24px; line-height: 24px; color: #333;" },
	});
	let span = doc.new({ type: "span", text: version_text });

	a.appendChild(span);
	inner_div.appendChild(a);
	cell.appendChild(inner_div);

	doc.find("h2=Areas").nextElementSibling.insertBefore(cell, doc.find("h2=Areas").nextElementSibling.firstElementChild);
}

function manipulateChat(highlights) {
	if (highlights || settings.pages.global.block_zalgo) {
		for (let chat of doc.findAll(".chat-box-content_2C5UJ .overview_1MoPG")) {
			for (let message of chat.findAll(".message_oP8oM")) {
				if (highlights) applyChatHighlights(message, highlights);

				if (settings.pages.global.block_zalgo) removeZalgoText(message);
			}
		}
	}
}

function applyChatHighlights(message, highlights) {
	let sender = message.find("a").innerText.replace(":", "").trim();
	let text = simplify(message.find("span").innerText);
	const words = text.split(" ").map(simplify);

	if (sender in highlights) {
		message.find("a").style.color = highlights[sender];
	}

	for (let highlight in highlights) {
		if (!words.includes(highlight.toLowerCase())) continue;

		let color = highlights[highlight];
		if (color.length === 7) color += "6e";

		message.find("span").parentElement.style.backgroundColor = color;
		break;
	}

	function simplify(text) {
		return text.toLowerCase().replaceAll([".", "?", ":", "!", '"', "'", ";", "`", ","], "");
	}
}

function removeZalgoText(message) {
	const content = message.find("span");

	if (REGEX_COMBINING_SYMBOL.test(content.innerHTML)) {
		console.log("Removed zalgo text.", content.innerHTML, content);
		content.innerHTML = content.innerHTML.replace(REGEX_COMBINING_SYMBOL, "*");
	}
}

function addChatFilters() {
	let chats = doc.findAll(".chat-box-content_2C5UJ");
	for (let chat of chats) {
		if (!chat.nextElementSibling) continue;
		if (chat.nextElementSibling.find(".tt-chat-filter")) continue;

		chat.nextElementSibling.classList.add("tt-modified");

		let filter_wrap = doc.new({ type: "div", class: "tt-chat-filter" });
		let filter_text = doc.new({ type: "div", text: "Find:" });
		let filter_input = doc.new({ type: "input" });

		filter_wrap.appendChild(filter_text);
		filter_wrap.appendChild(filter_input);

		chat.nextElementSibling.insertBefore(filter_wrap, chat.nextElementSibling.firstElementChild);

		// Filtering process
		filter_input.onkeyup = () => {
			let keyword = filter_input.value.toLowerCase();

			for (let message of chat.findAll(".overview_1MoPG .message_oP8oM span")) {
				message.parentElement.style.display = "block";

				if (keyword && message.innerText.toLowerCase().indexOf(keyword) === -1) {
					message.parentElement.style.display = "none";
				}
			}

			if (!keyword) {
				let viewport = chat.find(".viewport_1F0WI");
				viewport.scrollTop = viewport.scrollHeight;
			}
		};
	}
}

function addChatUsernameAutocomplete() {
	let chats = doc.findAll(".chat-box_Wjbn9");
	for (let chat of chats) {
		let chatMessageList = chat.find(".overview_1MoPG");
		if (!chatMessageList) continue;

		let chatTextbox = chat.find(".chat-box-textarea_2V28W");
		if (!chatTextbox) continue;
		if (chatTextbox.classList.contains("tt-chat-autocomplete")) continue;

		chatTextbox.classList.add("tt-chat-autocomplete");

		let currentUsername = null;
		let currentSearchValue = null;
		chatTextbox.addEventListener("keydown", (event) => {
			if (event.key !== "Tab") {
				currentUsername = null;
				currentSearchValue = null;
				return;
			}

			event.preventDefault();

			let valueToCursor = chatTextbox.value.substr(0, chatTextbox.selectionStart);
			let searchValueMatch = valueToCursor.match(/([^A-Za-z0-9\-_]?)([A-Za-z0-9\-_]*)$/);

			if (currentSearchValue === null) {
				currentSearchValue = searchValueMatch[2].toLowerCase();
			}

			let usernames = Array.from(chatMessageList.findAll(".message_oP8oM > a"))
				.map((message) => message.innerText.slice(0, -2))
				.filter((value, index, array) => array.indexOf(value) === index)
				.sort();

			let matchedUsernames = usernames.filter((username) => username.toLowerCase().indexOf(currentSearchValue) === 0);

			if (matchedUsernames.length === 0) {
				return;
			}

			let index = 0;
			if (currentUsername !== null) {
				index = matchedUsernames.indexOf(currentUsername) + 1;
			}

			if (index > matchedUsernames.length - 1) {
				index = 0;
			}

			currentUsername = matchedUsernames[index];

			let valueStart = searchValueMatch.index + searchValueMatch[1].length;
			chatTextbox.value =
				chatTextbox.value.substring(0, valueStart) + currentUsername + chatTextbox.value.substring(valueToCursor.length, chatTextbox.value.length);

			let selectionIndex = valueStart + currentUsername.length;
			chatTextbox.setSelectionRange(selectionIndex, selectionIndex);
		});
	}
}

function displayVaultBalance() {
	if (!networth || !networth.current || !networth.current.value) return;

	let money = networth.current.value.vault;

	if (settings.pages.global.vault_balance_own && vault.initialized && vault.user.current_money) {
		money = vault.user.current_money;
	}

	// FIXME - Use right classes.
	let elementHTML = `
    	<span class="bold">Vault:</span>
    	<span class="money-color">
			${settings.pages.global.vault_balance_own && vault.initialized && vault.user.current_money ? "*" : ""}$${numberWithCommas(money, false)}
		</span>
    `;

	// FIXME - Use right classes.
	let el = doc.new({ type: "p", class: "tt-point-block", attributes: { tabindex: "1" }, html: elementHTML });

	let info_cont = doc.find("h2=Information");
	info_cont.parentElement
		.find("[class*='points_']")
		.insertBefore(el, info_cont.parentElement.find("[class*='points_'] [class*='point-block_']:nth-of-type(2)"));
}

function showToggleChat() {
	const icon = doc.new({
		id: "tt-hide_chat",
		type: "i",
		class: `fas ${settings.pages.global.hide_chat ? "fa-comment" : "fa-comment-slash"}`,
	});

	icon.addEventListener("click", () => {
		settings.pages.global.hide_chat = !settings.pages.global.hide_chat;

		if (settings.pages.global.hide_chat) {
			icon.classList.remove("fa-comment-slash");
			icon.classList.add("fa-comment");
		} else {
			icon.classList.add("fa-comment-slash");
			icon.classList.remove("fa-comment");
		}

		document.documentElement.style.setProperty(`--torntools-hide-chat`, settings.pages.global.hide_chat ? "none" : "block");

		ttStorage.set({ settings: settings });
	});

	function setToggleChatPosition() {
		var maxTop =
			Array.from(document.querySelectorAll("#chatRoot > div > div")).reduce((accumulator, currentValue) =>
				Math.max(accumulator || 0, currentValue.style["top"].replace(/[^\d]/g, ""))
			) || 0;
		var iconBottom = (maxTop / 39 / 2 + 1) * 39;

		icon.style["bottom"] = `${iconBottom}px`;
	}

	new MutationObserver(() => setToggleChatPosition()).observe(document.querySelector("#chatRoot > div"), { attributes: true, subtree: true });

	doc.find("#body").prepend(icon);

	setToggleChatPosition();
}

function addInformationSection() {
	let hr = doc.new({ type: "hr", class: "delimiter___neME6 delimiter___3kh4j tt-information-section-hr" }); // FIXME - Use right classes.
	let div = doc.new({ type: "div", class: "tt-information-section" });

	doc.find("#sidebarroot [class*='user-information_'] [class*='content_']:not([class*='toggle-'])").appendChild(hr);
	doc.find("#sidebarroot [class*='user-information_'] [class*='content_']:not([class*='toggle-'])").appendChild(div);
}

function displayOCtime() {
	doc.find(".tt-information-section-hr").classList.add("active");
	doc.find(".tt-information-section").classList.add("active");

	let crime_ids = Object.keys(oc);
	crime_ids.reverse();

	if (crime_ids.length === 0) {
		let div = doc.new({ type: "div" });
		const keySpan = doc.new({ type: "span", text: "OC:", class: "tt-text-link key" });
		let span = doc.new({ type: "span", text: "N/A" });

		div.appendChild(keySpan);
		div.appendChild(span);
		doc.find(".tt-information-section").appendChild(div);

		keySpan.onclick = () => {
			window.location.href = "https://www.torn.com/factions.php?step=your#/tab=crimes";
		};
		return;
	}

	let found_oc = false;

	for (let crime_id of crime_ids) {
		if (crime_id === "date") continue;
		if (oc[crime_id].initiated === 1) continue;

		for (let participant of oc[crime_id].participants) {
			if (userdata.player_id in participant) {
				found_oc = true;

				let time_left = timeUntil(new Date(oc[crime_id].time_ready * 1000) - new Date());
				let div = doc.new({ type: "div" });
				const keySpan = doc.new({ type: "span", text: "OC: ", class: "tt-text-link key" });
				let span = doc.new({
					type: "span",
					text: time_left,
					attributes: { "seconds-down": parseInt((new Date(oc[crime_id].time_ready * 1000) - new Date()) / 1000) },
				});

				if (time_left === -1 || !time_left.includes("d")) span.classList.add("red");

				div.appendChild(keySpan);
				div.appendChild(span);
				doc.find(".tt-information-section").appendChild(div);

				keySpan.onclick = () => {
					window.location.href = "https://www.torn.com/factions.php?step=your#/tab=crimes";
				};
			}
		}
	}

	if (!found_oc) {
		let div = doc.new({ type: "div", text: `OC: ` });
		let span = doc.new({ type: "span", text: "No active OC" });

		div.appendChild(span);
		doc.find(".tt-information-section").appendChild(div);
	}
}

function addReviveListener() {
	const script = doc.new({
		type: "script",
		attributes: { type: "text/javascript" },
	});

	const reviveHandler = `
		(xhr, method, url) => {
			if (url.includes("action=revive") && !url.includes("step=revive")) {
				url = url + "&step=revive";
			}
			
			return { method, url };
		}
	`;

	script.innerHTML = `
		(() => { 
			if (typeof xhrOpenAdjustments === "undefined") xhrOpenAdjustments = {};
			
			xhrOpenAdjustments.noconfirm_revives = ${reviveHandler}
		})();
	`;

	doc.find("head").appendChild(script);
}

function showCustomConsole() {
	const element = doc.new({ type: "div", id: "tt-console" });

	ttConsole.parent = element;

	doc.find("#mainContainer").insertBefore(element, doc.find("#mainContainer > .clear"));
}

function highlightRefills() {
	if (mobile) return;

	if (settings.pages.global.refill_energy && !userdata.refills.energy_refill_used) {
		doc.find("#barEnergy [class*='bar-name_']").classList.add("tt-refill");
	}
	if (settings.pages.global.refill_nerve && !userdata.refills.nerve_refill_used) {
		doc.find("#barNerve [class*='bar-name_']").classList.add("tt-refill");
	}
}

function showMiniprofileInformation(information) {
	const miniProfile = doc.find("#profile-mini-root .mini-profile-wrapper");

	const lastAction = timeAgo(Date.now() - information.user.lastAction.seconds * 1000);

	const signupDate = new Date(information.user.signUp * 1000);
	const formattedTime = formatTime([signupDate.getUTCHours(), signupDate.getUTCMinutes(), signupDate.getUTCSeconds()], settings.format.time);
	const formattedDate = formatDate([signupDate.getUTCDate(), signupDate.getUTCMonth() + 1, signupDate.getUTCFullYear()], settings.format.date);

	requireElement("[class*='-profile-mini-_userProfileWrapper']", { parent: miniProfile }).then(() => {
		setTimeout(() => {
			miniProfile.find("[class*='-profile-mini-_userProfileWrapper']").appendChild(
				doc.new({
					type: "div",
					class: "tt-mini-data",
					children: [
						doc.new({ type: "strong", text: "Last Action: " }),
						doc.new({ type: "span", text: lastAction }),
						// doc.new("br"),
						// doc.new({ type: "strong", text: "Signup: " }),
						// doc.new({ type: "span", text: `${formattedTime} ${formattedDate}` }),
					],
				})
			);
		}, 500);
	});
}

function nukeReviveScript() {
	// HTML - taken from Jox's script 'Central Hospital Revive Request'
	const reviveButtonHTML = `
<div id="top-page-links-list" class="content-title-links" role="list" aria-labelledby="top-page-links-button">
	<a role="button" aria-labelledby="nuke-revive" class="nuke-revive t-clear h c-pointer  m-icon line-h24 right last" href="#" style="padding-left: 10px; padding-right: 10px" id="nuke-revive-link">
		<span class="icon-wrap svg-icon-wrap">
			<span class="link-icon-svg nuke-revive">
			<div id="cf"></div>
			</span>
		</span>
		<span id="nuke-revive" style="color:red">Revive Me</span>
	</a>
</div>
	`;
	const reviveButton = doc.new({ type: "span" });
	reviveButton.innerHTML = reviveButtonHTML;

	// Add button to page - taken from Jox's script 'Central Hospital Revive Request'
	if (!doc.find("#nuke-revive-link")) {
		let linkReference =
			doc.find(".links-footer") ||
			doc.find(".content-title .clear") ||
			doc.find(".tutorial-switcher") ||
			doc.find(".links-top-wrap") ||
			doc.find(".forums-main-wrap");
		if (linkReference) {
			let linkContainer = linkReference.parentNode;
			linkContainer.insertBefore(reviveButton, linkReference);

			doc.find("#nuke-revive-link").onclick = () => {
				callForRevive();
			};
		}
	}

	function callForRevive() {
		const playerID = userdata.player_id;
		const playerName = userdata.name;
		const isInHospital = !!doc.find("#sidebarroot [class*='status-icons_'] li[class*=icon15]");
		const faction = userdata.faction.faction_name;
		const appInfo = `TornTools v${chrome.runtime.getManifest().version}`;
		let country = document.body.dataset.country;

		switch (country) {
			case "uk":
				country = "United Kingdom";
				break;
			case "uae":
				country = "UAE";
				break;
			default:
				country = country.replace(/-/g, " ");
				country = capitalize(country, (everyWord = true));
				break;
		}

		if (!isInHospital) {
			alert("You are not in hospital.");
			return;
		}

		const postData = { uid: playerID, Player: playerName, Faction: faction, Country: country, AppInfo: appInfo };
		fetchRelay("nukefamily", {
			section: "dev/reviveme.php",
			method: "POST",
			postData: postData,
		}).then(async (response) => {
			console.log("response", response);
		});
	}
}

// Code for adding chat filter for People Box
function addPeopleBoxFilter() {
	if (doc.findAll("div[class*='chat-box-people_'] .tt-chat-filter").length === 0) {
		let peopleBox = document.find("div[class*='chat-box-people_']");

		peopleBox.nextElementSibling.classList.add("tt-modified");

		let filter_wrap = doc.new({ type: "div", class: "tt-chat-filter" });
		let filter_text = doc.new({ type: "div", text: "Find:" });
		let filter_input = doc.new({ type: "input" });

		filter_wrap.appendChild(filter_text);
		filter_wrap.appendChild(filter_input);

		peopleBox.find("div[class*='chat-box-content_']").appendChild(filter_wrap);

		// Filtering process
		filter_input.onkeyup = () => {
			let keyword = filter_input.value.toLowerCase();

			for (let player of peopleBox.findAll("li[class*='started-chat_']")) {
				player.style.display = "block";

				if (keyword && player.find(".bold").innerText.toLowerCase().indexOf(keyword) === -1) {
					player.style.display = "none";
				}
			}

			if (!keyword) {
				peopleBox.find("div[class*='viewport_']").scrollTo(0, 0);
			}
		};
	}
}

function hideGymHighlight() {
	if (settings.pages.gym.hide_gym_highlight) {
		const navGym = doc.find("#nav-gym");
		const gymClass = [...navGym.classList].find((name) => name.includes("available___"));
		const svg = navGym.find("svg");
		if (!gymClass) return;

		if (isDarkMode()) {
			if (!mobile) {
				svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_mobile)");
				svg.setAttribute("filter", "url(#svg_sidebar_mobile)");
			} else {
				svg.setAttribute("fill", svg.getAttribute("fill").replace("_green", ""));
				svg.setAttribute("filter", svg.getAttribute("filter").replace("_green", ""));
			}
		} else {
			if (mobile) {
				svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_mobile)");
				svg.setAttribute("filter", "url(#svg_sidebar_mobile)");
			} else {
				svg.setAttribute("fill", "url(#sidebar_svg_gradient_regular_desktop)");
			}
		}

		navGym.classList.remove(gymClass);
	}
}

function chainTimerHighlight() {
	let blinkIntervalId;
	let chainObserver = new MutationObserver(() => {
		if (doc.find("a#barChain [class^='bar-value_']").innerText.split("/")[1] >= settings.pages.global.highlight_chain_length) {
			let chainTimerParts = doc.find("a#barChain [class^='bar-timeleft_']").innerHTML.split(":");
			let chainTimer = parseInt(chainTimerParts[0]) * 60 + parseInt(chainTimerParts[1]);
			if (chainTimer === 0 || chainTimer > 60) clearInterval(blinkIntervalId);
			if (blinkIntervalId) return;
			if (chainTimer !== 0 && chainTimer < 60) blinkIntervalId = setInterval(() => doc.find("a#barChain").classList.toggle("tt-blink"), 700);
		}
	});
	chainObserver.observe(doc.find("a#barChain [class^='bar-value_']"), { characterData: true });
}

function tradeChatPostTimer() {
	let canPostHTML =
		'<div id="tt-trade-post-timer"><span class="tt-trade-chat-timer red" style="display: none;">Don\'t post</span><span class="tt-trade-chat-timer green" style="display: block;">Can post</span></div>';
	let dontPostHTML =
		'<div id="tt-trade-post-timer"><span class="tt-trade-chat-timer red" style="display: block;">Don\'t post</span><span class="tt-trade-chat-timer green" style="display: none;">Can post</span></div>';
	if (doc.findAll("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] div#tt-trade-post-timer").length === 0) {
		if (last_trade_post_time && new Date() - new Date(last_trade_post_time) < 60 * 1000) {
			doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_']").insertAdjacentHTML("afterBegin", dontPostHTML);
			setTimeout(() => {
				let canPost = doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] div#tt-trade-post-timer").lastElementChild;
				let dontPost = doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] div#tt-trade-post-timer").firstElementChild;
				if (canPost) canPost.style.display = "block";
				if (dontPost) dontPost.style.display = "none";
			}, 60 * 1000 - (new Date() - new Date(last_trade_post_time)));
		} else {
			if (doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_']"))
				doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_']").insertAdjacentHTML("afterBegin", canPostHTML);
		}
		if (doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] textarea"))
			doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] textarea").addEventListener("keypress", (event) => {
				if (event.keyCode == 13 && doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] div#tt-trade-post-timer")) {
					let new_last_trade_post_time = new Date().toString();
					ttStorage.set({ last_trade_post_time: new_last_trade_post_time });
					last_trade_post_time = new_last_trade_post_time;
					doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] div#tt-trade-post-timer").lastElementChild.style.display =
						"none";
					doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] div#tt-trade-post-timer").firstElementChild.style.display =
						"block";
					setTimeout(() => {
						let canPost = doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] div#tt-trade-post-timer").lastElementChild;
						let dontPost = doc.find("div[class*='chat-box'][class*='trade'] div[class*='chat-box-input_'] div#tt-trade-post-timer")
							.firstElementChild;
						if (canPost) canPost.style.display = "block";
						if (dontPost) dontPost.style.display = "none";
					}, 60000);
				}
			});
	}
}

function chainBonusWatch() {
	doc.findAll(".profile-button-attack[aria-label*='Attack']").forEach((attackButton) => {
		if (!attackButton.classList.contains("tt-mouseenter")) {
			attackButton.classList.add("tt-mouseenter");
			attackButton.addEventListener("mouseenter", () => {
				let chainParts = doc.find("a#barChain [class^='bar-value_']").innerText.split("/");
				if (!doc.find(".tt-fac-chain-bonus-warning") && chainParts[0] > 10 && chainParts[1] - chainParts[0] < 20) {
					let rawHTML = `<div class="tt-fac-chain-bonus-warning">
						<div>
							<span>Chain is approaching bonus hit ! Please check your faction chat !</span>
						</div>
					</div>`;
					doc.body.insertAdjacentHTML("afterBegin", rawHTML);
				}
			});
			attackButton.addEventListener("mouseleave", () => {
				if (doc.find(".tt-fac-chain-bonus-warning")) doc.find("div.tt-fac-chain-bonus-warning").remove();
			});
		}
	});
}

function ttSettingsLink() {
	doc.find("div.areasWrapper [class*='toggle-content__']").appendChild(
		navbar.newAreasLink({
			id: "tt-nav-settings",
			href: "/home.php#TornTools",
			svgHTML: `<img src="${chrome.runtime.getURL("images/icongrey48.png")}" style="height: 21px;">`,
			linkName: "TornTools Settings",
		})
	);
}

function aliasUsers() {
	requireElement(".m-hide a[href*='/profiles.php?XID=']").then(() => {
		for (const userID of Object.keys(users_alias)) {
			doc.findAll(`.m-hide a[href*='/profiles.php?XID=${userID}']`).forEach((userIdA) => {
				userIdA.classList.add("tt-user-alias");
				userIdA.insertAdjacentHTML("beforeEnd", `<div class='tt-alias'>${users_alias[userID]}</div>`);
			});
		}
	});
}

function aliasUsersChat(message = "") {
	if (message) {
		let profileA = message.find(`a[href*='/profiles.php?XID=']`);
		let messageUserId = profileA.href.split("=")[1];
		if (Object.keys(users_alias).includes(messageUserId)) profileA.innerText = users_alias[messageUserId] + ": ";
	} else {
		for (const userID of Object.keys(users_alias)) {
			doc.findAll(`#chatRoot a[href*='/profiles.php?XID=${userID}']`).forEach((profileA) => {
				let messageUserId = profileA.href.split("=")[1];
				profileA.innerText = users_alias[messageUserId] + ": ";
			});
		}
	}
}

function upkeepMoreThan() {
	if (-networth.current.value.unpaidfees >= settings.pages.global.upkeep_more_than) {
		doc.find("#sidebarroot #nav-properties").classList.add("tt-upkeep");
		if (isDarkMode()) {
			doc.find("#sidebarroot #nav-properties svg").setAttribute("fill", "url(#sidebar_svg_gradient_regular_green_mobile)");
		} else if (!isDarkMode() && mobile) {
			doc.find("#sidebarroot #nav-properties svg").setAttribute("fill", "url(#sidebar_svg_gradient_regular_green_mobile)");
		} else {
			doc.find("#sidebarroot #nav-properties svg").setAttribute("fill", "url(#sidebar_svg_gradient_regular_desktop_green)");
		}
	}
}

function easterEggs() {
	const mainContainer = doc.find("#mainContainer");
	if (!mainContainer) return;

	const EGG_SELECTOR = "img[src^='competition.php?c=EasterEggs'][src*='step=eggImage'][src*='access_token=']";

	for (const egg of doc.findAll(EGG_SELECTOR)) {
		highlightEgg(egg);
	}
	new MutationObserver((mutations, observer) => {
		for (const node of mutations.flatMap((mutation) => [...mutation.addedNodes])) {
			if (node.nodeType !== Node.ELEMENT_NODE || !node.find(EGG_SELECTOR)) continue;

			highlightEgg(node.find(EGG_SELECTOR));
			observer.disconnect();
			break;
		}
	}).observe(mainContainer, { childList: true });

	function highlightEgg(egg) {
		const canvas = document.new({ type: "canvas", attributes: { width: egg.width, height: egg.height } });
		const context = canvas.getContext("2d");
		context.drawImage(egg, 0, 0);

		// Check if the egg has any non-transparent pixels, to make sure it's not a fake egg.
		if (!canvas.width || !context.getImageData(0, 0, canvas.width, canvas.height).data.some((d) => d !== 0)) return;

		const overlay = doc.find(".tt-black-overlay");

		overlay.classList.add("active");
		const ttEasterEggDiv = doc.new({
			type: "div",
			class: "tt-easter-egg-div",
			text: "There is an Easter Egg on this page !",
			children: doc.new({ type: "button", class: "tt-easter-egg-button", text: "Close" }),
		});
		doc.find(".tt-black-overlay").appendChild(ttEasterEggDiv);
		ttEasterEggDiv.find("button").addEventListener("click", () => {
			ttEasterEggDiv.remove();
			overlay.classList.remove("active");
		});
	}
}

function showNpcLoot() {
	let npcLootDiv = navbar.newSection("NPCs");
	let npcContent = npcLootDiv.find(".tt-content");
	for (const npcID of Object.keys(loot_times)) {
		let npcData = loot_times[npcID];
		let npcDiv = doc.new({ type: "div", class: "tt-npc" });
		let npcSubDiv = doc.new({ type: "div", class: "tt-npc-information" });
		let npcName = doc.new({
			type: "a",
			class: "tt-npc-name",
			href: `https://www.torn.com/profiles.php?XID=${npcID}`,
			html: `${npcData.name} [${npcID}]:<br>`,
		});
		let npcStatus;
		let npcInHosp = false;
		if (npcData.hospout * 1000 > Date.now()) {
			npcInHosp = true;
			npcStatus = doc.new({ type: "span", class: "hosp", text: "Hosp" });
		} else {
			npcStatus = doc.new({ type: "span", class: "okay", text: "Okay" });
		}
		let npcLootLevel, npcNextLevelIn;
		if (npcInHosp) {
			let hospOutIn = npcData.hospout * 1000 - Date.now();
			npcLootLevel = doc.new({ type: "span", class: "loot", text: "0" });
			npcNextLevelIn = doc.new({ type: "span", text: timeUntil(hospOutIn), attributes: { seconds: Math.floor(hospOutIn / 1000) } });
		} else {
			for (let lootLevel in npcData.timings) {
				let nextLvlTime = npcData.timings[lootLevel].ts * 1000 - Date.now();
				if (nextLvlTime > 0) {
					npcLootLevel = doc.new({ type: "span", class: "loot", text: lootLevel - 1 });
					npcNextLevelIn = doc.new({ type: "span", text: timeUntil(nextLvlTime), attributes: { seconds: Math.floor(nextLvlTime / 1000) } });
					break;
				} else if (lootLevel !== 5 && nextLvlTime < 0) {
					continue;
				} else if (lootLevel === 5 && nextLvlTime < 0) {
					npcNextLevelIn = doc.new({ type: "span", text: "Max Level Reached" });
				}
			}
		}
		npcDiv.appendChild(npcName);
		npcSubDiv.appendChild(npcStatus);
		npcSubDiv.appendChild(doc.new({ type: "span", text: " / " }));
		npcSubDiv.appendChild(npcLootLevel);
		npcSubDiv.appendChild(doc.new({ type: "span", text: " / " }));
		npcSubDiv.appendChild(npcNextLevelIn);
		npcDiv.appendChild(npcSubDiv);
		npcContent.appendChild(npcDiv);
	}
	npcContent.id = "tt-loot";
	doc.find("#sidebar > :first-child").insertAdjacentElement("afterEnd", npcLootDiv);
	setInterval(() => {
		doc.findAll("div#tt-loot .tt-npc .tt-npc-information > :last-child").forEach((x) => {
			if (!x.getAttribute("seconds")) return;
			let secondsLeft = x.getAttribute("seconds");
			x.setAttribute("seconds", secondsLeft - 1);
			x.innerText = timeUntil((secondsLeft - 1) * 1000);
		});
	}, 1000);
}
