window.addEventListener('load', (event) => {
    console.log("TT - Missions");

    chrome.storage.local.get(["settings", "itemlist"], function(data){
        const settings = data.settings;
        const itemlist = data.itemlist.items;
        const slides = document.querySelectorAll(".rewards-slider .slide");
        // const rewards = document.querySelectorAll(".slide .rewards-list li");
        const userPoints = parseInt(document.querySelector(".total-mission-points").innerText.replace(",", ""));
        const show_missions = settings.pages.missions.show

        if(!show_missions)
            return;
        setTimeout(function(){
            for(let slide of slides){
                let rewards = slide.querySelectorAll(".rewards-list li");
                for (let reward of rewards) {
                    let data = JSON.parse(reward.getAttribute("data-ammo-info"));
                    let quantity = parseInt(data["amount"]);
                    let points = parseInt(data["points"]);
                    let id = parseInt(data["image"]);
                    let counter = parseInt(data["id"]);
        
                    let act_wrap = reward.querySelector(`.act-wrap`);
                    act_wrap.style.boxSizing = "border-box";
                    act_wrap.style.borderColor = "black";
                    act_wrap.style.borderImage = "none";
        
                    // MAKE THE PRICE RED IF NOT ENOUGH POINTS
                    if (userPoints < points) {
                        act_wrap.style.borderTop = "1px solid red";
                    } else {
                        act_wrap.style.borderTop = "1px solid #2ef42e";
                    }
        
                    if (!id) {
                        continue
                    }
        
                    displayMissionPrice(reward, id, quantity, points, itemlist);
                }
            }
        }, 1000);
        
    });
});

function displayMissionPrice(reward, id, quantity, points, itemlist){
	let itemValue = itemlist[id]["market_value"];

	const container = document.querySelector(`li[data-ammo-info='${reward.getAttribute("data-ammo-info")}'] .act-wrap`);
	const lastElement = document.querySelector(`li[data-ammo-info='${reward.getAttribute("data-ammo-info")}'] .act-wrap .actions`)
	const image = document.querySelector(`li[data-ammo-info='${reward.getAttribute("data-ammo-info")}'] .img-wrap`);

	// MAKE CONTAINERS BIGGER
	reward.style.height = "160px";

	let div = document.createElement("div");
	let oneItem = document.createElement("div");
	let pointValue = document.createElement("div");
	let totalValue = itemValue*quantity;

	// ONE ITEM PRICE ON IMAGE
	oneItem.innerText = "$" + String(numberWithCommas(itemValue));
	oneItem.style.color = "#35f4be";
	oneItem.style.position = "absolute";
	oneItem.style.left = "20px";
	oneItem.style.bottom = "5px";
	oneItem.style.fontsize = "10px";

	image.appendChild(oneItem);

	// LOWER CONTAINER
	let allItems = document.createElement("div");
	allItems.innerHTML = `Total value: <span style="color: #678c00">$${String(numberWithCommas(totalValue))}</span>`;
	allItems.style.textAlign = "left";
	allItems.style.paddingLeft = "5px";
	allItems.style.paddingTop = "50px";

	pointValue.innerHTML = `Point value: <span style="color: #678c00">$${numberWithCommas((totalValue/points).toFixed(0))}</span>`;
	pointValue.style.textAlign = "left";
	pointValue.style.paddingLeft = "5px";


	div.appendChild(allItems)
	div.appendChild(pointValue)
	container.insertBefore(div, lastElement);
}