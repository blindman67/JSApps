
const View = (() => {
  const matrix = [1, 0, 0, 1, 0, 0]; 
  const matrixInv = [1, 0, 0, 1, 0, 0]; 

  var m = matrix, im = matrixInv;             
  var scale = 1, invScale;              
  var ctx;                    
  const pos = { x: 0, y: 0 }; 
  var dirty = true;
  const API = {
    set context(_ctx) { ctx = _ctx; dirty = true },
    applyIdent() {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    },
    apply() {
        if (dirty) { this.update() }
        ctx.setTransform(m[0], m[1], m[2], m[3], m[4], m[5])
    },
    get scale() { return scale },
    get invScale() { return invScale },
    get position() { return pos },
    isDirty() { return dirty },
    update() {
        if (dirty) {
            dirty = false;
            
            m[3] = m[0] = scale;
            m[2] = m[1] = 0;
            m[4] = pos.x;
            m[5] = pos.y; 
            invScale = im[3] = im[0] = 1 / scale;
            im[1] = im[2] = 0;        
        }
    },
    toWorld(vec, res) {
        if (dirty) { API.update() }
        const xx = vec.x - m[4];
        const yy = vec.y - m[5];
        res.x = xx * im[0] + yy * im[2];
        res.y = xx * im[1] + yy * im[3];
        return res;
    },   
    getBounds(bounds) {
        if (dirty) { this.update(); }
        const xm = m[4];
        const ym = m[5];
        const xM = ctx.canvas.width  - xm;
        const yM = ctx.canvas.height - ym;
        bounds.min.set(pos.x - xm * scale, pos.y - ym * scale);
        bounds.max.set(pos.x + xM * scale, pos.y + yM * scale);        
        return bounds;
    },
    fitBounds(bounds) {
        const w = bounds.max.x - bounds.min.x;
        const h = bounds.max.y - bounds.min.y;
        scale = Math.min(ctx.canvas.width / w, ctx.canvas.height / h);
        pos.x = -(bounds.min.x * scale) + (ctx.canvas.width  - w * scale) * 0.5;
        pos.y = -(bounds.min.y * scale) + (ctx.canvas.height - h * scale) * 0.5;
        dirty = true;
    },
    fillBounds(bounds) {
        const w = bounds.max.x - bounds.min.x;
        const h = bounds.max.y - bounds.min.y;
        scale = Math.max(ctx.canvas.width / w, ctx.canvas.height / h);
        pos.x = -(bounds.min.x * scale) + (ctx.canvas.width  - w * scale) * 0.5;
        pos.y = -(bounds.min.y * scale) + (ctx.canvas.height - h * scale) * 0.5;
        dirty = true;
    },
    pan(amount) {
        if (dirty) { this.update() }
        pos.x += amount.x;
        pos.y += amount.y;
        dirty = true;
    },
    scaleAt(at, amount) { 
        if (dirty) { this.update() }
        scale *= amount;
        pos.x = at.x - (at.x - pos.x) * amount;
        pos.y = at.y - (at.y - pos.y) * amount;
        dirty = true;
    },  
  };
  return API;
})();
export {View};