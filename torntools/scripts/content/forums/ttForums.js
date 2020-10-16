requireDatabase().then(() => {
	addXHRListener((event) => {
		const { page, uri, xhr, json } = event.detail;

		const params = new URLSearchParams(xhr.requestBody);
		const step = params.get("step");

		if (page != "forums") return;

		if (step == "forums") {
			hideForumsThreads();
		}

		if (step == "threads") {
			hideForumsPosts();
		}
	});

	hideForumsThreads();
	hideForumsPosts();
});

function hideForumsThreads() {
	requireElement(".threads-list > li").then(() => {
		ttStorage.get("settings", (settings) => {
			let countHiddenThread = 0;
			let firstHiddenThread = null;

			let threadsList = doc.find(".threads-list");
			let threads = doc.findAll(".threads-list > li");
			for (let i = 0; i < threads.length; i++) {
				let thread = threads[i];

				if (hasClass(thread, "tt-forums-hidden")) {
					thread.remove();
					continue;
				}

				let userId = thread.find("a.user.name").href.replace(/^.*?(\d+)$/, "$1");

				if (settings.pages.forums.hide_threads[userId]) {
					thread.classList.add("tt-forums-hide");

					if (!firstHiddenThread) firstHiddenThread = thread;

					countHiddenThread++;
				} else {
					thread.classList.remove("tt-forums-hide");
					thread.classList.remove("tt-forums-hide-show");
				}

				if (countHiddenThread > 0 && (!settings.pages.forums.hide_threads[userId] || i == threads.length - 1)) {
					let hiddenDiv = doc.new({
						type: "li",
						class: "tt-forums-hidden",
						text: `${countHiddenThread} hidden thread${countHiddenThread > 1 ? "s" : ""}`,
					});

					threadsList.insertBefore(hiddenDiv, firstHiddenThread);

					hiddenDiv.addEventListener("click", () => {
						let post = hiddenDiv.nextElementSibling;
						while (1) {
							if (!post || !hasClass(post, "tt-forums-hide")) break;

							post.classList.toggle("tt-forums-hide-show");

							post = post.nextElementSibling;
						}
					});

					countHiddenThread = 0;
					firstHiddenThread = null;
				}
			}
		});
	});
}

function hideForumsPosts() {
	requireElement(".thread-list > li").then(() => {
		ttStorage.get("settings", (settings) => {
			let threadTitle = doc.find("#topic-title").innerText;
			let threadId = doc.find(".subscribe").getAttribute("data-thread");

			let countHiddenPost = 0;
			let firstHiddenPost = null;

			let threadList = doc.find(".thread-list");
			let posts = doc.findAll(".thread-list > li");
			for (let i = 0; i < posts.length; i++) {
				let post = posts[i];

				if (hasClass(post, "tt-forums-hidden")) {
					post.remove();
					continue;
				}

				let oldButton = post.find(".tt-forums-button");
				if (oldButton) oldButton.remove();

				let postId = post.getAttribute("data-id");
				let userId = post.find(".poster-id").innerText.replace(/[^\d]/g, "");
				let userName = post.find(".poster-name").innerText;
				let likes = post.find(".like > .value").innerText;
				let dislikes = post.find(".dislike > .value").innerText;
				let postDate = post.find(".time-wrap > .created, .time-wrap > .posted").innerText;

				if (settings.pages.forums.hide_posts[userId]) {
					post.classList.add("tt-forums-hide");
					if (hasClass(post.previousElementSibling, "tt-forums-hide-show") || hasClass(post.nextElementSibling, "tt-forums-hide-show")) {
						post.classList.add("tt-forums-hide-show");
					} else {
						post.classList.remove("tt-forums-hide-show");
					}

					if (!firstHiddenPost) firstHiddenPost = post;

					countHiddenPost++;
				} else {
					post.classList.remove("tt-forums-hide");
					post.classList.remove("tt-forums-hide-show");
				}

				if (countHiddenPost > 0 && (!settings.pages.forums.hide_posts[userId] || i == posts.length - 1)) {
					let hiddenDiv = doc.new({
						type: "li",
						class: "tt-forums-hidden",
						text: `${countHiddenPost} hidden post${countHiddenPost > 1 ? "s" : ""}`,
					});

					threadList.insertBefore(hiddenDiv, firstHiddenPost);

					hiddenDiv.addEventListener("click", () => {
						let post = hiddenDiv.nextElementSibling;
						while (1) {
							if (!post || !hasClass(post, "tt-forums-hide")) break;

							post.classList.toggle("tt-forums-hide-show");

							post = post.nextElementSibling;
						}
					});

					countHiddenPost = 0;
					firstHiddenPost = null;
				}

				let button = doc.new({
					type: "li",
					class: "tt-forums-button form-button",
				});
				button.appendChild(
					doc.new({
						type: "i",
						class: "thread-action-icon",
						attributes: {
							style: `background: url(${chrome.runtime.getURL("images/icon48.png")})`,
						},
					})
				);

				let dropDown = doc.new({
					type: "div",
					class: "tt-forums-button-dropdown",
				});

				let dropDownCopyDiscord = doc.new({
					type: "div",
					text: "Copy post for Discord",
				});
				dropDown.appendChild(dropDownCopyDiscord);
				dropDownCopyDiscord.addEventListener("click", () => {
					let textArea = doc.new({
						type: "textarea",
					});

					let text = `:speech_balloon: **${userName} [${userId}]** on thread **${threadTitle}**: \`\`\`bash
# ${likes} upvotes, ${dislikes} downvotes
# ${postDate}
\`\`\`\`\`\`md
$$$TEXT_CONTENT$$$\`\`\`$$$URLS$$$\nSource: https://www.torn.com/forums.php#/p=threads&t=${threadId}&to=${postId}`;

					let postContent = post.find(".origin-post-content").textContent;
					let quotesContent = "";
					let prefix = "> ";
					for (let quote of post.findAll(".post-quote")) {
						let quoteAuthor = quote.find(":scope > .author-quote a").innerText;
						let quoteContent = quote.find(":scope > .quote-post > .quote-post-content").innerText;

						quotesContent = `${prefix} ${quoteAuthor}:\n${quoteContent.replace(/^/gm, prefix)}\n${quotesContent}`;
						prefix = `> ${prefix}`;
					}

					//Replace emoticons
					let emoticonRegex = /\[img\].*?emotions\/(\w+).*?\[\/img\]/gs;
					postContent = postContent.replace(emoticonRegex, ":$1:");
					quotesContent = quotesContent.replace(emoticonRegex, ":$1:");

					//Remove images, tries to match [url] tags with the same url as the image and removes those as well
					let imageRegex = /\[url\=(.*?)\]\[img(?:\s?\w*\=[^\]]*)*\]\1\[\/img\]\[\/url\]|\[img(?:\s?\w*\=[^\]]*)*\].*?\[\/img\]/gs;
					postContent = postContent.replace(imageRegex, "[img]");
					quotesContent = quotesContent.replace(imageRegex, "[img]");

					//Replace urls
					let urls = [];
					let urlRegex = /\[url\=(.*?)\](.*?)\[\/url\]/gs;
					let urlCallback = (match, url, content) => {
						urls.push(url);
						return `[${content}][${urls.length}]`;
					};
					quotesContent = quotesContent.replace(urlRegex, urlCallback);
					postContent = postContent.replace(urlRegex, urlCallback);

					text = text.replace("$$$URLS$$$", urls.map((url, idx) => `[${idx + 1}]: ${url}`).join("\n"));

					//Remove bbcode
					let bbcodeRegex = /\[(\w+)(?:\s?\w*\=[^\]]*)*\](.*?)\[\/\1\]/gs;
					while (postContent != (postContent = postContent.replace(bbcodeRegex, "$2"))) {}
					while (quotesContent != (quotesContent = quotesContent.replace(bbcodeRegex, "$2"))) {}

					//Remove 3+ newlines
					let newlineRegex = /\n{3,}/gs;
					postContent = postContent.replace(newlineRegex, "\n\n");
					quotesContent = quotesContent.replace(newlineRegex, "\n\n");

					//Discord max length = 2000 + 18 = Placeholder, Subtract current length & newline count, to avoid problems with LF <> CRLF
					let maxLength =
						2018 - text.length - text.match(/\n/g).length - (postContent.match(/\n/g) || []).length - (quotesContent.match(/\n/g) || []).length;
					if (quotesContent.length > 0) {
						if (quotesContent.length > maxLength / 2) {
							quotesContent = quotesContent.substring(0, maxLength / 2 - 5) + "[...]";
						}

						postContent = `${quotesContent}\n\n${postContent}`;
					}

					if (postContent.length > maxLength) {
						text = text.replace("$$$TEXT_CONTENT$$$", postContent.substring(0, maxLength - 5) + "[...]");
					} else {
						text = text.replace("$$$TEXT_CONTENT$$$", postContent);
					}

					textArea.textContent = text;
					doc.body.appendChild(textArea);
					textArea.select();
					try {
						document.execCommand("copy");
						dropDownCopyDiscord.innerText = "Copied!";
					} catch (ex) {
						console.warn("Copy to clipboard failed.", ex);
						dropDownCopyDiscord.innerText = "Failed to copy!";
					} finally {
						doc.body.removeChild(textArea);
					}

					setTimeout(() => {
						dropDownCopyDiscord.innerText = "Copy post for Discord";
					}, 1000);
				});

				let dropDownHideThreads = doc.new({
					type: "div",
					text: `${settings.pages.forums.hide_threads[userId] ? "Show" : "Hide"} ${userName}'s threads`,
				});
				dropDown.appendChild(dropDownHideThreads);
				dropDownHideThreads.addEventListener("click", () => {
					ttStorage.get("settings", (settings) => {
						if (!settings.pages.forums.hide_threads[userId]) {
							settings.pages.forums.hide_threads[userId] = true;
						} else {
							delete settings.pages.forums.hide_threads[userId];
						}

						ttStorage.set({ settings: settings });

						dropDownHideThreads.innerText = `${settings.pages.forums.hide_threads[userId] ? "Show" : "Hide"} ${userName}'s threads`;
					});
				});

				let dropDownHidePosts = doc.new({
					type: "div",
					text: `${settings.pages.forums.hide_posts[userId] ? "Show" : "Hide"} ${userName}'s posts`,
				});
				dropDown.appendChild(dropDownHidePosts);
				dropDownHidePosts.addEventListener("click", () => {
					ttStorage.get("settings", (settings) => {
						if (!settings.pages.forums.hide_posts[userId]) {
							settings.pages.forums.hide_posts[userId] = true;
						} else {
							delete settings.pages.forums.hide_posts[userId];
						}

						ttStorage.set({ settings: settings });

						hideForumsPosts();
					});
				});

				button.appendChild(dropDown);

				let actionBar = post.find(".action-wrap");
				actionBar.insertBefore(button, actionBar.children[2]);
			}
		});
	});
}
