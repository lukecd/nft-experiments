/* #009C95 #F6F3A6 #FFC438 #E99204 #DF7701 */
// https://arweave.net/QDMblj7sCgLiD_zVfzCuMQ5guyqKEb2kJD_Obwsypcg
// MP3

// https://arweave.net/QJN3KMAnCHA2Mx4mNlaZ70PxIk45SV6lnFysYhMtho4
// WAV

const container = document.getElementById("container");
const canvas = document.getElementById("nftCanvas");
const ctx = canvas.getContext("2d");

let audioSource;
let analyser;
let bgColor = "#009C95";
let colors = ["#F6F3A6", "#FFC438", "#E99204", "#DF7701"];

canvas.addEventListener("click", () => {
	let audioMp3 = document.getElementById("nftAudio");

	audioMp3.loop = true;
	const audioCtx = new AudioContext();

	audioMp3.play();
	audioSource = audioCtx.createMediaElementSource(audioMp3);
	analyser = audioCtx.createAnalyser();
	audioSource.connect(analyser);
	analyser.connect(audioCtx.destination);
	analyser.fftSize = 64;
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);

	const barWidth = canvas.width / bufferLength;
	let barHeight;
	let x;

	const scale = (number, inMin, inMax, outMin, outMax) => {
		return ((number - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
	};

	const animate = () => {
		x = 0;
		ctx.fillStyle = bgColor;
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		analyser.getByteFrequencyData(dataArray);
		const maxFrequencyData = Math.max(...dataArray);
		for (let i = 0; i < bufferLength; i++) {
			//barHeight = dataArray[i]; // lounder sounds, longer bars
			barHeight = scale(dataArray[i], 0, maxFrequencyData, 0, canvas.height);
			ctx.fillStyle = colors[Math.floor(scale(dataArray[i], 0, maxFrequencyData, 0, colors.length))];
			ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
			x += barWidth;
		}
		requestAnimationFrame(animate);
	};
	animate();
});
