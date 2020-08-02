requireDatabase().then(function () {
    console.log("TT - Newspaper | Bounties");

    addXHRListener((event) => {
        const {page, xhr} = event.detail;
        if (page !== "bounties") return;

        const params = new URLSearchParams(xhr.requestBody);
        if (params.get("step") !== "mainBounties") return;

        bountiesLoaded().then(() => {
            addFilter(filters);

            if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.bounties)
                showStatsEstimates().then(() => console.log("Estimated stats."));
        });
    });

    bountiesLoaded().then(() => {
        addFilter(filters);

        if (settings.scripts.stats_estimate.global && settings.scripts.stats_estimate.bounties)
            showStatsEstimates().then(() => console.log("Estimated stats."));
    });
});

function bountiesLoaded() {
    return new Promise((resolve) => {
        let checker = setInterval(function () {
            if (doc.find(".bounties-list > li > ul > li .reward")) {
                resolve(true);
                return clearInterval(checker);
            }
        });
    });
}

function addFilter(filters) {
    try {
        if (doc.find("#ttBountyContainer")) return;

        let container = content.newContainer("Bounty Filter", {
            header_only: true,
            id: "ttBountyContainer",
            next_element: doc.find(".bounties-total").nextElementSibling
        });

        let option_1 = doc.new({type: "div", class: "tt-checkbox-wrap in-title"});
        let checkbox_1 = doc.new({type: "input", attributes: {type: "checkbox"}});
        let text_1 = doc.new({type: "div", text: "Hide unavailable"});

        if (filters.bounties.hide_unavailable) {
            checkbox_1.checked = true;
        }

        option_1.appendChild(checkbox_1);
        option_1.appendChild(text_1);

        let option_2 = doc.new({type: "div", class: "tt-input-wrap in-title"});
        let text_2 = doc.new({type: "div", text: "Max level"});
        let input_2 = doc.new({type: "input"});

        if (filters.bounties.max_level) {
            input_2.value = filters.bounties.max_level;
        }

        option_2.appendChild(text_2);
        option_2.appendChild(input_2);

        container.find(".tt-title .tt-options").appendChild(option_1);
        container.find(".tt-title .tt-options").appendChild(option_2);

        checkbox_1.onclick = filter;
        input_2.onkeyup = filter;

        filter();

        function filter() {
            let hide_unavailable = checkbox_1.checked;
            let max_level = input_2.value;

            for (let person of doc.findAll(".bounties-list>li:not(.clear)")) {
                hideRow(person, false);

                // Unavailable
                if (hide_unavailable && person.find(".status .t-red")) {
                    hideRow(person, true);
                    continue;
                }

                // Max level
                let person_level = parseInt(person.find(".level").innerText.replace("Level:", ""));
                if (max_level && person_level > parseInt(max_level)) {
                    hideRow(person, true);
                }
            }

            ttStorage.change({
                "filters": {
                    "bounties": {
                        "hide_unavailable": hide_unavailable,
                        "max_level": parseInt(max_level)
                    }
                }
            });

            function hideRow(row, hide) {
                const userinfoRow = row.nextElementSibling;
                if (hide) {
                    row.classList.add("filter-hidden");

                    if (userinfoRow && userinfoRow.classList && userinfoRow.classList.contains("tt-userinfo-container"))
                        row.nextElementSibling.classList.add("filter-hidden");
                } else {
                    row.classList.remove("filter-hidden");

                    if (userinfoRow && userinfoRow.classList && userinfoRow.classList.contains("tt-userinfo-container"))
                        row.nextElementSibling.classList.remove("filter-hidden");
                }
            }
        }
    } catch (e) {
        console.log("DKK error 2", e)
    }
}

function showStatsEstimates() {
    console.log("DKK showStatsEstimates")
    return new Promise((resolve) => {
        try {
            let estimateQueue = [];

            for (let person of doc.findAll(".bounties-list > li:not(.clear)")) {
                const userId = person.find(".head .target a").getAttribute("href").match(/profiles\.php\?XID=([0-9]*)/i)[1];

                const container = doc.new({type: "li", class: "tt-userinfo-container"});
                person.parentElement.insertBefore(container, person.nextElementSibling);

                const row = doc.new({type: "section", class: "tt-userinfo-row"});
                container.appendChild(row);

                if (cache && cache.battleStatsEstimate && cache.battleStatsEstimate[userId]) {
                    row.appendChild(doc.new({
                        type: "span",
                        text: `Stat Estimate: ${cache.battleStatsEstimate[userId].data}`,
                    }));
                } else {
                    loadingPlaceholder(row, true);
                    estimateQueue.push([userId, row]);
                }
            }

            setTimeout(async () => {
                for (let [userId, row] of estimateQueue) {
                    const result = handleTornProfileData(await fetchApi(`https://api.torn.com/user/${userId}?selections=profile,personalstats,crimes`, api_key));

                    if (!result.error) {
                        const timestamp = new Date().getTime();

                        ttStorage.change({
                            "cache": {
                                "battleStatsEstimate": {
                                    [userId]: {
                                        timestamp,
                                        ttl: result.battleStatsEstimate === RANK_TRIGGERS.stats[RANK_TRIGGERS.stats.length - -1] ? TO_MILLIS.DAYS * 31 : TO_MILLIS.DAYS,
                                        data: result.battleStatsEstimate,
                                    }
                                },
                            }
                        });

                        row.appendChild(doc.new({
                            type: "span",
                            text: `Stat Estimate: ${result.battleStatsEstimate}`,
                        }));
                    } else {
                        row.appendChild(doc.new({
                            type: "span",
                            class: "tt-userinfo-message",
                            text: result.error,
                            attributes: {color: "error"},
                        }));
                    }
                    loadingPlaceholder(row, false);

                    await sleep(TO_MILLIS.SECONDS * 1.5);
                }

                resolve();
            });
        } catch (e) {
            console.error("DKK erorr", e)
        }
    });
}
