// This is a script to download all the versions of a websim.ai site to bring it into local version control.

// First, run this function in the console of the latest version, then jump to the oldest in the list and repeat, collecting the results in the correct order.
// They're using unsemantic HTML, with only presentational classes.
// I'll just use a temporary global for the list element (which isn't a list element, it's just a div, of course),
// by right clicking in the DOM inspector and selecting "Store as global variable" on the div that contains the list of versions.
// By the way, the nodes in this (non-semantic) list are presented in the reverse order from how they are in the DOM, as of 2024-07-27.
// Each capture should overlap by one version, so you can check that the duplicate versions are next to each other to ensure the correct order,
// then remove the duplicates and concatenate the lists.
function collectVersions(versionListDivElement) {
	const linkUrls = [...versionListDivElement.querySelectorAll(`a[href^='https://websim.ai/c/']`)].map(a => a.href);
	const prompts = [...versionListDivElement.querySelectorAll(`div.text-black.whitespace-pre-wrap.flex.flex-col.items-start.flex-1 > div > div > div > div > span > span`)].map((el) => el.textContent);
	// const associated = prompts.map((prompt, i) => ({ prompt, linkUrl: linkUrls[i], dlUrl: linkUrls[i].replace('websim.ai/c/', 'party.websim.ai/api/v1/sites/').replace(/\/$/, '') + '/html?raw=true' }));
	const associated = prompts.map((prompt, i) => {
		const id = linkUrls[i].match(/https:\/\/websim.ai\/c\/([^/]+)/)[1];
		return { prompt, id, /*linkUrl: linkUrls[i], dlUrl: `https://party.websim.ai/api/v1/sites/${id}/html?raw=true`*/ };
	});
	return associated;
}
// JSON.stringify(collectVersions(temp1), null, "\t")

// Note: I think it uses history.pushState/replacesState to change the URL without reloading the page, so I could have automated this further,
// by clicking on the earliest version, then running the function to collect the versions, aggregating the results automatically,
// (optionally) ensuring the order is correct via the duplicates, and removing the duplicates.

// Can add commit summaries with ChatGPT, with prompt:
// > Add short one-line `commitSummary` fields to these, based on the prompts. They can be the same as the prompt if it's short enough.

const versions = [
	{
		"commitSummary": "Initial game implementation with basic mechanics.",
		"prompt": "https://oregano.game/\n\nA Peggle clone called Oregano, where you strip leaves off of oregano stems by rolling a ball across them, fired from a cannon. The leaves float down and give you points.\n- The cannon aims towards the mouse and fires with click.\n- If the ball hits the bottom of the screen, you lose the ball. You have a set number of balls.\n- Stems are arced platforms with leaves on them. The ball bounces off the stems.\n- A moving target at the bottom of the screen allows you to reclaim a ball.",
		"id": "BRV6QblN1qA6SSurN"
	},
	{
		"commitSummary": "Add game over screen and Bezier curve stems.",
		"prompt": "- Add game over screen.\n- Make ball bounce off sides.\n- Define stems with bezier curves, and calculate positions along the stems to place the leaves.",
		"id": "s3tuQxdc9khOAUI3S"
	},
	{
		"commitSummary": "Add ball-stem collisions and round leaves.",
		"prompt": "- The ball must collide with the stems.\n- The ball should fall through the bottom, so that you can lose a ball.\n- The leaves should be round.",
		"id": "R2c3iBbzVID8a86kv"
	},
	{
		"commitSummary": "Add reset ball button and falling leaves with stems.",
		"prompt": "- Add button to reset the ball, losing the ball.\n- Make leaves fall when collected.\n- Give leaves a little stem.",
		"id": "Dk0RkKJJN0DLJccKe"
	},
	{
		"commitSummary": "Fix Bezier curve collision and game over handling.",
		"prompt": "- Fix bezier curve collision, which is offset in some cases.\n- Handle game over when resetting ball for the last ball.",
		"id": "2bWRpl2Cay9IW4Doe"
	},
	// ----------------
	{
		"commitSummary": "Properly reset game and make leaves pointed with stems.",
		"prompt": "- Properly reset the game when restarting.\n- Give each leaf a stem.\n- Make leaves slightly pointed.",
		"id": "2LIilyWZciFSVVKuQ"
	},
	{
		"commitSummary": "Make leaves fatter and fix their visual connection.",
		"prompt": "Make leaves fatter, and fix their visual connection to the stems.",
		"id": "46gvVD6YWOHIrIDNa"
	},
	{
		"commitSummary": "Adjust leaf shape and reduce cannon velocity.",
		"prompt": "- Make leaves slightly pointed, but fatter, almost circular\n- Reduce cannon velocity.",
		"id": "1TdYIsJ6uad74ZoFS"
	},
	{
		"commitSummary": "Avoid overlapping stems and enlarge reclamation target.",
		"prompt": "- Avoid overlapping stems.\n- Make the ball reclamation target larger.",
		"id": "HKx7jafO87d1t9kkx"
	},
	{
		"commitSummary": "Improve cannon appearance and add \"Extra Ball!\" message.",
		"prompt": "- Improve cannon appearance.\n- Show \"Extra Ball!\" when getting a free ball.\n- Increase the number of balls given at the start.",
		"id": "BxvsNVWhxhah57vMF"
	},
	{
		"commitSummary": "Fix cannon angle and animate \"Extra Ball!\" text.",
		"prompt": "- Fix angle of cannon visual.\n- Improve contrast of \"Extra Ball!\" text, and animate it.\n- Increase average size of stems.",
		"id": "R8yeOf2lR8EG3b8pH"
	},
	{
		"commitSummary": "Improve cannon visuals and fire from correct location.",
		"prompt": "Improve the cannon visuals, and make it fire from the correct location.",
		"id": "lqwzDzm0XYVQeUwDM"
	},
	{
		"commitSummary": "Add \"Total Miss - Free Ball\" condition and adjust cannon.",
		"prompt": "- Add \"Total Miss - Free Ball\" condition\n- Add triangles to either side of the ball reclamation target that bounce the ball.\n- Make the cannon look less like a penis.",
		"id": "aSGLyGuZLoi5UGGCi"
	},
	{
		"commitSummary": "Adjust catcher triangles and add \"Total Miss - Free Ball\" message.",
		"prompt": "- The triangles of the catcher should be both facing up.\n- The catcher should be flush with the bottom.\n- The message \"Total Miss - Free Ball\" should show when you fire and lose the ball without gaining any points.",
		"id": "YlmkP9lcm7iCf05c4"
	},
	// ----------------
	{
		"commitSummary": "Adjust catcher triangles and center the game.",
		"prompt": "- The triangles of the catcher should be both facing up, not sideways.\n- Make the bounds of the game clear, and center the game on the page.",
		"id": "ZmPdPKykkROgyy0PX"
	},
	{
		"commitSummary": "Add sound effects.",
		"prompt": "Add sound effects.",
		"id": "1njNi1mbbxerXoEMZ"
	},
	{
		"commitSummary": "Use Web Audio API for procedural sound effects.",
		"prompt": "Use Web Audio API for procedural sound effects instead. Make a soft tone when you collect leaves that gets higher in pitch for each leaf during the shot.",
		"id": "IQ9jKY2rRnPULcyRg"
	},
	{
		"commitSummary": "Define stem physics bodies with oriented boxes.",
		"prompt": "Define the physics bodies for the stems using a series of 50 oriented boxes.",
		"id": "LfnXxtGxK6wqd5ckG"
	},
	{
		"commitSummary": "Make stems fall when leaves are gone or ball rests.",
		"prompt": "- If all the leaves of a stem are gone, make the stem fall similar to the leaves.\n- If the ball comes to rest (say, staying within 5px for 1/2 a second), make the stems fall that it has been in contact with in the past few frames (say, 1/10 of a second)",
		"id": "SEFj1HmDYVRhrAktn"
	},
	{
		"commitSummary": "Add win condition and multiple levels.",
		"prompt": "- Add win condition\n- Add multiple levels",
		"id": "kET1kn6MUiy6g9oPP"
	},
	{
		"commitSummary": "Add sound effects for stems falling and catching balls.",
		"prompt": "- Use a rustling sound for the stems falling.\n- Use a complex choral sound with a staggered attacks for getting a ball in the catcher.\n- Make the triangles at the sides of the catcher point up instead of right.",
		"id": "T8MNIPBR65sjuv2Ea"
	},
	{
		"commitSummary": "Adjust angle of triangles.",
		"prompt": "Add angle: Math.PI / 2 to triangles",
		"id": "LXFnubGCibmKSbvP8"
	},
	{
		"commitSummary": "Add sound effects for stems falling and level win.",
		"prompt": "For the stem falling, play a bunch of separate cracks/pops, for a better crunchier sound.\nFor the level win, play a set of choral ascending arpeggios.",
		"id": "pFo63qPDtjfeDCGqP"
	},
	// ------------
];

async function downloadVersions(versions, outputDirectory, outputFileName) {
	const fs = require("fs");
	const { mkdir } = require("fs/promises");
	const { Readable } = require('stream');
	const { finished } = require('stream/promises');
	const path = require("path");
	const { promisify } = require('util');
	const exec = promisify(require('child_process').exec)

	const downloadFile = (async (url, destination) => {
	  const res = await fetch(url);
	  const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
	  await finished(Readable.fromWeb(res.body).pipe(fileStream));
	});

	let v = 1;
	for (const version of versions) {
		const { id, prompt, commitSummary } = version;
		const dlUrl = `https://party.websim.ai/api/v1/sites/${id}/html?raw=true`;
		const outputFilePath = `${outputDirectory}/${outputFileName}`;
		await mkdir(outputDirectory, { recursive: true });
		await downloadFile(dlUrl, outputFilePath);
		console.log(`Downloaded version ${v} to ${outputFilePath}`);
		await exec(`git add ${outputFilePath}`);
		console.log(`Added version ${v} to git staging area`);
		const commitMessage = `${commitSummary || `Version ${v}`}

Websim version link: https://websim.ai/c/${id}

Automatically downloaded from ${dlUrl}
via dl-websim-versions.js

LLM prompt:
${prompt}`;
		await exec(`git commit -F -`, { input: commitMessage });
		console.log(`Committed version ${v}`);
		v++;
	}
}
if (typeof window === 'undefined') {
	downloadVersions(versions, 'websim-version', 'oregano.html');
}
