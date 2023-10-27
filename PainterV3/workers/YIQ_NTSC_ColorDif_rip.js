

class RGBA2 {
    r = 0xFF;
    g = 0xFF;
    b = 0xFF;
    a = 0xFF;
    set pixel(px) {
        this.r = px & 0xFF;
        this.g = (px >> 8) & 0xFF;
        this.b = (px >> 16) & 0xFF;
        this.a = px >> 24;
    }
};
const rgbaA = new RGBA2(), rgbaB = new RGBA2();
const pixel2RGBA = pixel => ({r: pixel & 0xFF, g: (pixel >> 8) & 0xFF, b: (pixel >> 16) & 0xFF, a: pixel >> 24});

/* REF http://www.progmat.uaem.mx:8080/artVol2Num2/Articulo3Vol2Num2.pdf */
const rgb2y = ({r, g, b}) => r * 0.29889531 + g * 0.58662247 + b * 0.11448223;
const rgb2i = ({r, g, b}) => r * 0.59597799 - g * 0.27417610 - b * 0.32180189;
const rgb2q = ({r, g, b}) => r * 0.21147017 - g * 0.52261711 + b * 0.31114694;

const pixelBrightDelta = (pxA, pxB) => rgb2y((rgbaA.pixel = pxA, rgbaA)) - rgb2y((rgbaB.pixel = pxB, rgbaB));
const pixelDelta = (pxA, pxB) => {
    rgbaA.pixel = pxA;
    rgbaB.pixel = pxB;
    return  (rgb2y(rgbaA) - rgb2y(rgbaB)) ** 2 * 0.5053 +
            (rgb2i(rgbaA) - rgb2i(rgbaB)) ** 2 * 0.2990 +
            (rgb2q(rgbaA) - rgb2q(rgbaB)) ** 2 * 0.1957;
};
