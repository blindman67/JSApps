class LevelMonitor extends AudioWorkletProcessor {
    process (inputs, outputs, parameters) {
        const input = inputs[0];
        var lMax = 0, rMax = 0;
        var L = input[0], R = input[1];
        var i = L.length;
        while (i--) {
            lMax = Math.max(lMax, L[i] * L[i]);
            rMax = Math.max(rMax, R[i] * R[i]);
        }
        return true
    }

}