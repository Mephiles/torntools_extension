"use strict";

(async () => {
    const page = getPage();
    
    const feature = featureManager.registerFeature(
        "Opened supply pack total value",
        "items",
        () => settings.pages.items.openedSupplyPackValue,
        addListener,
        undefined,
        removeTotalValueElement,
        undefined,
        {storage: ["settings.pages.items.openedSupplyPackValue"]},
        () => {
			if (!hasAPIData()) return "No API access.";
        }
    );

    const SUPPLY_PACK_ITEMS = [
        1035,
        1118,
        1119,
        1120,
        1121,
        1122,
        1080,
        364,
        365,
        1079,
        1083,
        1081,
        1117,
        1115,
        370,
        1114,
        1112,
        1057,
        588,
        1293,
        815,
        1113,
        1078,
        817,
        818,
        1298,
        1116,
        1082,
    ];

    function addListener() {
        if (page === "item") {
            let reqXID = 0;
            let itemID = 0;
            
            addXHRListener(async ({ detail: { page, xhr, json } }) => {
                if (!feature.enabled()) return;
                if (page !== "item") return;

                const params = new URLSearchParams(xhr.requestBody);
                if (params.get("action") !== "use" && params.get("step") !== "useItem") return;

                itemID = params.get("id")?.getNumber() ?? itemID;
                if (isXIDRequestSupplyPack(itemID)) {
                    reqXID = (await requireElement(`[data-item="${itemID}"] .pack-open-msg input[type="hidden"]`)).value;
                }

                if (params.get("XID") === reqXID || isDrugPackUseRequest(params)) {
                    const totalOpenedValue = json?.items?.itemAppear?.reduce(
                        (totalValue, item) => 
                        totalValue += item.isMoney
                                        ? item.moneyGain.substring(1).getNumber()
                                        : torndata.items[item.ID].market_value * item.qty, 0);

                        await showTotalValue(totalOpenedValue, itemID);
                }
            });
        }
    };

    async function showTotalValue(totalOpenedValue, itemID) {
        await sleep(0.1 * TO_MILLIS.SECONDS);
        const greenMsg = await requireElement(`[data-item="${itemID}"] .cont-wrap form p`);
        
        removeTotalValueElement;

        const openedValueTextElement = document.newElement({id: "openedValueText", type: "strong", text: `Total value: ${formatNumber(totalOpenedValue, { currency: true })}`});
        openedValueTextElement.insertAdjacentElement('afterbegin', document.createElement('br'));

        greenMsg.insertAdjacentElement('beforeend', openedValueTextElement);
    }

    function isXIDRequestSupplyPack(itemID) {
        return SUPPLY_PACK_ITEMS.includes(itemID) && !isDrugPack(itemID);
    }

    function isDrugPack(itemID) {
        return itemID === 370;
    }

    function isDrugPackUseRequest(params) {
        return params.get("item") == 370 || params.get("itemID") == 370;
    }

    function removeTotalValueElement() {
        document.getElementById("openedValueText")?.remove();
    }
})();