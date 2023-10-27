if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("spheroid", filter = {
            name : "spheroid",
            description : "deforms stuff",
            webGLFilters : null,
            shader : null,
            callback(amount,xAmount,xBallance,xScale,point) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float amount;
                        uniform float xAmount;
                        uniform float xBallance;
                        uniform float xScale;
                        const float pi = ${Math.PI.toFixed(6)};
                        uniform vec2 origin;
                        void main() {      
                            float x = (texCoord.x -origin.x) * pi * xScale + amount;
                            float y = (texCoord.y - origin.y) * pi * xAmount + xBallance;
                            vec2 pos = vec2(cos(x),sin(x)) * cos(y);
                            pos += origin;
                            gl_FragColor = texture2D(texture, pos);
                        }                    
                    `);
                }
                var uniformObj = {amount,xAmount,xScale,xBallance,origin : point};
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "Amount",
                    description : "The overall amount of the fx",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "xAmount",
                    description : "The change of the fx as x distance from the origin point increases",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "xBallance",
                    description : "The balance of the xAmount from left to right",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 0},
                },{
                    name : "xScale",
                    description : "Uniform scale in the x direction ",
                    type : "Number",
                    range : {min : -2, max : 2, step : 0.01, def : 1},
                },{
                    name : "point",
                    description : "The location of the nearest point on the structure to correct",
                    type : "Vec2",
                    range : {def : [0.5,0.5]},
                },
                
            ], 
        });
    }());
}
