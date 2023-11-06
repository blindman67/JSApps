
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("lensUndistortPlane", filter = {
            name : "lensUndistortPlane",
            description : "Corrects the image for to keep vertical parallel lines from converging",
            webGLFilters : null,
            shader : null,
            callback(fov,scale,point) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float fov;
                        uniform float scale;
                        
                        //uniform float outer
                        uniform vec2 origin;
                        void main() {      
                            float x = texCoord.x -origin.x;
                            float y = texCoord.y - origin.y;
                            float xx = abs(x);
                            x *= 1.0/sqrt(1.0+pow(y * fov + xx * scale,2.0));
                            vec2 pos = vec2(x,y) + origin;
                            gl_FragColor = texture2D(texture, pos);
                        }                    
                    `);
                }
                var uniformObj = {scale:scale,origin : point, fov : Math.sqrt(fov) / Math.sqrt(20)};
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "fov",
                    description : "Value to represent the relative focal length of the camera",
                    type : "Number",
                    range : {min : 0.0001, max : 60, step : 0.0001, def : 1},
                },{
                    name : "scale",
                    description : "Scale the FX to compensate for any cropping that may have occured to the image",
                    type : "Number",
                    range : {min : 0.0001, max : 60, step : 0.0001, def : 1},
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
if (typeof filterGL !== "undefined") {
    (function () {
        var filter; // to access common properties for associated filters
        filterGL.filters.register("lensUndistort", filter = {
            name : "lensUndistort",
            description : "Corrects the image for to keep vertical parallel lines from converging",
            webGLFilters : null,
            shader : null,
            callback(fov,point) {
                var glF = this.webGLFilters;
                if (this.shader === undefined || this.shader === null){
                    this.shader = glF.Shader(null, null).useLinker();
                    this.shader.setFragmentSource(`
                        uniform sampler2D texture;
                        varying vec2 texCoord;
                        uniform float fov;
                        //uniform float outer
                        uniform vec2 origin;
                        void main() {      
                            float x = texCoord.x -origin.x;
                            float y = texCoord.y - origin.y;
                            float xx = abs(x);
                            x *= 1.0/sqrt((xx)*(xx)+pow((y + (fov-1.0)/fov)*fov,2.0));
                            vec2 pos = vec2(x,y) + origin;
                            gl_FragColor = texture2D(texture, pos);
                        }                    
                    `);
                }
                var uniformObj = {origin : point, fov : Math.sqrt(fov) / Math.sqrt(20)};
                glF.filter(this.shader, uniformObj);          
                return glF; 
            },            
            arguments : [{
                    name : "fov",
                    description : "Value to represent the relative focal length of the camera",
                    type : "Number",
                    range : {min : 0.0001, max : 3, step : 0.0001, def : 1},
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
