requireDatabase().then(() => {
	if (page_status === "blocked") {
		console.log("Exiting Crimes script. Page is blocked.");
		return;
	}

	$(document).ready(() => {
		if (shouldDisable()) return;

		let script_tag = doc.new({
			type: "script",
			attributes: { type: "text/javascript", src: chrome.runtime.getURL("/scripts/content/crimes/ttCrimeInject.js") },
		});
		doc.find("head").appendChild(script_tag);

		window.addEventListener("tt-crime-finished", handleFormSubmit);
	});

	requireMessageBox().then(() => {
		console.log("TT - Quick crimes");
		if (shouldDisable()) return;

		// Quick crimes
		showCrimesContainer(quick);

		crimesLoaded().then(() => {
			markCrimes();
		});

		let in_progress = false;
		let content_wrapper = doc.find(".content-wrapper");
		let content_observer = new MutationObserver(() => {
			if (doc.find("#ttQuick") || in_progress) return;
			in_progress = true;

			requireMessageBox().then(() => {
				if (doc.find("#ttQuick")) return;

				ttStorage.get("quick", (quick) => {
					showCrimesContainer(quick);
				});
				in_progress = false;
			});

			crimesLoaded().then(() => {
				markCrimes();
			});
		});
		content_observer.observe(content_wrapper, { childList: true, subtree: true });

		// quick crimes listener
		doc.addEventListener("click", (event) => {
			// Close button
			if (event.target.classList.contains("tt-close-icon")) {
				console.log("here");
				event.stopPropagation();

				let div = findParent(event.target, { class: "item" });
				div.remove();

				let crimes = [...doc.findAll("#ttQuick .item")].map((x) => ({
					action: x.getAttribute("action"),
					nerve: x.getAttribute("nerve"),
					name: x.getAttribute("name"),
					icon: window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0],
					text: x.find(".text").innerText.split(" (")[0],
				}));
				ttStorage.change({ quick: { crimes: crimes } }, () => (quick.crimes = crimes));
			}
			// Crime button
			else if (
				(event.target.classList.contains("item") && hasParent(event.target, { id: "ttQuick" })) ||
				(hasParent(event.target, { class: "item" }) && hasParent(event.target, { id: "ttQuick" }))
			) {
				let div = event.target.classList.contains("item") ? event.target : findParent(event.target, { class: "item" });

				let action = div.getAttribute("action");
				let nerve_take = div.getAttribute("nerve");
				let crime_name = div.getAttribute("name");

				console.log("action", action);
				console.log("nerve_take", nerve_take);
				console.log("crime_name", crime_name);

				let form = doc.find(".content-wrapper form[name=crimes]");
				if (!form) {
					form = doc.new({ type: "form", attributes: { name: "crimes", method: "post" } });
					let dummy_crime = doc.new({ type: "input", value: crime_name, attributes: { name: "crime", type: "radio", checked: true } });
					let submit_button = doc.new({ type: "div", id: "do_crimes", class: "btn" });
					let submit_button_inner = doc.new({ type: "button", class: "torn-btn", text: "NEXT STEP" });
					submit_button.appendChild(submit_button_inner);
					form.appendChild(dummy_crime);
					form.appendChild(submit_button);
					doc.find(".content-wrapper").appendChild(form);
				} else {
					if (form.find("input[type=radio]:checked")) {
						form.find("input[type=radio]:checked").setAttribute("value", crime_name);
					} else {
						let dummy_crime = doc.new({ type: "input", value: crime_name, attributes: { name: "crime", type: "radio", checked: true } });
						form.appendChild(dummy_crime);
					}
				}

				form.setAttribute("action", action);
				form.setAttribute("hijacked", true);
				if (form.find("input[name=nervetake]")) {
					form.find("input[name=nervetake]").setAttribute("value", nerve_take);
				} else {
					let input = doc.new({ type: "input", attributes: { name: "nervetake", type: "hidden", value: nerve_take } });
					form.insertBefore(input, form.firstChild);
				}

				if (form.find("#do_crimes")) {
					form.find("#do_crimes").click();
				} else {
					let submit_button = doc.new({ type: "div", id: "do_crimes", class: "btn" });
					let submit_button_inner = doc.new({ type: "button", class: "torn-btn", text: "NEXT STEP" });
					submit_button.appendChild(submit_button_inner);
					form.appendChild(submit_button);
					form.find("#do_crimes").click();
				}
			}
		});
	});
});

function markCrimes() {
	let form_action = doc.find(".content-wrapper form[name=crimes]").getAttribute("action");
	if (!isNaN(parseInt(form_action[form_action.length - 1])) && parseInt(form_action[form_action.length - 1]) !== 3) {
		console.log("marking");
		for (let crime of doc.findAll(".specials-cont-wrap form[name=crimes]>ul>li")) {
			crime = crime.find(".item");

			crime.setAttribute("draggable", "true");
			crime.addEventListener("dragstart", onDragStart);
			crime.addEventListener("dragend", onDragEnd);
		}
	}
}

function crimesLoaded() {
	return new Promise((resolve) => {
		let checker = setInterval(() => {
			if ([...doc.findAll("form[name=crimes]>ul>li")].length > 1) {
				resolve(true);
				return clearInterval(checker);
			}
		}, 100);
	});
}

function showCrimesContainer(quick) {
	let quick_container = content
		.newContainer("Crimes", { id: "ttQuick", dragzone: true, next_element: doc.find(".tutorial-cont") })
		.find(".content"); /*doc.find("#module-desc") || doc.find(".title-black[role=heading]") || doc.find(".users-list-title")*/
	let inner_content = doc.new({ type: "div", class: "inner-content" });
	quick_container.appendChild(inner_content);

	if (quick.crimes.length > 0) {
		for (let crime of quick.crimes) {
			let div = doc.new({ type: "div", class: "item", attributes: { nerve: crime.nerve, name: crime.name, action: crime.action } });
			let pic = doc.new({ type: "div", class: "pic", attributes: { style: `background-image: url(${crime.icon})` } });
			let text = doc.new({ type: "div", class: "text", text: `${crime.text} (-${crime.nerve} nerve)` });
			let close_icon = doc.new({ type: "i", class: "fas fa-times tt-close-icon" });

			div.appendChild(pic);
			div.appendChild(text);
			div.appendChild(close_icon);
			inner_content.appendChild(div);
		}
	}

	addButton();

	const safeWrap = doc.new({ type: "div", class: "in-title tt-checkbox-wrap" });
	const safeSetting = doc.new({ type: "input", id: "safe-crimes", attributes: { type: "checkbox" } });
	const safeText = doc.new({ type: "label", text: "Only show safe crimes", attributes: { for: "safe-crimes" } });
	safeWrap.appendChild(safeSetting);
	safeWrap.appendChild(safeText);

	safeWrap.addEventListener("click", (event) => event.stopPropagation());
	safeSetting.addEventListener("click", () => {
		document.documentElement.style.setProperty("--torntools-only-safe-crimes", safeSetting.checked ? "none" : "block");

		ttStorage.change({ filters: { crimes: { safeCrimes: safeSetting.checked } } });
	});

	doc.find("#ttQuick .tt-options").appendChild(safeWrap);

	toggleCrimes();

	safeSetting.checked = filters.crimes.safeCrimes;
	document.documentElement.style.setProperty("--torntools-only-safe-crimes", filters.crimes.safeCrimes ? "none" : "block");
}

function addButton() {
	let wrap = doc.new({ type: "div", class: "tt-option", id: "edit-crime-button" });
	let icon = doc.new({ type: "i", class: "fas fa-plus" });
	wrap.appendChild(icon);
	wrap.innerHTML += " Edit";

	doc.find("#ttQuick .tt-title .tt-options").appendChild(wrap);

	wrap.onclick = (event) => {
		event.stopPropagation();

		if (doc.find(".tt-black-overlay").classList.contains("active")) {
			doc.find(".tt-black-overlay").classList.remove("active");
			doc.find("form[name='crimes']").classList.remove("tt-highlight-sector");
			doc.find(".tt-title .tt-options .tt-option#edit-crime-button").classList.remove("tt-highlight-sector");

			for (let crime of doc.findAll("form[name='crimes']>ul>li")) crime.onclick = undefined;
			for (let quickCrime of doc.findAll("#ttQuick .inner-content>.item")) {
				quickCrime.onclick = undefined;
				quickCrime.classList.remove("removable");
			}
		} else {
			doc.find('#ttQuick .tt-title').classList.remove('collapsed');
			doc.find(".tt-black-overlay").classList.add("active");
			doc.find(".tt-title .tt-options .tt-option#edit-crime-button").classList.add("tt-highlight-sector");

			// Make quick crimes removable
			for (let quickCrime of doc.findAll("#ttQuick .inner-content>.item")) {
				quickCrime.classList.add("tt-highlight-sector");
				quickCrime.classList.add("removable");

				quickCrime.onclick = (event) => {
					event.stopPropagation();
					event.preventDefault();

					if (event.target.classList.contains("item")) event.target.remove();
					else findParent(event.target, { class: "item" }).remove();

					let crimes = [...doc.findAll("#ttQuick .item")].map((x) => ({
						action: x.getAttribute("action"),
						nerve: x.getAttribute("nerve"),
						name: x.getAttribute("name"),
						icon: window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0],
						text: x.find(".text").innerText.split(" (")[0],
					}));
					ttStorage.change({ quick: { crimes: crimes } }, () => (quick.crimes = crimes));
				};
			}

			if (!doc.find(".specials-cont-wrap form[name=crimes]>ul>li .item[draggable]")) return;

			doc.find("form[name='crimes']").classList.add("tt-highlight-sector");
			// Add new crimes
			for (let crime of doc.findAll("form[name='crimes']>ul>li")) {
				crime.onclick = (event) => {
					event.stopPropagation();
					event.preventDefault();

					let action = doc.find(".specials-cont-wrap form[name=crimes]").getAttribute("action");
					action = action[0] === "/" ? action.substr(1) : action;
					if (!action.includes("?")) action += "?";

					let target = findParent(event.target, { class: "item" });

					let crime_nerve = doc.find(".specials-cont-wrap input[name=nervetake]").value;
					let crime_name = target.find(".radio.right input").getAttribute("value");
					let crime_icon = target.find(".title.left img").getAttribute("src");
					let crime_text = target.find(".bonus.left").innerText.trim();

					let div = doc.new({
						type: "div",
						class: "item removable tt-highlight-sector",
						attributes: { nerve: crime_nerve, name: crime_name, action: action },
					});
					let pic = doc.new({ type: "div", class: "pic", attributes: { style: `background-image: url(${crime_icon})` } });
					let text = doc.new({ type: "div", class: "text", text: `${crime_text} (-${crime_nerve} nerve)` });
					let close_icon = doc.new({ type: "i", class: "fas fa-times tt-close-icon" });

					div.appendChild(pic);
					div.appendChild(text);
					div.appendChild(close_icon);
					doc.find("#ttQuick .inner-content").appendChild(div);

					div.onclick = (event) => {
						event.stopPropagation();
						event.preventDefault();

						if (event.target.classList.contains("item")) event.target.remove();
						else findParent(event.target, { class: "item" }).remove();

						let crimes = [...doc.findAll("#ttQuick .item")].map((x) => ({
							action: x.getAttribute("action"),
							nerve: x.getAttribute("nerve"),
							name: x.getAttribute("name"),
							icon: window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0],
							text: x.find(".text").innerText.split(" (")[0],
						}));
						ttStorage.change({ quick: { crimes: crimes } }, () => (quick.crimes = crimes));
					};

					// Save
					let crimes = [...doc.findAll("#ttQuick .item")].map((x) => ({
						action: x.getAttribute("action"),
						nerve: x.getAttribute("nerve"),
						name: x.getAttribute("name"),
						icon: window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0],
						text: x.find(".text").innerText.split(" (")[0],
					}));
					ttStorage.change({ quick: { crimes: crimes } }, () => (quick.crimes = crimes));
				};
			}
		}
	};
}

// Dragging
function onDragStart(event) {
	event.dataTransfer.setData("text/plain", null);

	setTimeout(() => {
		doc.find("#ttQuick .content").classList.add("drag-progress");

		if (doc.find("#ttQuick .temp.item")) return;

		let action = doc.find(".specials-cont-wrap form[name=crimes]").getAttribute("action");
		action = action[0] === "/" ? action.substr(1) : action;
		if (!action.includes("?")) action += "?";

		let crime_nerve = doc.find(".specials-cont-wrap input[name=nervetake]").value;
		let crime_name = event.target.find(".specials-cont-wrap .radio.right input").getAttribute("value");
		let crime_icon = event.target.find(".specials-cont-wrap .title.left img").getAttribute("src");
		let crime_text = event.target.find(".specials-cont-wrap .bonus.left").innerText.trim();

		let div = doc.new({ type: "div", class: "temp item", attributes: { nerve: crime_nerve, name: crime_name, action: action } });
		let pic = doc.new({ type: "div", class: "pic", attributes: { style: `background-image: url(${crime_icon})` } });
		let text = doc.new({ type: "div", class: "text", text: `${crime_text} (-${crime_nerve} nerve)` });
		let close_icon = doc.new({ type: "i", class: "fas fa-times tt-close-icon" });

		div.appendChild(pic);
		div.appendChild(text);
		div.appendChild(close_icon);
		doc.find("#ttQuick .inner-content").appendChild(div);
	}, 10);
}

function onDragEnd() {
	if (doc.find("#ttQuick .temp.item")) {
		doc.find("#ttQuick .temp.item").remove();
	}

	doc.find("#ttQuick .content").classList.remove("drag-progress");

	let crimes = [...doc.findAll("#ttQuick .item")].map((x) => ({
		action: x.getAttribute("action"),
		nerve: x.getAttribute("nerve"),
		name: x.getAttribute("name"),
		icon: window.getComputedStyle(x.find(".pic"), false).backgroundImage.split('("')[1].split('")')[0],
		text: x.find(".text").innerText.split(" (")[0],
	}));
	ttStorage.change({ quick: { crimes: crimes } }, () => (quick.crimes = crimes));
}

function toggleCrimes() {
	if (!doc.find(".specials-cont-wrap > form")) return;

	const SAFE_CRIMES = {
		docrime: {
			"search-for-cash": true,
			"sell-copied-media": true,
			shoplift: true,
			"pickpocket-someone": true,
			"plant-a-computer-virus": true,
			arson: true,
			assassination: true,
			"grand-theft-auto": true,
			kidnapping: {
				check: () => parseInt(doc.find("#user-money").getAttribute("data-money")) >= 75000,
			},
		},
		docrime2: {
			// search for cash
			"search-the-train-station": true,
			"search-under-the-old-bridge": true,
			"search-the-bins": true,
			"search-the-water-fountain": true,
			"search-the-dumpsters": true,
			"search-movie-theater": true,
			// sell copied media
			"rock-cds": true,
			"heavy-metal-cds": true,
			"pop-cds": true,
			"rap-cds": true,
			"reggae-cds": true,
			"horror-dvds": true,
			"action-dvds": true,
			"romance-dvds": true,
			"sci-fi-dvds": true,
			"thriller-dvds": true,
		},
		docrime3: {
			"clothes-shop": true,
		},
		docrime4: {
			// shoplift
			jacket: true,
			// pickpocket
			kid: {
				nerve: 5,
			},
			"old-woman": true,
			businessman: true,
			// computer virus
			"stealth-virus": true,
			// arson
			warehouse: true,
			// assassination
			"assassinate-a-target": true,
			"mob-boss": true,
			// gta
			"steal-a-parked-car": true,
			// kidnapping
			mayor: {
				check: () => parseInt(doc.find("#user-money").getAttribute("data-money")) >= 75000,
			},
		},
	};

	const step = new URLSearchParams(doc.find(".specials-cont-wrap > form").getAttribute("action").substring(10)).get("step");
	if (!SAFE_CRIMES[step]) return;
	for (let crime of doc.findAll(".specials-cont-wrap .specials-cont > li")) {
		const type = crime.find(".choice-container .radio-css").id;

		const safe = SAFE_CRIMES[step][type];
		if (!safe) continue;

		if (typeof safe === "boolean") crime.classList.add("safe-crime");
		else if (typeof safe === "object") {
			const check = safe.check ? safe.check() : true;
			const nerve = safe.nerve ? safe.nerve === getNerve() : true;

			if (check && nerve) crime.classList.add("safe-crime");
		}
	}

	function getNerve() {
		return parseInt(doc.find(".specials-cont-wrap form input[name='nervetake']").value);
	}
}

function handleFormSubmit({ detail: { response } }) {
	const $content = $(".content-wrapper");

	if (response.responseText.indexOf("success-message") === -1 && response.responseText.indexOf("ready-message") === -1) {
		$content.html(response.responseText);
	} else {
		let parts = response.responseText.split('<div class="tutorial-cont');
		let top = parts[0];
		// let middle = doc.createElement("div");
		// middle.id = "ttQuick";
		// middle.innerHTML = doc.find("#ttQuick").innerHTML;
		let bottom = '<div class="tutorial-cont' + parts[1];

		doc.find(".content-wrapper").innerHTML = top;
		// doc.find(".content-wrapper").appendChild(middle);
		doc.find(".content-wrapper").innerHTML += bottom;

		showCrimesContainer(quick);
	}

	if ($content.find(".choice-container input.radio-css").is(":checked")) {
		$content.find(".special.btn-wrap .torn-btn").prop("disabled", false);
	}
}
