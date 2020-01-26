export function initialize(){
	chrome.storage.local.get(["update", "settings"], function(data){
		const update = data["update"];
		const settings = data["settings"];
		
		if(update){
			const headers = document.querySelectorAll(".header___30pTh");
			const version = chrome.runtime.getManifest().version;
			
			var container;
			for(let header of headers){
				if(header.innerText === "Areas"){
					container = header.parentElement.children[1];
				}
			}
			const nextElement = document.querySelector("#nav-home");

			let div = document.createElement("div");
			let innerDiv = document.createElement("div");
			let link = document.createElement("a");
			let span = document.createElement("span");
			let icon = document.createElement("div");

			div.classList.add("area-desktop___29MUo");
			innerDiv.classList.add("area-row___51NLj");
			innerDiv.style.backgroundColor = "#8eda53b0";

			link.addEventListener("click", function(){
				chrome.runtime.sendMessage({"action": "openOptionsPage"});
			});

			span.innerHTML = `Torn<span style="font-weight:600;margin:0;line-height:7px;">Tools</span>  v${version}`;
			span.setAttribute("style", `
				height: 20px;
				line-height: 20px;
			`);

			const src = chrome.extension.getURL("images/icon50.png");
			icon.setAttribute("style", `
				width: 15px;
				height: 15px;
				background-size: cover;
				background-image: url(${src});
				margin-top: 2px;
				margin-left: 10px;
				margin-right: 6px;
				float: left;
			`)

			link.appendChild(icon)
			link.appendChild(span);
			innerDiv.appendChild(link);
			div.appendChild(innerDiv);
			container.insertBefore(div, nextElement);
		}

		// functions
		capitalize();

		if(settings["other"]["factionchannels"]){
			setUpChats();
		}
	});
}

function setUpChats(){
	createChannels();

	// update channels
	let a = setInterval(function(){
		moveMessages();
	}, 500);

	// text input
	const textarea = document.querySelector(".faction_2T9gm .chat-box-input_1SBQR textarea");
	textarea.addEventListener("keydown", function(e){
		if(e.keyCode === 13){ // 13 - Enter
			if(document.querySelector("#tt-fac-channel-2").style.display === "block"){
				this.value = "@ch2 " + this.value;
			}
		}
	});

	function moveMessages(){
		const messages = document.querySelectorAll("#tt-fac-channel-1 .message_oP8oM");
		for(let message of messages){
			let text = message.querySelector("span").innerText;
			if(text.indexOf("@ch2") === 0){
				let channel = document.querySelector(`#tt-fac-channel-2`);
				message.querySelector("span").innerText = text.replace("@ch2", "").trim();
				channel.appendChild(message);
			}
		}

		// move time message
		let time_msg = document.querySelector(".overview_1MoPG div[style='padding-left: 10px; line-height: 18px; color: rgb(102, 102, 102); margin: 0px;']");
		time_msg.parentElement.appendChild(time_msg);
	}

	function scrollBottom(_this){
	    _this.scrollTop = _this.scrollHeight;
	}

	function createChannels(){
		const faction_chat = document.querySelector(".chat-box-wrap_20_R_ .faction_2T9gm");
		const title = faction_chat.querySelector(".chat-box-title_out6E");
		const close_button = title.querySelector("div[class='close_2tJH_']");

			// STYLE
			let head = document.head || document.getElementsByTagName('head')[0];
			let style = document.createElement('style');
			let css = `
				.channel-container {
					margin-left: 5px;
					color: #b9b6b6;
				}

				.channel {
					padding-left: 3px;
					padding-right: 3px;
				}

				.channel:hover {
					color: white;
				}

				.channel.active {
					color: white;
				}

			`
			style.type = "text/css";
			if (style.styleSheet){
			  // This is required for IE8 and below.
			  style.styleSheet.cssText = css;
			} else {
			  style.appendChild(document.createTextNode(css));
			}

			head.appendChild(style);
		
		let span = document.createElement("span");
		span.setAttribute("class", "name_3A6VH channel-container");
		
		let channel_1_button = document.createElement("span");
		channel_1_button.innerText = "1";
		channel_1_button.classList.add("channel");
		channel_1_button.classList.add("active");
		
		let channel_2_button = document.createElement("span");
		channel_2_button.innerText = "2";
		channel_2_button.classList.add("channel");

		span.appendChild(channel_1_button);
		span.appendChild(channel_2_button);

		title.appendChild(span);

		channel_1_button.addEventListener("click", function(e){
			e.stopPropagation();
			for(let channel of document.querySelectorAll(".channel")){
				channel.classList.remove("active");
			}
			for(let channel of document.querySelectorAll(".tt-fac-channel")){
				channel.style.display = "none";
			}
			this.classList.add("active");

			let channel_1_view = document.querySelector("#tt-fac-channel-1");
			channel_1_view.style.display = "block";
			scrollBottom(channel_1_view.parentElement);

		});

		channel_2_button.addEventListener("click", function(e){
			e.stopPropagation();
			for(let channel of document.querySelectorAll(".channel")){
				channel.classList.remove("active");
			}
			for(let channel of document.querySelectorAll(".tt-fac-channel")){
				channel.style.display = "none";
			}
			this.classList.add("active");

			let channel_2_view = document.querySelector("#tt-fac-channel-2");
			channel_2_view.style.display = "block";
			scrollBottom(channel_2_view.parentElement);
		});


		// MAKE CHANNEL OVERVIEWS
		const parent = title.parentElement.parentElement;
		const viewport = parent.querySelector(".viewport_1F0WI");

		const overview_1 = viewport.querySelector(".overview_1MoPG");
		overview_1.id = "tt-fac-channel-1";
		overview_1.classList.add("tt-fac-channel");

		let overview_2 = document.createElement("div");
		// overview_2.setAttribute("class", "overview_1MoPG");
		overview_2.id = "tt-fac-channel-2";
		overview_2.classList.add("tt-fac-channel");
		overview_2.style.display = "none";
		overview_2.style.paddingTop = "5px";

		viewport.appendChild(overview_2);
	}
}

export async function get_api(http, api_key) {
	const response = await fetch(http + "&key=" + api_key)
	const result = await response.json()

	if(result.error){
		switch (result.error["code"]){
			case 9:
				chrome.storage.local.set({"api_system_online": false}, function(){
					console.log("API SYSTEM OFFLINE");
				});
				break;
			default:
				break;
		}
	} else {
		chrome.storage.local.get(["api_system_online"], function(data){
			if(data["api_system_online"] === false){
				chrome.storage.local.set({"api_system_online": true}, function(){
					console.log("API SYSTEM BACK ONLINE!");
				});
			}
		});
	}

	return result;
}

export const numberWithCommas = (x) => {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function compare(a,b) {
  if (a.cost < b.cost)
    return -1;
  if (a.cost > b.cost)
    return 1;
  return 0;
}

export function getLowest(lists){
	var lowest;

	for(let list in lists){
		for(let id in lists[list]){
			let price = parseInt(lists[list][id]["cost"]);

			if(!lowest){
				lowest = price;
			} else if(price < lowest){
				lowest = price
			}
		}
	}
	return lowest;
}

export function days(x){
	return Math.floor(x/60/60/24); // seconds, minutes, hours
}

export function hours(x){
	return Math.floor(x/60/60); // seconds, minutes
}

export function countPerks(perks){
	let total = 0;

	for(let perklist of perks){
		for(let perk of perklist){
			total++;
		}
	}

	return total
}

export function displayNetworth(x){
	const container = document.querySelector("#item4741013");
	const innerBox = container.children[1].children[0].children[0];
	const last = innerBox.children[innerBox.children.length-1];

	last.removeAttribute("class");

	let li = document.createElement("li");
	let spanL = document.createElement("span");
	let spanName = document.createElement("span");
	let spanR = document.createElement("span");
	let i = document.createElement("i");

	li.classList.add("last");
	li.style.backgroundColor = "#65c90069";
	spanL.classList.add("divider");
	spanR.classList.add("desc");
	i.classList.add("networth-info-icon");
	i.setAttribute("title", "Torn Tools: Your networth is fetched from Torn's API which may have a small delay. It is fetched every 1 minute.");
	spanName.style.backgroundColor = "rgba(0,0,0,0)";

	spanName.innerText = "Networth"
	spanR.innerText = "$" + String(numberWithCommas(x));
	spanR.style.paddingLeft = "12px";
	
	spanL.appendChild(spanName);
	spanR.appendChild(i);
	li.appendChild(spanL);
	li.appendChild(spanR);
	innerBox.appendChild(li);
}

export function cleanNr(x){
	return String(parseInt(x).toFixed())
}

export function capitalize(){
	String.prototype.capitalize = function () {
	  	return this.replace(/^./, function (match) {
	    	return match.toUpperCase();
	  	});
	};
}