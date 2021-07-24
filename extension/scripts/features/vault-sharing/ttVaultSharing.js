"use strict";

(async () => {
	if (!getPageStatus().access) return;

	const feature = featureManager.registerFeature(
		"Vault Sharing",
		"vault sharing",
		() => settings.scripts.vaultSharing.vaultSharing,
		initialise,
		startFeature,
		dispose,
		{
			storage: ["settings.scripts.vaultSharing.vaultSharing"],
		},
		null
	);

	function initialise() {
		window.addEventListener("hashchange", () => {
			if (!feature.enabled()) return;

			startFeature();
		});
	}

	function startFeature() {
		if (getHashParameters().get("tab") !== "vault") return;

		showContainer();
	}

	async function showContainer(requireSaving = false) {
		await requireElement(".vault-cont .wvalue");

		const { content } = createContainer("Vault Sharing", { previousElement: document.find(".vault-wrap"), class: "mt10" });

		const total = getValue(document.find(".vault-cont .wvalue"));
		let yourShare = localdata.vault.user.current;
		let partnerShare = localdata.vault.partner.current;

		if (localdata.vault.initialized) {
			const lastTransaction = new Date(localdata.vault.lastTransaction);
			const username = document.find("[class*='menu-info-row___'] a").innerText;

			for (const transaction of document.findAll("ul.vault-trans-list > li:not(.title)")) {
				const [day, month, year] = transaction.find(".date .transaction-date").innerText.split("/");
				const time = transaction.find(".date .transaction-time").innerText;
				const date = new Date(`${MONTHS[parseInt(month) - 1]} ${day}, ${year} ${time}`);

				if (date <= lastTransaction) break;

				const user = transaction.find("li.user .user.name span").getAttribute("title").includes(username);
				const amount = parseInt(transaction.find(".amount").innerText.replace(/[$,]/g, ""));
				const type = transaction.find("li.type").innerText.includes("Deposit") ? "deposit" : "withdraw";

				if (user) yourShare = type === "withdraw" ? yourShare - amount : yourShare + amount;
				else partnerShare = type === "withdraw" ? partnerShare - amount : partnerShare + amount;

				requireSaving = true;
			}
		}

		const inputYour = document.newElement({ type: "input", value: formatNumber(yourShare), attributes: { type: "text" } });
		const inputPartner = document.newElement({ type: "input", value: formatNumber(partnerShare), attributes: { type: "text" } });
		const buttonSave = document.newElement({ type: "button", class: "tt-btn", text: "Save" });

		inputYour.addEventListener("keyup", (event) => {
			let value = getValue(event.target);
			let valueOther = total - value;

			if (value > total) {
				value = total;
				valueOther = 0;
			}

			inputYour.value = formatNumber(value);
			inputPartner.value = formatNumber(valueOther);
		});
		inputPartner.addEventListener("keyup", (event) => {
			let value = getValue(event.target);
			let valueOther = total - value;

			if (value > total) {
				value = total;
				valueOther = 0;
			}

			inputYour.value = formatNumber(valueOther);
			inputPartner.value = formatNumber(value);
		});

		buttonSave.addEventListener("click", async () => {
			buttonSave.innerText = "";
			buttonSave.setAttribute("disabled", "");
			showLoadingPlaceholder(buttonSave, true);

			await saveVault();

			buttonSave.innerText = "Saved!";
			showLoadingPlaceholder(buttonSave, false);

			setTimeout(() => {
				buttonSave.innerText = "Save";
				buttonSave.removeAttribute("disabled");
			}, TO_MILLIS.SECONDS);
		});

		const shareYour = document.newElement({
			type: "div",
			class: "share",
			children: [document.newElement({ type: "div", text: "Your share:" }), inputYour],
		});
		const sharePartner = document.newElement({
			type: "div",
			class: "share",
			children: [document.newElement({ type: "div", text: "Partner's share:" }), inputPartner],
		});
		if (!localdata.vault.initialized) {
			content.appendChild(
				document.newElement({ type: "div", class: "initialize-notice", text: "Please enter the amount of money owned by either user." })
			);
			content.appendChild(
				document.newElement({
					type: "div",
					class: "share-wrapper",
					children: [shareYour, document.newElement({ type: "div", class: "initialize-divider", text: "- OR -" }), sharePartner],
				})
			);
		} else {
			content.appendChild(document.newElement({ type: "div", class: "share-wrapper", children: [shareYour, sharePartner] }));
		}
		content.appendChild(document.newElement({ type: "div", class: "save-wrapper", children: [buttonSave] }));

		document.find("input[value=WITHDRAW]").addEventListener("click", async (event) => {
			if (event.target.parentElement.parentElement.classList.contains("disable")) return;

			await requireElement("#vaultSharing", { invert: true });

			await showContainer();
		});
		document.find("input[value=DEPOSIT]").addEventListener("click", async (event) => {
			if (event.target.parentElement.parentElement.classList.contains("disable")) return;

			await requireElement("#vaultSharing", { invert: true });

			await showContainer();
		});

		if (requireSaving) await saveVault();

		async function saveVault() {
			const lastTransaction = getLastTransaction();

			const total = getValue(document.find(".vault-cont .wvalue"));
			const yourShare = getValue(inputYour);
			const partnerShare = getValue(inputPartner);

			await ttStorage.change({
				localdata: {
					vault: {
						initialized: true,
						lastTransaction: lastTransaction.toString(),
						total: total,
						user: {
							initial: localdata.vault.initialized ? localdata.vault.user.initial : yourShare,
							current: yourShare,
						},
						partner: {
							initial: localdata.vault.initialized ? localdata.vault.partner.initial : partnerShare,
							current: partnerShare,
						},
					},
				},
			});
		}

		function getValue(input) {
			let value;
			if (input instanceof HTMLInputElement) value = input.value;
			else value = input.innerText;

			return parseInt(value.replace(/[$,]/g, "")) || 0;
		}

		function getLastTransaction() {
			const [day, month, year] = document.find(".vault-trans-list > li:not(.title) .date .transaction-date").innerText.split("/");
			const time = document.find(".vault-trans-list > li:not(.title) .date .transaction-time").innerText;

			return new Date(`${MONTHS[parseInt(month) - 1]} ${day}, ${year} ${time}`);
		}
	}

	function dispose() {
		removeContainer("Vault Sharing");
	}
})();
