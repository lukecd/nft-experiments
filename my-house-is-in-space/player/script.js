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

const dancerRadius = 20;
const danceFloorRadius = canvas.width / 2 - 2 * dancerRadius - 20;
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
		this.rOffset = 0;
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

		// when we dance, we swap from being a circle to being an amorphous blob
		this.wobbleIncrement = 0;
		// use this to change the size of the blob
		this.radius = dancerRadius * 3;
		// think of this as detail level
		// number of conections in the `bezierSkin`
		this.segments = 24;
		this.step = (Math.PI * 2) / this.segments;
		this.anchors = [];
		this.radii = [];
		this.thetaOff = [];

		const bumpRadius = 100;
		const halfBumpRadius = bumpRadius / 2;

		for (let i = 0; i < this.segments + 2; i++) {
			this.anchors.push(0, 0);
			this.radii.push(Math.random() * bumpRadius - halfBumpRadius);
			this.thetaOff.push(Math.random() * Math.PI * 2);
		}

		this.theta = 0;
		this.thetaRamp = 0;
		this.thetaRampDest = 24;
		this.rampDamp = 25;
		this.SCALE = 0.42;
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
			console.log("do move moveId=", moveId);
			this.shouldSatellite = false;
			this.shouldSlide = false;
			switch (moveId) {
				case 1:
					this.shouldSlide = true;
					const r = (danceFloorRadius - 90) * Math.sqrt(Math.random());
					const theta = Math.random() * 2 * Math.PI;
					this.slideX = centerX + r * Math.cos(theta);
					this.slideY = centerY + r * Math.sin(theta);
					break;
				case 2:
					this.shouldSatellite = true;
			}

			this.lastGrooveTime = new Date().getTime() / 1000;
		}
	}

	update(x, y, r) {
		this.xOffset = x;
		this.yOffset = y;
		this.rOffset = r;
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
	}

	draw() {
		// have we moved to dance mode
		if (this.hasCentered) {
			// switch to blob mode
			// based on https://stackoverflow.com/questions/69286992/corner-blob-animation
			this.thetaRamp += (this.thetaRampDest - this.thetaRamp) / this.rampDamp;
			this.theta += 0.03;

			this.anchors = [0, this.radius];
			for (let i = 0; i <= this.segments + 2; i++) {
				const sine = Math.sin(this.thetaOff[i] + this.theta + this.thetaRamp);
				const rad = this.radius + this.radii[i] * sine;
				const theta = this.step * i;
				const x = rad * Math.sin(theta);
				const y = rad * Math.cos(theta);
				this.anchors.push(x, y);
			}

			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(Math.PI / 2);
			ctx.scale(this.SCALE, this.SCALE);
			ctx.fillStyle = this.color;
			ctx.beginPath();
			ctx.moveTo(0, 0);
			this.bezierSkin(this.anchors, false);
			ctx.lineTo(0, 0);
			ctx.fill();
			ctx.restore();

			if (this.shouldSatellite) {
				this.satellites.forEach((satellite) => {
					satellite.draw(this.x + this.xOffset, this.y + this.yOffset);
				});
			}
		} else {
			ctx.beginPath();
			ctx.fillStyle = this.color;
			ctx.arc(
				this.x + this.xOffset,
				this.y + this.yOffset,
				dancerRadius + this.rOffset,
				0,
				2 * Math.PI,
				false,
			);
			ctx.fill();
		}
	}

	// array of xy coords, closed boolean
	bezierSkin(bez, closed = true) {
		const avg = this.calcAvgs(bez);
		const leng = bez.length;

		if (closed) {
			ctx.moveTo(avg[0], avg[1]);
			for (let i = 2; i < leng; i += 2) {
				let n = i + 1;
				ctx.quadraticCurveTo(bez[i], bez[n], avg[i], avg[n]);
			}
			ctx.quadraticCurveTo(bez[0], bez[1], avg[0], avg[1]);
		} else {
			ctx.moveTo(bez[0], bez[1]);
			ctx.lineTo(avg[0], avg[1]);
			for (let i = 2; i < leng - 2; i += 2) {
				let n = i + 1;
				ctx.quadraticCurveTo(bez[i], bez[n], avg[i], avg[n]);
			}
			ctx.lineTo(bez[leng - 2], bez[leng - 1]);
		}
	}

	// create anchor points by averaging the control points
	calcAvgs(p) {
		const avg = [];
		const leng = p.length;
		let prev;

		for (let i = 2; i < leng; i++) {
			prev = i - 2;
			avg.push((p[prev] + p[i]) / 2);
		}
		// close
		avg.push((p[0] + p[leng - 2]) / 2, (p[1] + p[leng - 1]) / 2);
		return avg;
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
			dancer.update(xOffset, yOffset, rOffset);
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
