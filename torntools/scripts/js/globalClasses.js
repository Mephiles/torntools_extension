class ttCustomConsole {
	constructor() {}

	set parent(_parent) {
		this.parentElement = _parent;
	}

	_custom(color, messages) {
		if (!this.parentElement) return;

		if (color === "error") {
			for (let i = 0; i < messages.length; i++) {
				let message = messages[i];

				if (isError(message)) {
					message = `${message.toString()} [${message.fileName}:${message.lineNumber}]`;
				}

				messages[i] = message;
			}
		}

		const log = doc.new({
			type: "span",
			class: "tt-log",
			children: [
				doc.new({
					type: "span",
					class: "timestamp",
					text: new Date().toLocaleTimeString(),
				}),
				doc.new({
					type: "span",
					class: "message",
					html: messages.join("<p class='separator'>&nbsp;-&nbsp;</p>"),
				}),
			],
			attributes: {
				color,
			},
		});

		if (this.parentElement.children.length) this.parentElement.insertBefore(log, this.parentElement.children[0]);
		else this.parentElement.appendChild(log);

		function isError(error) {
			return error && error.stack && error.message && typeof error.stack === "string" && typeof error.message === "string";
		}
	}

	log(...messages) {
		console.log(...messages);
		this._custom("", messages);
	}

	error(...messages) {
		console.error(...messages);
		this._custom("error", messages);
	}
}
