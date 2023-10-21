import {Events} from "./Events.js";
import {Engine} from "./Engine.js";
import {Common} from "./Common.js";
class Running {
    fps = 60;
    //correction = 1;
    //counterTimestamp = 0;
    frameCounter = 0;
    //timePrev = null;
    //timeScalePrev = 1;
    //isFixed = true;
    enabled = false;
    delta;
    //deltaMin;
    //deltaMax;
    constructor(options) {
        this.delta            = options.delta ?? 1000 / (options.fps ?? this.fps);
        this.fps              = 1000 / this.delta;
        Events.for(this, "beforeTick,afterTick");
    } 
};
const Runner = (() => {
    const  event = { timestamp: 0, frame: 0  };

    class Runner {
        create(options = {}) { return new Running(options) };
        run(runner) { runner.enabled = true };
        stop(runner) { runner.enabled = false };
        start(runner) { this.run(runner) };        
        tick(runner, engine, time) {
            if (!runner.enabled) { return }
            event.timestamp = time;
            event.frame = runner.frameCounter;
            runner.frameCounter += 1;
            runner.events.onBeforeTick.fire(event);             
            Engine.update(engine, runner.delta, 1);
            event.frame = runner.frameCounter;
            runner.events.onAfterTick.fire(event);            
        };

    }
    return new Runner();
})();
export {Runner};

