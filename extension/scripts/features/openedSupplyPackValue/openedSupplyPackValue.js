"use strict";

(async () => {
    const page = getPage();
    
    featureManager.registerFeature(
        "Opened supply pack total value",
        "items",
        () => settings.pages.items.openedSupplyPackValue,
        addListener,
        undefined,
        undefined,
        undefined,
        {storage: ["settings.pages.items.openedSupplyPackValue"]}
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
            
            addXHRListener(async ({ detail: { page, xhr, json } }) => {
                if (page !== "item") return;

                const params = new URLSearchParams(xhr.requestBody);
                if (params.get("action") === "use" && SUPPLY_PACK_ITEMS.includes(params.get("id").getNumber())) {
                    reqXID = (await requireElement('.pack-open-msg input[type="hidden"]')).value;
                } else if (reqXID === 0) return;

                console.log(reqXID)
                if (params.get("XID") === reqXID) {
                    const openedItems = json.items.itemAppear;
                    
                    let totalOpenedValue = 0;

                    openedItems.forEach(item => {
                        if (item.isMoney === true) {
                            totalOpenedValue += item.moneyGain.substring(1).getNumber();
                        } else {
                            totalOpenedValue += torndata.items[item.itemID].market_value;
                        }
                    });

                    await showTotalValue(totalOpenedValue);
                }
            });
        }
    };

    async function showTotalValue(totalOpenedValue) {
        await sleep(2.5 * TO_MILLIS.SECONDS);
        const greenMsg = await requireElement('.pack-open-msg > form p');
        
        console.log(greenMsg)

        if (!document.getElementById("openedValueText"));
            greenMsg.insertAdjacentElement('afterend', document.newElement({id: "openedValueText", type: "strong", class: "t-green bold animated-fadeIn", text: `Total value: $${totalOpenedValue}`}));
    }
})();