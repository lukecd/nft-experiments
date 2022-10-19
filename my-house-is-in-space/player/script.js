/* #009C95 #F6F3A6 #FFC438 #E99204 #DF7701 */
// https://arweave.net/QDMblj7sCgLiD_zVfzCuMQ5guyqKEb2kJD_Obwsypcg
// MP3

// https://arweave.net/QJN3KMAnCHA2Mx4mNlaZ70PxIk45SV6lnFysYhMtho4
// WAV

const container = document.getElementById("container");
const canvas = document.getElementById("nftCanvas");
const ctx = canvas.getContext("2d");

const height = canvas.height;
const width = canvas.width;
const centerX = width / 2;
const centerY = height / 2;

const tempCanvas = document.createElement("canvas");
const tempCtx = tempCanvas.getContext("2d");
tempCanvas.width = width;
tempCanvas.height = height;

const dancerRadius = 20;
const danceFloorRadius = canvas.width / 2 - 2 * dancerRadius - 20;
const innerDanceFoorRadius = danceFloorRadius / 2;

const nCircles = 20;
const startAngle = 15.0;

let audioMp3;
let audioSource;
let analyser;
let bufferLength;
let dataArray;

let songPlaying = false;
// let bgColor = "#009C95";
// let colors = ["#F6F3A6", "#FFC438", "#E99204", "#DF7701"];
// let bgColor = "#000000";
// let colors = ["#04CFDA", "#9DD000", "#FF036B", "#FF3B00"];
let bgColor = "#3F2D39";
let colors = ["#ED353F", "#F04A24", "#F06D68", "#F78A23"];

const scale = (number, inMin, inMax, outMin, outMax) => {
	return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

const randomInt = (min, max) => {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1) + min); // The maximum is inclusive and the minimum is inclusive
};

const randomFloat = (min, max) => {
	return Math.random() * (max - min) + min;
};

// from https://stackoverflow.com/questions/5092808/how-do-i-randomly-generate-html-hex-color-codes-using-javascript
const randomColorHex = () => {
	return "#000000".replace(/0/g, function () {
		return (~~(Math.random() * 16)).toString(16);
	});
};

// from https://stackoverflow.com/questions/4479475/javascript-color-palette-generator-formula-for-generating-array-of-intermediat
function lerp(a, b, fac) {
	let ret = [];

	for (let i = 0; i < Math.min(a.length, b.length); i++) {
		ret[i] = a[i] * (1 - fac) + b[i] * fac;
	}

	return new Color().setRGB(ret[0], ret[1], ret[2]).toString();
}

// from https://stackoverflow.com/questions/4479475/javascript-color-palette-generator-formula-for-generating-array-of-intermediat
function lerpColors(begin, end, n) {
	let ret = [];

	for (var i = 0; i < n; i++) {
		let fac = i / (n - 1);
		ret.push(lerp(begin.toRGBArray(), end.toRGBArray(), fac));
	}

	return ret;
}

const generateColorPalette = (hex1, hex2, paletteSize) => {
	return lerpColors(new Color(hex1), new Color(hex2), paletteSize);
};

class Satellite {
	constructor(distanceFromDancer, r, color) {
		this.distanceFromDancer = distanceFromDancer;
		this.r = r;
		this.color = color;
		this.orbitAngle = 0; // degrees relative to x axis
		this.orbitAngleDelta = 2 * Math.pow(distanceFromDancer, -1.5);
		this.lineWidth = randomInt(1, 3);
	}

	draw(dancerX, dancerY) {
		const satX = dancerX + this.distanceFromDancer * Math.cos(this.orbitAngle);
		const satY = dancerY + this.distanceFromDancer * Math.sin(this.orbitAngle);

		// draw the circle
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.arc(satX, satY, this.r, 0, 2 * Math.PI, false);
		ctx.fill();

		// connect to dancer
		// ctx.beginPath();
		// ctx.moveTo(dancerX, dancerY);
		// ctx.lineTo(satX, satY);
		// ctx.strokeStyle = this.color;
		// ctx.lineWidth = this.lineWidth;
		// ctx.stroke();

		this.orbitAngle = (this.orbitAngle + this.orbitAngleDelta) % 360;
	}
}

class Dancer {
	constructor(x, y, color) {
		this.x = x;
		this.y = y;
		this.originalX = x;
		this.originalY = y;
		this.color = color;
		this.xOffset = 0;
		this.yOffset = 0;
		this.rOffset = 5;
		// each "Dancer" exists in 2 states, "groove mode"
		// where it sits around the edge of the circle
		// and "dance mode" where it jumps in the middle of the circle
		// and busts a move.
		this.amGrooving = true;

		this.hasCentered = false;
		this.lastGrooveTime = new Date().getTime() / 1000;
		this.shouldSatellite = false;
		this.shouldSlide = false;

		// when dancing, a dancer can throw their arms / satellites around
		this.satellites = [];
		const numSatellites = randomInt(1, 4);
		for (let i = 0; i < numSatellites; i++) {
			this.satellites[i] = new Satellite(
				dancerRadius * 2.5 * (i + 1),
				dancerRadius / (i + 2),
				colors[randomInt(0, colors.length - 1)],
			);
		}

		// setup blob points based on centerX, centerY
		this.updateBlobPoints(centerX, centerY, 100);
	}

	updateBlobPoints(newX = centerX, newY = centerY, outerAnchorRadius) {
		this.numPoints = 50;
		this.blobPoints = [];
		this.anchorPoints = [];
		let angle = (Math.PI * 2) / this.numPoints;

		const s = Math.sin(angle);
		const blobRadius = this.rOffset;
		const innerAnchorRadius = 1;
		//const outerAnchorRadius = blobRadius * 50;
		for (let i = 0; i < this.numPoints; i++) {
			let phi = angle * i;
			this.blobPoints.push({
				x: newX + blobRadius * Math.cos(phi),
				y: newY + blobRadius * Math.sin(phi),
				vx: Math.random(),
				vy: Math.random(),
			});
		}
		// const howManyToShift = randomInt(1, 5);
		// for (let i = 0; i < howManyToShift; i++) {
		// 	this.blobPoints.unshift(this.blobPoints.pop());
		// }
		angle = (Math.PI * 2) / (this.numPoints * 2);
		for (let i = 0; i < this.numPoints * 2; i++) {
			let phi = angle * i;
			const inOrOut = Math.random();
			const innerX = newX + innerAnchorRadius * Math.cos(phi);
			const innerY = newY + innerAnchorRadius * Math.sin(phi);
			const outerX = newX + outerAnchorRadius * Math.cos(phi);
			const outerY = newY + outerAnchorRadius * Math.sin(phi);

			if (inOrOut > 0.5) {
				this.anchorPoints.push({
					curX: innerX,
					curY: innerY,
					minX: innerX >= newX ? innerX : outerX,
					minY: innerY >= newY ? innerY : outerY,
					maxX: outerX >= newX ? outerX * this.rOffset : innerX,
					maxY: outerY >= newY ? outerY * this.rOffset : innerY,
					vx: Math.random() / 10,
					vy: Math.random() / 10,
				});
			} else {
				this.anchorPoints.push({
					curX: outerX,
					curY: outerY,
					minX: innerX >= newX ? innerX : outerX,
					minY: innerY >= newY ? innerY : outerY,
					maxX: outerX >= newX ? outerX * this.rOffset : innerX,
					maxY: outerY >= newY ? outerY * this.rOffset : innerY,
					vx: -Math.random() / 10,
					vy: -Math.random() / 10,
				});
			}
		}
		// for (let i = 0; i < howManyToShift * 2; i++) {
		// 	this.anchorPoints.unshift(this.anchorPoints.pop());
		// }
	}

	groove() {
		this.amGrooving = true;
		this.hasCentered = false;
		this.shouldSatellite = false;
		this.shouldSlide = false;
	}

	dance() {
		this.amGrooving = false;
	}

	doMove() {
		const curSecs = new Date().getTime() / 1000;
		if (curSecs - this.lastGrooveTime >= 2) {
			const moveId = randomInt(1, 2);
			this.shouldSatellite = false;
			this.shouldSlide = false;
			switch (moveId) {
				case 1:
					this.shouldSlide = true;
					const r = innerDanceFoorRadius * Math.sqrt(Math.random());
					const theta = Math.random() * 2 * Math.PI;
					this.slideX = centerX + r * Math.cos(theta);
					this.slideY = centerY + r * Math.sin(theta);
					// this.anchorPoints[0].maxX = this.slideX;
					// this.anchorPoints[0].maxY = this.slideY;
					//this.updateBlobPoints(this.slideX, this.slideY);
					break;
				case 2:
					this.shouldSatellite = true;
			}

			this.lastGrooveTime = new Date().getTime() / 1000;
		}
	}

	update(x, y, r, frequency) {
		this.xOffset = x;
		this.yOffset = y;
		this.rOffset = r;
		this.updateBlobPoints(centerX, centerY, frequency + audioMp3.currentTime);
		// have we moved to dance mode
		if (!this.amGrooving && !this.hasCentered) {
			// move to center
			if (this.x > centerX) this.x -= 0.5;
			else if (this.x < centerX) this.x += 0.5;
			if (this.y > centerY) this.y -= 0.5;
			else if (this.y < centerY) this.y += 0.5;

			// if we're roughly at center, set with boolean
			if (Math.ceil(this.x) == centerX) this.hasCentered = true;
		}

		if (this.amGrooving) {
			// move to circumference
			if (this.x > this.originalX) this.x -= 0.5;
			else if (this.x < this.originalX) this.x += 0.5;
			if (this.y > this.originalY) this.y -= 0.5;
			else if (this.y < this.originalY) this.y += 0.5;
		}

		if (this.shouldSlide) {
			// move to slide location
			if (this.x > this.slideX) this.x -= 0.5;
			else if (this.x < this.slideX) this.x += 0.5;
			if (this.y > this.slideY) this.y -= 0.5;
			else if (this.y < this.slideY) this.y += 0.5;
		}

		if (this.hasCentered) {
			bgColor = this.color;
			this.updateBlobPoints(centerX, centerY, frequency * 1.1);
			// since we've centered we should start playing with the anchor points
			for (let i = 0; i < this.anchorPoints.length; i++) {
				this.anchorPoints[i].curX += this.anchorPoints[i].vx;
				this.anchorPoints[i].curY += this.anchorPoints[i].vy;
				if (this.anchorPoints[i].curX >= this.anchorPoints[i].maxX) {
					this.anchorPoints[i].vx = -Math.abs(this.anchorPoints[i].vx);
				} else if (this.anchorPoints[i].curX <= this.anchorPoints[i].minX) {
					this.anchorPoints[i].vx = Math.abs(this.anchorPoints[i].vx);
				}
				if (this.anchorPoints[i].curY >= this.anchorPoints[i].maxY) {
					this.anchorPoints[i].vy = -Math.abs(this.anchorPoints[i].vy);
				} else if (this.anchorPoints[i].curY <= this.anchorPoints[i].minY) {
					this.anchorPoints[i].vy = Math.abs(this.anchorPoints[i].vy);
				}
			}
		}
	}

	draw() {
		// have we moved to dance mode
		if (this.hasCentered) {
			// blob mode
			// testing code, draw each point as a dot so we can see structure
			// for (let i = 0; i < this.blobPoints.length; i++) {
			// 	ctx.beginPath();
			// 	ctx.fillStyle = "#FFFFFF";
			// 	ctx.arc(this.blobPoints[i].x, this.blobPoints[i].y, 2, 0, 2 * Math.PI, false);
			// 	ctx.fill();
			// 	ctx.font = "20px Arial";
			// 	ctx.fillText(i, this.blobPoints[i].x, this.blobPoints[i].y);
			// }
			// for (let i = 0; i < this.innerAnchorPoints.length; i++) {
			// 	ctx.beginPath();
			// 	ctx.fillStyle = "#000000";
			// 	ctx.arc(this.innerAnchorPoints[i].x, this.innerAnchorPoints[i].y, 2, 0, 2 * Math.PI, false);
			// 	ctx.fill();
			// 	ctx.beginPath();
			// 	ctx.fillStyle = "#000000";
			// 	ctx.arc(this.outerAnchorPoints[i].x, this.outerAnchorPoints[i].y, 2, 0, 2 * Math.PI, false);
			// 	ctx.fill();
			// 	ctx.font = "20px Arial";
			// 	ctx.fillText(i, this.outerAnchorPoints[i].x, this.outerAnchorPoints[i].y);
			// }
			// let region = new Path2D();
			// for (let i = 0; i < this.blobPoints.length; i++) {
			// 	region.moveTo(this.blobPoints[i].x, this.blobPoints[i].y);
			// 	if (i + 1 === this.blobPoints.length) {
			// 		region.quadraticCurveTo(
			// 			this.anchorPoints[this.anchorPoints.length - 1].curX,
			// 			this.anchorPoints[this.anchorPoints.length - 1].curY,
			// 			this.blobPoints[0].x,
			// 			this.blobPoints[0].y,
			// 		);
			// 	} else {
			// 		region.quadraticCurveTo(
			// 			this.anchorPoints[i * 2 + 1].curX,
			// 			this.anchorPoints[i * 2 + 1].curY,
			// 			this.blobPoints[i + 1].x,
			// 			this.blobPoints[i + 1].y,
			// 		);
			// 	}
			// }
			// ctx.clip(region);
			// ctx.fillStyle = this.color;
			// ctx.fillRect(0, 0, width, height);

			for (let i = 0; i < this.blobPoints.length; i++) {
				ctx.beginPath();
				ctx.moveTo(this.blobPoints[i].x, this.blobPoints[i].y);
				if (i + 1 === this.blobPoints.length) {
					ctx.quadraticCurveTo(
						this.anchorPoints[this.anchorPoints.length - 1].curX,
						this.anchorPoints[this.anchorPoints.length - 1].curY,
						this.blobPoints[0].x,
						this.blobPoints[0].y,
					);
				} else {
					ctx.quadraticCurveTo(
						this.anchorPoints[i * 2 + 1].curX,
						this.anchorPoints[i * 2 + 1].curY,
						this.blobPoints[i + 1].x,
						this.blobPoints[i + 1].y,
					);
				}
				// ctx.strokeStyle = colors[randomInt(0, colors.length - 1)];
				ctx.strokeStyle = colors[Math.floor(i % colors.length)];
				ctx.lineWidth = randomInt(1, 9);
				ctx.stroke();
				ctx.closePath();
				ctx.fill();
			}
			// ctx.arc(centerX, centerY, 200, 0, 2 * Math.PI, false);
			// ctx.stroke();
			// ctx.clip();

			// cover up some of the starburst to create a dance floor
			// ctx.beginPath();
			// ctx.fillStyle = bgColor;
			// ctx.arc(centerX, centerY, innerDanceFoorRadius, 0, 2 * Math.PI, false);
			// ctx.closePath();
			// ctx.fill();

			// draw the dancer
			// ctx.beginPath();
			// ctx.fillStyle = this.color;
			// ctx.arc(this.x, this.y, 2 * this.rOffset, 0, 2 * Math.PI, false);
			// ctx.closePath();
			// ctx.fill();
		} else {
			// just draw normal style
			ctx.beginPath();
			ctx.strokeStyle = "#000000";
			ctx.fillStyle = this.color;
			ctx.arc(this.x + this.xOffset, this.y + this.yOffset, 2 * this.rOffset, 0, 2 * Math.PI, false);
			ctx.closePath();
			ctx.stroke();
			ctx.fill();
		}
	}
}

class DanceFloor {
	constructor() {
		this.dancers = [];
		this.init();
		this.dancerIndex = -1;
	}

	init() {
		const angle = Math.PI / nCircles;
		const s = Math.sin(angle);
		for (let i = 0; i < nCircles; ++i) {
			const phi = startAngle + angle * i * 2;
			const cx = width / 2 + (danceFloorRadius + dancerRadius) * Math.cos(phi);
			const cy = height / 2 + (danceFloorRadius + dancerRadius) * Math.sin(phi);
			const color = colors[randomInt(0, colors.length - 1)];
			this.dancers.push(new Dancer(cx, cy, color));
		}
	}

	releaseDancer() {
		// do we have an active dancer
		if (this.dancerIndex >= 0) {
			this.dancers[this.dancerIndex].groove();
		}
		this.dancerIndex = randomInt(0, this.dancers.length - 1);
		this.dancers[this.dancerIndex].dance();
	}

	dancerDance() {
		if (this.dancerIndex >= 0) {
			this.dancers[this.dancerIndex].doMove();
		}
	}

	update(frequency) {
		this.dancers.forEach((dancer) => {
			//	console.log(frequency);
			// let xOffset = randomFloat(-frequency, frequency);
			// let yOffset = randomFloat(-frequency, frequency);
			let xOffset = 0; //randomFloat(-5, 5);
			let yOffset = 0; //randomFloat(-5, 5);
			let rOffset = scale(frequency, 0, 256, 0, 10);
			if (frequency == 0) yOffset = 0;
			dancer.update(xOffset, yOffset, rOffset, frequency);
		});
	}

	draw() {
		this.dancers.forEach((dancer) => {
			dancer.draw();
		});
	}
}

const raveStyle = new DanceFloor();
const animate = () => {
	ctx.fillStyle = bgColor;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	if (songPlaying) {
		if (Math.floor(audioMp3.currentTime % 8) == 0) {
			raveStyle.releaseDancer();
		} else if (Math.floor(audioMp3.currentTime % 2) == 0) {
			raveStyle.dancerDance();
		}
		analyser.getByteFrequencyData(dataArray);
		for (let i = 0; i < bufferLength; i++) {
			raveStyle.update(dataArray[i]);
			raveStyle.draw();
		}
	} else {
		raveStyle.draw();
	}
	requestAnimationFrame(animate);
};
animate();

// temp
document.addEventListener("keyup", (event) => {
	console.log("key=", event.code);
	if (event.code === "Space") {
		if (raveStyle) raveStyle.releaseDancer();
	} else if (event.code === "Enter") {
		songPlaying = false;
		audioMp3.pause();
	} else if (event.code === "KeyJ") {
		// JUMp
	}
});

canvas.addEventListener("click", () => {
	audioMp3 = document.getElementById("nftAudio");

	audioMp3.loop = true;
	const audioCtx = new AudioContext();

	audioMp3.play();
	audioSource = audioCtx.createMediaElementSource(audioMp3);
	analyser = audioCtx.createAnalyser();
	audioSource.connect(analyser);
	analyser.connect(audioCtx.destination);
	analyser.fftSize = 64;
	bufferLength = analyser.frequencyBinCount;
	dataArray = new Uint8Array(bufferLength);
	songPlaying = true;
});
