const local_storage = {
	get: function(key, callback){
		let promise = new Promise(function(resolve, reject){
			if(Array.isArray(key)){
				let arr = [];
				chrome.storage.local.get(key, function(data){
					for(let item of key){
						arr.push(data[item]);
					}
					resolve(arr);
				});
			} else if(key == null){
				chrome.storage.local.get(null, function(data){
					resolve(data);
				});
			} else {
				chrome.storage.local.get([key], function(data){
					resolve(data[key]);
				});
			}
		});

		promise.then(function(data){
			callback(data);
		});
	},
	set: function(object, callback){
		chrome.storage.local.set(object, function(){
			callback ? callback() : null;
		});
	},
	change: function(key, keys_to_change, callback){
		chrome.storage.local.get([key], function(data){
			for(let key_to_change of Object.keys(keys_to_change)){
                if(!Array.isArray(keys_to_change[key_to_change]) && typeof keys_to_change[key_to_change] == "object"){
                    data[key][key_to_change] = objectRecursive(data[key][key_to_change], keys_to_change[key_to_change]);
                } else
                    data[key][key_to_change] = keys_to_change[key_to_change];
			}

			chrome.storage.local.set({[key]: data[key]}, function(){
				callback ? callback() : null;
			});
        });
        
        function objectRecursive(key, keys_to_change){
            for(let key_to_change of Object.keys(keys_to_change)){
                if(!Array.isArray(keys_to_change[key_to_change]) && typeof keys_to_change[key_to_change] == "object"){
                    key[key_to_change] = objectRecursive(key[key_to_change], keys_to_change[key_to_change]);
                } else {
                    key[key_to_change] = keys_to_change[key_to_change];
                }
            }
            return key;
        }
	}
}

const doc = document;

Document.prototype.find = function(type){
    if(type.indexOf("=") > -1){
        let key = type.split("=")[0];
        let value = type.split("=")[1];

        for(let element of document.querySelectorAll(key)){
            if(element.innerText == value){
                return element;
            }
        }
    }
    return this.querySelector(type);
}
Element.prototype.find = function(type){
    if(type.indexOf("=") > -1){
        let key = type.split("=")[0];
        let value = type.split("=")[1];

        for(let element of document.querySelectorAll(key)){
            if(element.innerText == value){
                return element;
            }
        }
    }
    return this.querySelector(type);
}

Document.prototype.findAll = function(type){
    return this.querySelectorAll(type);
}
Element.prototype.findAll = function(type){
    return this.querySelectorAll(type);
}

Document.prototype.new = function(type){
    return this.createElement(type);
}
Element.prototype.new = function(type){
    return this.createElement(type);
}

Document.prototype.setClass = function(class_name){
    return this.setAttribute("class", class_name);
}
Element.prototype.setClass = function(class_name){
    return this.setAttribute("class", class_name);
}

const navbar = {
    new_section: function(name, attributes={}){
        let defaults = {
            next_element: undefined,
            next_element_heading: undefined
        }
        attr = {...defaults, ...attributes};

        // process
        let parent = doc.find("#sidebarroot");
        let new_div = createNewBlock(name);
        let next_div = attr.next_element || findSection(parent, attr.next_element_heading);

        if(!next_div)
            parent.appendChild(new_div);
        else
            next_div.parentElement.insertBefore(new_div, next_div);

        return new_div;

        function createNewBlock(name){
            let sidebar_block = doc.new("div");
                sidebar_block.setClass("sidebar-block___1Cqc2 tt-nav-section");
            let content = doc.new("div");
                content.setClass("content___kMC8x");
            let div1 = doc.new("div");
                div1.setClass("areas___2pu_3");
            let toggle_block = doc.new("div");
                toggle_block.setClass("toggle-block___13zU2");
            let header = doc.new("div");
                header.setClass("title-green");
                header.innerText = name;
            let toggle_content = doc.new("div");
                toggle_content.setClass("toggle-content___3XKOC");
            
            toggle_block.appendChild(header);
            toggle_block.appendChild(toggle_content);
            div1.appendChild(toggle_block);
            content.appendChild(div1);
            sidebar_block.appendChild(content);
            
            return sidebar_block;
        }

        function findSection(parent, heading){
            for(let head of parent.findAll("h2")){
                if(head.innerText == heading){
                    return head.parentElement.parentElement.parentElement;
                }
            }
            return undefined;
        }
    },
    new_cell: function(text, attributes={}){
        let defaults = {
            parent_heading: undefined,
            parent_element: undefined,
            first: undefined,
            style: undefined,
            href: undefined
        }
        attr = {...defaults, ...attributes};

        // process
        let sidebar = doc.find("#sidebarroot");

        if(!attr.parent_element && attr.parent_heading){
            attr.parent_element = (function(){
                for(let el of sidebar.findAll("h2")){
                    if(el.firstChild.nodeValue == attr.parent_heading){
                        return el.parentElement;
                    }
                }
                return undefined;
            })();
        }

        let toggle_content = attr.parent_element.find(".toggle-content___3XKOC");
        let new_cell_block = createNewCellBlock(text, attr.href, attr.style, attr.target);

        if(attr.first)
            toggle_content.insertBefore(new_cell_block, toggle_content.firstElementChild);
        else
            toggle_content.appendChild(new_cell_block);

        return new_cell_block;

        function createNewCellBlock(text, href, style){
            let div = doc.new("div");
                div.setClass("area-desktop___2YU-q");
            let inner_div = doc.new("div");
                inner_div.setClass("area-row___34mEZ");
            let a = doc.new("a");
                a.setClass("desktopLink___2dcWC");
                href == "#" ? inner_div.style.cursor = "default" : a.setAttribute("href", href);
                a.setAttribute("target", "_blank");
                a.setAttribute("style", style);
                a.style.minHeight = "24px";
                a.style.lineHeight = "24px";
            let span = doc.new("span");
                span.innerText = text;

            a.appendChild(span);
            inner_div.appendChild(a);
            div.appendChild(inner_div);
            
            return div;
        }
    }
}

const info_box = {
    new_row : function(key, value, attributes={}){
        let defaults = {
            parent_heading: undefined,
            parent_element: undefined,
            first: undefined
        }
        attr = {...defaults, ...attributes};

        // process
        let content = doc.find(".container .content");

        if(!attr.parent_element && attr.parent_heading){
            attr.parent_element = (function(){
                for(let el of content.findAll("h5")){
                    if(el.innerText == attr.parent_heading)
                        return el.parentElement.parentElement;
                }
                return undefined;
            })();
        } else
            return undefined;


        let list = attr.parent_element.find(".info-cont-wrap");
            !attr.first ? list.find("li.last").classList.remove("last") : null;

        let new_row;
        if(attr.heading){
            new_row = createNewHeading(`${key} - ${value}`);
        } else {
            new_row = createNewRow(key, value, attr.style, attr.value_style);
        }

        if(attr.first)
            list.insertBefore(new_row, list.firstElementChild);
        else
            list.appendChild(new_row);

        return new_row;

        function createNewHeading(text){
            let li = doc.new("li");
                !attr.first ? li.setClass("last") : null;
                li.classList.add("tt-box-section-heading");
                li.classList.add("title-green");
                li.innerText = text;
            return li;
        }

        function createNewRow(key, value, style, value_style){
            let li = doc.new("li");
                !attr.first ? li.setClass("last") : null;
                style? li.setAttribute("style", style):null;
            let span_left = doc.new("span");
                span_left.setClass("divider");
            let span_left_inner = doc.new("span");
                span_left_inner.innerText = key;
                span_left_inner.style.backgroundColor = "transparent";

            let span_right = doc.new("span");
                span_right.setClass("desc");
                value_style? span_right.setAttribute("style", value_style) : null;
            let span_right_inner = doc.new("span");
                span_right_inner.innerText = value;
                span_right_inner.style.paddingLeft = "3px";

            span_left.appendChild(span_left_inner);
            span_right.appendChild(span_right_inner);
            li.appendChild(span_left);
            li.appendChild(span_right);
            
            return li;
        }
    }
}

const content = {
    new_container: function(name, attributes={}){
        let defaults = {
            first: undefined,
            id: undefined,
            next_element_heading: undefined,
            next_element: undefined
        }
        attr = {...defaults, ...attributes};

        // process           
        if(attr.next_element_heading)
            attr.next_element = content.findContainer(attr.next_element_heading);

        let parent_element = attr.next_element ? attr.next_element.parentElement : doc.find(".content-wrapper"); 
        let new_div = createNewContainer(name, attr.id);

        if(attr.first)
            parent_element.insertBefore(new_div, parent_element.find(".content-title").nextElementSibling);
        else if(attr.next_element)
            parent_element.insertBefore(new_div, attr.next_element);
        else
            parent_element.appendChild(new_div);

        return new_div;

        function createNewContainer(name, id){
            let div = doc.new("div");
                id ? div.id = id : null;
            let heading = doc.new("div");
                heading.setClass("title-green top-round m-top10");
                heading.innerText = name;
            let content = doc.new("div");
                content.setClass("cont-gray bottom-round content");
                content.style.marginTop = "0";

            div.appendChild(heading);
            div.appendChild(content);
            
            return div;
        }
    },
    findContainer: function(name){
        let headings = doc.findAll(".content-wrapper .title-black");
        
        for(let heading of headings){
            if(heading.innerText == name)
                return heading.parentElement.parentElement;
        }
        
        return undefined;
    }
}

function flying() {
    let promise = new Promise(function(resolve, reject){
        let checker = setInterval(function(){
            let page_heading = document.querySelector("#skip-to-content");
            if(page_heading){
                if(page_heading.innerText == "Traveling"){
                    resolve(true);
                    return clearInterval(checker);
                } else if(page_heading.innerText == "Error"){
                    for(let msg of doc.findAll(".msg")){
                        if(msg.innerText == "You cannot access this page while traveling!"){
                            resolve(true);
                            return clearInterval(checker);
                        }
                    }
                }
                resolve(false);
                return clearInterval(checker);
            }
        }, 100);
    })
    
    return promise.then(function(data){
        if(data == true)
            console.log("User flying.");
        return data;
    });
}

function abroad(){
    let promise = new Promise(function(resolve, reject){
        let counter = 0;
        let checker = setInterval(function(){
            if(doc.find("#travel-home")){
                resolve(true);
                return clearInterval(checker);
            } else if(doc.find("#skip-to-content").innerText == "Preferences"){
                resolve(false);
                return clearInterval(checker);
            } else if(doc.find("#sidebarroot h2").innerText == "Information"){
                resolve(false);
                return clearInterval(checker);
            } else {
                for(let msg of doc.findAll(".msg")){
                    if(msg.innerText == "You can't access this page while abroad."){
                        resolve(true);
                        return clearInterval(checker);
                    }
                }
            }

            if(counter >= 50){
                resolve(false);
                return clearInterval(checker);
            } else 
                counter++;
        }, 100);
    })
    
    return promise.then(function(data){
        return data;
    });
}

function secondsToHours(x) {
	return Math.floor(x / 60 / 60); // seconds, minutes
}

function secondsToDays(x) {
	return Math.floor(x / 60 / 60 / 24); // seconds, minutes, hours
}

function time_ago(time) {

    switch (typeof time) {
        case 'number':
            break;
        case 'string':
            time = +new Date(time);
            break;
        case 'object':
            if (time.constructor === Date) time = time.getTime();
            break;
        default:
            time = +new Date();
    }
    var time_formats = [
        [60, 'seconds', 1], // 60
        [120, '1 minute ago', '1 minute from now'], // 60*2
        [3600, 'minutes', 60], // 60*60, 60
        [7200, '1 hour ago', '1 hour from now'], // 60*60*2
        [86400, 'hours', 3600], // 60*60*24, 60*60
        [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
        [604800, 'days', 86400], // 60*60*24*7, 60*60*24
        [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
        [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
        [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
        [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
        [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
        [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
        [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
        [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];
    var seconds = (+new Date() - time) / 1000,
        token = 'ago',
        list_choice = 1;

    if (seconds == 0) {
        return 'Just now'
    }
    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = 'from now';
        list_choice = 2;
    }
    var i = 0,
        format;
    while (format = time_formats[i++])
        if (seconds < format[0]) {
            if (typeof format[2] == 'string')
                return format[list_choice];
            else
                return Math.floor(seconds / format[2]) + ' ' + format[1] + ' ' + token;
        }
    return time;
}

function numberWithCommas(x, shorten=true) {
    if(!shorten)
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    if(Math.abs(x) >= 1e9){
        if(Math.abs(x)%1e9 == 0)
            return (x/1e9).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "bil";
        else
            return (x/1e9).toFixed(3) + "bil";
    } else if(Math.abs(x) >= 1e6){
        if(Math.abs(x)%1e6 == 0)
            return (x/1e6) + "mil";
        else
            return (x/1e6).toFixed(3) + "mil";
    } else if(Math.abs(x) >= 1e3){
        if(Math.abs(x)%1e3 == 0)
            return (x/1e3) + "k";
    }

    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function dateParts(date){
    let data = [
        date.getDate(),
        date.getMonth()+1,
        date.getFullYear(),
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
    ]

    return data.map(x => (x.toString().length == 1 ? "0"+x.toString() : x.toString()));
}

function capitalize(text, every_word=false){
    if(!every_word)
        return text[0].toUpperCase()+text.slice(1);

    let words = text.trim().split(" ");
    let new_text = "";
    
    for(let word of words){
        new_text = new_text + capitalize(word) + " ";
    }

    return new_text.trim();
}

async function get_api(http, api_key) {
	const response = await fetch(http + "&key=" + api_key);
	const result = await response.json();

	if(result.error){
		console.log("API SYSTEM OFFLINE");
		local_storage.change("api", {"online": false, "error": result.error.error});
		return false;
	} else
		local_storage.change("api", {"online": true, "error": ""});

	return result;
}

function sleep(time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

function rotateElement(element, degrees){
    let start_degrees = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;
    
    if(start_degrees != 0 && start_degrees%360 == 0){
        start_degrees = 0;
        element.style.transform = `rotate(${start_degrees}deg)`;
    } else if(start_degrees > 360){
        start_degrees = start_degrees%360;
        element.style.transform = `rotate(${start_degrees}deg)`;
    }

    let total_degrees = start_degrees + degrees;
    let step = 1000/degrees;
    
    let rotater = setInterval(function(){
        let current_rotation = element.style.transform ? parseInt(element.style.transform.replace("rotate(", "").replace("deg)", "")) : 0;
        let new_rotation = current_rotation + step;

        if(current_rotation < total_degrees && new_rotation > total_degrees){
            new_rotation = total_degrees;
            clearInterval(rotater);
        }

        element.style.transform = `rotate(${new_rotation}deg)`;
    }, 1);
}