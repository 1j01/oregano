// This is a script to download all the versions of a websim.ai site to bring it into local version control.

// First, copy and paste this script into the browser console to collect versions,
// then paste the result into the script as the versions array below, and run the script in Node.js to download the versions.

// Optionally, before running the script in Node.js, you can edit the commit summaries (and add notes) in the versions array.
// You can add commit summaries with an LLM (like ChatGPT) with a prompt like "Add short one-line commitSummary fields to these, based on the prompts."
// or use GitHub Copilot to autocomplete the commit summaries interactively, or just enter them manually.
// One could also edit commit messages later running the script, possibly in one big `rebase -i`.
// Recommended: if using a chatbot-style LLM interface, run a diff between the original input and the output to check for unexpected changes.
// It may incidentally try to fix typos in your prompts, for instance, or simply mess up the JSON syntax.
// An autocompletion-style LLM interface (like GitHub Copilot) would avoid this issue.
// Also: note that the LLM doesn't know what changes where successfully made by the other LLM (powering websim).
// summaries like "Fix <some issue>" may be more accurately written as "Try to fix <some issue>" :)

// ------------------------------

// WebSim is using unsemantic HTML, with only presentational classes, unfortunately,
// so I can't just find the list of versions with a selector like `ul.versions`.
// Instead I'm prompting the user to select the element with the list of versions.

// By the way, the nodes in this (non-semantic) list are presented in the reverse order from how they are in the DOM, as of 2024-07-27.
// The first node is the earliest version, shown at the bottom of the list.

// (Hm, I guess I could select based on the class .flex-col-reverse, since if that's removed the script is likely to break anyway...
// and then also check that the selected element contains version links - filter based on this, and then assert that there's only one element matching the filter.
// That would take care of the first interaction... as for finding a selector for the prompt text, that seems trickier,
// but maybe I could get the prompt from the "address bar" and the find an element in the list (deepest in the DOM) that contains that text.)

// TODO: Make automation easier to cancel. To hit Esc after pasting the script in the console, you have to focus the page,
// but clicking will select an element, so you have to press the mouse button down and then hit Esc before releasing it.
// Also there's no way to abort once it starts collecting versions, so it should be possible to cancel that too.
// Could add a cancel button. Could add a start button too, so the page is likely focused when you try to press Esc.
// Could also move the overlay to the bottom of the screen since the version list is near the top.

// TODO: handle "!continue" prompts, which are used to continue output when it's too long.

async function collectAllVersions(versionListDivSelector, promptSelector) {
	const aggregatedResults = [];

	function collectVisibleVersions() {
		// Don't move this querySelector outside the function; apparently the whole browser UI is recreated when clicking the link
		const versionListDivElement = document.querySelector(versionListDivSelector);
		if (!versionListDivElement) {
			return [];
		}
		const linkUrls = [...versionListDivElement.querySelectorAll(`a[href^='https://websim.ai/c/']`)].map(a => a.href);
		const prompts = [...versionListDivElement.querySelectorAll(promptSelector)].map((el) => el.textContent);
		const associated = prompts.map((prompt, i) => {
			const id = linkUrls[i].match(/https:\/\/websim.ai\/c\/([^/]+)/)[1];
			return { prompt, id };
		});
		return associated;
	}

	function waitFor(condition, { timeout = 10000, interval = 100 } = {}) {
		return new Promise((resolve, reject) => {
			const timer = setInterval(() => {
				if (condition()) {
					clearInterval(timer);
					resolve();
				}
			}, interval);
			setTimeout(() => {
				clearInterval(timer);
				reject("Timed out waiting for condition.");
			}, timeout);
		});
	}

	function waitForVersionListToChange(oldVisibleVersions) {
		return waitFor(() => {
			const visibleVersions = collectVisibleVersions();
			console.log("Waiting for version list to change, old:", oldVisibleVersions, "new:", visibleVersions);
			if (visibleVersions.length === 0) {
				openVersionList();
				return false;
			}
			// return visibleVersions[0].id !== oldVisibleVersions[0].id;
			// In the case that we're moving to the view that has just the earliest item,
			// the earliest item will be the same as in the last snapshot,
			// so we need to check the latest items instead.
			return visibleVersions[visibleVersions.length - 1].id !== oldVisibleVersions[oldVisibleVersions.length - 1].id;
		}).then(() => {
			// Wait for the version list to stabilize (finish loading)
			let baseline = collectVisibleVersions();
			return waitFor(() => {
				const visibleVersions = collectVisibleVersions();
				console.log("Waiting for version list to stabilize (finish loading), loaded already:", baseline.length, "loaded now:", visibleVersions.length);
				const finishedLoading = visibleVersions.length === baseline.length;
				baseline = visibleVersions; // must be updated after comparison
				return finishedLoading;
			}, { interval: 2000 });
		});
	}

	async function collectAndClickEarliest() {
		const visibleVersions = collectVisibleVersions();
		if (aggregatedResults.length > 0) {
			// Sanity check: each capture should overlap by one version
			const earliestRecordedVersion = aggregatedResults[0];
			const latestVisibleVersion = visibleVersions[visibleVersions.length - 1];
			if (earliestRecordedVersion.id !== latestVisibleVersion.id) {
				alert("Warning: The first node in the visible list is not the same as the last node in the previous capture. The order of versions may be incorrect.");
			}
			// There should be no other duplicates
			const duplicate = visibleVersions.slice(0, -1).find(({ id }) => aggregatedResults.some((item) => item.id === id));
			if (duplicate) {
				alert("Warning: Duplicate versions found in the visible list compared to the previous capture.");
			}
			// Add all but the last version, which is already in the previous capture
			aggregatedResults.unshift(...visibleVersions.slice(0, -1));
		} else {
			aggregatedResults.unshift(...visibleVersions);
		}

		if (visibleVersions.length === 0) {
			alert("Websim version links not found.");
			return;
		}
		if (visibleVersions.length === 1) {
			// Done - No more versions to collect.
			return;
		}

		// In parallel, wait for the version list to change and click the earliest version link
		let versionListDivElement = document.querySelector(versionListDivSelector);
		const earliestVersionLink = versionListDivElement.querySelector(`a[href^='https://websim.ai/c/']`);
		await Promise.all([
			waitForVersionListToChange(visibleVersions).catch((err) => {
				alert("Timed out waiting for the version list to change.");
			}),
			new Promise((resolve) => {
				earliestVersionLink.click();
				resolve();
			}),
		]);

		await collectAndClickEarliest();
	}

	await collectAndClickEarliest();

	return aggregatedResults;
}

function openVersionList() {
	// mouseup is what actually does it, but don't tell anyone
	const addressBar = document.querySelector("[name='url']");
	addressBar.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
	addressBar.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
	addressBar.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
	addressBar.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
	addressBar.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}


// Based on https://jsfiddle.net/Sillvva/qof6h0up/
// found via https://stackoverflow.com/questions/8588301/how-to-generate-unique-css-selector-for-dom-element#comment115592481_49663134
function buildQuerySelector(elem, relativeToParent = document.body) {
	let path = [];
	let parent;
	while (parent = elem.parentNode) {
		let tag = elem.tagName;
		let siblings;
		// Avoiding invalid CSS selectors from certain class names like "max-h-[calc(100vh-8rem)]"
		// Could use escaping but this is simpler, and these layout framework classes are unlikely to be useful in selectors
		// Also "body.__classname_36bd41" is valid as a selector, but not useful, not sure where it comes from
		let classes = Array.from(elem.classList.values()).filter(c => /^[a-z][a-z0-9_\-]*$/i.test(c));
		let classStr = classes.length ? `.${classes.join('.')}` : '';
		path.unshift(
			elem.id ? `#${elem.id}` : (
				siblings = parent.children,
				[].filter.call(siblings, sibling =>
					sibling.tagName === tag &&
					JSON.stringify(classes.sort()) === JSON.stringify(
						Array.from(sibling.classList.values()).sort()
					)
				).length === 1 ?
					`${tag}${classStr}` :
					`${tag}${classStr}:nth-child(${1 + [].indexOf.call(siblings, elem)})`
			)
		);
		if (elem === relativeToParent) break;
		elem = parent;
	};
	return `${path.join(' > ')}`.toLowerCase();
};


// Add commit summaries (can be improved with ChatGPT or manual editing before committing)
function addCommitSummaries(results, placeholder) {
	return results.map(({ prompt, id }) => {
		let commitSummary = prompt;
		if (placeholder !== undefined) {
			commitSummary = placeholder;
		} else {
			const maxLength = 50;
			if (prompt.length > maxLength) {
				let cutOff = maxLength - '...'.length;
				if (prompt.includes("\n")) {
					cutOff = Math.min(cutOff, prompt.indexOf("\n"));
				}
				commitSummary = prompt.substring(0, cutOff) + '...';
			}
		}
		return { prompt, id, commitSummary };
	});
}

/**
 * Prompts the user to pick an element matching a selector.
 * @param {string | (Element => boolean)} elementFilter A CSS selector or a function that returns `true` for the desired elements.
 * @param {string} [message] The message to display to the user.
 * @param {string} [subMessage] Extra text to show below the main message.
 * @returns {Promise<Element | null>} The selected element, or `null` if no element was selected. May never resolve if the user cancels.
 */
async function pickElement(elementFilter, message = "Select an element.", subMessage = "") {
	const overlayMessage = document.createElement('div');
	overlayMessage.textContent = message;
	Object.assign(overlayMessage.style, {
		position: 'fixed',
		top: '0',
		left: '0',
		width: '100%',
		textAlign: 'center',
		fontSize: '2em',
		color: 'white',
		backgroundColor: 'rgba(0,0,0,0.5)',
		padding: '1em',
		pointerEvents: 'none',
		zIndex: '9999999999'
	});

	const smallText = document.createElement('small');
	smallText.style.display = 'block';
	smallText.style.fontSize = '0.6em';
	smallText.innerHTML = 'Press <kbd>Esc</kbd> to cancel.';
	if (subMessage) {
		smallText.prepend(subMessage, document.createElement('br'));
	}
	overlayMessage.appendChild(smallText);

	const targetOverlay = document.createElement('div');
	targetOverlay.classList.add('target-overlay');
	Object.assign(targetOverlay.style, {
		position: 'fixed',
		boxSizing: 'border-box',
		outline: '2px dashed black',
		boxShadow: '0 0 0 2px white, 0 0 0 3px red, 0 0 0 1px red inset',
		zIndex: '9999999999',
		cursor: 'pointer',
		display: 'none'
	});
	document.body.appendChild(targetOverlay);

	/** @type {Element | null} */
	let currentEl = null;

	const cleanup = () => {
		document.body.removeChild(overlayMessage);
		document.body.removeChild(targetOverlay);
		removeEventListener('keydown', keydown, true);
		removeEventListener('pointermove', pointermove, true);
		removeEventListener('pointerdown', pointerdown, true);
	};

	const promise = new Promise((resolve) => {
		targetOverlay.addEventListener('click', () => {
			cleanup();
			resolve(currentEl);
		});
	});

	const keydown = (/** @type {KeyboardEvent} */ e) => {
		if (e.key === 'Escape') {
			cleanup();
			e.preventDefault();
			e.stopImmediatePropagation();
		}
	};

	const pointermove = (/** @type {PointerEvent} */ e) => {
		const matchedEl = document.elementsFromPoint(e.clientX, e.clientY)
			.find((el) =>
				(!el.matches('.target-overlay')) &&
				(typeof elementFilter === 'function' ? elementFilter(el) : el.matches(elementFilter)
				));
		if (matchedEl) {
			currentEl = matchedEl;
			const rect = matchedEl.getBoundingClientRect();
			Object.assign(targetOverlay.style, {
				top: `${rect.top}px`,
				left: `${rect.left}px`,
				width: `${rect.width}px`,
				height: `${rect.height}px`,
				display: 'block'
			});
		} else {
			targetOverlay.style.display = 'none';
		}
	};

	const pointerdown = (/** @type {PointerEvent} */ e) => {
		e.preventDefault(); // prevent focus change
	};

	addEventListener('keydown', keydown, true);
	addEventListener('pointermove', pointermove, true);
	addEventListener('pointerdown', pointerdown, true);

	document.body.appendChild(overlayMessage);

	return promise;
}

async function collectVersionsInteractively() {
	openVersionList();
	const hasLinks = (el) => el.querySelectorAll(`a[href^='https://websim.ai/c/']`).length > 0;
	const versionListDivElement = await pickElement(hasLinks, "Select the element containing the list of versions.", "(Click in the space between two items.)");
	const versionListDivSelector = buildQuerySelector(versionListDivElement);
	console.log("Generated version list selector:", versionListDivSelector);
	// Sanity check: the selector should match exactly the one element we picked
	if (document.querySelectorAll(versionListDivSelector).length !== 1) {
		alert("Error: The generated version list selector does not match exactly one element.");
		return;
	}
	if (document.querySelector(versionListDivSelector) !== versionListDivElement) {
		alert("Error: The generated version list selector matched a different element from the one picked.");
		return;
	}
	const mightBePrompt = (el) => el.textContent.length > 8 && el.closest(versionListDivSelector) === versionListDivElement && !hasLinks(el);
	const promptElement = await pickElement(mightBePrompt, "Select the prompt text from of the versions in the list.", "(Click directly on the text of a prompt.)");
	let promptSelector = buildQuerySelector(promptElement, versionListDivElement);
	console.log("Initially generated prompt selector:", promptSelector);
	// remove first :nth-child(), so that it matches multiple items, not the specific list item
	promptSelector = promptSelector.replace(/:nth-child\(\d+\)/, '');
	console.log("Adjusted generated prompt selector:", promptSelector);
	// Sanity check: the selector should match the element we picked (among others)
	if (document.querySelectorAll(promptSelector).length === 0) {
		alert("Error: The generated prompt selector does not match any elements.");
		return;
	}
	if (!promptElement.matches(promptSelector)) {
		alert("Error: The picked prompt element does not match the generated selector.");
		return;
	}
	const allVersions = await collectAllVersions(versionListDivSelector, promptSelector);
	const versionsWithTruncatedPromptCommitSummaries = addCommitSummaries(allVersions);
	const versionsWithGenericCommitSummaries = addCommitSummaries(allVersions, "WebSim updates");
	const versionsWithEmptyCommitSummaries = addCommitSummaries(allVersions, "");
	const jsonWithTruncatedPromptCommitSummaries = JSON.stringify(versionsWithTruncatedPromptCommitSummaries, null, "\t");
	const jsonWithGenericCommitSummaries = JSON.stringify(versionsWithGenericCommitSummaries, null, "\t");
	const llmPrompt = `${JSON.stringify(versionsWithEmptyCommitSummaries, null, "\t")}\n\n\nAdd short one-line commitSummary fields to these, based on the prompts.`;
	console.log(jsonWithTruncatedPromptCommitSummaries);
	showOutputDialog([
		{ outputText: jsonWithTruncatedPromptCommitSummaries, noun: "JSON", label: "JSON with truncated prompt commit summaries", default: true },
		{ outputText: jsonWithGenericCommitSummaries, noun: "JSON", label: "JSON with generic commit summaries", default: true },
		{ outputText: llmPrompt, noun: "LLM prompt", label: "LLM prompt for better automatic commit summaries" },
	]);
}

function showOutputDialog(options) {
	// Remove existing stylesheet if it exists
	const existingStyle = document.getElementById('websim-exporter-dialog-style');
	if (existingStyle) {
		existingStyle.remove();
	}

	// Create a new stylesheet
	const style = document.createElement('style');
	style.id = 'websim-exporter-dialog-style';
	style.textContent = `
		.websim-exporter-dialog {
			font-family: Arial, sans-serif;
			background-color: #f9f9f9;
			border: 1px solid #ccc;
			padding: 20px;
			position: fixed;
			box-shadow: 0 4px 8px rgba(0,0,0,0.1);
			border-radius: 4px;
			z-index: 1000;
			display: flex;
			flex-direction: column;
			align-items: center;
		}
		.websim-exporter-dialog label {
			margin-bottom: 10px;
		}
		.websim-exporter-dialog .output-preview {
			border: 1px solid #ccc;
			padding: 10px;
			width: 70vw;
			height: 70vh;
			white-space: pre-wrap;
			overflow-wrap: break-word;
			overflow-y: auto;
			margin-bottom: 20px;
		}
		.websim-exporter-dialog .buttons {
			margin-top: 10px;
		}
		.websim-exporter-dialog .buttons button {
			margin: 0 5px;
			padding: 8px 16px;
			cursor: pointer;
			border: none;
			background-color: #007bff;
			color: white;
			border-radius: 4px;
			outline: none;
		}
		.websim-exporter-dialog .buttons button:hover {
			background-color: #0056b3;
		}
		.websim-exporter-toast {
			position: fixed;
			bottom: 30px;
			right: 30px;
			background-color: rgba(0, 0, 0, 0.8);
			color: white;
			padding: 10px 20px;
			border-radius: 4px;
			z-index: 1100;
		}
		.websim-exporter-toast.error {
			background-color: #dc3545;
		}
		.websim-exporter-toast.success {
			background-color: #28a745;
		}
	`;

	document.head.appendChild(style);

	// Create dialog element
	const dialog = document.createElement('dialog');
	dialog.classList.add('websim-exporter-dialog');

	// Create radio group and output preview
	const radioGroup = document.createElement('div');
	options.forEach((opt, index) => {
		const radioInput = document.createElement('input');
		radioInput.type = 'radio';
		radioInput.id = `option${index}`;
		radioInput.name = 'outputOption';
		radioInput.value = index.toString();
		radioInput.addEventListener('change', () => {
			previewOutput(opt.outputText, opt.noun);
		});
		if (opt.default) {
			radioInput.checked = true;
			// previewOutput(opt.outputText, opt.noun); called after outputPreview is created
			// could reorder things to simplify this a bit
		}

		const radioLabel = document.createElement('label');
		radioLabel.setAttribute('for', `option${index}`);
		radioLabel.textContent = opt.label;

		radioGroup.appendChild(radioInput);
		radioGroup.appendChild(radioLabel);
		radioGroup.appendChild(document.createElement('br'));
	});

	const outputPreview = document.createElement('pre');
	outputPreview.classList.add('output-preview');

	dialog.appendChild(radioGroup);
	dialog.appendChild(outputPreview);

	// Create close button
	const closeButton = document.createElement('button');
	closeButton.textContent = 'Close';
	closeButton.addEventListener('click', () => {
		dialog.remove();
	});

	// Create copy to clipboard button
	const copyButton = document.createElement('button');
	copyButton.textContent = 'Copy to Clipboard';
	copyButton.addEventListener('click', () => {
		const selectedOption = document.querySelector('input[name="outputOption"]:checked');
		if (selectedOption) {
			const index = parseInt(selectedOption.value);
			const selectedOpt = options[index];

			// Copy to clipboard logic
			navigator.clipboard.writeText(selectedOpt.outputText)
				.then(() => {
					showToast(`Copied ${selectedOpt.noun} to clipboard.`, 'success');
				})
				.catch((err) => {
					showToast(`Failed to copy ${selectedOpt.noun} to clipboard: ${err}`, 'error');
				});
		}
	});

	const buttonContainer = document.createElement('div');
	buttonContainer.classList.add('buttons');
	buttonContainer.appendChild(closeButton);
	buttonContainer.appendChild(copyButton);
	dialog.appendChild(buttonContainer);

	// Handle default selection preview
	options.forEach((opt, index) => {
		if (opt.default) {
			previewOutput(opt.outputText, opt.noun);
		}
	});

	// Show dialog
	document.body.appendChild(dialog);
	dialog.showModal();

	// Function to preview selected output text
	function previewOutput(outputText, noun) {
		outputPreview.textContent = outputText;
	}

	// Function to show toast message
	function showToast(message, extraClass = '') {
		const toast = document.createElement('div');
		toast.classList.add('websim-exporter-toast', extraClass);
		toast.textContent = message;
		// document.body.appendChild(toast); // would go behind modal dialog
		dialog.append(toast);

		// Remove toast after 3 seconds
		setTimeout(() => {
			toast.remove();
		}, 3000);
	}
}

const versions = [
	{
		"commitSummary": "Initial game implementation with basic mechanics",
		"prompt": "https://oregano.game/\n\nA Peggle clone called Oregano, where you strip leaves off of oregano stems by rolling a ball across them, fired from a cannon. The leaves float down and give you points.\n- The cannon aims towards the mouse and fires with click.\n- If the ball hits the bottom of the screen, you lose the ball. You have a set number of balls.\n- Stems are arced platforms with leaves on them. The ball bounces off the stems.\n- A moving target at the bottom of the screen allows you to reclaim a ball.",
		"id": "BRV6QblN1qA6SSurN"
	},
	{
		"commitSummary": "Game over screen, bouncing off sides, and bezier stems",
		"prompt": "- Add game over screen.\n- Make ball bounce off sides.\n- Define stems with bezier curves, and calculate positions along the stems to place the leaves.",
		"id": "s3tuQxdc9khOAUI3S"
	},
	{
		"commitSummary": "Fix stem collision, bottom behavior, and tweak leaf shape",
		"prompt": "- The ball must collide with the stems.\n- The ball should fall through the bottom, so that you can lose a ball.\n- The leaves should be round.",
		"id": "R2c3iBbzVID8a86kv"
	},
	{
		"commitSummary": "Add reset button, leaf falling effect, and (not) leaf stems",
		"prompt": "- Add button to reset the ball, losing the ball.\n- Make leaves fall when collected.\n- Give leaves a little stem.",
		"id": "Dk0RkKJJN0DLJccKe"
	},
	{
		"commitSummary": "Try to fix Bezier curve collision and Reset Ball with no balls",
		"prompt": "- Fix bezier curve collision, which is offset in some cases.\n- Handle game over when resetting ball for the last ball.",
		"id": "2bWRpl2Cay9IW4Doe"
	},
	// ----------------
	{
		"commitSummary": "Fix resetting game, and add stems to leaves, tweak leaf shape",
		"prompt": "- Properly reset the game when restarting.\n- Give each leaf a stem.\n- Make leaves slightly pointed.",
		"id": "2LIilyWZciFSVVKuQ"
	},
	{
		"commitSummary": "Make leaves fatter and fix their visual connection",
		"prompt": "Make leaves fatter, and fix their visual connection to the stems.",
		"id": "46gvVD6YWOHIrIDNa"
	},
	{
		"commitSummary": "Adjust leaf shape and reduce cannon velocity",
		"prompt": "- Make leaves slightly pointed, but fatter, almost circular\n- Reduce cannon velocity.",
		"id": "1TdYIsJ6uad74ZoFS"
	},
	{
		"commitSummary": "Avoid overlapping stems and enlarge catcher",
		"prompt": "- Avoid overlapping stems.\n- Make the ball reclamation target larger.",
		"id": "HKx7jafO87d1t9kkx"
	},
	{
		"commitSummary": "Improve cannon visuals, show \"Extra Ball!\", increase initial balls",
		"prompt": "- Improve cannon appearance.\n- Show \"Extra Ball!\" when getting a free ball.\n- Increase the number of balls given at the start.",
		"id": "BxvsNVWhxhah57vMF"
	},
	{
		"commitSummary": "Fix cannon angle, improve \"Extra Ball!\" text, lengthen stems",
		"prompt": "- Fix angle of cannon visual.\n- Improve contrast of \"Extra Ball!\" text, and animate it.\n- Increase average size of stems.",
		"id": "R8yeOf2lR8EG3b8pH"
	},
	{
		"commitSummary": "Improve cannon visuals and fix firing location",
		"prompt": "Improve the cannon visuals, and make it fire from the correct location.",
		"id": "lqwzDzm0XYVQeUwDM"
	},
	{
		"commitSummary": "Add \"Total Miss - Free Ball\", triangles for catcher, and tweak cannon visuals",
		"prompt": "- Add \"Total Miss - Free Ball\" condition\n- Add triangles to either side of the ball reclamation target that bounce the ball.\n- Make the cannon look less like a penis.",
		"id": "aSGLyGuZLoi5UGGCi"
	},
	{
		"commitSummary": "Add \"Total Miss - Free Ball\" message, and try to tweak catcher triangles",
		"prompt": "- The triangles of the catcher should be both facing up.\n- The catcher should be flush with the bottom.\n- The message \"Total Miss - Free Ball\" should show when you fire and lose the ball without gaining any points.",
		"id": "YlmkP9lcm7iCf05c4"
	},
	// ----------------
	{
		"commitSummary": "Add game bounds, and try to fix catcher triangles",
		"prompt": "- The triangles of the catcher should be both facing up, not sideways.\n- Make the bounds of the game clear, and center the game on the page.",
		"id": "ZmPdPKykkROgyy0PX"
	},
	{
		"commitSummary": "Add sound effects (missing audio files)",
		"prompt": "Add sound effects.",
		"id": "1njNi1mbbxerXoEMZ"
	},
	{
		"commitSummary": "Use Web Audio API for procedural sound effects",
		"prompt": "Use Web Audio API for procedural sound effects instead. Make a soft tone when you collect leaves that gets higher in pitch for each leaf during the shot.",
		"id": "IQ9jKY2rRnPULcyRg"
	},
	{
		"commitSummary": "Use 50 oriented boxes per stem for physics",
		"commitNote": `Note:
As soon as I took a look at the code the AI was generating, I saw why
the collision was broken. The collision bodies for the stems were
polygons constructed from the points of the curves, thus, closed shapes.
This explains why it was colliding with the empty space near the stems.`,
		"prompt": "Define the physics bodies for the stems using a series of 50 oriented boxes.",
		"id": "LfnXxtGxK6wqd5ckG"
	},
	{
		"commitSummary": "Make stems fall when leaves are gone or ball rests",
		"prompt": "- If all the leaves of a stem are gone, make the stem fall similar to the leaves.\n- If the ball comes to rest (say, staying within 5px for 1/2 a second), make the stems fall that it has been in contact with in the past few frames (say, 1/10 of a second)",
		"id": "SEFj1HmDYVRhrAktn"
	},
	{
		"commitSummary": "Add win condition and multiple levels",
		"prompt": "- Add win condition\n- Add multiple levels",
		"id": "kET1kn6MUiy6g9oPP"
	},
	{
		"commitSummary": "Add sound effects for stems falling and catching balls (and try to fix catcher triangles)",
		"prompt": "- Use a rustling sound for the stems falling.\n- Use a complex choral sound with a staggered attacks for getting a ball in the catcher.\n- Make the triangles at the sides of the catcher point up instead of right.",
		"id": "T8MNIPBR65sjuv2Ea"
	},
	{
		"commitSummary": "Fix angle of triangles",
		"commitNote": `FINALLY. I really had to spell it out for the AI.`,
		"prompt": "Add angle: Math.PI / 2 to triangles",
		"id": "LXFnubGCibmKSbvP8"
	},
	// {
	// 	"commitSummary": "Tweak sound effects for stems falling and level win",
	// 	"commitNote": `Note:
	// I ran into the limit of the AI's willingness to reproduce existing unchanged code.`,
	// 	"prompt": "For the stem falling, play a bunch of separate cracks/pops, for a better crunchier sound.\nFor the level win, play a set of choral ascending arpeggios.",
	// 	"id": "pFo63qPDtjfeDCGqP"
	// },
	// ------------
	{
		"commitSummary": "Add multiplier & goal leaves, and improve SFX",
		"commitNote": `Note:
I was running up against the AI's willingness to output unchanged code,
rather than eliding it, so I had to tell it to change more at once.
I had to use the "!continue" command in websim for the first time,
since the output was getting long.
Also, the multiplier leaf doesn't change every shot like I wanted.
I guess "turn" was a bit of a weird turn of phrase... no pun intended!`,
		"prompt": `- For the stem falling, play a bunch of separate cracks/pops, for a better crunchier sound, and to fix an error when multiple stems are broken at once.
- For the level win, play a series of choral ascending arpeggios.
- Rename the "target" the "catcher".
- Move the triangles of the catcher down so they're flush with the bottom.
- Add a debug mode for the physics.
- Pick a random leaf each turn that will increase a score multiplier if collected (purple)
- Pick a random set of leaves at the start of the level that are required to pass the level (orange)`,
		"id": "DbDNRR7MGycY8NBex",
	},
];

async function downloadVersions(versions, outputDirectory, outputFileName) {
	const fs = require("fs");
	const { mkdir, writeFile, unlink } = require("fs/promises");
	const { Readable } = require('stream');
	const { finished } = require('stream/promises');
	const path = require("path");
	const { promisify } = require('util');
	const exec = promisify(require('child_process').exec)

	const downloadFile = (async (url, destination) => {
		const res = await fetch(url);
		const fileStream = fs.createWriteStream(destination, { flags: 'w' }); // allowing overwrites
		await finished(Readable.fromWeb(res.body).pipe(fileStream));
	});

	for (let i = 0; i < versions.length; i++) {
		const v = i + 1;
		const { id, prompt, commitSummary, commitNote } = versions[i];
		// Skip if already committed
		const { stdout, stderr } = await exec(`git log --oneline --fixed-strings --grep=${id}`);
		if (stderr) {
			console.error("Error from git log:", stderr);
			return;
		}
		if (stdout) {
			console.log(`Skipping version ${v} with ID ${id} as it is already mentioned in commit ${stdout.trim()}`);
			continue;
		}
		// Download the version
		const dlUrl = `https://party.websim.ai/api/v1/sites/${id}/html?raw=true`;
		const outputFilePath = `${outputDirectory}/${outputFileName}`;
		await mkdir(outputDirectory, { recursive: true });
		console.log(`Downloading version ${v} to ${outputFilePath}`);
		await downloadFile(dlUrl, outputFilePath);
		// Commit the version
		await exec(`git add ${outputFilePath}`);
		console.log(`Added version ${v} to git staging area`);
		const commitMessage = `${commitSummary || `Version ${v}`}

WebSim version link: https://websim.ai/c/${id}

Automatically downloaded from ${dlUrl}
via dl-websim-versions.js
${commitNote ? `\n${commitNote}\n` : ''}
LLM prompt:
${prompt}`;
		const commitMessageFile = "commit-message.txt";
		await writeFile(commitMessageFile, commitMessage);
		await exec(`git commit -F ${commitMessageFile}`);
		await unlink(commitMessageFile);
		console.log(`Committed version ${v}`);
	}
}
if (typeof window === 'undefined') {
	downloadVersions(versions, 'websim-version', 'oregano.html');
} else {
	collectVersionsInteractively();
}
