return (()=>{

    var time;
    if(isNaN(args[0])) { time = 60 }
    else { time = Number(args[0]) }
    args[1] = args[1] ? args[1] : "Timer " + time;
    const ends = performance.now() + time * 1000;    
    var handle;
    var element = log.sysForceLine("Starting " + time + "secs")
    function tick() {
        const timeTill = ends - performance.now();
        if(timeTill <= 0) {
            log.info("Time up : " + args[1]);
            dismount(UID,true);
            return;
        }
        if(timeTill > 30000) {
            handle = setTimeout(tick,20000);
        }else if(timeTill > 10000) {
            handle = setTimeout(tick,5000);
        }else if(timeTill > 2000) {
            handle = setTimeout(tick,1000);
        } else {
            handle = setTimeout(tick,timeTill);
        }
        element = log.update(element,(Math.round(timeTill / 1000) + "secs till '" + args[1] +"'"));
    }
    tick();
    
    return {dismount(){
        clearTimeout(handle);
        log("Timer canceled");
        
    }};
})();