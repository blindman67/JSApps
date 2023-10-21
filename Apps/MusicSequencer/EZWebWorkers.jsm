/*
Version V2.0
I have updated an old API I used a lot to now handle webworkers via the promise API

It is designed to provide synchronous and asynchronous processing of data via dedicated web workers.
Workers are spawned directly from functions via the API, as either a single thread, or as many concurrent threads.
All messaging is handled within the API.
Processing work is via a job queue. The API will ensure that all avalible workers will be kept busy until the job queue is empty.
There is also a broadcast job(named `cast`) that is placed on the queue, and will send the same data to all concurent workers as they are avalible. All jobs remaining on the queue will wait until all concurent workers have procested that `cast`
Creating a worker returns a promise that resolves when all concurrent workers have been parsed and ready to accept data
The worker interface is via a function. There are some example uses above.
It will also handle transferable data objects (currently only one at a time)


*/


const EZWebWorkers = (() => {
    const CPUCores =  window.clientInformation && clientInformation.hardwareConcurrency ? clientInformation.hardwareConcurrency : 1;
    const workers = {};
    const ID_PREFIX = "BM67_";
    const ID_CHARS = "1234567890AbCdEfGhIjKlMnOpQrStUvWXYz";
    const ID_LENGTH = 10;
    const RESPOND_TIMEOUT = 2000;
    const commands = {
        SYSTEM: "System",
        RUN: "Run",
        CAST: "Cast",
        OK: "OK",
        QUERY: "?",
        ALIVE: "Alive",
        CLOSING: "Closing",
        CLOSE: "Close",
        PROGRESS: "Progress",
    };
    const ids = new Set();
    const getID = () => {
        var i, id, finding = true;
        id = ID_PREFIX;
        while (finding) {
            i = ID_LENGTH;
            while (i--) { id += ID_CHARS[Math.random() * ID_CHARS.length | 0] }
            finding = !ids.has(id) ? false : (id = ID_PREFIX, true);
        }
        ids.add(id);
        return id;
    }
    function functionToString (func) {
        var i, str = func.toString().replace("function ()", "");
        str = str.replace("{","");
        i = str.length - 1;
        while (str[i--] !== "}");
        str = str.substr(0, i + 1) + str.substr(i + 2);
        return str;
    }
    const addCommands = code => {
        for (const [name, str] of Object.entries(commands)) { code = code.replace(new RegExp(name, "g"), `"${str}"`) }
        return code;
    }
    const workerSourceComs = addCommands(functionToString(function (){
        addEventListener("message", e => {
            const id = workerId;
            const {type, message} = e.data;
            if (type === undefined) { postMessage({type: SYSTEM, id, message: "Unknown message"}) }
            else if (type === SYSTEM) {
                if(message === CLOSE) {
                    postMessage({type: SYSTEM, id, message: CLOSING});
                    close();
                } else if(message === QUERY) { postMessage({type: SYSTEM, id, message: ALIVE}) }
            } else if (type === RUN || type === CAST) {
                const result = workerFunction(e.data.args);
                const transfer = result && result.transfer ? [result.transfer] : undefined;
                postMessage({type, id, result}, transfer);
            }
        });
        const progressMessage = progress => {postMessage({type: PROGRESS, id: workerId, progress}) }
        postMessage({type: SYSTEM, id: workerId, message: OK});
    }));
    const cancelJobs = (wId) => { workers[wId] && (workers[wId].jobQueue.queue.length = 0) }
    const removeConcurentWorker = worker => {
        if(worker !== undefined) {
            const idx = worker.jobQueue.workers.indexOf(worker.id);
            if (idx !== -1) { worker.jobQueue.workers.splice(idx, 1) }
            delete workers[worker.id];
        }
    }
    const postJob = (worker, job) => {
        Object.assign(worker, job.callbacks);
        worker.busy = true;
        const type  = job.cast ? commands.CAST : commands.RUN;
        if (job.args.transfer) {
            if (job.cast) { console.warn("Warnning! It is unsafe to cast a transferable object.") }
            worker.postMessage({type, args: job.args}, [job.args.transfer]);
        } else { worker.postMessage({type, args: job.args}) }
    }
    const nextJob = worker => {
        if (worker.busy) { return }
        if (worker.jobQueue.cast.length > 0) { postJob(worker, worker.jobQueue.cast[0].job) }
        else if (worker.jobQueue.queue.length > 0){
            const job = worker.jobQueue.queue.shift();
            if (job.cast) {
                worker.jobQueue.cast.push({job, results: []});
                postJob(worker, job);
            } else { job.close ? close(job.who, true) : postJob(worker, job) }
        } else { worker.busy = false }
    }
    function workerError(err) {
        const worker = err.target, wId = worker.id;
        if (worker.ready) {
            if (worker.busy) {
                worker.error(err);
                shutDown(wId);
            } else {
                worker.postMessage({type: commands.SYSTEM, message: commands.QUERY});
                worker.waitHandle = setTimeout(() => shutDown(wId), RESPOND_TIMEOUT);
            }
        } else {
            worker.loading.error(err);
            shutDown(wId);
        }
    }
    function workerMessage (e) {
        if (!e.data.type || (e.data.id !== undefined && !workers[e.data.id])) { return }
        else {
            const {type, id, message} = e.data;
            const worker = workers[id];
            if (type === commands.SYSTEM) {
                if (message === commands.CLOSING) { removeConcurentWorker(worker) }
                else {
                    if (message === commands.OK) {
                        worker.ready = true;
                        const refWorker = workers[worker.jobQueue.workers[0]];
                        if (worker.jobQueue.workers.every(wId => workers[wId].ready)) {
                            refWorker.loading.ready(refWorker.interface);
                            delete refWorker.loading;
                            for (const wId of refWorker.jobQueue.workers) { nextJob(workers[wId]) }
                        }
                    } else if (message === commands.ALIVE) {
                        clearTimeout(worker.waitHandle);
                        nextJob(worker);
                    }
                }
            } else if (type === commands.RUN) {
                worker.complete(e.data.result);
                worker.busy = false;
                nextJob(worker);
            } else if (type === commands.CAST) {
                const cast = worker.jobQueue.cast[0];
                cast.results.push(e.data.result);
                worker.busy = false;
                if (cast.results.length === worker.jobQueue.workers.length) {
                    worker.jobQueue.cast.shift();
                    worker.complete(cast.results);
                    for (const wId of worker.jobQueue.workers) { nextJob(workers[wId]) }
                }
            } else if (type === commands.PROGRESS && worker.progress) { worker.progress(e.data.progress) }
        }
    }
    function createWorker(func, jobQueue, loading){
        const wId = getID();
        const functionStr = [
            `"use strict"`, `const isWorker = true`, `const workerId = "${wId}"`,
            functionToString(func).replace(/^function .+?\)/, ""),
            workerSourceComs
        ].join(";\n");
        const worker = workers[wId] = Object.assign(
            new Worker(URL.createObjectURL(new Blob([functionStr], {type : 'application/javascript'}))),
            {jobQueue, busy: false, id: wId, name: func.name, loading}
        );
        worker.addEventListener("message", workerMessage);
        worker.addEventListener("error", workerError);
        jobQueue.workers.push(wId);
        return worker;
    }
    function run(wId, args, complete, error, progress, cast = false){
        if (workers[wId]) {
            const workerRef = workers[wId];
            const job = {args, callbacks : {complete, error, progress}};
            if (cast) {
                job.cast = true;
                workerRef.jobQueue.queue.push(job);
                for (const wId of workerRef.jobQueue.workers) {
                    const worker = workers[wId];
                    if (worker && worker.ready && !worker.busy) { nextJob(worker) }
                }
            } else {
                for (const wId of workerRef.jobQueue.workers) {
                    const worker = workers[wId];
                    if (worker && worker.ready && !worker.busy) {
                        postJob(worker, job);
                        return;
                    }
                }
                workerRef.jobQueue.queue.push(job);
            }
        }
    }
    function close(wId, forceClose) {
        if (workers[wId]) {
            const worker = workers[wId];
            if (forceClose !== true && (worker.busy || !worker.ready)) { worker.jobQueue.queue.push({close: true , who: wId}) }
            else {
                for(const wId of worker.jobQueue.workers) {
                    workers[wId].postMessage({type: commands.SYSTEM, message: commands.CLOSE});
                }
             }
        }
    }
    function shutDown(wId){
        const terminate = worker => {
            removeConcurentWorker(worker);
            worker.terminate();
        }
        if (wId === undefined) {
            for (const worker of Object.values(workers)) { terminate(worker) }
        } else if(workers[wId] !== undefined) { terminate(workers[wId]) }
    }
    function worker(func, {concurrent = 1, onprogress, interface} = {}) {
        return new Promise((ready, error) => {
            const jobQueue = {cast: [], queue: [], workers: []};
            concurrent = concurrent === "all" ? CPUCores : (isNaN(concurrent) || concurrent < 1 ? 1 : concurrent);
            const worker = createWorker(func, jobQueue, {ready, error}), wId = worker.id;
            while (-- concurrent) { createWorker(func, jobQueue) }
            worker.interface = Object.assign((data => new Promise((done, error) => run(wId, data, done, error, onprogress))), {
                workerId : wId,
                cast: data => new Promise((done, error) => run(wId, data, done, error, onprogress, true)),
                cancel() { cancelJobs(wId) },
                close() { close(wId) },
            });
            interface && (interface[func.name] = worker.interface);
        });
    }
    const API = Object.freeze({worker, shutDown, CPUCores});
    return API;
})();
export {EZWebWorkers};
