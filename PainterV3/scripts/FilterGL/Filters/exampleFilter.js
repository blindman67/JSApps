/* This is an example of a simple webGL filter for use with filterGL 
*/

if(typeof filterGL !== "undefined"){    // check if filterGL is installed
    filterGL.filters.register(          // register the filter
        "channelMultipler",             // name of the filter
        {                               // filter object
            webGLFilters : null,        // required and set when the filter is registered. Use it to create shaders and textures 
            shader : null,              // reference to your shader. You can store the shader any where you wish.
            description : "This filter is an example filter. It has 4 arguments each of which multiplies the RGBA channels of the image.",
            callback(red,green,blue,alpha) {    // this function is required and is called to apply the filter via its alias filtersGL.channelMultiplier
                var glF = this.webGLFilters;    // alias for lazy programmers
                if(!this.shader){  // create the shader.
                    // the shader will not be compiled until it is needed at the call glF.Filter
                    // if you change the shared source the filter will automatic be recompiled
                    this.shader = glF.Shader(null, `
                        uniform sampler2D texture;  // required
                        varying vec2 texCoord;   // required unless you create a custom vertex shader and use a different name.
                        
                        // the uniforms are set with the values of the second argument to the call glF.filter(shader, uniformsObject)
                        uniform float red;
                        uniform float green;
                        uniform float blue;
                        uniform float alpha;
                        
                        void main() {
                            vec4 color = texture2D(texture, texCoord);                        
                            gl_FragColor = color * vec4(red,green,blue,alpha);
                        }
                    `);
                }
                glF.filter(this.shader, {red , green, blue, alpha}); // makes the call that renders the filter
                return glF;  // Not a must but allows users to chain filters
            },
            arguments : [{
                    name : "red",
                    description : "Multiplies red channel.",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "green",
                    description : "Multiplies green channel.",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "blue",
                    description : "Multiplies blue channel.",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },{
                    name : "alpha",
                    description : "Multiplies alpha channel.",
                    type : "Number",
                    range : {min : 0, max : 2, step : 0.01, def : 1},
                },
            ],
            utilities : { // functions associated with this filter
            }
        }   
    );
}
