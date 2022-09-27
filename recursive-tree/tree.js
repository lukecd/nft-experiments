const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const bgColor = "#FFF338";
const colors = ["#0CECDD", "#FF67E7", "#C400FF"];
const width = canvas.width;
const height = canvas.height;

drawBackground();
drawTree(250, 500, 60, -Math.PI / 2, 12, 15, colors[0], colors[1], colors[2]);

class Tree {}

function drawTree(startX, startY, length, angle, depth, branchWidth, color1, color2, color3) {
	const rand = Math.random;
	var newLength,
		newAngle,
		newDepth,
		maxBranch = 3,
		endX,
		endY,
		maxAngle = (2 * Math.PI) / 6,
		subBranches;

	ctx.beginPath();
	ctx.moveTo(startX, startY);
	endX = startX + length * Math.cos(angle);
	endY = startY + length * Math.sin(angle);
	ctx.lineCap = "round";
	ctx.lineWidth = branchWidth;
	ctx.lineTo(endX, endY);

	if (depth <= 2) {
		ctx.strokeStyle = color2;
	} else {
		ctx.strokeStyle = color1;
	}
	ctx.stroke();
	newDepth = depth - 1;

	if (!newDepth) {
		if (Math.random() >= 0.99) {
			ctx.beginPath();
			ctx.fillStyle = color3;
			ctx.arc(startX, startY, 5, 0, 2 * Math.PI);
			ctx.fill();
		}

		return;
	}
	subBranches = rand() * (maxBranch - 1) + 1;
	branchWidth *= 0.7;

	for (var i = 0; i < subBranches; i++) {
		newAngle = angle + rand() * maxAngle - maxAngle * 0.5;
		newLength = length * (0.7 + rand() * 0.3);
		//рекурсивный вызов функции с новыми параметрами
		drawTree(endX, endY, newLength, newAngle, newDepth, branchWidth, color1, color2, color3);
	}
}

function drawBackground() {
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
