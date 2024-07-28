# Oregano: Websim Version

This prototype of the game was made with natural language on [Websim](https://websim.ai/).

It was exported to git using [`dl-websim-versions.js`](../scripts/dl-websim-versions.js).


## Development

Look in `dl-websim-versions.js` for the ID of the latest version of the project on Websim,
and open the URL `https://websim.ai/c/<ID>` in your browser.

Then enter LLM prompts into the virtual address bar.

To download the latest version of the project from Websim, add entries to the `versions` array in `dl-websim-versions.js` (automatically as described, or manually) and run:

```shell
node scripts/dl-websim-versions.js
```

It will skip downloading versions that are already committed to git, and commit the new versions to git.

## Notes

- I ran into the limits of the AI's willingness to output code unchanged (it starts to really want to elide things with comments saying "`// The rest of the code is unchanged`" or many variations), so you may need to check the output for this sort of thing if it doesn't work.
- It was also getting long enough that it was pretty slow to produce a new version, and I had to use Websim's `!continue` command to get it to finish.
- I don't plan to use the AI's code directly. I did that with jengle-gym and ended up with a long tail of bullshit that I slowly discovered - stupid variable names, hardcoded values, tech debt like multiple WebGL contexts, etc. - which I did manage to reel in, but it feels like it would have been easier, or at least less annoying, to have started from scratch, and only pulled in the AI's code as desired.


## Issues


I don't plan to use the AI's code directly, but I wanted to review it to remind myself how bad the AI's code can be.  

I find it's very important to step back and restructure code to match new requirements (especially *before* implementing new features),
but the AI takes a lot of structure as a given, which is useful when doing one-off changes, but problematic when the AI is building repeatedly on top of its own output.

It can and does restructure things, and perhaps if I had asked it to refactor the code every other step, it would have been better.
But I wasn't looking at the code it was producing, most of the time, I was looking at the game it was producing, which is part of the fun of Websim.

Here are some problems I noticed with the code:
- `function makeStermFall` (even computers make typos)
- `if (lastBallPositions.length > 30) { // 1/2 second at 60 FPS` sure but this is frame-rate dependent
- `if (lastBallPositions.length === 30) {` also hardcoded, on the line following that conditional
- `ctx.fillStyle = '#8B4513';` bad color choice for oregano stems
- in `makeStermFall`, it leaves leaves in the air (if stem is broken due to ball resting on it)
- `leaf.stemAngle += 0.1; // Rotate the stem as it falls` what? you mean rotate the leaf as it falls, right?
- `if (leaf.active || leaf.falling) {` sigh... why? This is for drawing the leaf. active and falling are mutually exclusive, aren't they? should just have one or the other and no condition here... right!?
- drawing code is mixed with simulation
- `#score, #ballsLeft, #level, #multiplier` and `#restartButton, #nextLevelButton, #resetBallButton, #debugToggle` in CSS instead of classes
- `// Catcher (formerly target)` didn't really need the note
- `// Bounce triangles` apt but stupid name
- `// Set multiplier leaf` happens only once per level, and color may be overridden if it's also a required leaf
- `const numRequiredLeaves = Math.min(3 + currentLevel, leaves.length);` level-based logic is scattered throughout the code
- `ballsLeft = 10 + currentLevel * 2; // Increase starting balls with each level` wouldn't want it to get more difficult over time

Some more general problems:
- relying on CDN of course (that's necessary for Websim)
- selection isn't prevented (of course - the AI never handles this without asking for it)
- near `const ballContacted = Matter.Query.collides(ball, stem.bodies);` it ignored part of my request, for it to remember what has collided recently; the instantaneous check *works*, but it would probably work better if it broke what had been collided within a few frames, at the same exact time (so as to limit the chaos of which direction the ball goes next), and then maybe used a timer to prevent breaking things for a bit (imagine a bunch of closely nested platforms, like rungs of a ladder; if it doesn't gain enough speed before getting to the next one, it might instantly break all of them as it reaches them, which might look bad)
- balls sometimes don't bounce off walls, just ZERO the velocity and go straight down, which is really bad for a game like this
- balls sometimes bounce at weird angles off the stems, possibly due to them being a bunch of separate oriented rectangles
  - The matter.js "bridge" example uses *rounded* (chamfered) shapes, which would probably help a lot
- balls sometimes go through the stems; perhaps it needs smaller time-steps or similar fine-tuning
- leaves can be placed off screen where you can't reach them
- leaves can be placed directly on the cannon
- stem fragments are collidable, and if a bunch of them fall on a stem and then the ball falls on the fragments, it fails to trigger the ball rest logic, because there's no stem directly colliding with the ball for it to break
- level complete screen shows before the winning shot is finished; the score updates, which is good I guess, but it's not very solid feeling to update the score after winning.
- ball can be completely overlapped by leaf without collecting it; I think the hit box is toward the stem, which makes sense in a way, but it's unsatisfying
- I didn't really want the stems to disintegrate
- debug mode and reset ball buttons get in the way; UI should be separate from the playing area
