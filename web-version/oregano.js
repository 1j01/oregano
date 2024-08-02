
const canvas = document.getElementById('game-canvas');

const STEM_COLOR = "#d3e8ab";
const LEAF_COLOR = "#41963c";
const FLOWER_COLOR = "#f0e7fd";
const GOAL_LEAF_COLOR = "#ffde23";
const MULTIPLIER_LEAF_COLOR = "#b923ff";
const LEAF_COLOR_RAMP = ["#024c01", "#166a17", "#5fae5c", "#86bd76", "#9fc148",  "#c3df94", "#b9d9ac"];
const BALL_COLOR = "#ff0000";

// This is a very OOP-heavy sketch.
// I don't really like OOP, and this beginner-y-looking code is
// making GitHub Copilot suggest very inane things...
// I'm not attached to any of this, so I might start over again.
// The thing that made me want to use a class is the overall game state,
// in order to cleanly support multiple levels and a menu system.
// I'm not sure if I should use a class for each game object, though.

// I'm still not sure if I want to use a physics engine or not.
// matter.js seems to have problems with bounces stopping dead on walls
// at some angles (see the websim version), so it might be best to implement bespoke physics.
// Point based physics are pretty easy, and there don't need to be many object types.
// I guess I'm talking myself into it.
// The only tricky thing might be collision with bezier curves, but I should
// just need to get the normal at the point of collision and reflect the velocity.


class Stem {
	constructor(points) {
		this.points = points;
	}
	draw(ctx) {
		ctx.beginPath();
		ctx.moveTo(this.points[0].x, this.points[0].y);
		for (let i = 1; i < this.points.length; i++) {
			ctx.lineTo(this.points[i].x, this.points[i].y);
		}
		ctx.strokeStyle = STEM_COLOR;
		ctx.stroke();
	}
}

class Leaf {
	constructor(x, y, size) {
		this.x = x;
		this.y = y;
		this.size = size;
		this.isRequired = false;
		this.isMultiplier = false;
		this.collected = false;
	}
	draw(ctx) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
		ctx.fillStyle = this.isRequired ? GOAL_LEAF_COLOR : this.isMultiplier ? MULTIPLIER_LEAF_COLOR : LEAF_COLOR;
		ctx.fill();
	}
}

class Ball {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.radius = 10;
	}
	draw(ctx) {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		ctx.fillStyle = BALL_COLOR;
		ctx.fill();
	}
}

class Simulation {
	constructor() {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.stems = [];
		this.leaves = [];
		this.balls = [];
	}
	draw() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		for (const stem of this.stems) {
			stem.draw(this.ctx);
		}
		for (const leaf of this.leaves) {
			leaf.draw(this.ctx);
		}
		for (const ball of this.balls) {
			ball.draw(this.ctx);
		}
	}
	step(dt) {
	}
}

const sim = new Simulation();
sim.stems.push(new Stem([{ x: 100, y: 100 }, { x: 100, y: 200 }, { x: 200, y: 200 }]));
sim.leaves.push(new Leaf(100, 100, 10));
sim.leaves.push(new Leaf(100, 200, 10));
sim.balls.push(new Ball(150, 150));

let lastTime = 0;
function animate() {
	const time = performance.now();
	let dt = time - lastTime;
	lastTime = time;
	dt = Math.min(dt, 100);

	sim.step(dt);
	sim.draw();

	requestAnimationFrame(animate);
}

animate();
