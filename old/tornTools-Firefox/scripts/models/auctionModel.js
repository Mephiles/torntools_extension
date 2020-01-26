export function openAllAuctionTabs(){
	// LOAD ALL ITEMS
	const tabs = document.querySelectorAll("ul.tabs.tabs-order.t5.dark.clearfix.ui-tabs-nav.ui-helper-reset.ui-helper-clearfix.ui-widget-header.ui-corner-all li a");
	for(let tab of tabs){
		tab.click();
	}
	tabs[0].click(); // RETURN TO FIRST

	const listings = document.querySelectorAll(".items-list.t-blue-cont.h li");
	return listings.length;
}

export function setUpAuctionWindow(){
	const main = document.querySelector(".auction-market-main-cont")
	const firstEl = document.querySelector(".after-msg-show")
	let container = document.createElement("div");
	let header = document.createElement("div");
	let clear = document.createElement("div");

	container.style.height = "180px";
	container.style.backgroundColor = "#F2F2F2";
	container.style.marginBottom = "10px";
	container.style.borderRadius = "8px";
	container.id = "ttListings"
	
	header.classList.add("title-brown");
	header.classList.add("top-round");
	header.innerText = "Your listings";
	header.style.color = "#36d136";

	clear.classList.add("clear");

	container.appendChild(header);
	main.insertBefore(clear, firstEl)
	main.insertBefore(container, clear);
}

export function addAuctionListing(item){
	const container = document.querySelector("#ttListings");
	let div = document.createElement("div");
	let title = document.createElement("div");
	let high_bid = document.createElement("div");
	let time = document.createElement("div");
	let hr = document.createElement("hr");

	div.style.width = "20%";
	div.style.height = "120px";
	div.style.border = "0.5px solid lightgrey";
	div.style.borderTopLeftRadius = "10px";
	div.style.borderTopRightRadius = "10px";
	div.style.margin = "2.5%";
	div.style.float = "left";

	let bid = item.children[3].innerText.replace("Top bid:", "").replace(/\r?\n|\r/g, "").replace(" ", "");
	high_bid.innerHTML = "Highest bid: <br><span style='color: #678c00'>" + String(this.numberWithCommas(bid)) + "</span>";
	high_bid.style.marginLeft = "5px";
	high_bid.style.marginTop = "7px";
	high_bid.style.marginBottom = "7px";
	// high_bid.style.paddingBottom = "23px";
	high_bid.style.fontSize = "17px";
	high_bid.style.fontWeight = "600";

	let timeLeft = item.children[5].children[1].children[0].innerText.replace(/\r?\n|\r/g, "").replace(" ", "");
	time.innerText = "Time left: " + String(timeLeft);
	time.style.marginLeft = "5px";
	time.style.marginTop = "7px";
	time.style.fontSize = "17px";
	time.style.fontWeight = "600";

	if(timeLeft.indexOf("d") === -1){
		time.style.color = "red";
	} else {
		time.style.color = "black";	
	}
	
	title.classList.add("top-round");
	title.innerText = item.children[0].children[1].children[0].innerText;
	title.classList.add("title-gray");

	div.appendChild(title);
	div.appendChild(high_bid);
	div.appendChild(hr);
	div.appendChild(time);
	container.appendChild(div);
}