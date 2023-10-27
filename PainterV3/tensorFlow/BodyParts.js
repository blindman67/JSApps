
BodyParts.install = async function (ready) {
    BodyParts.installing = true;
    ScriptLoader.addScript("tensorFlow", "./tensorFlow/tensorFlow.js" , () => typeof TENSOR_FLOW_LOADED !== "undefined");
    await ScriptLoader.addScript("bodyPix", "./tensorFlow/bodyPix.js" , () => typeof bodyPix !== "undefined", "tensorFlow");
    BodyParts.install = undefined;
    BodyParts.installing = false;
    ready();

}
function BodyParts(cb) {
    const bodyPixProperties = {architecture: 'MobileNetV1', outputStride: 16, multiplier: 0.75, quantBytes: 4 };
    const segmentationProperties = { flipHorizontal: false, internalResolution: 'high', segmentationThreshold: 0.3 };
    let modelHasLoaded = false;
    let model = undefined;
    const colourMap = [];
    const toUint32 = c => (c.a << 24) + (c.b << 16) + (c.g << 8) + c.r | 0;
    colourMap.push(toUint32({r: 244, g: 67, b: 54,   a: 255}));  // Left_face
    colourMap.push(toUint32({r: 183, g: 28,  b: 28,  a: 255}));  // Right_face
    colourMap.push(toUint32({r: 233, g: 30,  b: 99,  a: 255}));  // left_upper_arm_front
    colourMap.push(toUint32({r: 136, g: 14,  b: 79,  a: 255}));  // left_upper_arm_back
    colourMap.push(toUint32({r: 233, g: 30,  b: 99,  a: 255}));  // right_upper_arm_front
    colourMap.push(toUint32({r: 136, g: 14,  b: 79,  a: 255}));  // right_upper_arm_back
    colourMap.push(toUint32({r: 233, g: 30,  b: 99,  a: 255}));  // left_lower_arm_front
    colourMap.push(toUint32({r: 136, g: 14,  b: 79,  a: 255}));  // left_lower_arm_back
    colourMap.push(toUint32({r: 233, g: 30,  b: 99,  a: 255}));  // right_lower_arm_front
    colourMap.push(toUint32({r: 136, g: 14,  b: 79,  a: 255}));  // right_lower_arm_back
    colourMap.push(toUint32({r: 156, g: 39,  b: 176, a: 255})); // left_hand
    colourMap.push(toUint32({r: 156, g: 39,  b: 176, a: 255})); // right_hand
    colourMap.push(toUint32({r: 63,  g: 81,  b: 181, a: 255}));  // torso_front
    colourMap.push(toUint32({r: 26,  g: 35,  b: 126, a: 255}));  // torso_back
    colourMap.push(toUint32({r: 33,  g: 150, b: 243, a: 255})); // left_upper_leg_front
    colourMap.push(toUint32({r: 13,  g: 71,  b: 161, a: 255}));  // left_upper_leg_back
    colourMap.push(toUint32({r: 33,  g: 150, b: 243, a: 255})); // right_upper_leg_front
    colourMap.push(toUint32({r: 13,  g: 71,  b: 161, a: 255}));  // right_upper_leg_back
    colourMap.push(toUint32({r: 0,   g: 188, b: 212, a: 255}));  // left_lower_leg_front
    colourMap.push(toUint32({r: 0,   g: 96,  b: 100, a: 255}));   // left_lower_leg_back
    colourMap.push(toUint32({r: 0,   g: 188, b: 212, a: 255}));  // right_lower_leg_front
    colourMap.push(toUint32({r: 0,   g: 188, b: 212, a: 255}));  // right_lower_leg_back
    colourMap.push(toUint32({r: 255, g: 193, b: 7,   a: 255}));  // left_feet
    colourMap.push(toUint32({r: 255, g: 193, b: 7,   a: 255}));  // right_feet
    const functions = {
        removeBackground(n, px32, seg) {
            while (n--) {
                const s = seg[n];
                px32[n] = s > -1 ? px32[n] : 0;
            }
        },
        removeBody(n, px32, seg) {
            while (n--) {
                const s = seg[n];
                px32[n] = s > -1 ? 0 : px32[n];
            }
        },
        findFaces(n, px32, seg) {
            while (n--) {
                const s = seg[n];
                px32[n] = s === 0 || s === 1 ? px32[n] : 0;
            }
        },
        mark(n, px32, seg) {
            while (n--) {
                const s = seg[n];
                px32[n] = s > -1 ? colourMap[s] : px32[n];
            }
        }        
    };
    function processSegmentation(media, segmentation, type) {
        const imageData = media.ctx.getImageData(0, 0, media.w, media.h);
        functions[type]?.(media.w * media.h, new Uint32Array(imageData.data.buffer), segmentation.data);
        media.ctx.putImageData(imageData, 0, 0);
    }

    const API = {
        loadModel(cb) {
            model = bodyPix.load(bodyPixProperties).then(function (loadedModel) {
                model = loadedModel;
                modelHasLoaded = true;
                cb();
            });
        },
        locateBodyParts(srcMedia, type) {
            var can = media.createTempImage(srcMedia.w, srcMedia.h)
            var ctx = can.getContext("2d");
            ctx.drawImage(srcMedia, 0, 0);
            model.segmentPersonParts(can, segmentationProperties).then(segmentation => {
                processSegmentation(srcMedia, segmentation, type);
                srcMedia.desc.dirty = true;
                srcMedia.lastAction = "BodyPix";
                srcMedia.processed = true;
                srcMedia.update();
                ctx = can = undefined;
            })
            .catch(()=> {
                can = ctx = undefined;
                log.warn("Segmentation failed..");
            });
        }
    };
    BodyParts.ready = true;
    return API;
}

