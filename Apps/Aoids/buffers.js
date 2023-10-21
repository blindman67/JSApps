const buffers = {
	draw: undefined,
	drawB: undefined,
	fx: undefined,
	overlay: undefined,
	overlayB: undefined,
	offsets: undefined,
};
const BUFFER_POSITIONS = {
	drawStart: 0,
	fxStart: 0,
	drawCount: 0,
	fxCount: 0,
    drawRollback: 0,
    fxRollback: 0,
    setupShipMountSprites(ship) {
        const bp = ship.bufPos;
        const O = buffers.offsets;
        const z = 0.09;
        ship.visibleMounts.sort((a, b) => a.renderOrder - b.renderOrder);
        //bp.drawRollback = buffers.draw.length;
        //bp.fxRollback = buffers.fx.length;
        //bp.overlayRollback = buffers.overlay.length;
        bp.drawStart = (bp.drawCount = buffers.draw.length) * O.stride;
        for(const mount of ship.visibleMounts) { mount.spritesAdd(buffers.draw, z) }
        bp.drawCount = buffers.draw.length - bp.drawCount;
        //buffers.draw.lock();
        bp.fxStart = (bp.fxCount = buffers.fx.length) * O.stride;
        for(const mount of ship.visibleMounts) { mount.spritesAddFX(buffers.fx, z) }
        bp.fxCount = buffers.fx.length - bp.fxCount;
        //buffers.fx.lock();
    }
};

export {buffers};