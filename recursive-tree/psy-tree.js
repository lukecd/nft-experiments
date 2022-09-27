const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const bgColor = "#FFF338";
const colors = ["#0CECDD", "#FF67E7", "#C400FF"];
const width = canvas.width;
const height = canvas.height;

class Leaf {
	constructor(x, y, color) {
		this.x = x;
		this.y = y;
		this.color = color;
	}

	draw() {
		ctx.beginPath();
		ctx.strokeColor = bgColor;
		ctx.fillStyle = this.color;
		ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
		ctx.stroke();
		ctx.fill();
	}
}

class Tree {
	constructor(startX, startY, len, angle, depth, branchWidth, color1, color2, leafColor, earth) {
		this.color1 = color1;
		this.color2 = color2;
		this.leafColor = leafColor;
		this.startX = startX;
		this.startY = startY;
		this.depth = depth;
		this.branchWidth = branchWidth;
		this.earth = earth;

		this.firstDraw = true;
		this.hasPropigated = false;

		this.instructions = [];
		this.leaves = [];
		this.leafFallIndex = -1;
		this.maxLeaves = Math.floor(100 * Math.random());

		this.len = len;
		this.angle = angle;
		this.maxAngle = (2 * Math.PI) / 6;

		this.maxBranch = 2;
		this.subBranches = Math.random() * (this.maxBranch - 1) + 1;

		this.init(this.startX, this.startY, this.len, this.angle, this.depth, this.branchWidth);
	}

	shake() {
		if (this.leafFallIndex == -1) this.leafFallIndex = Math.floor(Math.random() * this.leaves.length);
		if (this.leaves[this.leafFallIndex].y >= height) {
			if (!this.hasPropigated) {
				this.earth.plantNewTree(
					this.leaves[this.leafFallIndex].x,
					this.leaves[this.leafFallIndex].color,
				);
				this.hasPropigated = true;
			}
		} else {
			this.leaves[this.leafFallIndex].y++;
		}
	}

	update() {}

	async draw() {
		// draw the tree
		for (let i = 0; i < this.instructions.length; i++) {
			ctx.beginPath();
			ctx.moveTo(this.instructions[i].startX, this.instructions[i].startY);
			const endX = this.instructions[i].endX;
			const endY = this.instructions[i].endY;
			ctx.lineCap = "round";
			ctx.lineWidth = this.instructions[i].lineWidth;
			ctx.lineTo(endX, endY);
			ctx.strokeStyle = this.instructions[i].color;
			ctx.stroke();
		}
		// draw the leaves
		for (let i = 0; i < this.leaves.length; i++) {
			this.leaves[i].draw();
		}
	}

	/**
	 * Recursive function used to define the tree. As this tree is constantly
	 * redrawn in an animation loop, we save processing power by only
	 * computing the design once, then we redraw it from the saved instructions.
	 */
	init(startX, startY, length, angle, depth, branchWidth) {
		let newLength;
		let newAngle;
		let newDepth;
		let maxAngle = (2 * Math.PI) / 6;

		let endX = startX + length * Math.cos(angle);
		let endY = startY + length * Math.sin(angle);

		let strokeColor;
		if (depth <= 2) {
			strokeColor = this.color2;
		} else {
			strokeColor = this.color1;
		}

		this.instructions.push({
			startX: startX,
			startY: startY,
			endX: endX,
			endY: endY,
			branchWidth: branchWidth,
			color: strokeColor,
		});
		newDepth = depth - 1;

		if (!newDepth) {
			// we're at the end of a branch, maybe add a leaf
			if (Math.random() >= 0.95) {
				this.leaves.push(new Leaf(startX, startY, this.leafColor));
			}

			return;
		}
		branchWidth *= 0.7;

		for (var i = 0; i < this.subBranches; i++) {
			newAngle = angle + Math.random() * maxAngle - maxAngle * 0.5;
			newLength = length * (0.7 + Math.random() * 0.3);
			this.init(endX, endY, newLength, newAngle, newDepth, branchWidth);
		}
	}
}

class Earth {
	constructor() {
		this.trees = [];
		this.maxTrees = 9;
		this.trees.push(
			new Tree(width / 2, height, 60, -Math.PI / 2, 12, 15, colors[0], colors[1], colors[2], this),
		);
	}

	/**
	 * Creates a new tree at x, height
	 */
	plantNewTree(x, leafColor) {
		// filter array
		const newColors = colors.filter((color) => color != leafColor);

		if (x <= 0) x = 10;
		if (x >= width) x = width - 10;
		this.trees.push(
			new Tree(x, 500, 60, -Math.PI / 2, 12, 15, leafColor, newColors[0], newColors[1], this),
		);
		if (this.trees.length >= this.maxTrees) this.trees.shift();
	}

	draw() {
		for (let i = 0; i < this.trees.length; i++) {
			this.trees[i].draw();
			this.trees[i].shake();
		}
	}
}

const earth = new Earth();
const drawAll = () => {
	// clear the background
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	earth.draw();
	requestAnimationFrame(drawAll);
};

drawAll();
