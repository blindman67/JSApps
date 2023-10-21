const sprites = {
    icon8: {
        icon:   {x: 0, y: 164, w: 64, h: 32},
        size:   {x: 0, y: 164, w: 8, h: 16},
    },
    icon12: {
        icon:  {x: 0, y: 0, w: 60, h: 60},
        size:  {x: 0, y: 0, w: 12, h: 12},
    },
    icon16: {
        icon: {x: 64,  y: 0, w: 64,  h: 320},
        size: {x: 64,  y: 0, w: 16,  h: 16},
    },
    icon3216: {
        icon: {x: 0, y: 196, w: 64, h: 112},
        size: {x: 0, y: 196, w: 32, h: 16},
    },
    icon24: {
        icon: {x: 128, y: 0, w: 96,  h: 192},
        size: {x: 128, y: 0, w: 24,  h: 24},
    },
    icon32: {
        icon: {x: 224, y: 0, w: 128, h: 320},
        size: {x: 224, y: 0, w: 32,  h: 32},
    },
    icon40: {
        icon: {x: 352, y: 0, w: 120, h: 320},
        size: {x: 352, y: 0, w: 40, h: 40},
    },
	iconsChannelShow: {
		icon: {x: 0, y: 100, w: 64, h: 32},
		size: {x: 0, y: 100, w: 8, h: 16},
	},
	iconPan: {
		icon: {x: 0, y: 132, w: 64, h: 32},
		size: {x: 0, y: 132, w: 8, h: 16},
	},
    icon48: {
        icon: {x: 472, y: 0, w: 96, h: 288},
        size: {x: 472, y: 0, w: 48, h: 48},
    }, 
};

for (const set of Object.values(sprites)) {
    set.cols = set.icon.w / set.size.w | 0;
    set.rows = set.icon.h / set.size.h | 0;
}
function getSpriteSet(name) {
    const spriteSet = [];
    if (sprites[name]) {
        const set = sprites[name];
        var i = set.cols * set.rows;
        while (i--) {
            const r = i / set.cols | 0;
            const c = i % set.cols;
            spriteSet.push({
                x: set.icon.x + set.size.w * c,
                y: set.icon.y + set.size.h * r,
                w: set.size.w,
                h: set.size.h,
            });
        }
        spriteSet.reverse();
    }
    return spriteSet;
}

const spriteLocs = {
    image: new Image,
    PRoll: [
        {x: 472, y: 288, w: 169, h: 12, cx: 0, cy: 0,
        marks: [
            [1, 1, 3, 1, 5, 1, 7, 1, 9, 1, 13, 1, 15, 1, 17, 1, 19, 1, 21, 1, 23, 1, 25, 1, 29, 1, 31, 1, 33, 1, 35, 1, 37, 1, 41, 1, 43, 1, 45, 1, 47, 1, 49, 1, 51, 1, 53, 1, 57, 1, 59, 1, 61, 1, 63, 1, 65, 1, 69, 1, 71, 1, 73, 1, 75, 1, 77, 1, 79, 1, 81, 1, 85, 1, 87, 1, 89, 1, 91, 1, 93, 1, 97, 1, 99, 1, 101, 1, 103, 1, 105, 1, 107, 1, 109, 1, 113, 1, 115, 1, 117, 1, 119, 1, 121, 1, 125, 1, 127, 1, 129, 1, 131, 1, 133, 1, 135, 1, 137, 1, 141, 1, 143, 1, 145, 1, 147, 1, 149, 1, 153, 1, 155, 1, 157, 1, 159, 1, 161, 1, 163, 1, 165, 1],
        ]},
    ],
    PBlankRoll: [
        {x: 472, y: 312, w: 169, h: 12, cx: 0, cy: 0},
    ],
    PKeys: [
        {x: 473, y: 301, w: 3, h: 10, cx: 0, cy: 0},
        {x: 477, y: 301, w: 3, h: 10, cx: 0, cy: 0},
        {x: 481, y: 301, w: 3, h: 10, cx: 0, cy: 0},
        {x: 485, y: 301, w: 3, h: 7, cx: 0, cy: 0},
    ],
    PNotes: [
        {x: 490, y: 302, w: 6, h: 7, cx: 1, cy: 6},
        {x: 497, y: 302, w: 6, h: 7, cx: 1, cy: 6},
        {x: 504, y: 302, w: 6, h: 7, cx: 1, cy: 6},
        {x: 511, y: 302, w: 6, h: 7, cx: 1, cy: 6},
        {x: 518, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 524, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 530, y: 302, w: 6, h: 7, cx: 1, cy: 6},
        {x: 537, y: 301, w: 4, h: 7, cx: 1, cy: 5},
    ],
    NoteNums: [
        {x: 548, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 554, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 560, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 566, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 572, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 578, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 584, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 590, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 596, y: 302, w: 5, h: 7, cx: 1, cy: 6},
        {x: 602, y: 302, w: 8, h: 7, cx: 1, cy: 6},
        {x: 611, y: 302, w: 7, h: 7, cx: 1, cy: 6},
        {x: 619, y: 302, w: 8, h: 7, cx: 1, cy: 6},
    ],   
    drawSprite(ctx, x, y, spr) {
        ctx.drawImage(spriteLocs.image, spr.x, spr.y, spr.w, spr.h, x + spr.cx, y + spr.cy, spr.w, spr.h);
    },
    drawPartSprite(ctx, x, y, left, top, right, bot, spr) {
        ctx.drawImage(spriteLocs.image, 
            spr.x + left, spr.y + top, spr.w - (left + right), spr.h - (top + bot), 
            x + spr.cx + left, y + spr.cy + top, spr.w - (left + right), spr.h - (top + bot)
         );
    }    
};

spriteLocs.image.src = "./Images/icons.png";

const bgCan = document.createElement("canvas");
function createBgURL(w, h, draw) {
    bgCan.width = w;
    bgCan.height = h;
    const ctx = bgCan.getContext("2d");
    draw(ctx, w, h);
    return bgCan.toDataURL();
}
    

export {sprites, getSpriteSet, spriteLocs, createBgURL};