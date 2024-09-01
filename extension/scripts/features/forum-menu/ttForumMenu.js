"use strict";

(async () => {
	const feature = featureManager.registerFeature("Forum Menu", "forums", () => settings.pages.forums.menu, initialiseListeners, startFeature, removeMenu, {
		storage: ["settings.pages.forums.menu"],
	});

	function initialiseListeners() {
		addXHRListener(({ detail: { page, xhr } }) => {
			if (!feature.enabled()) return;

			if (page !== "forums") return;

			const params = new URLSearchParams(xhr.requestBody);
			const step = params.get("step");

			if (step === "forums") showThreads();
			else if (step === "threads") showPosts();
		});
	}

	async function startFeature() {
		const wrap = await requireElement(".forums-wrap, .forums-committee-wrap, .forums-thread-wrap:not(.search-wrap) .forums-thread");

		if (wrap.classList.contains("forums-committee-wrap")) await showThreads();
		else if (wrap.classList.contains("forums-thread")) await showPosts();
	}

	async function showThreads() {
		await requireElement(".forums-committee-wrap");

		let countHiddenThread = 0;
		let firstHiddenThread;

		const threads = document.findAll(".threads-list > li");
		for (let i = 0; i < threads.length; i++) {
			const thread = threads[i];

			if (thread.classList.contains("tt-forums-hidden")) {
				thread.remove();
				continue;
			}

			const userId = getUsername(thread).id;
			const threadId = new URL(thread.find("a.thread-name").href).searchParams.get("t").getNumber();

			const shouldHideThreads = settings.pages.forums.hideThreads[userId] || settings.pages.forums.ignoredThreads[threadId];
			if (shouldHideThreads) {
				thread.classList.add("tt-forums-hide");

				if (!firstHiddenThread) firstHiddenThread = thread;
				countHiddenThread++;
			} else {
				thread.classList.remove("tt-forums-hide", "tt-forums-hide-show");
			}

			if (settings.pages.forums.highlightThreads[userId]) thread.classList.add("tt-forums-highlight");
			else thread.classList.remove("tt-forums-highlight");

			if (countHiddenThread && (!shouldHideThreads || i === threads.length - 1)) {
				firstHiddenThread.insertAdjacentElement(
					"beforebegin",
					document.newElement({
						type: "li",
						class: "tt-forums-hidden",
						text: `${countHiddenThread} hidden thread${applyPlural(countHiddenThread)}`,
						events: {
							click(event) {
								let thread = event.target.nextElementSibling;
								while (thread && thread.classList.contains("tt-forums-hide")) {
									thread.classList.toggle("tt-forums-hide-show");
									thread = thread.nextElementSibling;
								}
							},
						},
					})
				);

				countHiddenThread = 0;
				firstHiddenThread = undefined;
			}
		}
	}

	async function showPosts() {
		await requireElement(".forums-thread");

		let countHiddenPost = 0;
		let firstHiddenPost;

		const threadId = getHashParameters().get("t").getNumber();

		const posts = document.findAll(".thread-list > li");
		for (let i = 0; i < posts.length; i++) {
			const post = posts[i];

			if (post.classList.contains("tt-forums-hidden")) {
				post.remove();
				continue;
			}
			post.find(".tt-forums-button")?.remove();

			const userId = post.find(".poster-id").textContent.getNumber();
			const userName = post.find(".poster-name").textContent;

			const shouldHidePosts = settings.pages.forums.hidePosts[userId];
			if (shouldHidePosts) {
				post.classList.add("tt-forums-hide");

				if (
					post.previousElementSibling?.classList.contains("tt-forums-hide-show") ||
					post.nextElementSibling?.classList.contains("tt-forums-hide-show")
				)
					post.classList.add("tt-forums-hide-show");
				else post.classList.remove("tt-forums-hide-show");

				if (!firstHiddenPost) firstHiddenPost = post;
				countHiddenPost++;
			} else {
				post.classList.remove("tt-forums-hide", "tt-forums-hide-show");
			}

			if (settings.pages.forums.highlightPosts[userId]) post.classList.add("tt-forums-highlight");
			else post.classList.remove("tt-forums-highlight");

			if (countHiddenPost && (!shouldHidePosts || i === posts.length - 1)) {
				firstHiddenPost.insertAdjacentElement(
					"beforebegin",
					document.newElement({
						type: "li",
						class: "tt-forums-hidden",
						text: `${countHiddenPost} hidden post${applyPlural(countHiddenPost)}`,
						events: {
							click(event) {
								let post = event.target.nextElementSibling;
								while (post && post.classList.contains("tt-forums-hide")) {
									post.classList.toggle("tt-forums-hide-show");
									post = post.nextElementSibling;
								}
							},
						},
					})
				);

				countHiddenPost = 0;
				firstHiddenPost = undefined;
			}

			const name = `${userName}'${userName.endsWith("s") ? "" : "s"}`;
			post.find(".action-wrap .right-part").insertAdjacentElement(
				"beforebegin",
				document.newElement({
					type: "li",
					class: "tt-forums-button",
					children: [
						ttSvg(),
						document.newElement({
							type: "div",
							class: "tt-forums-button-dropdown",
							children: [
								document.newElement({
									type: "div",
									text: "Copy post for Discord",
									events: {
										click(event) {
											const threadTitle = document.find("#topic-title").textContent.replaceAll("\u200B", "").trim();
											const threadId = document.find(".subscribe").dataset.thread;

											const postId = post.dataset.id;
											const date = post.find(".time-wrap > .created, .time-wrap > .posted").textContent;

											let likes, dislikes;
											if (!post.find(".rating-results-pending")) {
												likes = post.find(".like > .value").textContent.trim();
												dislikes = post.find(".dislike > .value").textContent.trim();
											} else {
												likes = "N/A";
												dislikes = "N/A";
											}

											let quotesContent = "";
											let prefix = "> ";
											for (const quote of post.findAll(".post-quote")) {
												const author = quote.find(":scope > .author-quote a").innerText;
												const content = quote.find(":scope > .quote-post > .quote-post-content").innerText;

												quotesContent = `${prefix} ${author}:\n${content.replace(/^/gm, prefix)}\n${quotesContent}`;
												prefix = `> ${prefix}`;
											}

											let postContent = post.find(".post-container .post").textContent;

											// Replace emoticons
											const emoticonRegex = /\[img].*?emotions\/(\w+).*?\[\/img]/gs;
											postContent = postContent.replace(emoticonRegex, ":$1:");
											quotesContent = quotesContent.replace(emoticonRegex, ":$1:");

											// Remove images, tries to match [url] tags with the same url as the image and removes those as well
											const imageRegex = /\[url=(.*?)]\[img(?:\s?\w*=[^\]]*)*]\1\[\/img]\[\/url]|\[img(?:\s?\w*=[^\]]*)*].*?\[\/img]/gs;
											postContent = postContent.replace(imageRegex, "[img]");
											quotesContent = quotesContent.replace(imageRegex, "[img]");

											// Replace urls
											const urls = [];
											const urlRegex = /\[url=(.*?)](.*?)\[\/url]/gs;
											const urlCallback = (match, url, content) => {
												let place;

												if (urls.includes(url)) {
													place = urls.indexOf(url) + 1;
												} else {
													urls.push(url);
													place = urls.length;
												}

												return `[${content.trim()}][${place}]`;
											};
											quotesContent = quotesContent.replace(urlRegex, urlCallback);
											postContent = postContent.replace(urlRegex, urlCallback);

											let text =
												`:speech_balloon: **${userName} [${userId}]** on thread **${threadTitle}**:\n` +
												"```bash\n" +
												`# ${likes} upvotes, ${dislikes} downvotes\n# ${date}\n` +
												"```\n```md\n$$$TEXT_CONTENT$$$\n```\n" +
												"$$$URLS$$$\nSource: <" +
												`https://www.torn.com/forums.php#/p=threads&t=${threadId}&to=${postId}` +
												">";

											text = text.replace("$$$URLS$$$", urls.map((url, idx) => `[${idx + 1}]: <${url}>`).join("\n"));

											// Remove bbcode
											const bbcodeRegex = /\[(\w+)(?:\s?\w*=[^\]]*)*](.*?)\[\/\1]/gs;
											while (postContent !== (postContent = postContent.replace(bbcodeRegex, "$2"))) {} // eslint-disable-line no-empty
											while (quotesContent !== (quotesContent = quotesContent.replace(bbcodeRegex, "$2"))) {} // eslint-disable-line no-empty

											// Remove 3+ newlines
											const newlineRegex = /\n{3,}/gs;
											postContent = postContent.replace(newlineRegex, "\n\n");
											quotesContent = quotesContent.replace(newlineRegex, "\n\n");

											// Discord max length = 2000 + 18 = Placeholder, Subtract current length & newline count, to avoid problems with LF <> CRLF
											const maxLength =
												2018 - text.length - (postContent.match(/\n/g) || []).length - (quotesContent.match(/\n/g) || []).length;

											if (quotesContent.length > 0) {
												if (quotesContent.length > maxLength / 2) {
													quotesContent = quotesContent.substring(0, maxLength / 2 - 5) + "[...]";
												}

												postContent = `${quotesContent}\n\n${postContent}`;
											}

											if (postContent.length > maxLength)
												text = text.replace("$$$TEXT_CONTENT$$$", postContent.substring(0, maxLength - 5) + "[...]");
											else text = text.replace("$$$TEXT_CONTENT$$$", postContent);

											toClipboard(text);

											event.target.textContent = "Copied!";
											setTimeout(() => (event.target.textContent = "Copy post for Discord"), 1000);
										},
									},
								}),
								document.newElement({
									type: "div",
									text: `${settings.pages.forums.hideThreads[userId] ? "Show" : "Hide"} ${name} threads`,
									events: {
										click(event) {
											const status = settings.pages.forums.hideThreads[userId];

											if (status) delete settings.pages.forums.hideThreads[userId];
											else settings.pages.forums.hideThreads[userId] = true;

											ttStorage.set({ settings });

											event.target.textContent = `${!status ? "Show" : "Hide"} ${name} threads`;
										},
									},
								}),
								document.newElement({
									type: "div",
									text: `${shouldHidePosts ? "Show" : "Hide"} ${name} posts`,
									events: {
										click() {
											const status = settings.pages.forums.hidePosts[userId];

											if (status) delete settings.pages.forums.hidePosts[userId];
											else settings.pages.forums.hidePosts[userId] = true;

											ttStorage.set({ settings });

											showPosts();
										},
									},
								}),
								document.newElement({
									type: "div",
									text: `${settings.pages.forums.highlightThreads[userId] ? "Unhighlight" : "Highlight"} ${name} threads`,
									events: {
										click(event) {
											const status = settings.pages.forums.highlightThreads[userId];

											if (status) delete settings.pages.forums.highlightThreads[userId];
											else settings.pages.forums.highlightThreads[userId] = true;

											ttStorage.set({ settings });

											event.target.textContent = `${!status ? "Unhighlight" : "Highlight"} ${name} threads`;
										},
									},
								}),
								document.newElement({
									type: "div",
									text: `${settings.pages.forums.highlightPosts[userId] ? "Unhighlight" : "Highlight"} ${name} posts`,
									events: {
										click() {
											const status = settings.pages.forums.highlightPosts[userId];

											if (status) delete settings.pages.forums.highlightPosts[userId];
											else settings.pages.forums.highlightPosts[userId] = true;

											ttStorage.set({ settings });

											showPosts();
										},
									},
								}),
								document.newElement({
									type: "div",
									text: `${settings.pages.forums.ignoredThreads[threadId] ? "Unignore" : "Ignore"} this entire thread`,
									events: {
										click(event) {
											const status = settings.pages.forums.ignoredThreads[threadId];

											if (status) delete settings.pages.forums.ignoredThreads[threadId];
											else settings.pages.forums.ignoredThreads[threadId] = true;

											ttStorage.set({ settings });
											event.target.textContent = `${!status ? "Unignore" : "Ignore"} this entire thread`;
										},
									},
								}),
							],
						}),
					],
				})
			);
		}
	}

	function removeMenu() {}
})();
