const MEAN = (t, f) => t += f;
const fTimes = [0,0,0], bTimes = [...fTimes];
var pos = 0, prevTime, element, slide, warn, isWarning, maxWidth, showing = false, tick = 0, tock = false, tockName;
function frameRate(el, time, busy){
	if (prevTime) {
		bTimes[pos % bTimes.length] = busy;
		fTimes[(pos ++) % fTimes.length] = time - prevTime;
		const meanBusy = bTimes.reduce(MEAN, 0) / bTimes.length;
		const meanFPS = fTimes.reduce(MEAN, 0) / fTimes.length;
		el.textContent = "FPS: " + Math.round(1000 / meanFPS) + " Load: " + (meanBusy / (1000/60) * 100).toFixed(1) + "%";
		frameRate.busyFraction = meanBusy / (1000/60);
	}
	prevTime = time;
};
function simpleFrameRate(el, elSlide, warnStyleName = "slow", heartBeatTockName = "tock"){
	element = el;
	slide = elSlide;
	warn = warnStyleName;
	tockName = heartBeatTockName;
	isWarning = true;
	return fRateSimple;
}
function fRateSimple(time, busy){
	if (prevTime) {
		!showing && (showing = true, element.classList.remove("hide"), maxWidth = element.getBoundingClientRect().width - 5);
		(tick++) % 20 === 0 && ((tock = !tock) ? slide.classList.remove(tockName) : slide.classList.add(tockName));

		bTimes[pos % bTimes.length] = busy;
		fTimes[(pos ++) % fTimes.length] = time - prevTime;
		const meanBusy = bTimes.reduce(MEAN, 0) / bTimes.length / (1000/60);
		const busyW = Math.ceil((meanBusy % 1) ** (1/3) * maxWidth);
		const meanFPS = Math.round(1000 / (fTimes.reduce(MEAN, 0) / fTimes.length));
		if (meanFPS < 60 || meanBusy >= 1) {
			!isWarning && element.classList.add(warn);
			isWarning = true;
		} else {
			isWarning && element.classList.remove(warn);
			isWarning = false;
		}
		slide.style.width = (busyW < 1 ? 1 : busyW) + "px"
		frameRate.busyFraction = meanBusy;
	}
	prevTime = time;

};
export {frameRate, simpleFrameRate};