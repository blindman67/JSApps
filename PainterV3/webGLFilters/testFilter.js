"use strict";


if (typeof filterGL !== "undefined") {
    (()=>{
        const filter = {
            name : "testFilter",
            description : "WebGL filter used to test interface in PainterV3",
            callback(
                fov = filter.arguments[0].range.def, 
                scale = filter.arguments[1].range.def, 
                origin = filter.arguments[2].range.def
            ) {
                const glF = this.webGLFilters;
                if (!glF) { throw new ReferenceError("Filter '" + this.name + "' has not been registered and is unusable") }
                if (!this.shader){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float fov;
                        uniform float scale;
                        uniform vec2 origin;
                        void main() {      
                            float x = texCoord.x - origin.x;
                            float y = texCoord.y - origin.y;
                            x *= 1.0 / sqrt(1.0 + pow(y * fov + abs(x) * scale, 2.0));
                            vec2 pos = vec2(x, y) + origin;
                            gl_FragColor = texture2D(texture, pos);
                        }                    
                    `);
                }
                var uniformObj = {scale, origin, fov : Math.sqrt(fov) / Math.sqrt(20)};
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "fov",
                    description : "Value to represent the relative focal length of the camera",
                    type : "Number",
                    range : {min : 0.1, max : 60, step : 0.1, def : 2},
                },{
                    name : "scale",
                    description : "Scale the FX to compensate for any cropping that may have occured to the image",
                    type : "Number",
                    range : {min : 0.1, max : 60, step : 0.1, def : 1.6},
                },{
                    name : "origin",
                    description : "The location of the nearest point on the structure to correct",
                    type : "Vec2",
                    range : {def : [0.25,0.25]},
                },{
                    name : "Checkbox",
                    description : "Boolean as a check box item",
                    type : "Boolean",
                    range : {def : true},
                },{
                    name : "Selector",
                    description : "Does nothing this is just a UI test object",
                    type : "String",
                    range : "one,two,three,four,five,six,seven,eight,nine,ten".split(","),
                },
                
            ], 
        };
        filterGL.filters.register(filter.name,filter); 
    })();
}
