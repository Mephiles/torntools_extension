requireDatabase().then(() => {
	console.log("Loading Global Script");

	// Add TT Black overlay
	doc.find("body").appendChild(doc.new({ type: "div", class: "tt-black-overlay" }));

	if (settings.pages.global.miniprofile_last_action) {
		addFetchListener(event => {
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

	requireNavbar().then(async () => {
		let _flying = await isFlying();

		// Mark Body with Mobile class
		if (mobile) doc.find("body").classList.add("tt-mobile");

		// Create a section in Information tab for future info added
		if (!mobile) addInformationSection();

		// Make Areas collapsible
		if (!doc.find(".header-arrow___1Ph0g") && !mobile) {
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

			for (let icon of doc.findAll("#sidebarroot .status-icons___1SnOI>li")) {
				let name = icon.getAttribute("class").split("_")[0];
				if (hide_icons.includes(name)) {
					icon.parentElement.appendChild(icon);
				}
			}

			observer.observe(doc.find("#sidebarroot .status-icons___1SnOI"), { childList: true });
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
			doc.find("#barEnergy .bar-name___3TJ0p").classList.add("tt-text-link");
			doc.find("#barNerve .bar-name___3TJ0p").classList.add("tt-text-link");
			doc.find("#barEnergy .bar-name___3TJ0p").onclick = () => {
				window.location.href = "https://www.torn.com/gym.php";
			};
			doc.find("#barNerve .bar-name___3TJ0p").onclick = () => {
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

			if (settings.pages.global.find_chat) addChatFilters();
			if (settings.pages.global.autocomplete_chat) addChatUsernameAutocomplete();
		}

		doc.addEventListener("click", event => {
			if (!hasParent(event.target, { class: "chat-box_Wjbn9" })) {
				return;
			}

			manipulateChat(highlights);
			if (settings.pages.global.find_chat) addChatFilters();
			if (settings.pages.global.autocomplete_chat) addChatUsernameAutocomplete();
		});

		let chat_observer = new MutationObserver((mutationsList) => {
			for (let mutation of mutationsList) {
				if (mutation.addedNodes[0] && mutation.addedNodes[0].classList && mutation.addedNodes[0].classList.contains("message_oP8oM")) {
					let message = mutation.addedNodes[0];

					applyChatHighlights(message, highlights);
					if (settings.pages.global.block_zalgo) removeZalgoText(message);
				}
			}
		});
		chat_observer.observe(doc.find("#chatRoot"), { childList: true, subtree: true });
	});
});

function chatsLoaded() {
	return new Promise((resolve) => {
		let checker = setInterval(() => {
			if (doc.find(".overview_1MoPG")) {
				setInterval(() => {
					resolve(true);
				}, 300);
				return clearInterval(checker);
			}
		});
	});
}

function addCustomLinks() {
	if (mobile) {
		let areas_custom = doc.new({
			type: "div",
			class: "areas___2pu_3 areasWrapper areas-mobile___3zY0z torntools-mobile",
		});
		let div = doc.new({ type: "div" });
		let swipe_container = doc.new({ type: "div", class: "swiper-container swiper-container-horizontal" });
		let swipe_wrapper = doc.new({
			type: "div",
			class: "swiper-wrapper swiper___nAyWO",
			attributes: { style: "transform: translate3d(0px, 0px, 0px); transition-duration: 0ms;" },
		});
		let swipe_button_left = doc.new({
			type: "div",
			class: "swiper-button___3lZ1n button-prev___2x-Io swiper-button-disabled",
		});
		let swipe_button_right = doc.new({ type: "div", class: "swiper-button___3lZ1n button-next___1hJxo" });

		for (let link of custom_links) {
			let slide = doc.new({ type: "div", class: "swiper-slide slide___1oBWA" });
			let area = doc.new({ type: "div", class: "area-mobile___1XJcq" });
			let area_row = doc.new({ type: "div", class: "area-row___34mEZ torntools-mobile" });
			let a = doc.new({
				type: "a",
				href: link.href,
				class: "mobileLink___33zU1 sidebarMobileLink torntools-mobile",
				text: link.text,
				attributes: { target: (link.new_tab ? "_blank" : "") },
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

		doc.find("#sidebar .content___kMC8x").insertBefore(areas_custom, doc.find("#sidebar .content___kMC8x .user-information-mobile___EaRKJ"));
	} else {
		let custom_links_section = navbar.newSection("Custom Links", { next_element_heading: "Areas" });

		for (let link of custom_links) {
			navbar.newCell(link.text, {
				parent_element: custom_links_section,
				href: link.href,
				link_target: (link.new_tab ? "_blank" : ""),
			});
		}

		doc.find("#sidebar").insertBefore(custom_links_section, findParent(doc.find("h2=Areas"), { class: "sidebar-block___1Cqc2" }));
	}
}

function addNotesBox() {
	let notes_section = navbar.newSection("Notes", { next_element_heading: "Areas" });
	let cell = doc.new({ type: "div", class: "area-desktop___2YU-q" });
	let inner_div = doc.new({ type: "div", class: "area-row___34mEZ" });
	let textbox = doc.new({ type: "textarea", class: "tt-nav-textarea", value: notes.text || "" });

	if (notes.height) {
		textbox.style.height = notes.height;
	}

	inner_div.appendChild(textbox);
	cell.appendChild(inner_div);
	notes_section.find(".tt-content").appendChild(cell);

	doc.find("#sidebar").insertBefore(notes_section, findParent(doc.find("h2=Areas"), { class: "sidebar-block___1Cqc2" }));

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

	let cell = doc.new({ type: "div", class: "area-desktop___2YU-q" });
	let inner_div = doc.new({ type: "div", class: "area-row___34mEZ" });
	let a = doc.new({
		type: "a",
		class: "desktopLink___2dcWC",
		href: settings_page_url,
		attributes: { target: "_blank", style: "background-color: #B8E28F; min-height: 24px; line-height: 24px;" },
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
		return text.toLowerCase().replaceAll([".", "?", ":", "!", "\"", "'", ";", "`", ","], "");
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
		let filter_text = doc.new({ type: "div", text: "find:" });
		let filter_input = doc.new({ type: "input", id: "---search---" });

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

			let usernames = Array.from(chatMessageList.findAll(".message_oP8oM > a")).map((message) => message.innerText.slice(0, -2)).filter((value, index, array) => array.indexOf(value) === index).sort();

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
			chatTextbox.value = chatTextbox.value.substring(0, valueStart) + currentUsername + chatTextbox.value.substring(valueToCursor.length, chatTextbox.value.length);

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

	let elementHTML = `
    	<span class="name___297H-">Vault:</span>
    	<span class="value___1K0oi money-positive___3pqLW" style="position:relative;left:-3px;">
			${(settings.pages.global.vault_balance_own && vault.initialized && vault.user.current_money) ? "*" : ""}$${numberWithCommas(money, false)}
		</span>
    `;

	let el = doc.new({ type: "p", class: "point-block___xpMEi", attributes: { tabindex: "1" }, html: elementHTML });

	let info_cont = doc.find("h2=Information");
	info_cont.parentElement.find(".points___KTUNl").insertBefore(el, info_cont.parentElement.find(".points___KTUNl .point-block___xpMEi:nth-of-type(2)"));
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
		var maxTop = Array.from(document.querySelectorAll("#chatRoot > div > div")).reduce((accumulator, currentValue) => Math.max(accumulator || 0, currentValue.style["top"].replace(/[^\d]/g, ""))) || 0;
		var iconBottom = ((maxTop / 39 / 2) + 1) * 39;

		icon.style["bottom"] = `${iconBottom}px`;
	}

	new MutationObserver(() => setToggleChatPosition()).observe(document.querySelector("#chatRoot > div"), { attributes: true, subtree: true });

	doc.find("#body").prepend(icon);

	setToggleChatPosition();
}

function addInformationSection() {
	let hr = doc.new({ type: "hr", class: "delimiter___neME6 tt-information-section-hr" });
	let div = doc.new({ type: "div", class: "tt-information-section" });

	doc.find("#sidebarroot .user-information___u408H .content___3HChF").appendChild(hr);
	doc.find("#sidebarroot .user-information___u408H .content___3HChF").appendChild(div);
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
		doc.find("#barEnergy .bar-name___3TJ0p").classList.add("tt-refill");
	}
	if (settings.pages.global.refill_nerve && !userdata.refills.nerve_refill_used) {
		doc.find("#barNerve .bar-name___3TJ0p").classList.add("tt-refill");
	}
}

function showMiniprofileInformation(information) {
	const miniProfile = doc.find("#profile-mini-root .mini-profile-wrapper");

	const lastAction = timeAgo(Date.now() - (information.user.lastAction.seconds * 1000));

	const signupDate = new Date(information.user.signUp * 1000);
	const formattedTime = formatTime([signupDate.getUTCHours(), signupDate.getUTCMinutes(), signupDate.getUTCSeconds()], settings.format.time);
	const formattedDate = formatDate([signupDate.getUTCDate(), signupDate.getUTCMonth() + 1, signupDate.getUTCFullYear()], settings.format.date);

	requireElement(".-profile-mini-_userProfileWrapper___39cKq", { parent: miniProfile }).then(() => {
		setTimeout(() => {
			miniProfile.find(".-profile-mini-_userProfileWrapper___39cKq").appendChild(doc.new({
				type: "div",
				class: "tt-mini-data",
				children: [
					doc.new({ type: "strong", text: "Last Action: " }),
					doc.new({ type: "span", text: lastAction }),
					// doc.new("br"),
					// doc.new({ type: "strong", text: "Signup: " }),
					// doc.new({ type: "span", text: `${formattedTime} ${formattedDate}` }),
				],
			}));
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
	`
	const reviveButton = doc.new({ type: 'span' })
	reviveButton.innerHTML = reviveButtonHTML;

	// Add button to page - taken from Jox's script 'Central Hospital Revive Request'
	if (!doc.find('#nuke-revive-link')) {
		let linkReference = doc.find('.links-footer') || doc.find('.content-title .clear') || doc.find('.tutorial-switcher') || doc.find('.links-top-wrap') || doc.find('.forums-main-wrap');
		if (linkReference) {
			let linkContainer = linkReference.parentNode;
			linkContainer.insertBefore(reviveButton, linkReference);

			doc.find('#nuke-revive-link').onclick = () => { callForRevive() };
		}
	}

	function callForRevive() {
		const playerID = userdata.player_id;
		const playerName = userdata.name;
		const isInHospital = doc.find('#sidebarroot .status-icons___1SnOI li[class^=icon15]') ? true : false;
		const faction = userdata.faction.faction_name;
		const appInfo = `TornTools v${chrome.runtime.getManifest().version}`
		let country = document.body.dataset.country;

		switch (country) {
			case 'uk':
				country = 'United Kingdom';
				break;
			case 'uae':
				country = 'UAE';
				break;
			default:
				country = country.replace(/-/g, " ");
				country = capitalize(country, everyWord = true);
				break;
		}

		if (!isInHospital) {
			alert('You are not in hospital.');
			return;
		}

		const postData = { uid: playerID, Player: playerName, Faction: faction, Country: country, AppInfo: appInfo }
		fetchRelay('nukefamily', {
			section: 'dev/reviveme.php',
			method: 'POST',
			postData: postData
		})
			.then(async response => {
				console.log('response', response);
			})
	}
}