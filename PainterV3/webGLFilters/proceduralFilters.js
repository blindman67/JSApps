"use strict";
(()=>{
	function UIArgumentUpdate(filterType) {
		const opt = this.namedFilterArguments[filterType];
		filterType = opt ? (isNaN(opt) ? filterType : opt) : "default";
		if(this.prevFilterType !== filterType) {
			this.prevFilterType = filterType;
			for(const args of this.namedFilterArguments[filterType]) {
				const a = this.arguments[args[0]]
				if(args[1] === undefined) {
					a._hide = false;
					a._name = a.name;
					a._description = a.description;
					//if (a.type === "Number" && a.range._min !== undefined) {
						//a.range._min = a.range.min;
						//a.range._max = a.range.max;
						//a.range._step = a.range.step;

					//}
				}else  if(args[1] === false) {
					a._hide = true;
				}else {
					a._hide = false;
					a._name = args[1];
					a._description = args[2];
					//if (Array.isArray(args[3]) && a.type === "Number") {
						//a.range._min = args[3][0];
						//a.range._max = args[3][1];
						//a.range._step = args[3][2];
					//}
				}
			}
			this.updateArguments = true;
		}
	}
    var sArgs = {};
    proceduralFilter.arguments.forEach(arg => sArgs[arg.name] = arg);
    const vals = "#Va,pNorm,4#Vb,0,2#Vc,-1,1";
    const channelVals = "#Va,-2,2#Vb,-2,2#Vc,-2,2#Vd,-2,2";
    const channelValsPow = "#Va,pNorm,4#Vb,pNorm,4#Vc,pNorm,4#Vd,pNorm,4";
    filterGL.filters.register("curves", {
			name: "curves",
			description : "brightness contrast adjustments using powers ",
			curves : {
				contrast : "D=pow(clamp(A*Vb+Vc,0,1),v4(Va));R=D/(D+pow(1-clamp(A*Vb+Vc,0,1),v4(Va)))" + vals,
				darken : "R=pow(clamp(A*Vb+Vc,0,1),v4(Va))" + vals,
				lighten : "R=1-pow(1-clamp(A*Vb+Vc,0,1),v4(Va))" + vals,
				contrastHue : "Ah=clamp(Ah*Vb+Vc,0,1);Fa=pow(Ah,Va);Ah=Fa/(Fa+pow(1-Ah,Va));Rrgb=hsl2RGB(Ahsl)" + vals,
				darkenHue : "Ah=clamp(Ah*Vb+Vc,0,1);Ah=pow(Ah,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
				lightenHue : "Ah=clamp(Ah*Vb+Vc,0,1);Ah=1-pow(1-Ah,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
				contrastLum : "Al=clamp(Al*Vb+Vc,0,1);Fa=pow(Al,Va);Al=Fa/(Fa+pow(1-Al,Va));Rrgb=hsl2RGB(Ahsl)" + vals,
				darkenLum : "Al=clamp(Al*Vb+Vc,0,1);Al=pow(Al,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
				lightenLum : "Al=clamp(Al*Vb+Vc,0,1);Al=1-pow(1-Al,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
				contrastSat : "As=clamp(As*Vb+Vc,0,1);Fa=pow(As,Va);As=Fa/(Fa+pow(1-As,Va));Rrgb=hsl2RGB(Ahsl)" + vals,
				darkenSat : "As=clamp(As*Vb+Vc,0,1);As=pow(As,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
				lightenSat : "As=clamp(As*Vb+Vc,0,1);As=1-pow(1-As,Va);Rrgb=hsl2RGB(Ahsl)" + vals,
				darkenSatLum : "Fa=Ah;Ahsl=clamp(Ahsl*Vb+Vc,0,1);Drgb=pow(Ahsl,v3(Va));Rrgb=hsl2RGB(v3(Fa,Dg,Db))" + vals,
				lightenSatLum : "Fa=Ah;Ahsl=clamp(Ahsl*Vb+Vc,0,1);Drgb=1-pow(1-Ahsl,v3(Va));Rrgb=hsl2RGB(v3(Fa,Dg,Db))" + vals,
				contrastSatLum : "Fa=Ah;Ahsl=clamp(Ahsl*Vb+Vc,0,1);Drgb=pow(Ahsl,v3(Va));Drgb=Drgb/(Drgb+pow(1-Ahsl,v3(Va)));Rrgb=hsl2RGB(v3(Fa,Dg,Db))" + vals,
				darkenISatLum : "As=clamp(As*Vb+Vc,0,1);Al=clamp(Al*Vb+Vc,0,1);Dg=pow(As,Va);Db=1-pow(1-Al,Va);Rrgb=hsl2RGB(v3(Ah,Dg,Db))" + vals,
				lightenISatLum : "As=clamp(As*Vb+Vc,0,1);Al=clamp(Al*Vb+Vc,0,1);Dg=1-pow(1-As,Va);Db=pow(Al,Va);Rrgb=hsl2RGB(v3(Ah,Dg,Db))" + vals,
			},
			callback(power,scaling,level,type,channels) {
				var glF = this.webGLFilters;
				var pUtil = glF.filters.getFilter("procedural").utilities;
				var pString = this.curves[type];
				glF.procedural(undefined, undefined, pString, power-256,scaling,level,0, [0.5,0.5], 1, channels);
				return glF;
			},
			arguments : [{
					name : "power",
					description : "Amount of curve to apply. This is the exponential ",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 0},
				},{
					name : "scaling",
					description : "Amount of scaling to apply to input. eg  (in * scaling) ^ power",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 0},
				},{
					name : "level",
					description : "Amount of scaling to apply to input. eg  (in * scaling + level) ^ power",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 0},
				},{
					name : "type",
					description : "Types of adjustments",
					type : "String",
					range : ["contrast","lighten","darken","contrastHue","lightenHue","darkenHue","contrastLum","lightenLum","darkenLum","contrastSat","lightenSat","darkenSat","contrastSatLum","lightenSatLum","darkenSatLum","lightenISatLum","darkenISatLum"],
				},sArgs.channels
			],
		}
	);
    filterGL.filters.register("channels", {
			name: "channels",
			description : "Adjust levels per channel ",
			curves : {
				scale: "R=v4(Va<0?(1-Ar)*-Va:Ar*Va,Vb<0?(1-Ag)*-Vb:Ag*Vb,Vc<0?(1-Ab)*-Vc:Ab*Vc,Vd<0?(1-Aa)*-Vd:Aa*Vd)"  + channelVals,
				offset: "R=v4(Ar+Va,Ag+Vb,Ab+Vc,Aa+Vd)" + channelVals,
                contrast: "R=pow(A,v4(Va,Vb,Vc,Vd))" + channelValsPow,
                contrast2: "R=ease4(A,v4(Va,Vb,Vc,Vd))" + channelValsPow,


			},
			callback(red,green,blue,alpha,type,channels) {
				var glF = this.webGLFilters;
				var pUtil = glF.filters.getFilter("procedural").utilities;
				var pString = this.curves[type];
				glF.procedural(undefined, undefined, pString, red, green, blue, alpha, [0.5,0.5], 1, channels);
				return glF;
			},
			arguments : [{
					name : "red",
					description : "Adjust red channel",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 128},
				},{
					name : "green",
					description : "Adjust green channel",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 128},
				},{
					name : "blue",
					description : "Adjust blue channel",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 128},
				},{
					name : "alpha",
					description : "Adjust alpha channel",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 128},
				},{
					name : "type",
					description : "Types of adjustments",
					type : "String",
					range : ["scale","offset","contrast","contrast2"],
				},sArgs.channels
			],
		}
	);
    filterGL.filters.register("Overdrive", {
			name: "Overdrive",
			description : "Pushes dynamic range outward depending on summed pixel value  ",
			curves : {
				bottomUp: "R=v4((Argb-Va)*(1/(Vb-Va)),Aa)#Va,0,1#Vb,0,1",
				bottomUpRanged: "R=v4((Argb-Va)*(1/Vb),Aa)#Va,0,1#Vb,0,1",
				topDown: "R=v4(1-(Va-Argb)*(1/(Vb-Va)),Aa)#Va,0,1#Vb,0,1",
				topDownRanged: "R=v4(1-(Va-Argb)*(1/Vb),Aa)#Va,0,1#Vb,0,1",
			},
			callback(from,scale,type,channels) {
				var glF = this.webGLFilters;
				var pUtil = glF.filters.getFilter("procedural").utilities;
				var pString = this.curves[type];
				glF.procedural(undefined, undefined, pString, from * 2 - 256, scale * 2 - 256, 0, 0, [0.5,0.5], 1, channels);
				return glF;
			},
			arguments : [{
					name : "from",
					description : "Level to drive from",
					type : "Number",
					range : {min : 0, max : 256, step : 1, def : 0},
				},{
					name : "top",
					description : "Level to push to max",
					type : "Number",
					range : {min : 0, max : 256, step : 1, def : 256},
				},{
					name : "type",
					description : "Types of adjustments",
					type : "String",
					range : ["bottomUp","bottomUpRanged", "topDown", "topDownRanged"],
				},sArgs.channels
			],
		}
	);
    filterGL.filters.register("mirror", {
			name: "mirror",
			description : "Mirror image content via mix",
			code : {
                horizontal: "D=Sa(v2(1-X1/W1,Y));Fa=max(Da,Aa);R=v4(mix(Argb,Drgb,Va),Fa)#Va,0,1",
                vertical: "D=Sa(v2(X,1-Y1/H1));Fa=max(Da,Aa);R=v4(mix(Argb,Drgb,Va),Fa)#Va,0,1",
                diagonal: "D=Sa(v2(1-X1/W1,1-Y1/H1));Fa=max(Da,Aa);R=v4(mix(Argb,Drgb,Va),Fa)#Va,0,1",

                both:
                       "D=Sa(v2(1-X1/W1,Y));"+
                       "E=Sa(v2(1-X1/W1,1-Y1/H1));"+
                       "Fa=max(Da,Ea);"+
                       "D=v4(mix(Drgb,Ergb,Va),Fa);"+
                       "E=Sa(v2(X,1-Y1/H1));"+
                       "Fa=max(max(Aa,Ea),Fa);"+
                       "R=v4(mix(Drgb,mix(Argb,Ergb,Va),Va),max(max(Aa,Ea),Fa));"+
                       "#Va,0,1",
                test: "R=mix(A,Sa(v2(X + Vb * W1,Y + Vb * H1)),Va)#Va,0,1#Vb,-1,1",
			},
			callback(mix,test,type,channels) {
				var glF = this.webGLFilters;
				var pUtil = glF.filters.getFilter("procedural").utilities;
				var pString = this.code[type];
				glF.procedural(undefined, undefined, pString, mix, test, 0, 0, [0.5,0.5], 1, channels);
				return glF;
			},
			arguments : [{
					name : "mix",
					description : "Amount to mix mirror",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 0},
				},{
					name : "test",
					description : "Adjust green channel",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 128},
				}/*,{
					name : "blue",
					description : "Adjust blue channel",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 128},
				},{
					name : "alpha",
					description : "Adjust alpha channel",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 128},
				}*/,{
					name : "type",
					description : "Mirror Type",
					type : "String",
					range : ["horizontal", "vertical", "diagonal", "both", "test"],
				},sArgs.channels
			],
		}
	);
    filterGL.filters.register("rangeCurves", {
			name: "rangeCurves",
			description : "Apply curves to a range of pixel values ",
			curves : {
				contrast : "R=select4(Vb,Vc,A,A,ease4(clamp((A-Vb)/Vc,0,1),v4(Va))*Vc+Vb)" + vals,
				push : "R=select4(Vb,Vc,A,A,pow(clamp((A-Vb)/Vc,0,1),v4(Va))*Vc+Vb)" + vals,
				contrastOpen : "R=ease4(clamp((A-Vb)/Vc,0,1),v4(Va))*Vc+Vb" + vals,
				pushOpen : "R=pow(clamp((A-Vb)/Vc,0,1),v4(Va))*Vc+Vb" + vals,
				contrastLum: "Al=select1(Vb,Vc,Al,Al,ease(clamp((Al-Vb)/Vc,0,1),Va)*Vc+Vb);Rrgb=hsl2RGB(Ahsl)" + vals,
				pushLum: "Al=select1(Vb,Vc,Al,Al,pow(clamp((Al-Vb)/Vc,0,1),Va)*Vc+Vb);Rrgb=hsl2RGB(Ahsl)" + vals,
				contrastLumOpen: "Al=ease(clamp((Al-Vb)/Vc,0,1),Va)*Vc+Vb;Rrgb=hsl2RGB(Ahsl)" + vals,
				pushLumOpen: "Al=pow(clamp((Al-Vb)/Vc,0,1),Va)*Vc+Vb;Rrgb=hsl2RGB(Ahsl)" + vals,
				contrastSat: "As=select1(Vb,Vc,As,As,ease(clamp((As-Vb)/Vc,0,1),Va)*Vc+Vb);Rrgb=hsl2RGB(Ahsl)" + vals,
				pushSat: "As=select1(Vb,Vc,As,As,pow(clamp((As-Vb)/Vc,0,1),Va)*Vc+Vb);Rrgb=hsl2RGB(Ahsl)" + vals,
				contrastSatOpen: "As=ease(clamp((As-Vb)/Vc,0,1),Va)*Vc+Vb;Rrgb=hsl2RGB(Ahsl)" + vals,
				pushSatOpen: "As=pow(clamp((As-Vb)/Vc,0,1),Va)*Vc+Vb;Rrgb=hsl2RGB(Ahsl)" + vals,
				contrastHue: "Ah=select1(Vb,Vc,Ah,Ah,ease(clamp((Ah-Vb)/Vc,0,1),Va)*Vc+Vb);Rrgb=hsl2RGB(Ahsl)" + vals,
				pushHue: "Ah=select1(Vb,Vc,Ah,Ah,pow(clamp((Ah-Vb)/Vc,0,1),Va)*Vc+Vb);Rrgb=hsl2RGB(Ahsl)" + vals,
				contrastHueOpen: "Ah=ease(clamp((Ah-Vb)/Vc,0,1),Va)*Vc+Vb;Rrgb=hsl2RGB(Ahsl)" + vals,
				pushHueOpen: "Ah=pow(clamp((Ah-Vb)/Vc,0,1),Va)*Vc+Vb;Rrgb=hsl2RGB(Ahsl)" + vals,
			},
			callback(power,from,range,type,channels) {
				var glF = this.webGLFilters;
				var pUtil = glF.filters.getFilter("procedural").utilities;
				var pString = this.curves[type];
				glF.procedural(undefined, undefined, pString, -power*2, from-256, range, 0, [0.5,0.5], 1, channels);
				return glF;
			},
			arguments : [{
					name : "power",
					description : "Amount of curve ",
					type : "Number",
					range : {min : -256, max : 256, step : 4, def : 256},
				},{
					name : "from",
					description : "Min value",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 0},
				},{
					name : "ramge",
					description : "Range of curve",
					type : "Number",
					range : {min :0, max : 256, step : 1, def : 256},
				},{
					name : "type",
					description : "Types of adjustments",
					type : "String",
					range : ["contrast","push","contrastHue","pushHue","contrastSat","pushSat","contrastLum","pushLum","contrastOpen","pushOpen","contrastHueOpen","pushHueOpen","contrastSatOpen","pushSatOpen","contrastLumOpen","pushLumOpen"],
				},sArgs.channels
			],
		}
	);
    filterGL.filters.register("contrast", {
			name: "contrast",
			description : "brightness contrast adjustments using powers ",
			curves : {
				contrast : "D=pow(A,v4(Va));R=D/(D+pow(1-A,v4(Va)))#Va,pNorm,4",
				darken : "R=pow(A,v4(Va))#Va,pNorm,4",
				lighten : "R=1-pow(1-A,v4(Va))#Va,pNorm,4",
			},
			callback(power,type,channels) {
				this.webGLFilters.procedural(undefined, undefined,this.curves[type], power-256,0,0,0, [0.5,0.5], 1, channels);
				return this.webGLFilters;
			},
			arguments : [{
					name : "power",
					description : "Low reduces contrast and high more contrast",
					type : "Number",
					range : {min : -256, max : 256, step : 4, def : 0},
				},{
					name : "type",
					description : "Types of adjustments",
					type : "String",
					range : ["contrast","lighten","darken"],
				},sArgs.channels
			],
		}
	);
    filterGL.filters.register("clamp", {
			name: "clamp",
			description : "clamp channels",
			callback(level,channels) {
				this.webGLFilters.procedural(undefined, undefined,"R=v4(Va)#Va,0,1", level,0,0,0, [0.5,0.5], 1, channels);
				return this.webGLFilters;
			},
			arguments : [{
					name : "level",
					description : "What to put in the channel",
					type : "Number",
					range : {min : -256, max : 256, step : 4, def : 0},
				},sArgs.channels
			],
		},
	);
    filterGL.filters.register("Invert", {
			name: "Invert",
			description : "Invert one or more channels",
			callback(mix,channels) {
				this.webGLFilters.procedural(undefined, undefined,"R=1-v4(A)", 0,0,0,0, [0.5,0.5], mix, channels);
				return this.webGLFilters;
			},
			arguments : [sArgs.mix,sArgs.channels],
		}
	);
    filterGL.filters.register("Vignette", {
			name: "Vignette",
			description : "Amount photographic like vignette.",
			callback(amount, mix, channels) {
				var pString = `
					Fa = X*(1-Y)*Y*(1-X) * 15.0;
                    R = pow(Fa,Va)*Argba;
				`;
				this.webGLFilters.procedural(undefined, undefined,pString, amount / 255,0,0,0, undefined, mix, channels);
				return this.webGLFilters;
			},
			arguments : [
                {
					name : "Amount",
					description : "Amount of vignette to apply",
					type : "Number",
					range : {min : 0, max : 255, step : 1, def : 127},
				},
                sArgs.mix,sArgs.channels],
		},
	);  
    filterGL.filters.register("ACESFilm", {
			name: "ACESFilm",
			description : "ACES Film fx.",
			callback(mix, channels) {
				var pString = `R = (Argba*(2.51*Argba+0.03))/(Argba*(2.43*Argba+0.59)+0.14);`;
				this.webGLFilters.procedural(undefined, undefined,pString, 0,0,0,0, undefined, mix, channels);
				return this.webGLFilters;
			},
			arguments : [sArgs.mix, sArgs.channels],
		},
	);    
    filterGL.filters.register("WhiteBalance", {
			name: "WhiteBalance",
			description : "White balance the image depending on the distance the colour under the selection point is from white",
			callback(color1, mix,channels) {
				var pString = `
					D = c1;
					Fa = meanv3(Drgb);
					Ergb = Fa/v3(Dr,Dg,Db);
					R = v4(v3(Ergb*Argb),Aa);
				`;
				this.webGLFilters.procedural(undefined, undefined,pString, 0,0,0,0, undefined, mix, channels, {color1});
				return this.webGLFilters;
			},
			arguments : [
                {
					name : "WhitColor",
					description : "Color that defines white in image",
					type : "HexColor",
					range : {def : "#FFFFFF"},
				},
                sArgs.mix,sArgs.channels],
		},
	);
    filterGL.filters.register("Temperature", {
			name: "Temperature",
			description : "Change the image temperature from warm to cool.",
			callback(temperature) {
				var pString = "R=v4(v3(1-Va,1,1+Va)*Argb,Aa)#Va,-0.2,0.2";
				this.webGLFilters.procedural(undefined, undefined,pString, temperature,0,0,0, [0.5,0.5], 1,"RGB");
				return this.webGLFilters;
			},
			arguments : [{
				name : "Temperature",
				description : "Temperature adjust from warm to cool",
				type : "Number",
				range : {min : -256, max : 256, step : 1, def :0},
			}]
		},
	);
    filterGL.filters.register("BlackAndWhite", {
			name: "BlackAndWhite",
			description : "Convert images to black and white",
			namedFilters : {
				BWStepMean :"R=v4(step(Va,v3(meanv3(Brgb))),Ba)#Va,0,1",
				BWStepMax : "R=v4(step(Va,v3(maxv3(Brgb))),Ba)#Va,0,1",
				BWStepMin : "R=v4(step(Va,v3(minv3(Brgb))),Ba)#Va,0,1",
				BWStepPerceptual : "Fa=step(Va,Br*0.2126+Bg*0.7152+Bb*0.0722);R=v4(Fa,Fa,Fa,Ba)#Va,0,1",
				BWStepPhoton : "D=B*256;D*=D;Drgb=step(Va,v3(pow((Dr+Dg+Db)/3,0.5)/256));R=v4(Drgb,Ba)#Va,0,1",
				BW3StepMean :"Drgb = v3(meanv3(Brgb));R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
				BW3StepMax : "Drgb = v3(maxv3(Brgb));R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
				BW3StepMin : "Drgb = v3(minv3(Brgb));R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
				BW3StepMean :"Drgb = v3(meanv3(Brgb));R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
				BW3StepRed : "Drgb = v3(Br);R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
				BW3StepGreen : "Drgb = v3(Bg);R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
				BW3StepBlue : "Drgb = v3(Bb);R=v4((step(Va,Drgb)+step(Vb,Drgb))/2,Ba)#Va,0,1#Vb,0,1",
				BW3StepPerceptual : "Fa=step(Va,Br*0.2126+Bg*0.7152+Bb*0.0722);R=v4((step(Vb,v3(Fa))+step(Va,v3(Fa)))/2,Ba)#Va,0,1#Vb,0,1",
				BWMean : "R=v4(v3(meanv3(Brgb)),Ba)",
				BWMax : "R=v4(v3(maxv3(Brgb)),Ba)",
				BWMin : "R=v4(v3(minv3(Brgb)),Ba)",
				BWPerceptual : "Fa=Br*0.2126+Bg*0.7152+Bb*0.0722;R=v4(Fa,Fa,Fa,Ba)",
				BWPhoton : "D=B*256;D*=D;Drgb=v3(pow((Dr+Dg+Db)/3,0.5)/256);R=v4(Drgb,Ba)",
				BWSum: "R=v4(v3(clamp((Br+Bg+Bb)*Va,0,1)),Ba)#Va,0,1",
				BWProduct: "R=v4(v3(clamp((Br*Bg*Bb+Va)*Vb,0,1)),Ba)#Va,-1,1#Vb,0,4",
				BWInvProduct: "R=v4(v3(clamp(((1-Br)*(1-Bg)*(1-Bb)+Va)*Vb,0,1)),Ba)#Va,-1,1#Vb,0,4",
				BWFromRed : "R=v4(v3(Br),Ba)",
				BWFromGreen : "R=v4(v3(Bg),Ba)",
				BWFromBlue : "R=v4(v3(Bb),Ba)",
				BWFromAlpha : "R=v4(v3(Ba),Ba)",
			},
			namedFilterArguments: {
				default: [[1],[2]],
				"1": [[1],[2,false]],
				"2": [[1,false],[2,false]],
				BWStepMean :1,
				BWStepMax : 1,
				BWStepMin : 1,
				BWStepPerceptual : 1,
				BWStepPhoton : 1,
				BWMean : 2,
				BWMax :2,
				BWMin : 2,
				BWPerceptual : 2,
				BWPhoton : 2,
				BWFromRed: 2,
				BWFromRed: 2,
				BWFromGreen: 2,
				BWFromBlue: 2,
				BWFromAlpha: 2,
				BWSum: [[1,"Brightness","Set brighness of result"],[2,false]],
				BWProduct: [[1,"Level","Set level of result"],[2,"Brightness","sets brightness"]],
			},
			UIArgumentUpdate,
			callback(filterType,threshold,threshold2,mix,channels) {
				this.UIArgumentUpdate(filterType);
				var pString = this.namedFilters[filterType];

				this.webGLFilters.procedural(undefined, undefined,pString, threshold,threshold2,0,0, [0.5,0.5], mix, channels);
				return this.webGLFilters;
			},
			arguments : [{
					name : "filterType",
					description : "Select which black and white filter to use.",
					type : "String",
					range : null,
				},{
					name : "threshold",
					description : "Sets the threshold.",
					type : "Number",
					range : {min : -256, max : 256, step : 4, def : 0},
				},{
					name : "threshold2",
					description : "Sets the low threshold for 3 step filters.",
					type : "Number",
					range : {min : -256, max : 256, step : 4, def : 0},
				},sArgs.mix,sArgs.channels
			],
			setup(filter) { filter.arguments[0].range = Object.keys(filter.namedFilters) },
		}
	);
    filterGL.filters.register("twoTone", {
			name: "twoTone",
			description : "Two colour images, like Black and white but the colours are selecteable",
			webGLFilters : null,
			namedFilters : {
				Mean            : "R=v4(mix(c3rgb,c1rgb,meanv3(Brgb)),Ba)",
				Max             : "R=v4(mix(c3rgb,c1rgb,maxv3(Brgb)),Ba)",
				Min             : "R=v4(mix(c3rgb,c1rgb,minv3(Brgb)),Ba)",
				Perceptual      : "Fa=Br*0.2126+Bg*0.7152+Bb*0.0722;R=v4(mix(c3rgb,c1rgb,Fa),Ba)",
				Photon          : "D=B*256;D*=D;Fa=pow((Dr+Dg+Db)/3,0.5)/256;R=v4(mix(c3rgb,c1rgb,Fa),Ba)",
				FromRed         : "R=v4(mix(c3rgb,c1rgb,Br),Ba)",
				FromGreen       : "R=v4(mix(c3rgb,c1rgb,Bg),Ba)",
				FromBlue        : "R=v4(mix(c3rgb,c1rgb,Bb),Ba)",
				FromAlpha       : "R=v4(mix(c3rgb,c1rgb,Ba),Ba)",
				StepMean        : "R=v4(mix(c3rgb,c1rgb,step(Va,meanv3(Brgb))),Ba)#Va,0,1",
				StepMax         : "R=v4(mix(c3rgb,c1rgb,step(Va,maxv3(Brgb))),Ba)#Va,0,1",
				StepMin         : "R=v4(mix(c3rgb,c1rgb,step(Va,minv3(Brgb))),Ba)#Va,0,1",
				StepPerceptual  : "Fa=step(Va,Br*0.2126+Bg*0.7152+Bb*0.0722);R=v4(mix(c3rgb,c1rgb,Fa),Ba)#Va,0,1",
				StepPhoton      : "D=B*256;D*=D;Fa=step(Va,pow((Dr+Dg+Db)/3,0.5)/256);R=v4(mix(c3rgb,c1rgb,Fa),Ba)#Va,0,1",
				Step3Mean       : "Fa=meanv3(Brgb);R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
				Step3Max        : "Fa=meanv3(Brgb);R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
				Step3Min        : "Fa=meanv3(Brgb);R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
				Step3Red        : "Fa=Br;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
				Step3Green      : "Fa=Bg;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
				Step3Blue       : "Fa=Bb;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
				Step3Alpha      : "Fa=Ba;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
				Step3Perceptual : "Fa=Br*0.2126+Bg*0.7152+Bb*0.0722;R=v4(step(Va,Fa)*c1rgb+(1-step(Va,Fa))*step(Vb,Fa)*c2rgb+(1-step(Vb,Fa))*c3rgb,Ba)#Va,0,1#Vb,0,1",
			},
			namedFilterArguments: {
				default: [[1],[2,false],[3,false],[4,false],[5]],
				"1": [[1],[2],[3,false],[4,false],[5]],
				"2": [[1],[2],[3],[4],[5]],
				StepMean: 1,
				StepMax: 1,
				StepMin: 1,
				StepPerceptual: 1,
				StepPhoton: 1,
				Step3Mean: 2,
				Step3Max: 2,
				Step3Min: 2,
                Step3Red: 2,
                Step3Green: 2,
                Step3Blue: 2,
                Step3Alpha: 2,
                Step3Perceptual: 2,
			},
			UIArgumentUpdate,
			callback(filterType,topColor, threshold,midColor, threshold2,bottomColor, mix, channels){
				this.UIArgumentUpdate(filterType);
				var colours = {color1 : topColor, color2 : midColor,color3 : bottomColor};
				var pString = this.namedFilters[filterType];
				this.webGLFilters.procedural(undefined, undefined,pString, threshold,threshold2,0,0, [0.5,0.5], mix, channels,colours);
				return this.webGLFilters;
			},
			arguments : [{
					name : "filterType",
					description : "Select which 2 tone filter to use.",
					type : "String",
					range :null,
				},{
					name : "topColor",
					description : "Set the colour for brightest pixel.",
					type : "HexColor",
					range : {def : "#FFFFFF"},
				},{
					name : "threshold",
					description : "Sets the threshold.",
					type : "Number",
					range : {min : -256, max : 256, step : 4, def : 0},
				},{
					name : "midColor",
					description : "Set the colour for midRange pixels.",
					type : "HexColor",
					range : {def : "#888888"},
				},{
					name : "threshold2",
					description : "Sets the low threshold for 3 step filters threshold.",
					type : "Number",
					range : {min : -256, max : 256, step : 4, def : 0},
				},{
					name : "bottomColor",
					description : "Set the colour for darkest pixel.",
					type : "HexColor",
					range : {def : "#000000"},
				},sArgs.mix,sArgs.channels
			],
			setup(filter) { filter.arguments[0].range = Object.keys(filter.namedFilters) },
		}
	);
    filterGL.filters.register("channelCopy", {
			name: "channelCopy",
			description : "Copies channels between images",
			webGLFilters : null,
			fromCode :{
				RGB : "D=B;E=v4(meanv3(Brgb));",
				RGBA : "D=B;E=v4(meanv4(B));",
				Red : "D=v4(Br);E=D;",
				Green : "D=v4(Bg);E=D;",
				Blue : "D=v4(Bb);E=D;",
				Alpha : "D=v4(Ba);E=D;",
				RG : "Fa=(Br+Bg)/2;D=v4(Fa);E=D;",
				GB : "Fa=(Bb+Bg)/2;D=v4(Fa);E=D;",
				RB : "Fa=(Br+Bb)/2;D=v4(Fa);E=D;",
				RGA : "Fa=(Br+Bg+Ba)/3;D=v4(Fa);E=D;",
				GBA : "Fa=(Bg+Bb+Ba)/3;D=v4(Fa);E=D;",
				RBA : "Fa=(Br+Bb+Ba)/3;D=v4(Fa);E=D;",
			},
			actions : {
				replace  : "",
				add      : "D=D+A;E=E+A;",
				subtract : "D=A-D;E=A-E;",
				lighter  : "D=v4(max(Ar,Dr),max(Ag,Dg),max(Ab,Db),max(Aa,Da));D=v4(max(Ar,Er),max(Ag,Eg),max(Ab,Eb),max(Aa,Ea));",
				darker   : "D=v4(min(Ar,Dr),min(Ag,Dg),min(Ab,Db),min(Aa,Da));D=v4(min(Ar,Er),min(Ag,Eg),min(Ab,Eb),min(Aa,Ea));",
				multiply : "D=A*D;E=A*E;",
				inverseMultiply :"D=A*(1-D);E=A*(1-E);" ,
				mix      : "D=(A+D)/2;E=(A+E)/2;",
			},
			toCode :{
				RGB   : "R=mix(A,D,v4(Va,Va,Va,0));",
				RGBA  : "R=D*Va;",
				Red   : "R=mix(A,E,v4(Va,0,0,0));",
				Green : "R=mix(A,E,v4(0,Va,0,0));",
				Blue  : "R=mix(A,E,v4(0,0,Va,0));",
				Alpha : "R=mix(A,E,v4(0,0,0,Va));",
				RG    : "R=mix(A,D,v4(Va,Va,0,0));",
				GB    : "R=mix(A,D,v4(0,Va,Va,0));",
				RB    : "R=mix(A,D,v4(Va,0,Va,0));",
				RGA   : "R=mix(A,D,v4(Va,Va,0,Va));",
				GBA   : "R=mix(A,D,v4(0,Va,Va,Va));",
				RBA   : "R=mix(A,D,v4(Va,0,Va,Va));",
			},
			callback(action,fromc,source,toc,amount) {
				var pString = ""
				pString += this.fromCode[fromc];
				pString += this.actions[action];
				pString += this.toCode[toc];
				pString  += "#Va,0,1",
				this.webGLFilters.procedural(source, undefined,pString,amount,0,0,0, [0.5,0.5], 1, "RGBA");
				return this.webGLFilters;
			},
			arguments : [{
					name : "action",
					description : "Type of copy to perform",
					type : "String",
					range : ["replace","add","subtract","lighter","darker","multiply","inverseMultiply","mix"]
				},{
					name : "from",
					description : "Channels copy from.",
					type : "String",
					range : ["RGB","RGBA","Red","Green","Blue","Alpha","RG","GB","RB","RGA","GBA","RBA"]
				},{
					name : "source",
					description : "source of copy.",
					type : "Image",
					range : null
				},{
					name : "to",
					description : "Channels to copy to.",
					type : "String",
					range : ["RGB","RGBA","Red","Green","Blue","Alpha","RG","GB","RB","RGA","GBA","RBA"],
				},{
					name : "amount",
					description : "level to copy.",
				   type : "Number",
					range : {min : -256, max : 256, step : 1, def : 256},
				}
			],
		}
	);
    filterGL.filters.register("alphaFilters", {
			name: "alphaFilters",
			description : "Procedural filters that apply alpha to the image",
			webGLFilters : null,
			namedProcedures : {
				RGBMean2Alpha : "R=v4(Argb,#op#bump(meanv3(Argb),Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
				RGBMax2Alpha : "R=v4(Argb,#op#bump(maxv3(Argb),Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
				RGBMin2Alpha : "R=v4(Argb,#op#bump(minv3(Argb),Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
				Hue2Alpha : "R=v4(Argb,#op#(bump(Ah,Fa,Vb,Vc)*bump(As,Fb,Vd,0)))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
				Sat2Alpha : "R=v4(Argb,#op#(bump(As,Fa,Vb,Vc)*bump(Ah,Fb,Vd,0)))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
				Lum2Alpha : "R=v4(Argb,#op#bump(Al,Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
				Red2Alpha : "R=v4(Argb,#op#bump(Ar,Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
				Green2Alpha : "R=v4(Argb,#op#bump(Ag,Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
				Blue2Alpha : "R=v4(Argb,#op#bump(Ab,Fa,Vb,Vc))#Va,-0.5,1.5#Vb,0,1,#Vc,0,1#Vd,0,1",
			},
			usePointCode : {
				RGBMean2Alpha : "D=Sa(Pxy);Fa=meanv3(Drgb);",
				RGBMax2Alpha : "D=Sa(Pxy);Fa=maxv3(Drgb);",
				RGBMin2Alpha : "D=Sa(Pxy);Fa=minv3(Drgb);",
				Hue2Alpha : "D=Sa(Pxy);Fa=rgb2H(Drgb);Fb=rgb2S(Drgb);",
				Sat2Alpha : "D=Sa(Pxy);Fa=rgb2S(Drgb);Fb=rgb2H(Drgb);",
				Lum2Alpha : "D=Sa(Pxy);Fa=rgb2L(Drgb);",
				Red2Alpha : "D=Sa(Pxy);Fa=Dr;",
				Green2Alpha : "D=Sa(Pxy);Fa=Dg;",
				Blue2Alpha : "D=Sa(Pxy);Fa=Db;",
			},
			namedAlphaOps : {
				replace : "",
				add : "Aa+",
				subtract : "Aa-",
				multiply : "Aa*",
			},
			callback(procedureName,alphaOp,source2,level,range,falloff,secondaryRange,usePoint,point, mix, channels) {
				var glF = this.webGLFilters;
				var pString = this.namedProcedures[procedureName];
				if(pString !== undefined){
					pString = pString.replace("#op#",this.namedAlphaOps[alphaOp]);
					if(usePoint){
						pString = this.usePointCode[procedureName] + pString;
					}else{
						pString = "Fa=Va;Fb=0.5;"+pString;
					}
					glF.procedural(source2, undefined, pString, level,range,falloff,secondaryRange,point, mix, "Alpha");
				}
				return glF;
			},
			arguments : [{
					name : "name",
					description : "Name of procedural filter to apply",
					type : "String",
					range : null,
				},{
					name : "alphaOp",
					description : "Operation to apply to the existing alpha value",
					type : "String",
					range : null,
				},{
					name : "source2",
					description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
					type : "Image",
					range : null,
				},{
					name : "level",
					description : "Center of selected range",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 0},
				},{
					name : "Range",
					description : "distance from level to make selection ",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 0},
				},{
					name : "falloff",
					description : "Distance off selection falloff",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 0},
				},{
					name : "secondaryRange",
					description : "For hue/Saturation this  set the luminance and other value as a range",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 0},
				},{
					name : "usePoint",
					description : "If true then the pixels at the point are used to select the level",
					type : "Boolean",
					range : {def : false},
				},sArgs.point, sArgs.mix
			],
			setup(filter) { filter.arguments[0].range = Object.keys(filter.namedProcedures); filter.arguments[1].range = Object.keys(filter.namedAlphaOps)},
		},
	);
    filterGL.filters.register("HSLFilters", {
			name: "HSLFilters",
			description : "Procedural filters that use Hue Saturation and luminance to filter the image",
			namedProcedures : {
				hslChannelScale : "Ahsl= Bhsl*v3(Va,Vb,1);Rrgb=hsl2RGB(v3(Ah,As,negInv(Bl,Vc)))#Va,-2,2#Vb,-2,2#Vc,-2,2",
				rgbChannelScale : "Rrgb=v3(negInv(Br,Va),negInv(Bg,Vb),negInv(Bb,Vc))#Va,-2,2#Vb,-2,2#Vc,-2,2",
				//hslInvert : "Ahsl=1-Bhsl*v3(Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-1,1#Vb,-1,1#Vc,-1,1",
				hueFromLum  : "Ah=Bl;Rrgb=hsl2RGB(Ahsl)",
				hueFromSat  : "Ah=Bs;Rrgb=hsl2RGB(Ahsl)",
				hueFromMeanSatLum : "Ah=(Bs+Bl)/2;Rrgb=hsl2RGB(Ahsl)",
				SatFromHue  : "As=Bh;Rrgb=hsl2RGB(Ahsl)",
				SatFromLum  : "As=Bl;Rrgb=hsl2RGB(Ahsl)",
				SatFromMeanHueLum : "As=(Bh+Bl)/2;Rrgb=hsl2RGB(Ahsl)",
				LumFromHue  : "Al=Bh;Rrgb=hsl2RGB(Ahsl)",
				LumFromSat  : "Al=Bs;Rrgb=hsl2RGB(Ahsl)",
				LumFromMeanHueSat : "Al=(Bh+Bs)/2;Rrgb=hsl2RGB(Ahsl)",
				hueFromMeanHueSatLum : "Ah=(Bh+Bs+Bl)/3;Rrgb=hsl2RGB(Ahsl)",
				SatFromMeanHueSatLum : "As=(Bh+Bs+Bl)/3;Rrgb=hsl2RGB(Ahsl)",
				LumFromMeanHueSatLum : "Al=(Bh+Bs+Bl)/3;Rrgb=hsl2RGB(Ahsl)",
				hueShift    : "Ah=Bh+Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1#HueClamp,Off",
				hueScale : "Ah=(Bh-Vb)*Va+Vb;Rrgb=hsl2RGB(Ahsl)#Va,-4,4#Vb,-1,1#HueClamp,Off",
				hueScaleModSat : "Ah=(Bh-Vb)*(Va*Bs)+Vb;Rrgb=hsl2RGB(Ahsl)#Va,-4,4#Vb,-1,1#HueClamp,Off",
				hueScaleModLum : "Ah=(Bh-Vb)*(Va*Bl)+Vb;Rrgb=hsl2RGB(Ahsl)#Va,-4,4#Vb,-1,1#HueClamp,Off",
				hueSet      : "Ah=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
				hueInvert   : "Ah=1-Bh;Rrgb=hsl2RGB(Ahsl)",
				hueThreshold: "Ah=bump(Bh,Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-0.5,1.5#Vb,0,1,#Vc,0,1",
				satShift    : "As=Bs+Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
				satScale : "As=(Bs-Vb)*Va+Vb;Rrgb=hsl2RGB(Ahsl)#Va,-4,4#Vb,-1,1",
				satSet      : "As=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
				satInvert   : "As=1-Bs;Rrgb=hsl2RGB(Ahsl)",
				satThreshold: "As=bump(Bs,Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-0.5,1.5#Vb,0,1,#Vc,0,1",
				lumShift    : "Al=Bl+Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
				lumScale  : "Al=(Bl-Vb)*Va+Vb;Rrgb=hsl2RGB(Ahsl)#Va,-4,4#Vb,-1,1",
				lumSet      : "Al=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
				lumInvert   : "Al=1-Bl;Rrgb=hsl2RGB(Ahsl)",
				lumThreshold: "Al=bump(Bl,Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-0.5,1.5#Vb,0,1,#Vc,0,1",
			},
			namedFilterArguments: {
				default: [[2],[3],[4]],
				"1": [[2,false],[3,false],[4,false]],
				"2": [[2],[3,false],[4,false]],
				"3": [[2,"Scale","Amount to scale values"],[3,"Center", "Scale origin (center)"],[4,false]],
				"4": [[2,"Center","Center of selection"],[3,"Width","Width of selection"],[4,"Falloff","Falloff rate"]],
				hslChannelScale:[[2,"Hue","Scales hue from -2 to 2"],[3,"Sat","Scales saturation from -2 to 2"],[4,"Lum","Scales luminosity -2 to 2"]],
				rgbChannelScale:[[2,"Red","Scales red from -2 to 2"],[3,"Green","Scales green from -2 to 2"],[4,"Blue","Scales blue -2 to 2"]],
				lumThreshold: 4,
				satThreshold: 4,
				hueThreshold: 4,
				hueScale 		 : 3,
				hueScaleModSat 		 : 3,
				hueScaleModLum 		 : 3,
				satScale 		 : 3,
				lumScale 		 : 3,
				hueFromLum  		 : 1,
				hueFromSat  		 : 1,
				hueFromMeanSatLum 	 : 1,
				SatFromHue  		 : 1,
				SatFromLum  		 : 1,
				SatFromMeanHueLum 	 : 1,
				LumFromHue           : 1,
				LumFromSat  		 : 1,
				LumFromMeanHueSat    : 1,
				hueFromMeanHueSatLum : 1,
				SatFromMeanHueSatLum : 1,
				LumFromMeanHueSatLum : 1,
				hueInvert   		 : 1,
				satInvert   		 : 1,
				lumInvert   		 : 1,
				hueShift    		 : 2,
				hueSet      		 : 2,
				satShift    		 : 2,
				satSet      		 : 2,
				lumShift    		 : 2,
				lumSet      		 : 2,


			},
			UIArgumentUpdate,
			callback(procedureName,source2,valueA, valueB, valueC, mix) {
				/*const r1 = this.arguments[2].range;
				const r2 = this.arguments[3].range;
				const r3 = this.arguments[4].range;
				if(r1._min !== undefined) { valueA = ((valueA - r1._min) / (r1._max - r1._min)) * 512 - 256 }
				else { valueA = ((valueA - r1.min) / (r1.max - r1.min)) * 512 - 256 }
				if(r2._min !== undefined) { valueB = ((valueB - r2._min) / (r2._max - r2._min)) * 512 - 256 }
				else { valueB = ((valueA - r2.min) / (r2.max - r2.min)) * 512 - 256 }
				if(r3._min !== undefined) { valueC = ((valueC - r3._min) / (r3._max - r3._min)) * 512 - 256 }
				else { valueC = ((valueC - r3.min) / (r3.max - r3.min)) * 512 - 256 }*/


			    this.UIArgumentUpdate(procedureName);
				if(this.namedProcedures[procedureName] !== undefined){
					this.webGLFilters.procedural(source2, undefined, this.namedProcedures[procedureName], valueA, valueB, valueC, 1, [0,0], mix, "RGB");
				}
				return this.webGLFilters;
			},
			arguments : [{
					name : "name",
					description : "Name of procedural filter to apply",
					type : "String",
					range : null,
				},{
					name : "source2",
					description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
					type : "Image",
					range : null,
				}, sArgs.valueA,  sArgs.valueB, sArgs.valueC, sArgs.mix
			],
			setup(filter) { filter.arguments[0].range = Object.keys(filter.namedProcedures) },
		}
	);
    filterGL.filters.register("RGB2HSLExchange", {
			name: "RGB2HSLExchange",
			description : "Swaps RGB and HSL channels",
			namedProcedures : {
				RGB_From_HSL: "R=v4(Ahsl,Aa)",
				BW_From_Hue : "R=v4(v3(Ah),Aa)",
				BW_From_Sat : "R=v4(v3(As),Aa)",
				BW_From_Lum : "R=v4(v3(Al),Aa)",
				RGB_Mul_Hue : "R=v4(Argb * v3(Ah),Aa)",
				RGB_Mul_Sat : "R=v4(Argb * v3(As),Aa)",
				RGB_Mul_Lum : "R=v4(Argb * v3(Al),Aa)",
				RGB_Mul_Sat_Lum_Mean : "R=v4(Argb * v3((Al + As) / 2),Aa)",
				RGB_Mul_Sat_Dot_Lum : "R=v4(Argb * v3(Al * As),Aa)",
				RGB_Mul_Inv_Hue : "R=v4(Argb * v3(1-Ah),Aa)",
				RGB_Mul_Inv_Sat : "R=v4(Argb * v3(1-As),Aa)",
				RGB_Mul_Inv_Lum : "R=v4(Argb * v3(1-Al),Aa)",
				RGB_Mul_Inv_Sat_Lum_Mean : "R=v4(Argb * v3(1-(Al+As)/2),Aa)",
				RGB_Mul_Inv_Sat_Dot_Lum : "R=v4(Argb * v3(1-Al*As),Aa)",
				HSL_To_RGB  : "R=v4(hsl2RGB(Argb),Aa)",
			},
			callback(procedureName) {
				if(this.namedProcedures[procedureName] !== undefined){
					this.webGLFilters.procedural(null, undefined, this.namedProcedures[procedureName], 1,1,1,1,{x:0,y:0},1, "RGB");
				}
				return this.webGLFilters;
			},
			arguments : [{
					name : "name",
					description : "Name of procedural filter to apply",
					type : "String",
					range : null,
				},
			],
			setup(filter) { filter.arguments[0].range = Object.keys(filter.namedProcedures) },
		}
	);
    filterGL.filters.register("HSLTargeted", {
			name: "HSLTargeted",
			description : "Target specific HSL values and modify them",
			webGLFilters : null,
			namedProcedures : {
				select : [
				"Fa = (bump(Bh,c1h,c2h,c3h) * bump(Bs,c1s,c2s,c3s) * bump(Bl,c1l,c2l,c3l));Ra=1-Fa;Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
				"Fa = (bump(Bh, Er,c2h,c3h) * bump(Bs ,Eg,c2s,c3s) * bump(Bl, Eb,c2l,c3l));Ra=1-Fa;Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
				],
				selectInv : [
				"Fa = 1-(bump(Bh,c1h,c2h,c3h) * bump(Bs,c1s,c2s,c3s) * bump(Bl,c1l,c2l,c3l));Ra=1-Fa; Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
				"Fa = 1-(bump(Bh, Er,c2h,c3h) * bump(Bs, Eg,c2s,c3s) * bump(Bl, Eb,c2l,c3l));Ra=1-Fa; Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
				]
			},
			callback(procedureName,source2,pivitHue,hue1,hue2,hue3,pivitSat,sat1,sat2,sat3,pivitLum,lum1,lum2,lum3,hue,sat,lum,mask, point, mix) {
				if(this.namedProcedures[procedureName] !== undefined){
					var colours = {
						hue: true,
						color1 : [hue1,sat1,lum1,1],
						color2 : [hue2,sat2,lum2,1],
						color3 : [hue3,sat3,lum3,1],
						color4 : [hue,sat,lum,1]
					};
					if(pivitHue || pivitSat || pivitLum){

						var pString = `
							D=Sa(Pxy);
							Ergb = v3(${pivitHue?"rgb2H(Drgb)":"c1h"}, ${pivitSat?"rgb2S(Drgb)":"c1s"}, ${pivitLum?"rgb2L(Drgb)":"c1l"});
							${this.namedProcedures[procedureName][1]}
						`;
						this.webGLFilters.procedural(source2, undefined,pString, 0, 0, 0, 0, point, mix, mask ? "RBGA" : "RGB",colours);
					}else{
						this.webGLFilters.procedural(source2, undefined, this.namedProcedures[procedureName][0], 0, 0, 0, 0, point, mix, mask ? "RBGA" : "RGB",colours);
					}

				}
				return this.webGLFilters;
			},
			arguments : [{
					name : "name",
					description : "Name of procedural filter to apply",
					type : "String",
					range : null,
				},{
					name : "source2",
					description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
					type : "Image",
					range : null,
				},{
					name : "PivitHue",
					description : "Hue is centered on the pixel's hue under the pivit point",
					type : "Boolean",
					range : {def : false},
				},{
					name : "Hue1",
					description : "Hue mid point",
					type : "Number",
					range : {min : -1, max : 2, step : 0.01, def :1},
				},{
					name : "Hue2",
					description : "Hue range",
					type : "Number",
					range : {min : 0, max : 1, step : 0.01, def :0},
				},{
					name : "Hue3",
					description : "Hue falloff",
					type : "Number",
					range : {min : 0, max : 1, step : 0.01, def :0},
				},{
					name : "PivitSat",
					description : "Saturation is centered on the pixel's saturation under the pivit point",
					type : "Boolean",
					range : {def : false},
				}, {
					name : "Sat1",
					description : "Sat mid point",
					type : "Number",
					range : {min : -2, max : 2, step : 0.01, def :1},
				},{
					name : "Sat2",
					description : "Sat range",
					type : "Number",
					range : {min : 0, max : 1, step : 0.01, def :1},
				},{
					name : "Sat3",
					description : "Sat falloff",
					type : "Number",
					range : {min : 0, max : 1, step : 0.01, def :0},
				},{
					name : "PivitLum",
					description : "Luminance is centered on the pixel's luminance under the pivit point",
					type : "Boolean",
					range : {def : false},
				}, {
					name : "Lum1",
					description : "Lum mid point",
					type : "Number",
					range : {min : -2, max : 2, step : 0.01, def :1},
				},{
					name : "Lum2",
					description : "Lum range",
					type : "Number",
					range : {min : 0, max : 1, step : 0.01, def :1},
				},{
					name : "Lum3",
					description : "Lum falloff",
					type : "Number",
					range : {min : 0, max : 1, step : 0.01, def :0},
				},{
					name : "Hue",
					description : "Scale Hue",
					type : "Number",
					range : {min : -2, max : 2, step : 0.01, def : 1},
				},{
					name : "Sat",
					description : "Scale Saturation",
					type : "Number",
					range : {min : -2, max : 2, step : 0.01, def : 1},
				},{
					name : "Lum",
					description : "Scale Lumination",
					type : "Number",
					range : {min : 0, max : 2, step : 0.01, def : 1},
				},{
					name : "Mask",
					description : "Mask alpha moves range results to alpha channel",
					type : "Boolean",
					range : {def : false},
				}/*,{
					name : "FromPoint",
					description : "Hue sat and lum is set to the pixel under the pivit point",
					type : "Boolean",
					range : {def : false},
				}*/,
				sArgs.point,sArgs.mix,
			],
			setup(filter) { filter.arguments[0].range = Object.keys(filter.namedProcedures) },
		}
	);
    filterGL.filters.register("HSLCycTargeted", {
			name: "HSLCycTargeted",
			description : "Target specific HSL values and modify them",
			webGLFilters : null,
			namedProcedures : {
				select : [
				"Fa = (bCyc(Bh,c1h,c2h,c3h) * bump(Bs,c1s,c2s,c3s) * bump(Bl,c1l,c2l,c3l));Ra=1-Fa;Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
				"Fa = (bCyc(Bh, Er,c2h,c3h) * bump(Bs ,Eg,c2s,c3s) * bump(Bl, Eb,c2l,c3l));Ra=1-Fa;Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
				],
				selectInv : [
				"Fa = 1-(bCyc(Bh,c1h,c2h,c3h) * bump(Bs,c1s,c2s,c3s) * bump(Bl,c1l,c2l,c3l));Ra=1-Fa; Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
				"Fa = 1-(bCyc(Bh, Er,c2h,c3h) * bump(Bs, Eg,c2s,c3s) * bump(Bl, Eb,c2l,c3l));Ra=1-Fa; Rrgb=hsl2RGB(mix(Ahsl, Ahsl*v3(c4h,c4s,c4l),Fa))#HueClamp,Off",
				]
			},
			callback(procedureName,source2,pivitHue,hue1,hue2,hue3,pivitSat,sat1,sat2,sat3,pivitLum,lum1,lum2,lum3,hue,sat,lum,mask, point, mix) {
				if(this.namedProcedures[procedureName] !== undefined){
					var colours = {
						hue: true,
						color1 : [hue1,sat1,lum1,1],
						color2 : [Math.log2(hue2/2.2)**4,sat2,lum2,1],
						color3 : [hue3,sat3,lum3,1],
						color4 : [hue,sat,lum,1]
					};
					if(pivitHue || pivitSat || pivitLum){

						var pString = `
							D=Sa(Pxy);
							Ergb = v3(${pivitHue?"rgb2H(Drgb)":"c1h"}, ${pivitSat?"rgb2S(Drgb)":"c1s"}, ${pivitLum?"rgb2L(Drgb)":"c1l"});
							${this.namedProcedures[procedureName][1]}
						`;
						this.webGLFilters.procedural(source2, undefined,pString, 0, 0, 0, 0, point, mix, mask ? "RBGA" : "RGB",colours);
					}else{
						this.webGLFilters.procedural(source2, undefined, this.namedProcedures[procedureName][0], 0, 0, 0, 0, point, mix, mask ? "RBGA" : "RGB",colours);
					}

				}
				return this.webGLFilters;
			},
			arguments : [{
					name : "name",
					description : "Name of procedural filter to apply",
					type : "String",
					range : null,
				},{
					name : "source2",
					description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
					type : "Image",
					range : null,
				},{
					name : "PivitHue",
					description : "Hue is centered on the pixel's hue under the pivit point",
					type : "Boolean",
					range : {def : false},
				},{
					name : "Hue1",
					description : "Hue mid point",
					type : "Number",
					range : {min : -1, max : 2, step : 0.002, def :0},
				},{
					name : "Hue2",
					description : "Hue width",
					type : "Number",
					range : {min : 0, max : 2, step : 0.002, def :0},
				},{
					name : "Hue3",
					description : "Hue falloff",
					type : "Number",
					range : {min : 0.5, max : 1, step : 0.002, def :0.5},
				},{
					name : "PivitSat",
					description : "Saturation is centered on the pixel's saturation under the pivit point",
					type : "Boolean",
					range : {def : false},
				}, {
					name : "Sat1",
					description : "Sat mid point",
					type : "Number",
					range : {min : -2, max : 2, step : 0.002, def :1},
				},{
					name : "Sat2",
					description : "Sat range",
					type : "Number",
					range : {min : 0, max : 1, step : 0.002, def :1},
				},{
					name : "Sat3",
					description : "Sat falloff",
					type : "Number",
					range : {min : 0, max : 1, step : 0.002, def :0},
				},{
					name : "PivitLum",
					description : "Luminance is centered on the pixel's luminance under the pivit point",
					type : "Boolean",
					range : {def : false},
				}, {
					name : "Lum1",
					description : "Lum mid point",
					type : "Number",
					range : {min : -2, max : 2, step : 0.002, def :1},
				},{
					name : "Lum2",
					description : "Lum range",
					type : "Number",
					range : {min : 0, max : 1, step : 0.002, def :1},
				},{
					name : "Lum3",
					description : "Lum falloff",
					type : "Number",
					range : {min : 0, max : 1, step : 0.002, def :0},
				},{
					name : "Hue",
					description : "Scale Hue",
					type : "Number",
					range : {min : -2, max : 2, step : 0.002, def : 1},
				},{
					name : "Sat",
					description : "Scale Saturation",
					type : "Number",
					range : {min : -2, max : 2, step : 0.002, def : 1},
				},{
					name : "Lum",
					description : "Scale Lumination",
					type : "Number",
					range : {min : 0, max : 2, step : 0.002, def : 1},
				},{
					name : "Mask",
					description : "Mask alpha moves range results to alpha channel",
					type : "Boolean",
					range : {def : false},
				}/*,{
					name : "FromPoint",
					description : "Hue sat and lum is set to the pixel under the pivit point",
					type : "Boolean",
					range : {def : false},
				}*/,
				sArgs.point,sArgs.mix,
			],
			setup(filter) { filter.arguments[0].range = Object.keys(filter.namedProcedures) },
		}
	);
    filterGL.filters.register("GradientMixing", {
			name: "GradientMixing",
			description : "Mixes image with image of color using a gradient over the image  ",
			namedProcedures : {
                gradientHor : "V2=v2(cos(Ai),-sin(Ai));Fb=V2x*V2x+V2y*V2y;Fa=clamp(((X-Px)*V2x+(Y-Py)*V2y)/Fb,0,1);Fa=(Vb-Va)*ease(Fa,Vc)+Va;#op##Va,0,1#Vb,0,1#Vc,pEase,9",
                gradLocateHor : "Fb=H1/W1;V2=v2(cos(Ai),-sin(Ai)*Fb);Fa=((X-Px)*V2x+(Y*Fb-Py*Fb)*V2y)/((V2x*V2x+V2y*V2y)/2);Fa=Fa<0?(Va-Vc)*ease(-Fa,Vd)+Vc:(Vb-Vc)*ease(Fa,Vd)+Vc;#op##Va,0,1#Vb,0,1#Vc,0,1#Vd,pEase,9",
				gradLocateVert : "Fa=(Va-Vc)*ease(clamp((Py-Y)/Py,0,1),Vd)+Vc+(Vb-Vc)*ease(clamp((Y-Py)/(1-Py),0,1),Vd);#op##Va,0,1#Vb,0,1#Vc,0,1#Vd,pEase,5",
				circularFit: "Fa=(Vb-Va)*ease(clamp(dist(XY,Pxy)*Vc,0,1),Vd)+Va;#op##Va,0,1#Vb,0,1#Vc,8,-2#Vd,pEase,15",
				circular: "V2=v2(1,H1/W1);Fa=(Vb-Va)*ease(clamp(dist(XY*V2,Pxy*V2)*Vc,0,1),Vd)+Va;#op##Va,0,1#Vb,0,1#Vc,8,-2#Vd,pEase,15",
				//corners: "Fa=(Vb-Va)*X+Va;Fb=(Vd-Vc)*X+Vc;Fa=(Fb-Fa)*Y+Fa;#op##Va,0,1#Vb,0,1#Vc,0,1#Vd,0,1",
				corners: "Fa=(Vb-Va)*X+Va;Fb=(Vd-Vc)*X+Vc;Fa=(Fb-Fa)*Y+Fa;Fa=pow(Fa,2);#op##Va,0,1#Vb,0,1#Vc,0,1#Vd,0,1",

			},
			namedMixingOps : {
				replace : "R=mix(A,B,Fa)",
				add : "R=A+B*Fa",
				subtract : "R=A-B*Fa",
				multiply : "R=A*B*Fa",
				mix : "R=(A+B*Fa)/2",
				difference : "R=abs(A-B*Fa)",
				screen : "R=1-((1-A)*(1-B*Fa))",
				overlay : "R=1-((1-A)*(1-B*Fa))+(A*B*Fa)",
				lighter : "R=max(A,B*Fa)",
				darker : "R=min(A,B*Fa)",
				Hue : "Ah=mix(Ah,Bh,Fa);Rrgb=hsl2RGB(Ahsl)",
				Sat : "As=mix(As,Bs,Fa);Rrgb=hsl2RGB(Ahsl)",
				Lum : "Al=mix(Al,Bl,Fa);Rrgb=hsl2RGB(Ahsl)",
			},
			namedMixingOpsColor : {
				replace : "R=mix(A,v4(c1rgb,0),Fa)",
				add : "R=A+v4(c1rgb,0)*Fa",
				subtract : "R=A-v4(c1rgb,0)*Fa",
				multiply : "R=A*v4(c1rgb,0)*Fa",
				mix : "R=(A+v4(c1rgb,0)*Fa)/2",
				difference : "R=abs(A-v4(c1rgb,0)*Fa)",
				screen : "R=1-((1-A)*(1-v4(c1rgb,0)*Fa))",
				overlay : "R=1-((1-A)*(1-v4(c1rgb,0)*Fa))+(A*v4(c1rgb,0)*Fa)",
				lighter : "R=max(A,v4(c1rgb,0)*Fa)",
				darker : "R=min(A,v4(c1rgb,0)*Fa)",
				Hue : "Ah=mix(Ah,rgb2H(c1rgb),Fa);Rrgb=hsl2RGB(Ahsl)",
				Sat : "As=mix(As,rgb2S(c1rgb),Fa);Rrgb=hsl2RGB(Ahsl)",
				Lum : "Al=mix(Al,rgb2L(c1rgb),Fa);Rrgb=hsl2RGB(Ahsl)",
			},

			namedFilterArguments: {
				default: [[1],[2],[3],[4],[5],[6],[7]],
				gradientHor :[
                    [0,"Across", "Mix gradient across image"],
                    [4,"Left mix","Amount to mix left side"],
                    [5,"Right mix", "Amount to mix right side"],
                    [6,"Ease power", "Shape of easing curve"],
                    [7,false]
                ],
				gradLocateHor :[
                     [0,"Horizontal", "Horizontal gradient with center pos"],
                    [4,"Left mix","Amount to mix left side"],
                    [5,"Right mix", "Amount to mix right side"],
                    [6,"Center mix", "Amount to mix center. Use marker to position center"],
                    [7,"Ease power", "Shape of easing curve"]
                ],
				gradLocateVert :[
                     [0,"Vertical", "Vertical gradient with center pos"],
                    [4,"Top mix","Amount to mix top"],
                    [5,"Bottom mix", "Amount to mix bottom"],
                    [6,"Center mix", "Amount to mix center. Use marker to position center"],
                    [7,"Ease power", "Shape of easing curve"]
                ],
				circularFit :[
                     [0,"Circular", "Circular gradient streched to image ratio "],
                    [4,"Inner mix", "Amount to inner circle"],
                    [5,"Outer mix","Amount to outer circle"],
                    [6,"Circle size", "Radius of circle"],
                    [7,"Ease power", "Shape of easing curve"]
                ],
				circular :[
                    [0,"Circular", "Circular gradient"],
                    [4,"Inner mix", "Amount to inner circle"],
                    [5,"Outer mix","Amount to outer circle"],
                    [6,"Circle size", "Radius of circle"],
                    [7,"Ease power", "Shape of easing curve"]
                ],
				corners :[
                    [0,"Corners", "Gradient between corners"],
                    [4,"Top left mix","Amount to mix top left"],
                    [5,"Top right mix", "Amount to mix top right"],
                    [6,"Bottom left mix", "Amount to mix bottom left"],
                    [7,"Bottom right mix", "Amount to mix bottom right"]
                ],

			},
			UIArgumentUpdate,
			callback(procedureName,blendingOp,imageSource2,color1,valueA, valueB, valueC, valueD,point, mix, channels) {
                this.UIArgumentUpdate(procedureName);
				var glF = this.webGLFilters;
				var pString = this.namedProcedures[procedureName];
                point.x = point.x < 0 ? 0 : point.x > 1 ? 1 : point.x;
                point.y = point.y < 0 ? 0 : point.y > 1 ? 1 : point.y;

                if(imageSource2){
                    pString = pString.replace("#op#",this.namedMixingOps[blendingOp]);
                    glF.procedural(imageSource2, undefined, pString, valueA, valueB, valueC, valueD, point, mix, channels, {color1});
                }else{
                    pString = pString.replace("#op#",this.namedMixingOpsColor[blendingOp]);
                    glF.procedural(undefined, undefined, pString, valueA, valueB, valueC, valueD, point, mix, channels, {color1});
                }

				return glF;
			},
			arguments : [{
					name : "name",
					description : "Name of procedural filter to apply",
					type : "String",
					range : null,
				},{
					name : "blendingOp",
					description : "Blending operations",
					type : "String",
					range : null,
				},{
					name : "2nd Image Source",
					description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
					type : "Image",
					range : {def : null},
				} ,{
                    name : "Color Source",
                    description : "If no 2nd image use color",
                    type : "HexColor",
                    range : {def : "#FFFFFF"},
                },
                sArgs.valueA, 
                sArgs.valueB, 
                sArgs.valueC, 
                sArgs.valueD,
                sArgs.point, 
                sArgs.mix, 
                sArgs.channels
			],
			setup(filter) {
                filter.arguments[0].range = Object.keys(filter.namedProcedures);
                filter.arguments[1].range = Object.keys(filter.namedMixingOps);
                filter.arguments[4].def = -256;
                filter.arguments[6].def = 0;
                filter.arguments[7].def = 0;
            },
		}
	);
    filterGL.filters.register("simpleFilters", {
			name: "simpleFilters",
			description : "Simple single image filters, This is current home for experimental procedure filters",
			namedProcedures : {
				multiply : "R=A*B*Va#Va,1,2",
				screen : "R=1-(1-A)*(1-B)",
				dif : "R=(A-B)*1000",
				difInvert : "R=(1-(A-B))*1000",

				hueInvert : "Ah=1-Bh;Rrgb=hsl2RGB(Ahsl)",
				satInvert : "As=1-Bs;Rrgb=hsl2RGB(Ahsl)",
				lumInvert : "Al=1-Bl;Rrgb=hsl2RGB(Ahsl)",
				hslInvert : "Ahsl=1-Bhsl*v3(Va,Vb,Vc);Rrgb=hsl2RGB(Ahsl)#Va,-1,1#Vb,-1,1#Vc,-1,1",
				rgbaInvert : "R=1-B*v4(Va,Vb,Vc,Vd)#Va,-1,1#Vb,-1,1#Vc,-1,1#Vd,-1,1",
				BWStepMean :"R=v4(step(Va,v3(meanv3(Brgb))),Ba)#Va,0,1",
				BWStepMax : "R=v4(step(Va,v3(maxv3(Brgb))),Ba)#Va,0,1",
				BWStepMin : "R=v4(step(Va,v3(minv3(Brgb))),Ba)#Va,0,1",
				BWStepPerceptual : "Fa=step(Va,Br*0.2126+Bg*0.7152+Bb*0.0722);R=v4(Fa,Fa,Fa,Ba)#Va,0,1",
				BWStepPhoton : "D=B*256;D*=D;Drgb=step(Va,v3(pow((Dr+Dg+Db)/3,0.5)/256));R=v4(Drgb,Ba)#Va,0,1",
				BWMean : "R=v4(v3(meanv3(Brgb)),Ba)",
				BWMax : "R=v4(v3(maxv3(Brgb)),Ba)",
				BWMin : "R=v4(v3(minv3(Brgb)),Ba)",
				BWPerceptual : "Fa=Br*0.2126+Bg*0.7152+Bb*0.0722;R=v4(Fa,Fa,Fa,Ba)",
				BWPhoton : "D=B*256;D*=D;Drgb=v3(pow((Dr+Dg+Db)/3,0.5)/256);R=v4(Drgb,Ba)",
				DotRgbHSl : "Rrgb=v3(dot(Brgb*Va,Bhsl*Vb));Ra=Ba#Va,0,1#Vb,0,1",
				CrossRgbHSl : "Rrgb=cross(Brgb*Va,Bhsl*Vb);Ra=Ba#Va,0,1#Vb,0,1",
				NormRgb : "Rrgb=norm(Brgb-v3(Va,Vb,Vc));Ra=Ba#Va,-1,1#Vb,-1,1#Vc,-1,1",
				NormHsl : "Ahsl=norm(Bhsl-Ahsl*v3(Va,Vb,Vc));Ra=Ba;Rrgb=hsl2RGB(Ahsl)#Va,-1,1#Vb,-1,1#Vc,-1,1",
				NormHslAB : "Ahsl=norm(Bhsl-Ahsl);Ra=Ba;Rrgb=hsl2RGB(Ahsl)#Va,-1,1#Vb,-1,1#Vc,-1,1",
				NormRgbAB : "Rrgb=norm(Brgb-Argb);Ra=Ba;",
				randMix : "R=mix(A,B,rF);",
				randColLev : "Rrgb=mix(Brgb*rV3,Brgb,Va);Ra=Ba#Va,0,1",
				randTest : "Rrgb=rV3*Va;Ra=rF*Va#Va,0,2",
				randScat : "R=mix(B,A,step(Va,rF))#Va,0,1",

				movePixMeanRGB: "Fa=((Br+Bg+Bb)/3)*pi2;R=mix(A,SA(v2(cos(Fa),sin(Fa))*Va),Vb)#Va,-10,10#Vb,0,1",
				movePixMeanRGBMore: "Fa=((Br+Bg+Bb)/3)*pi2*Vc;R=mix(A,SA(v2(cos(Fa),sin(Fa))*Va),Vb)#Va,-10,10#Vb,0,1#Vc,-10,10",
				movePixRGB: `
					Fa=((Br+Bg+Bb)/3)*pi2*Vc;
					Fb=cos(Fa);
					Fc=sin(Fa);
					D=mix(SA(v2(Fb,Fc)*Va),B,Vb);
					Fa=meanv3(Drgb)*pi2*Va;
					R=mix(SA(v2(cos(Fa)+Fc,sin(Fa)+Fb)*Va),A,Vb);
					#Va,-10,10#Vb,0,1#Vc,-10,10`,
				pixelGrow : `
					Fc = cos(Ar*pi*2+Vb) * Va;
					Fd = sin(Ar*pi*2+Vb) * Va;
					D = SA(v2(-Fc,-Fd));
					E = SA(v2(Fc,Fd));
					Fa = meanv4(D)-meanv4(E) + 0.5;
					R = mix(D,E,step(0.5,Fa));
					Fc = cos(Ag*pi*2+Vc) * Va;
					Fd = sin(Ag*pi*2+Vc) * Va;
					D = SA(v2(-Fc,-Fd));
					E = SA(v2(Fc,Fd));
					Fb = meanv4(D)-meanv4(E) + 0.5;
					D = mix(D,E,step(0.5,Fb));
					R = mix(R,D,step(0.5,Fa-Fb+0.5));
					#Va,-10,10#Vb,-10,10#Vc,-10,10`,
				movePixHueLum : "R=mix(SA(v2(cos(Bh*pi2*Vc),sin(Bh*pi2*Vc))*Bl*Va),A,Vb)#Va-10,10#Vb,0,1#Vc,-10,10",

				posMixVert : "R=mix(A,B,Y);",
				posMixHor : "R=mix(A,B,X);",
				posMixVertSet : "R=mix(A,B,clamp(abs(Y-Va)*Vb+Vc,0,1));#Va,0,1#Vb,-2,2#Vc,-2,2",
				posMixHorSet : "R=mix(A,B,clamp(abs(X-Va)*Vb+Vc,0,1));#Va,0,1#Vb,-2,2#Vc,-2,2",
				posMixCircle : "R=mix(A,B,clamp(dist(XY,v2(Vc,Vd))*Va+Vb,0,1));#Va,0,1#Vb,-2,2#Vc,0,1#Vd,0,1",
				hueShift : "Ah=Bh+Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1#HueClamp,Off",
				hueMultiply : "Ah=Bh*Va+Vb;Rrgb=hsl2RGB(Bhsl)#Va,-4,4#Vb,-1,1#HueClamp,Off",
				hueContrast :"Ah=(Bh-0.5)*(Va-1)+0.5+Vb;Rrgb=hsl2RGB(Ahsl)#Va,pNorm,10#Vb,0,1#HueClamp,Off",
				lumContrast :"Al=(Bl-0.5)*(Va-1)+0.5+Vb;Rrgb=hsl2RGB(Ahsl)#Va,pNorm,10#Vb,-3,3",
				satContrast :"As=(Bs-0.5)*(Va-1)+0.5+Vb;Rrgb=hsl2RGB(Ahsl)#Va,pNorm,10#Vb,-3,3",
				hueSet : "Ah=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
				satSet : "As=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
				lumSet : "Al=Va;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
				hueRangeRemove : "R=A;Ra=bump(Bh,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
				satRangeRemove : "R=A;Ra=bump(Bs,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
				lumRangeRemove : "R=A;Ra=bump(Bl,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
				redRangeRemove : "R=A;Ra=bump(Br,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
				greenRangeRemove : "R=A;Ra=bump(Bg,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
				blueRangeRemove : "R=A;Ra=bump(Bb,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
				alphaRangeRemove : "R=A;Ra=bump(Ba,Va,Vb,Vc)#Vb,0,1#Va,0,1#Vc,0,1",
				hueRangeSat : "As=mix(Bs*Vd,Bs,bump(Bh,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
				hueRangeLum : "Al=mix(Bl*Vd,Bs,bump(Bh,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
				hueRangeHue : "Ah=mix(Bh+Vd,Bs,bump(Bh,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
				satRangeSat : "As=mix(Bs*Vd,Bs,bump(Bs,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
				satRangeLum : "Al=mix(Bl*Vd,Bs,bump(Bs,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
				satRangeHue : "Ah=mix(Bh+Vd,Bs,bump(Bs,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
				lumRangeSat : "As=mix(Bs*Vd,Bs,bump(Bl,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
				lumRangeLum : "Al=mix(Bl*Vd,Bs,bump(Bl,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-2,2",
				lumRangeHue : "Ah=mix(Bh+Vd,Bs,bump(Bl,Va,Vb,Vc));Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
				distanceRemove : "R=A;Ra=step(Vd,dist(Ahsl,v3(Va,Vb,Vc)));#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
				distanceHue : "Ah=dist(Ahsl,v3(Va,Vb,Vc))*Vd;Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
				distanceSat : "As=dist(Ahsl,v3(Va,Vb,Vc))*Vd;Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
				distanceLum : "Al=dist(Ahsl,v3(Va,Vb,Vc))*Vd;Rrgb=hsl2RGB(Ahsl)#Vb,0,1#Va,0,1#Vc,0,1#Vd,-1,1",
				distanceRemoveAB : "R=A;Ra=step(Va,dist(Ahsl,Bhsl)*Vb);#Vb,-2,2#Va,0,1",
				distanceHueAB : "Ah=dist(Ahsl,Bhsl)*Va;Rrgb=hsl2RGB(Ahsl)#Va,-1,1",
				distanceSatAB : "As=dist(Ahsl,Bhsl)*Va;Rrgb=hsl2RGB(Ahsl)#Va,-1,1",
				distanceLumAB : "Al=dist(Ahsl,Bhsl)*Va;Rrgb=hsl2RGB(Ahsl)#Va,-1,1",

				hueExpand : "Ah=clamp((Ah-Va)/Vb+Va,0,1);Rrgb=hsl2RGB(Ahsl)#Va,0,1#Vb,0,1#HueClamp,Off",
				hueBox : "Ah=X;As=1;Al=Y;Rrgb=hsl2RGB(Ahsl)",
				hueCircle : "Ah=dist(XY,v2(0.5,0.5))*Va + Vb;Rrgb=hsl2RGB(Ahsl)#Va,-6,6#Vb,0,2#HueClamp,Off",
				colorBox :"Fa=(Vb-Va)*X+Va;Fb=(Vd-Vc)*X+Vc;Ah=(Fb-Fa)*Y+Fa;Rrgb=hsl2RGB(v3(Ah,1,0.5))#Va,0,1#Vb,0,1#Vc,0,1#Vd,0,1",
				satLumBox : "Ah=Va;As=X;Al=Y;Rrgb=hsl2RGB(Ahsl)#Va,0,1",
				luminance : "Al=Bl;Rrgb=hsl2RGB(Ahsl)",
				lum2Sat : "As=Bl;Rrgb=hsl2RGB(Ahsl)",
				lum2Hue : "Ah=Bl;Rrgb=hsl2RGB(Ahsl)",
				lumFromHS : "Al=Bh*Bs;Rrgb=hsl2RGB(Ahsl)",
				saturation : "As=Bs;Rrgb=hsl2RGB(Ahsl)",
				power : "R=pow(A,v4(Va))#Va,pNorm,10",
				powerAdd : "R=A+pow(A,v4(Va))#Va,pNorm,10",
				powerSub : "R=A-pow(A,v4(Va))#Va,pNorm,10",
				powerDown : "R=0.5+((1-pow(A,v4(Vb)))-pow(A,v4(Va)))#Va,pNorm,10#Vb,pNorm,10",
				contrast : "R=(A-0.5)*(Va-1)+0.5#Va,pNorm,10",
				contrastChannels : "R=(A-0.5)*v4(Va-1,Vb-1,Vc-1,Vd-1)+0.5#Va,pNorm,10#Vb,pNorm,10#Vc,pNorm,10#Vd,pNorm,10",
			},
			callback(procedureName,source2,valueA, valueB, valueC, valueD, point, mix, channels) {
				if(this.namedProcedures[procedureName] !== undefined){
					this.webGLFilters.procedural(source2, undefined, this.namedProcedures[procedureName], valueA, valueB, valueC, valueD,point, mix, channels);
				}
				return this.webGLFilters;
			},
			arguments : [{
					name : "name",
					description : "Name of procedural filter to apply",
					type : "String",
					range : null,
				},{
					name : "source2",
					description : "The image or texture that is the second source. If not given then the filter is applied to itself. If the src2Image is not a texture it is converted to a texture",
					type : "Image",
					range : null,
				}, sArgs.valueA, sArgs.valueB, sArgs.valueC, sArgs.valueD,sArgs.point, sArgs.mix, sArgs.channels
			],
			setup(filter) { filter.arguments[0].range = Object.keys(filter.namedProcedures) },
		}
	);
    filterGL.filters.register("Unsharpen", {
			name: "Unsharpen",
			description : "Unsharpen mask sharpens the image by blurring the image and creating a mask from the difference to sharpen the image",
			callback(radius,scale,offset,invert,useMean,iterations, mix, channels) {
				var glF = this.webGLFilters;
				const gBlur = filterGL.filters.getFilter("gBlur");
				radius = radius < 3 ? 3 : radius;
				gBlur.callback(radius, scale, 0 ,iterations,1, channels);
				var pString = "R=B+(B-A)*Va#Va,0,8";
				if(useMean){
					pString = "D=B-A;Fa=1+((Dr+Db+Dg)/3)*Va;R=B*Fa#Va,0,8";
					if(invert){
						pString = "D=B-A;Fa=1-((Dr+Db+Dg)/3)*Va;R=B*Fa#Va,0,8";
					}
				}else{
					if(invert){
						pString = "R=B+(A-B)*Va#Va,0,8";
					}
				}
				glF.procedural(glF.sourceTexture, undefined, pString, offset, 0, 0, 0, [0.5,0.5], mix, channels);
				return glF;
			},
			arguments : [{
					name : "Radius",
					description : "How wide the effect is",
					type : "Number",
					range : {min : 3, max : 31, step : 1, def : 3},
				},{
					name : "scale",
					description : "Additional scale",
					type : "Number",
					range : {min : -1, max : 1, step : 0.02, def : 0},
				},{
					name : "offset",
					description : "determines how the black and white is split",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 128},
				},{
					name : "Invert",
					description : "Inverts the result",
					type : "Boolean",
					range : {def : false},
				},{
					name : "UseMean",
					description : "Uses the mean of the difference for each channel",
					type : "Boolean",
					range : {def : false},
				}, {
					name : "iterations",
					description : "Number of times to apply the filter before returning the result. Be careful some machines will crash the GPU if you use large matrix with many iteration. Iteration is done in JavaScript.",
					type : "Number",
					range : {min : 1, max : 32, step : 1, def : 1},
				}, sArgs.mix, sArgs.channels
			],
		}
	);
    filterGL.filters.register("CustomConvolute", {
			name: "CustomConvolute",
			description : "Uses a custom convolution filter defined as a bitmap",
			callback(pxSize, matImg, minVal, maxVal, scale, offset, invert, useMean, iterations, mix, channels) {
				var glF = this.webGLFilters;
                var util = glF.filters.getFilter("procedural").utilities;
                if (matImg && matImg.ctx) {
                    const cCtx = matImg.ctx;
                    if (cCtx.canvas.width !== cCtx.canvas.height) {
                        log.warn("Convolution media image must be square!");
                        return glF;  
                    }
                    var size = cCtx.canvas.width / pxSize;
                    if ((size | 0) !== size) {
                        log.warn("Convolution media image must be divisible by " + pxSize + " px!");
                        return glF;  
                    }
                    if (size > 15) { 
                        log.warn("Convolution media image is too large!");
                        return glF;  
                    }
                    const b8 = cCtx.getImageData(0, 0, cCtx.canvas.width, cCtx.canvas.height);

                    //iterations = iterations > 5 ? 5 : iterations;
                    this.convolutionMatrix = util.matrix2Spacial(util.createMatrixFromRGBPixels(b8.data, size, pxSize, minVal, maxVal));
                    glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), iterations, channels, true, true,false);
                }                 
                return glF;  
                
;
			},
			arguments : [{
					name : "Pixel size",
					description : "Size of convolution image pixel",
					type : "Number",
					range : {min : 1, max : 8, step : 1, def : 2},
				},{
                    name : "Matrix image",
                    description : "Image representing the convolution matrix",
                    type : "Canvas",
                    range : {def : null},
                },{
					name : "Min Value",
					description : "Matrix min value",
					type : "Number",
					range : {min : -4, max : 4, step : 0.02, def : 0},                    
                },{
					name : "Max Value",
					description : "Matrix max value",
					type : "Number",
					range : {min : -4, max : 4, step : 0.02, def : 1},                    
                },{
					name : "scale",
					description : "Additional scale",
					type : "Number",
					range : {min : -1, max : 1, step : 0.02, def : 0},
				},{
					name : "offset",
					description : "determines how the black and white is split",
					type : "Number",
					range : {min : -256, max : 256, step : 1, def : 128},
				},{
					name : "Invert",
					description : "Inverts the result",
					type : "Boolean",
					range : {def : false},
				},{
					name : "UseMean",
					description : "Uses the mean of the difference for each channel",
					type : "Boolean",
					range : {def : false},
				}, {
					name : "iterations",
					description : "Number of times to apply the filter before returning the result. Be careful some machines will crash the GPU if you use large matrix with many iteration. Iteration is done in JavaScript.",
					type : "Number",
					range : {min : 1, max : 32, step : 1, def : 1},
				}, sArgs.mix, sArgs.channels
			],
		}
	);



    const cArgs = {};
    convolutionFilter.arguments.forEach(arg => cArgs[arg.name] = arg);
    cArgs.scale = {
        name : "scale",
        description : "Amount of additional scaling. < 0 reduces scale of filter. >1 increases scale of filter",
        type : "Number",
        range : {min : -1, max : 1, step : 0.02, def : 0},
    };
    cArgs.size = {
        name : "size",
        description : "Pixel size of the matrix used by the convolution filter\nUse settings.misc.maxConvoluteSize to increase max size ",
        type : "Number",
        range : {min : 3, max : settings.maxConvoluteSize, step : 2, def : 3},
    };
    cArgs.weightScale = {
        name : "weightScale",
        description : "Determines how the weighting is distributed over the matrix",
        type : "Number",
        range : {min : -1, max : 1, step : 0.02, def : 0},
    };
    filterGL.filters.register("pinSharp",  {
        name : "pinSharp",
        description : "High quality sharpen filter",
        webGLFilters : null,
        convolutionMatrix : null,
        callback(size, scale, weightScale,iterations,noiseReduce, mix, channels) {
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("convolution").utilities;
            size = util.valideBoxSize(size);
            var maxIterations  = Math.ceil((21*21*4*2048*1360)/(size*size*glF.width * glF.height * (noiseReduce ? 5 : 1)));
            iterations = iterations > maxIterations ? maxIterations : iterations;
            this.convolutionMatrix = util.optimiseSpacialMatrix(
                util.matrix2Spacial(
                    util.createSharpenMatrix(
                        size,
                        util.curvePowerNorm(weightScale)
            )));
            glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), iterations, channels, true, true, noiseReduce);
            return glF;
        },
        arguments : [
            cArgs.size, cArgs.scale, cArgs.weightScale, cArgs.iterations, cArgs.noiseReduce, cArgs.mix, cArgs.channels
        ],
    });
    filterGL.filters.register("boxBlur",  {
        name : "boxBlur",
        webGLFilters : null,
        description : "Simple Box blur filter",
        callback(size, scale,iterations,mix, channels) {
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("convolution").utilities;
            size = util.valideBoxSize(size);
            var maxIterations  = Math.ceil((21*21*4*2048*1360)/(size*size*glF.width * glF.height));
            iterations = iterations > maxIterations ? maxIterations : iterations;
            this.sharpenMatrix = util.matrix2Spacial(
                    util.createBoxBlurMatrix(size)
            );
            glF.convolution(this.sharpenMatrix, mix, util.curvePowerNorm(scale), iterations, channels, true, true);
            return glF;
        },
        arguments : [ cArgs.size, cArgs.scale,  cArgs.iterations, cArgs.mix, cArgs.channels],
    });
    filterGL.filters.register("gBlur",  {
        name : "gBlur",
        description : "Blur filter similar to a Gaussian blur. Iteration limited to prevent WebGL crashing on some systems",
        webGLFilters : null,
        convolutionMatrix : null,
        callback(size, scale, weightScale,iterations,mix, channels) {
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("procedural").utilities;
            size = util.valideBoxSize(size);
            var maxIterations  = Math.ceil((21*21*4*2048*1360)/(size*size*glF.width * glF.height));
            iterations = iterations > maxIterations ? maxIterations : iterations;
            this.convolutionMatrix = util.optimiseSpacialMatrix(util.matrix2Spacial(util.createGBlurMatrix(size,util.curvePowerNorm(weightScale))));
            glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), iterations, channels, true, true,false);
            return glF;
        },
        arguments : [ cArgs.size, cArgs.scale, cArgs.weightScale, cArgs.iterations, cArgs.mix, cArgs.channels ],
    });
    filterGL.filters.register("imageOutline",  {
        name : "imageOutline",
        description : "Outline high contrast areas in image",
        webGLFilters : null,
        convolutionMatrix : null,
        callback(size, scale,invert, noiseReduce, mix, channels) {
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("convolution").utilities;
            size = util.valideBoxSize(size);
            this.convolutionMatrix = util.optimiseSpacialMatrix(util.matrix2Spacial(
                util.createOutlineMatrix(size,util.curvePowerNorm(0))
            ));
            glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true, noiseReduce);
            if(invert){
                glF.procedural(undefined,undefined,"R=(1-A)+v4(Aa)",0,0,0,0,[0.5,0.5],1,channels);
            }
            return glF;
        },
        arguments : [
            cArgs.size, cArgs.scale,
            {
                name : "invert",
                description : "Inverts the colours",
                type : "Boolean",
                range: {def : false},
            },
            cArgs.noiseReduce, cArgs.mix, cArgs.channels
        ],
    });
    filterGL.filters.register("denoise",  {
        name : "denoise",
        description : "Denoise filter removes noise from low contrast parts of the image.",
        webGLFilters : null,
        convolutionMatrix : null,
        callback(exponent,/*dotBase,*/ hueSat, size, scale,iterations,mix, channels) {
            const dotBase = 0.25;
            exponent = exponent ** 2;
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("convolution").utilities;
            size = util.valideBoxSize(size);
            this.convolutionMatrix = util.optimiseSpacialMatrix(util.matrix2Spacial(util.createGBlurMatrix(size,1)));

            var custom = {
                uniform : `
                    uniform float exponent;
                    uniform float dotBase;
                `,
                prep : `
                    vec4 col = vec4(0.0);
                    float total = 0.0;
                `,
                loop : `
                    float weight = 1.0 - abs(dot(sample.rgb - src1Color.rgb, vec3(dotBase)));
                    weight = pow(weight, exponent);
                    color += sample * weight;
                    total += weight;
                `,
                result : `
                    color /= total;
                `,
                uniforms : {
                    exponent,
                    dotBase,
                }
            }

            if(hueSat){
                custom.uniform = `
                    ##rgb2HSL##
                    ##hsl2RGB##
                    uniform float exponent;
                    uniform float dotBase;
                `;
                custom.result = `
                    color /= total;
                    vec3 sHSL = rgb2HSL(src1Color.rgb);
                    vec3 rHSL = rgb2HSL(color.rgb);
                    color = vec4(hsl2RGB(vec3(rHSL.x,rHSL.y,sHSL.z)),color.w);
                `;

            }
            glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), iterations, channels, false, true,false,custom);
            return glF;
        },
        arguments : [{
                name : "Edge",
                description : "Edge cutoff",
                type : "Number",
                range : {min : 0, max : 20, step : 0.25, def : 9},
            },{
                name : "HueSat",
                description : "Filter is applied only to the hue and saturation\nUse to remove color noise from JPEG",
                type : "Boolean",
                range : {def : false},
            },
            cArgs.size, cArgs.scale,cArgs.iterations, cArgs.mix, cArgs.channels
        ],
    });
    filterGL.filters.register("emboss",  {
        name : "emboss",
        description : "Emboss filter",
        webGLFilters : null,
        convolutionMatrix : null,
        callback(size, scale,angle,strength, mix, channels) {
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("convolution").utilities;
            var width = size * 1;
            width = util.valideBoxSize(width);
            size = util.valideBoxSize(size);
            angle *= Math.PI/180;
            strength *= 3;
            this.convolutionMatrix = util.rotateSpacialMatrix(
                util.optimiseSpacialMatrix(
                    util.embossMatrixExpand(
                        util.matrix2Spacial(
                            util.createEmbossMatrix(
                                size,
                                width,
                                util.curvePowerNorm(0),
                                strength,
                                util.curvePowerNorm(0)
                            )
                        ),
                        util.curvePowerNorm(0),
                        3
                    )
                ),
                angle
            );
            glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true,false);
            return glF;
        },
        arguments : [
            cArgs.size,
            cArgs.scale,
            {
                name : "angle",
                description : "The angle of the embossing (90 deg to the apparent light)",
                type : "Number",
                range : {min : 0, max : 360, step : 1, def : 0},
            },{
                name : "strength",
                description : "How strong the embossing is.",
                type : "Number",
                range : {min : -1, max : 1, step : 0.05, def : 1},
            },
            cArgs.mix, cArgs.channels
        ],
    });
    filterGL.filters.register("edgeDetect",  {
        name : "edgeDetect",
        description : "Edge Detect filter for Painter image tracking utilities",
        webGLFilters : null,
        convolutionMatrix : null,
        callback(size, scale,angle,strength, mix, channels) {
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("convolution").utilities;
            var width = size * 1;
            width = util.valideBoxSize(width);
            size = util.valideBoxSize(size);
            angle *= Math.PI/180;
            strength *= 3;
            this.convolutionMatrix = util.rotateSpacialMatrix(
                util.optimiseSpacialMatrix(
                    util.matrix2Spacial(
                        util.createSobelMatrix(
                            size,
                            width,
                            util.curvePowerNorm(0),
                            strength,
                            util.curvePowerNorm(0)
                        )
                    )
                ),
                angle
            );
            glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true, false);
            return glF;
        },
        arguments : [
            cArgs.size,
            cArgs.scale,
            {
                name : "angle",
                description : "The angle of the embossing (90 deg to the apparent light)",
                type : "Number",
                range : {min : 0, max : 360, step : 1, def : 0},
            },{
                name : "strength",
                description : "How strong the embossing is.",
                type : "Number",
                range : {min : -1, max : 1, step : 0.05, def : 1},
            },
            cArgs.mix, cArgs.channels
        ],
    });
    filterGL.filters.register("edgeDetectTripple",  {
        name : "edgeDetectTripple",
        description : "Edge Detect filter for Painter image tracking utilities\n Detects edge and directoin in single pass",
        webGLFilters : null,
        convolutionMatrix : null,
        trippleMatrix : undefined,
        callback(size, scale,angle,strength,spreadCurve,spreadWidthCurve,type, mix, channels) {
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("convolution").utilities;
            var width = size * 1;
            width = util.valideBoxSize(width);
            size = util.valideBoxSize(size);
            angle *= Math.PI/180;

            this.convolutionMatrix = util.rotateSpacialMatrix(
                util.optimiseSpacialMatrix(
                    util.matrix2Spacial(
                        util.normalizeMatrix(
                            util.createEdgeMatrix(
                                size,
                                width,
                                util.curvePowerNorm(spreadCurve),
                                strength,
                                util.curvePowerNorm(spreadWidthCurve),
                                type
                            ),
                            false,
                            0
                        )
                    )
                ),
                angle
            );
            this.trippleMatrix = util.spacialMatricesToTripple(
                this.convolutionMatrix,
                Math.PI * 2 * (1 / 3),
                Math.PI * 2 * (2 / 3),
                this.trippleMatrix
            );


            glF.convolution(this.trippleMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true, false);
            return glF;
        },
        arguments : [
            cArgs.size,
            cArgs.scale,
            {
                name : "angle",
                description : "The angle of the outline",
                type : "Number",
                range : {min : 0, max : 360, step : 1, def : 0},
            },{
                name : "strength",
                description : "How strong the outline is.",
                type : "Number",
                range : {min : -3, max : 3, step : 0.05, def : 1},
            },{
                name : "spreadCurve",
                description : "convolution spread curve.",
                type : "Number",
                range : {min : -1, max : 1, step : 0.05, def : 0},
            },{
                name : "spreadWidthCurve",
                description : "convolution width spread curve.",
                type : "Number",
                range : {min : -1, max : 1, step : 0.05, def : 0},
            },{
                name : "type",
                description : "The type of edge detect to use",
                type : "String",
                range : ["Sobel","Edge","EdgeInv"]
            },

            cArgs.mix, cArgs.channels
        ],
    });
    filterGL.filters.register("directionalOutline",  {
        name : "directionalOutline",
        description : "Experimental filter uses an accumulating texture to sum one sided edge detection",
        webGLFilters : null,
        convolutionMatrix : null,
        callback(size, scale,angle,iterations, mix, channels) {
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("convolution").utilities;
            size = util.valideBoxSize(size);
            var mid = (size - 1) / 2;
            angle *= Math.PI/180;
            var m = this.convolutionMatrix = util.createBoxBlurMatrix(size);
            for(var i = 0; i < m.length; i++){
                var x = i % size;
                var y = Math.floor(i / size);
                if(x === mid){
                    m[i] = -1;
                }else{
                    m[i] = x-mid;
                }
            }
            this.convolutionMatrix = util.rotateSpacialMatrix(
                util.optimiseSpacialMatrix(util.matrix2Spacial(util.normalizeMatrix(m,false,-1))),
                angle
            );
            var tempText = glF.createTexture();
            glF.fromSource(); // forces this filter to start from the source image
            glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true,false);
            glF.procedural(undefined,undefined,"Rrgb=v3(meanv3(Argb))",0,0,0,0,[0.5,0.5],1,channels);
            glF.copyBufferTo(tempText);
            for(var i = 1; i < iterations; i+= 1){
                this.convolutionMatrix = util.rotateSpacialMatrix(this.convolutionMatrix,(2*Math.PI) / (iterations-1));
                glF.fromSource();
                glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true,false);
                glF.procedural(tempText,undefined,"Rrgb=Brgb+v3(meanv3(Argb))",0,0,0,0,[0.5,0.5],1,channels);
                glF.copyBufferTo(tempText);
            }
            tempText.destroy();
            return glF;
        },
        arguments : [
            cArgs.size,
            cArgs.scale,{
                name : "angle",
                description : "The angle of the embossing (90 deg to the apparent light)",
                type : "Number",
                range : {min : 0, max : 360, step : 1, def : 0},
            },{
                name : "iterations",
                description : "Number of iterations to rotate the filter 360deg. If set at 1 then only one sample is made.",
                type : "Number",
                range : {min : 1, max : 16, step : 1, def : 1},
            },
            cArgs.mix, cArgs.channels
        ],
    });
    filterGL.filters.register("Sobel",  {
            name : "Sobel",
            description : "Sobel filter plus some experiments in regard to how it adapts to the modified convolution method",
            webGLFilters : null,
            convolutionMatrix : null,
            callback(test) {
                var glF = this.webGLFilters;
                var util = glF.filters.getFilter("convolution").utilities;

                //var gradients can use 3 and 10
                var g1 = 3; //
                var g2 = 10;  //
                var Gx = [-g1,0,g1,-g2,0,g2,-g1,0,g1];
                var Gy = [-g1,-g2,-g1,0,0,0,g1,g2,g1];
                var GSx = util.optimiseSpacialMatrix(util.matrix2Spacial(Gx));
                var GSy = util.optimiseSpacialMatrix(util.matrix2Spacial(Gx));
                if(this.shader === undefined){
                    this.sharder  =  glF.Shader(null, null).useLinker();
                }
                var cFilter = [...GSx,...GSy];
                var subFilterLen = cFilter.length/3;
                var subFilterCount = 2;
                this.sharder.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec3 filter[${cFilter.length}];
                    uniform vec2 texSize;
                    varying vec2 texCoord;
                    const float pi2 = ${(Math.PI*2).toFixed(6)};
                    const float pi = ${Math.PI.toFixed(6)};
                    const float pi0p5 = ${(Math.PI/2).toFixed(6)};
                    ##direction##
                    void main() {
                        vec4 centPixel = texture2D(texture, texCoord);
                        vec4 res = vec4(0.0);
                        vec4 result[${subFilterCount}];
                        vec4 dir;;
                        int k = 0;
                        for (int j = 0; j < ${subFilterCount}; j+= 1) {
                            vec4 color = vec4(0.0);
                            for (int i = 0; i < ${subFilterLen}; i += 1) {
                                vec4 sample = texture2D(texture, texCoord + vec2(filter[j*${subFilterLen} + i].x,filter[j*${subFilterLen} + i].y) / texSize);
                                color += sample * filter[j*${subFilterLen} + i].z;
                            }
                            result[j] = color;
                            res += color*color;
                        }
                        res = sqrt(res);
                        dir = atan(result[1]/result[0]);
                        vec2 vDir = vec2(cos(dir.x),sin(dir.x)) ;
                        vDir += vec2(cos(dir.y),sin(dir.y)) ;
                        vDir += vec2(cos(dir.z),sin(dir.z)) ;
                        float strength = res.x + res.y + res.z;
                        strength /= 3.0;
                        float d = direction(vDir) /pi2;
                        gl_FragColor = vec4(vec3(strength),1);
                    }
                `);
                var uniformObj = {
                    filter: {type : "uniform3fv", value : cFilter},
                    texSize : [glF.width,glF.height],
                };
                glF.filter(this.sharder,uniformObj);
                return glF;
            },
            arguments : [
                {
                    name : "test",
                    description : "BS data as my UI needs a arg or it spits it",
                    type : "Number",
                    range : {min : 0.05, max : 2, step : 0.05, def : 1},
                },
            ],
        }
    );
    filterGL.filters.register("reduceNoise",  {
        name : "reduceNoise",
        description : "Various filters that can remove different types of noise from BW scanned images (also images from outline filters) ",
        webGLFilters : null,
        convolutionMatrix : null,
        customProcessing : {
            uniform : `
                uniform float threshold;
                uniform int outputType;
                uniform int blackToAlpha;
            `,
            prep : `
                float total1 = 0.0;
                float total = 0.0;
                float count = 0.0;
            `,
            loop : `
                float val = (sample.r + sample.g + sample.b) / 3.0;
                total += abs(val - filter[i].z);
                total1 += abs(val - (1.0-filter[i].z));
                count += 1.0;
            `,
            result : `
                total /= count;
                total1 /= count;
                if(total < threshold && total1 > 1.0-threshold){
                    total = 0.0;
                }else{
                    total = 1.0;
                }
                if(outputType == 2){
                    color = vec4(vec3(total),src1Color.a);
                }else if(outputType == 1){
                    if(total > 0.5){
                        color = vec4(vec3(1.0), src1Color.a);
                    }else{
                        color = src1Color;
                    }
                }else if(outputType == 0){
                    if(total < 0.5){
                        color = vec4(vec3(0.0), src1Color.a);
                    }else{
                        color = src1Color;
                    }
                }
                if(blackToAlpha == 1){
                    color.a *= total;
                }
            `,
            uniforms : {
                threshold : 0.5,
                outputType : { type : "uniform1i", value : 1 },
                blackToAlpha : { type : "uniform1i", value : 0 },
            }
        },
        callback( type,invert,blackToAlpha,keep,threshold,size, scale, angle,mix, channels) {
            var glF = this.webGLFilters;
            var util = glF.filters.getFilter("convolution").utilities;
            size = util.valideBoxSize(size);

            var mat = util.createBoxBlurMatrix(size);
            var mid = (size - 1) / 2;
            var index = 0;
            for(var y = 0; y < size; y ++){
                for(var x = 0; x < size; x ++){
                    mat[index++] = 0;
                }
            }
            index = 0;
            var halfMid = Math.floor(mid / 2);
            for(var y = 0; y < size; y ++){
                for(var x = 0; x < size; x ++){
                    if(type === "KeepLines"){
                        if(Math.abs(x-mid)<= halfMid){
                            mat[index] = 1;
                        }
                    }else if(type === "checker"){
                        if(((x % 2) + y) % 2 === 1){
                            mat[index] = 1;
                        }

                    }else if(type === "checker2"){
                        if(((Math.floor(x/2) % 2) + Math.floor(y/2)) % 2 === 1){
                            mat[index] = 1;
                        }

                    }else if(type === "box"){
                        if(x > halfMid && x < size-1-halfMid && y > halfMid && y < size-1-halfMid){
                            mat[index] = 1;
                        }

                    }else if(type === "KeepEdges"){
                        if(x === mid){
                            mat[index] = 0.5;
                        }else if(x > mid){
                            mat[index] = 1;
                        }
                    }else if(type === "KeepMarks"){
                        if(x > mid || y > mid){
                            mat[index] = 1;
                        }
                    }else if(type === "KeepLines2"){
                        if(Math.sqrt((x-mid) * (x-mid) + (y-mid) * (y-mid)) <= halfMid){
                            mat[index] = 1;
                        }
                    }
                    if(invert){
                        mat[index] = 1-mat[index];
                    }
                    index += 1;
                }
            }
            this.convolutionMatrix = util.rotateSpacialMatrix(util.matrix2Spacial(mat),angle * (Math.PI/180 ));

            this.customProcessing.uniforms.threshold = threshold;
            this.customProcessing.uniforms.outputType.value = ["Black","White","Black&White","Original"].indexOf(keep);
            this.customProcessing.uniforms.blackToAlpha.value = blackToAlpha ? 1 : 0;

            glF.convolution(this.convolutionMatrix, mix, util.curvePowerNorm(scale), 1, channels, false, true,false,this.customProcessing);
            return glF;
        },
        arguments : [{
                name: "Type",
                description : "Type of detail to keep",
                type : "String",
                range : ["KeepLines","KeepLines2","KeepEdges","KeepMarks","checker","checker2","box"]
            },{
                name: "invert",
                description : "Inverts the test shape intensity",
                type : "Boolean",
                range : {def : false}
            },{
                name: "BlackToAlpha",
                description : "If on then black is sent to the alpha channel as transparent",
                type : "Boolean",
                range : {def : false}
            },{
                name: "Keep",
                description : "What part of the result to keep.",
                type : "String",
                range : ["Black","White","Black&White","Original"],
            },{
                name: "threshold",
                description : "Sensitivity of the test",
                type : "Number",
                range : {min : 0, max : 1, step : 0.001, def : 1}
            },

            cArgs.size, cArgs.scale,
            {
                name: "angle",
                description : "Angle that matrix is applied",
                type : "Number",
                range : {min : 0, max : 360, step : 1, def : 0},
            }
            , cArgs.mix, cArgs.channels
        ],
    });
    filterGL.filters.register("shadow",{
        name : "shadow",
        description : "Outlines parts of the image that are next to transparent pixels",
        webGLFilters : null,
        shader : null,
        callback(radius,blur, offset,mixin, color) {
            var glF = this.webGLFilters;
            var perim = Math.max(0.1,Math.PI * radius * 2);
            var maxPerim = Math.ceil(Math.PI * 8 * 2);
            if (this.shader === null){
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float mixin;
                    uniform float perim;
                    uniform float radius;
                    uniform vec2 offset;
                    uniform vec4 color1;
                    const float pi2 = ${(Math.PI * 2).toFixed(6)};
                    varying vec2 texCoord;
                    void main() {
                        vec4 color = texture2D(texture, texCoord);
                        vec2 pos = vec2(0.0,0.0);
                        float a;
                        float weight = 0.0;
                        if(color.a <1.0){
                            for(float i = 0.0; i < ${maxPerim.toFixed(1)}; i += 1.0){
                                float a = (i/perim)*pi2;
                                pos.x = cos(a) * radius / texSize.x;
                                pos.y = sin(a) * radius / texSize.y;
                                vec4 samp = texture2D(texture, texCoord + pos - offset);
                                weight += (samp.a / 8.0);
                                if(i >= perim-1.0 || weight >= 1.0) break;
                            }
                            if(weight > 0.0){
                                if(weight > 1.0) weight = 1.0;
                                weight *= color1.a;
                                a = color.a + weight * (1.0-color.a);
                                gl_FragColor = vec4(vec3((color.rgb * color.a + color1.rgb * weight * ( 1.0- color.a))/a),a );
                                gl_FragColor = mix(color, gl_FragColor, mixin);
                            }else{
                                gl_FragColor = color;
                            }
                        }else{
                            gl_FragColor = color;
                        }
                    }
                `);
            }
            offset[0] -= 0.5;
            offset[1] -= 0.5;


            var uniformObj = Object.assign({
                    mixin,offset,radius,perim,
                    texSize: [glF.width, glF.height] ,
                    color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],

                },
            );
            if(blur === 0){
                glF.filter(this.shader, uniformObj);
            }else{
                var offsetStep = [offset[0]/blur,offset[1]/blur];
                var radiusStep = radius / blur;
                for(var i = 0; i < blur; i ++){
                    uniformObj.offset[0] = offsetStep[0] * i;
                    uniformObj.offset[1] = offsetStep[1] * i;
                    uniformObj.radius = i * radiusStep;
                    uniformObj.perim =  Math.max(0.1,Math.PI * i * radiusStep * 2);
                    glF.filter(this.shader, uniformObj);
                }
            }

            return glF;
        },
        arguments : [{
                name : "radius",
                description : "Radius of outline",
                type : "Number",
                range : {min : 1, max : 8, step : 0.5, def : 1},
            },{
                name : "blur",
                description : "amount of blur",
                type : "Number",
                range : {min : 0, max : 8, step : 0.5, def : 1},
            },{
                name : "point",
                description : "Offset of shadow",
                type : "Vec2",
                range : {def : [0.5,0.5]},
            },{
                name : "mixin",
                description : "Standard mix of result and original",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "color",
                description : "Outline color",
                type : "HexColor",
                range : {def : "#FFFFFF"},
            }
        ],
    });
    filterGL.filters.register("pixelOutline",{
        name : "pixelOutline",
        description : "Adds pixel outline where alpha is zero",
        webGLFilters : null,
        shader : null,
        shaderSetCol : null,
		shaderImageCol: null,
        callback(Left, Below, Right, Above, Inside, color, imageColor, mixColor, mixAmount, iterations, mixin) {
            var glF = this.webGLFilters;
			if(imageColor && this.shaderImageCol === null) {
                this.shaderImageCol = this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2  texSize;
                    uniform float mixin;
                    uniform int   mixColor;
                    uniform float mixAmount;
                    uniform vec4  color1;
					uniform int   left;
					uniform int   below;
					uniform int   right;
					uniform int   above;
					uniform int   inside;

                    varying vec2 texCoord;
                    void main() {
						vec2 pixel = vec2(1.0 / texSize.x, 1.0 / texSize.y);
                        vec4 color = texture2D(texture, texCoord);
						if (inside == 0 && color.a == 0.0) {
							vec4 l = texture2D(texture, texCoord + vec2( pixel.x, 0.0));
							vec4 r = texture2D(texture, texCoord + vec2(-pixel.x, 0.0));
							vec4 a = texture2D(texture, texCoord + vec2(0.0,  pixel.y));
							vec4 b = texture2D(texture, texCoord + vec2(0.0, -pixel.y));
							vec3 colSum = vec3(0.0);
							float count = 0.0;
							float maxA = 0.0;

							if (l.a > 0.0 && left == 1) {
								colSum += l.rgb * l.rgb;
								maxA = max(maxA, l.a);
								count += 1.0;
							}
							if (r.a > 0.0 && right == 1) {
								colSum += r.rgb * r.rgb;
								maxA = max(maxA, r.a);
								count += 1.0;
							}
							if (a.a > 0.0 && above == 1) {
								colSum += a.rgb * a.rgb;
								maxA = max(maxA, a.a);
								count += 1.0;
							}
							if (b.a > 0.0 && below == 1) {
								colSum += b.rgb * b.rgb;
								maxA = max(maxA, b.a);
								count += 1.0;
							}
							if (count > 0.0) {
								colSum = sqrt(colSum / count);
								color = vec4(colSum, maxA * mixin);
                                if (mixColor == 1) {
                                    color.rgb = vec3((1.0 - mixAmount) * color.rgb) + vec3(mixAmount * color1.rgb);
                                }
							}
						} else if (inside == 1 && color.a != 0.0) {
							float a = texture2D(texture, texCoord + vec2(pixel.x, 0.0)).a;
							if (a < 1.0 && left == 1) {
								color = vec4(color1.rgb, (1.0 - a) * mixin);
							} else {
								a = texture2D(texture, texCoord + vec2(-pixel.x, 0.0)).a;
								if (a < 1.0 && right == 1) {
									color = vec4(color1.rgb, (1.0 - a) * mixin);
								} else {
									a = texture2D(texture, texCoord + vec2(0.0, pixel.y)).a;
									if (a < 1.0 && above == 1) {
										color = vec4(color1.rgb, (1.0 - a) * mixin);
									} else {
										a = texture2D(texture, texCoord + vec2(0.0, -pixel.y)).a;
										if (a < 1.0 && below == 1) {
											color = vec4(color1.rgb, (1.0 - a) * mixin);
										}
									}
								}
							}
						}
                        gl_FragColor = color;
                    }
                `);
            } else if (this.shaderSetCol === null){
                this.shaderSetCol = this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float mixin;
                    uniform int   mixColor;
                    uniform float mixAmount;                    
                    uniform vec4 color1;
					uniform int left;
					uniform int below;
					uniform int right;
					uniform int above;
					uniform int inside;

                    varying vec2 texCoord;
                    void main() {
						vec2 pixel = vec2(1.0 / texSize.x, 1.0 / texSize.y);
                        vec4 color = texture2D(texture, texCoord);
						if (inside == 0) {
							if (color.a == 0.0) {
								float a = texture2D(texture, texCoord + vec2(pixel.x, 0.0)).a;
								if (a > 0.0 && left == 1) {
									color = vec4(color1.rgb, a * mixin);
								} else {
									a = texture2D(texture, texCoord + vec2(-pixel.x, 0.0)).a;
									if (a > 0.0 && right == 1) {
										color = vec4(color1.rgb, a * mixin);
									} else {
										a = texture2D(texture, texCoord + vec2(0.0, pixel.y)).a;
										if (a > 0.0 && above == 1) {
											color = vec4(color1.rgb, a * mixin);
										} else {
											a = texture2D(texture, texCoord + vec2(0.0, -pixel.y)).a;
											if (a > 0.0 && below == 1) {
												color = vec4(color1.rgb, a * mixin);
											}
										}
									}
								}
							}
						} else if (color.a != 0.0) {

							float a = texture2D(texture, texCoord + vec2(pixel.x, 0.0)).a;
							if (a < 1.0 && left == 1) {
								color = vec4(color1.rgb, (1.0 - a) * mixin);
							} else {
								a = texture2D(texture, texCoord + vec2(-pixel.x, 0.0)).a;
								if (a < 1.0 && right == 1) {
									color = vec4(color1.rgb, (1.0 - a) * mixin);
								} else {
									a = texture2D(texture, texCoord + vec2(0.0, pixel.y)).a;
									if (a < 1.0 && above == 1) {
										color = vec4(color1.rgb, (1.0 - a) * mixin);
									} else {
										a = texture2D(texture, texCoord + vec2(0.0, -pixel.y)).a;
										if (a < 1.0 && below == 1) {
											color = vec4(color1.rgb, (1.0 - a) * mixin);
										}
									}
								}
							}

						}
                        gl_FragColor = color;

                    }
                `);
            }

            this.shader = imageColor ? this.shaderImageCol : this.shaderSetCol;
            var uniformObj = Object.assign({
				mixin,
                mixAmount,
				texSize: [glF.width, glF.height] ,
				color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],
				left: { type: "uniform1i", value: Left ? 1 : 0 },
				below: { type: "uniform1i", value: Below ? 1 : 0 },
				right: { type: "uniform1i", value: Right ? 1 : 0 },
				above: { type: "uniform1i", value: Above ? 1 : 0 },
				inside: { type: "uniform1i", value: Inside ? 1 : 0 },
				mixColor: { type: "uniform1i", value: mixColor ? 1 : 0 },


            });

            glF.filter(this.shader, uniformObj);
			for(var i = 1; i < iterations; i ++){
				glF.filter(this.shader, null); // no need to set uniforms again.
			}

            return glF;
        },
        arguments : [{
                name : "Left",
                description : "Line left ",
                type : "Boolean",
                range : {def : true},
                UISpaceAbove: 0.75, /* adds space before UI element */
            },{
                name : "Below",
                description : "Line below ",
                type : "Boolean",
                range : {def : true},
            },{
                name : "Right",
                description : "Line right ",
                type : "Boolean",
                range : {def : true},
            },{
                name : "Above",
                description : "Line above ",
                type : "Boolean",
                range : {def : true},
            },{
                name : "Inside",
                description : "Outline is inside ",
                type : "Boolean",
                range : {def : false},
                UISpace: 0.75, /* adds space after UI element */
            },{
                name : "color",
                description : "Outline color",
                type : "HexColor",
                range : {def : "#FFFFFF"},
            },{
                name : "imageColor",
                description : "Get outline color from image. Only for outer edge",
                type : "Boolean",
                range : {def : true},
            },{
                name : "mixColor",
                description : "Mix image color with outline color",
                type : "Boolean",
                range : {def : true},
            },{
                name : "mixColorAmount",
                description : "Amount to mix colours",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
                UISpace: 0.75, /* adds space after UI element */
            },{
                name : "iterations",
                description : "Number of times to apply outline",
                type : "Number",
                range : {min : 1, max : 12, step : 1, def : 1},
            },{
                name : "mixin",
                description : "Standard mix of result and original",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },
        ],
    });
    filterGL.filters.register("pixelOutline2",{
        name : "pixelOutline2",
        description : "Adds pixel outline where alpha is zero",
        webGLFilters : null,
        shader : null,
        shaderSetCol : null,
		shaderImageCol: null,
        callback(Left, Below, Right, Above, Inside, pixelDistance, color, imageColor, mixColor, mixAmount, iterations, mixin) {
            var glF = this.webGLFilters;
			if(imageColor && this.shaderImageCol === null) {
                this.shaderImageCol = this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2  texSize;
                    uniform float mixin;
                    uniform int   mixColor;
                    uniform float mixAmount;
                    uniform vec4  color1;
					uniform int   left;
					uniform int   below;
					uniform int   right;
					uniform int   above;
					uniform int   inside;
					uniform int   pixelDistance;

                    varying vec2 texCoord;
                    void main() {

                        vec4 color = texture2D(texture, texCoord);
                        float aa;
                        if (pixelDistance > 1) {   
                            if (inside == 0 && color.a == 0.0) {
                                vec2 pixel = vec2(1.0 / texSize.x, 1.0 / texSize.y) * float(pixelDistance);
                                vec4 l = texture2D(texture, texCoord + vec2( pixel.x, 0.0));
                                vec4 r = texture2D(texture, texCoord + vec2(-pixel.x, 0.0));
                                vec4 a = texture2D(texture, texCoord + vec2(0.0,  pixel.y));
                                vec4 b = texture2D(texture, texCoord + vec2(0.0, -pixel.y));
                                vec2 pixelLess1 = vec2(1.0 / texSize.x, 1.0 / texSize.y) * (float(pixelDistance) - 1.0);  
                                float la = texture2D(texture, texCoord + vec2( pixelLess1.x, 0.0)).a;
                                float ra = texture2D(texture, texCoord + vec2(-pixelLess1.x, 0.0)).a;
                                float aa = texture2D(texture, texCoord + vec2(0.0,  pixelLess1.y)).a;
                                float ba = texture2D(texture, texCoord + vec2(0.0, -pixelLess1.y)).a;                               
                                vec3 colSum = vec3(0.0);
                                float count = 0.0;
                                float maxA = 0.0;

                                if (l.a > 0.0 && la == 0.0 && left == 1) {
                                    colSum += l.rgb * l.rgb;
                                    maxA = max(maxA, l.a);
                                    count += 1.0;
                                }
                                if (r.a > 0.0 && ra == 0.0 && right == 1) {
                                    colSum += r.rgb * r.rgb;
                                    maxA = max(maxA, r.a);
                                    count += 1.0;
                                }
                                if (a.a > 0.0 && aa == 0.0 && above == 1) {
                                    colSum += a.rgb * a.rgb;
                                    maxA = max(maxA, a.a);
                                    count += 1.0;
                                }
                                if (b.a > 0.0 && ba == 0.0 && below == 1) {
                                    colSum += b.rgb * b.rgb;
                                    maxA = max(maxA, b.a);
                                    count += 1.0;
                                }
                                if (count > 0.0) {
                                    colSum = sqrt(colSum / count);
                                    color = vec4(colSum, maxA * mixin);
                                    if (mixColor == 1) {
                                        color.rgb = vec3((1.0 - mixAmount) * color.rgb) + vec3(mixAmount * color1.rgb);
                                    }
                                }
                            } else if (inside == 1 && color.a != 0.0) {
                                vec2 pixel = vec2(1.0 / texSize.x, 1.0 / texSize.y) * float(pixelDistance);
                                vec2 pixelLess1 = vec2(1.0 / texSize.x, 1.0 / texSize.y) * (float(pixelDistance) - 1.0);                            
                                float a = texture2D(texture, texCoord + vec2(pixel.x, 0.0)).a;
                                aa = texture2D(texture, texCoord + vec2(pixelLess1.x, 0.0)).a +
                                    texture2D(texture, texCoord + vec2(-pixelLess1.x, 0.0)).a +
                                    texture2D(texture, texCoord + vec2(0.0,  pixelLess1.y)).a +
                                    texture2D(texture, texCoord + vec2(0.0, -pixelLess1.y)).a;
                                if (a < 1.0 && aa == 0.0 && left == 1) {
                                    color = vec4(color1.rgb, (1.0 - a) * mixin);
                                } else {
                                    a = texture2D(texture, texCoord + vec2(-pixel.x, 0.0)).a;
                                    if (a < 1.0 && aa == 0.0 && right == 1) {
                                        color = vec4(color1.rgb, (1.0 - a) * mixin);
                                    } else {
                                        a = texture2D(texture, texCoord + vec2(0.0, pixel.y)).a;
                                        if (a < 1.0 && aa == 0.0 && above == 1) {
                                            color = vec4(color1.rgb, (1.0 - a) * mixin);
                                        } else {
                                            a = texture2D(texture, texCoord + vec2(0.0, -pixel.y)).a;
                                            if (a < 1.0 && aa == 0.0 && below == 1) {
                                                color = vec4(color1.rgb, (1.0 - a) * mixin);
                                            }
                                        }
                                    }
                                }
                                
                            }

                        } else {                        
                            if (inside == 0 && color.a == 0.0) {
                                vec2 pixel = vec2(1.0 / texSize.x, 1.0 / texSize.y);
                                vec4 l = texture2D(texture, texCoord + vec2( pixel.x, 0.0));
                                vec4 r = texture2D(texture, texCoord + vec2(-pixel.x, 0.0));
                                vec4 a = texture2D(texture, texCoord + vec2(0.0,  pixel.y));
                                vec4 b = texture2D(texture, texCoord + vec2(0.0, -pixel.y));
                                vec3 colSum = vec3(0.0);
                                float count = 0.0;
                                float maxA = 0.0;

                                if (l.a > 0.0 && left == 1) {
                                    colSum += l.rgb * l.rgb;
                                    maxA = max(maxA, l.a);
                                    count += 1.0;
                                }
                                if (r.a > 0.0 && right == 1) {
                                    colSum += r.rgb * r.rgb;
                                    maxA = max(maxA, r.a);
                                    count += 1.0;
                                }
                                if (a.a > 0.0 && above == 1) {
                                    colSum += a.rgb * a.rgb;
                                    maxA = max(maxA, a.a);
                                    count += 1.0;
                                }
                                if (b.a > 0.0 && below == 1) {
                                    colSum += b.rgb * b.rgb;
                                    maxA = max(maxA, b.a);
                                    count += 1.0;
                                }
                                if (count > 0.0) {
                                    colSum = sqrt(colSum / count);
                                    color = vec4(colSum, maxA * mixin);
                                    if (mixColor == 1) {
                                        color.rgb = vec3((1.0 - mixAmount) * color.rgb) + vec3(mixAmount * color1.rgb);
                                    }
                                }
                            } else if (inside == 1 && color.a != 0.0) {
                                vec2 pixel = vec2(1.0 / texSize.x, 1.0 / texSize.y) * float(pixelDistance);
                                vec2 pixelLess1 = vec2(1.0 / texSize.x, 1.0 / texSize.y) * (float(pixelDistance) - 1.0);                            
                                float a = texture2D(texture, texCoord + vec2(pixel.x, 0.0)).a;
                                float aa = (a < 1.0 && left == 1) ? texture2D(texture, texCoord + vec2(pixelLess1.x, 0.0)).a : 0.0;
                                if (a < 1.0 && aa == 0.0 && left == 1) {
                                    color = vec4(color1.rgb, (1.0 - a) * mixin);
                                } else {
                                    a = texture2D(texture, texCoord + vec2(-pixel.x, 0.0)).a;
                                    aa = (a < 1.0 && right == 1) ? texture2D(texture, texCoord + vec2(-pixelLess1.x, 0.0)).a : 0.0;
                                    if (a < 1.0 && aa == 0.0 && right == 1) {
                                        color = vec4(color1.rgb, (1.0 - a) * mixin);
                                    } else {
                                        a = texture2D(texture, texCoord + vec2(0.0, pixel.y)).a;
                                        aa = (a < 1.0 && above == 1) ? texture2D(texture, texCoord + vec2(0.0, pixelLess1.y)).a : 0.0;
                                        if (a < 1.0 && aa == 0.0 && above == 1) {
                                            color = vec4(color1.rgb, (1.0 - a) * mixin);
                                        } else {
                                            a = texture2D(texture, texCoord + vec2(0.0, -pixel.y)).a;
                                            aa = (a < 1.0 && below == 1) ? texture2D(texture, texCoord + vec2(0.0, -pixelLess1.y)).a : 0.0;
                                            if (a < 1.0 && aa == 0.0 && below == 1) {
                                                color = vec4(color1.rgb, (1.0 - a) * mixin);
                                            }
                                        }
                                    }
                                }
                                
                            }
                        }
                        gl_FragColor = color;
                    }
                `);
            } else if (this.shaderSetCol === null){
                this.shaderSetCol = this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float mixin;
                    uniform int   mixColor;
                    uniform float mixAmount;                    
                    uniform vec4 color1;
					uniform int left;
					uniform int below;
					uniform int right;
					uniform int above;
					uniform int inside;
                    uniform int  pixelDistance;

                    // not imageColor   
                    varying vec2 texCoord;
                    void main() {
						vec2 pixel = vec2(1.0 / texSize.x, 1.0 / texSize.y) * float(pixelDistance);
						vec2 pixelLess1 = vec2(1.0 / texSize.x, 1.0 / texSize.y) * (float(pixelDistance) - 1.0);
                        float aa;
                        if (pixelDistance > 1) {
                            vec4 color = texture2D(texture, texCoord);
                            if (inside == 0) {
                                if (color.a == 0.0) {
                                    float a = texture2D(texture, texCoord + vec2(pixel.x, 0.0)).a;
                                    aa = texture2D(texture, texCoord + vec2(pixelLess1.x, 0.0)).a +
                                        texture2D(texture, texCoord + vec2(-pixelLess1.x, 0.0)).a +
                                        texture2D(texture, texCoord + vec2(0.0,  pixelLess1.y)).a +
                                        texture2D(texture, texCoord + vec2(0.0, -pixelLess1.y)).a;
                                    if (a > 0.0 && aa == 0.0 && left == 1) {
                                        color = vec4(color1.rgb, a * mixin);
                                    } else {
                                        a = texture2D(texture, texCoord + vec2(-pixel.x, 0.0)).a;
                                        if (a > 0.0 && aa == 0.0 && right == 1) {
                                            color = vec4(color1.rgb, a * mixin);
                                        } else {
                                            a = texture2D(texture, texCoord + vec2(0.0, pixel.y)).a;
                                            if (a > 0.0 && aa == 0.0 && above == 1) {
                                                color = vec4(color1.rgb, a * mixin);
                                            } else {
                                                a = texture2D(texture, texCoord + vec2(0.0, -pixel.y)).a;
                                                if (a > 0.0 && aa == 0.0 && below == 1) {
                                                    color = vec4(color1.rgb, a * mixin);
                                                }
                                            }
                                        }
                                    }
                                }
                            } else {
                                color = texture2D(texture, texCoord);
                                if (color.a > 0.0) {
                                    float a = texture2D(texture, texCoord + vec2(pixel.x, 0.0)).a;
                                    aa = texture2D(texture, texCoord + vec2(pixelLess1.x, 0.0)).a +
                                        texture2D(texture, texCoord + vec2(-pixelLess1.x, 0.0)).a +
                                        texture2D(texture, texCoord + vec2(0.0,  pixelLess1.y)).a +
                                        texture2D(texture, texCoord + vec2(0.0, -pixelLess1.y)).a;                                    
                                    if (a < 1.0 && aa == 0.0 && left == 1) {
                                        color = vec4(color1.rgb, (1.0 - a) * mixin);
                                    } else {
                                        a = texture2D(texture, texCoord + vec2(-pixel.x, 0.0)).a;
                                        if (a < 1.0 && aa == 0.0 && right == 1) {
                                            color = vec4(color1.rgb, (1.0 - a) * mixin);
                                        } else {
                                            a = texture2D(texture, texCoord + vec2(0.0, pixel.y)).a;
                                            if (a < 1.0 && aa == 0.0 && above == 1) {
                                                color = vec4(color1.rgb, (1.0 - a) * mixin);
                                            } else {
                                                a = texture2D(texture, texCoord + vec2(0.0, -pixel.y)).a;
                                                if (a < 1.0 && aa == 0.0 && below == 1) {
                                                    color = vec4(color1.rgb, (1.0 - a) * mixin);
                                                }
                                            }
                                        }
                                    }
                                }
                            }                                
                            gl_FragColor = color;
                        } else {
                            vec4 color = texture2D(texture, texCoord);
                            if (inside == 0) {
                                if (color.a == 0.0) {
                                    float a = texture2D(texture, texCoord + vec2(pixel.x, 0.0)).a;
                                    if (a > 0.0 && left == 1) {
                                        color = vec4(color1.rgb, a * mixin);
                                    } else {
                                        a = texture2D(texture, texCoord + vec2(-pixel.x, 0.0)).a;
                                        if (a > 0.0 && right == 1) {
                                            color = vec4(color1.rgb, a * mixin);
                                        } else {
                                            a = texture2D(texture, texCoord + vec2(0.0, pixel.y)).a;
                                            if (a > 0.0 && above == 1) {
                                                color = vec4(color1.rgb, a * mixin);
                                            } else {
                                                a = texture2D(texture, texCoord + vec2(0.0, -pixel.y)).a;
                                                if (a > 0.0 && below == 1) {
                                                    color = vec4(color1.rgb, a * mixin);
                                                }
                                            }
                                        }
                                    }
                                }
                            } else if (color.a != 0.0) {
                                float a = texture2D(texture, texCoord + vec2(pixel.x, 0.0)).a;
                                if (a < 1.0 && left == 1) {
                                    color = vec4(color1.rgb, (1.0 - a) * mixin);
                                } else {
                                    a = texture2D(texture, texCoord + vec2(-pixel.x, 0.0)).a;
                                    if (a < 1.0 && right == 1) {
                                        color = vec4(color1.rgb, (1.0 - a) * mixin);
                                    } else {
                                        a = texture2D(texture, texCoord + vec2(0.0, pixel.y)).a;
                                        if (a < 1.0 && above == 1) {
                                            color = vec4(color1.rgb, (1.0 - a) * mixin);
                                        } else {
                                            a = texture2D(texture, texCoord + vec2(0.0, -pixel.y)).a;
                                            if (a < 1.0 && below == 1) {
                                                color = vec4(color1.rgb, (1.0 - a) * mixin);
                                            }
                                        }
                                    }
                                }
                            }
                            gl_FragColor = color;
                        }

                    }
                `);
            }

            this.shader = imageColor ? this.shaderImageCol : this.shaderSetCol;
            var uniformObj = Object.assign({
				mixin,
                mixAmount,
				texSize: [glF.width, glF.height] ,
				color1 : [color[0]/255,color[1]/255,color[2]/255,color[3]/255],
				left: { type: "uniform1i", value: Left ? 1 : 0 },
				below: { type: "uniform1i", value: Below ? 1 : 0 },
				right: { type: "uniform1i", value: Right ? 1 : 0 },
				above: { type: "uniform1i", value: Above ? 1 : 0 },
				inside: { type: "uniform1i", value: Inside ? 1 : 0 },
				mixColor: { type: "uniform1i", value: mixColor ? 1 : 0 },
				pixelDistance: { type: "uniform1i", value: pixelDistance },


            });

            glF.filter(this.shader, uniformObj);
			for(var i = 1; i < iterations; i ++){
				glF.filter(this.shader, null); // no need to set uniforms again.
			}

            return glF;
        },
        arguments : [{
                name : "Left",
                description : "Line left ",
                type : "Boolean",
                range : {def : true},
                UISpaceAbove: 0.75, /* adds space before UI element */
            },{
                name : "Below",
                description : "Line below ",
                type : "Boolean",
                range : {def : true},
            },{
                name : "Right",
                description : "Line right ",
                type : "Boolean",
                range : {def : true},
            },{
                name : "Above",
                description : "Line above ",
                type : "Boolean",
                range : {def : true},
            },{
                name : "Inside",
                description : "Outline is inside ",
                type : "Boolean",
                range : {def : false},
                UISpace: 0.5,  /* adds space after UI element */
            }, {
                name : "pixelDistance",
                description : "Distance from pixel being set to check for edge",
                type : "Number",
                range : {min : 1, max : 12, step : 1, def : 1},
            }, {
                name : "color",
                description : "Outline color",
                type : "HexColor",
                range : {def : "#FFFFFF"},
            },{
                name : "imageColor",
                description : "Get outline color from image. Only for outer edge",
                type : "Boolean",
                range : {def : true},
            },{
                name : "mixColor",
                description : "Mix image color with outline color",
                type : "Boolean",
                range : {def : true},
            },{
                name : "mixColorAmount",
                description : "Amount to mix colours",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
                UISpace: 0.5,  /* adds space after UI element */
            },{
                name : "iterations",
                description : "Number of times to apply outline",
                type : "Number",
                range : {min : 1, max : 12, step : 1, def : 1},
            },{
                name : "mixin",
                description : "Standard mix of result and original",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },
        ],
    });    
    filterGL.filters.register("chromaKey", {
        name : "chromaKey",
        description : "Applies chromakey",
        webGLFilters : null,
        shader : null,
        namedFilters : {
            RemoveAndBleed:"V2=(v2(Ab,Ar)-v2(0.897*Ar+1.761*Ag+0.342*Ab)/3)*v2(0.565,0.713);"+
                "Fa=sStep(Va,Vb,sqrt(pow(Px-V2x,2)+pow(Py-V2y,2)));"+
                "R=v4(max(Argb-(1-Fa)*c1rgb,0),Aa * Fa)#Va,0,1#Vb,0,1",
            Standard:"V2=(v2(Ab,Ar)-v2(0.897*Ar+1.761*Ag+0.342*Ab)/3)*v2(0.565,0.713);"+
                "Fa=sStep(Va,Vb,sqrt(pow(Px-V2x,2)+pow(Py-V2y,2)));"+
                "R=v4(Argb,Aa * Fa)#Va,0,1#Vb,0,1",
            PullHue:"V2=(v2(Ab,Ar)-v2(0.897*Ar+1.761*Ag+0.342*Ab)/3)*v2(0.565,0.713);"+
                "Fa=1-sStep(Va,Vb,sqrt(pow(Px-V2x,2)+pow(Py-V2y,2)));"+
                "R=v4(max(Argb-Fa*c1rgb,0),Aa)#Va,0,1#Vb,0,1",
            MeanRemoveBleed: ""+
                "D=(SA(1,0)+SA(-1,0)+SA(0,1)+SA(0,-1)+A*2)/6;"+
                "V2=(v2(Db,Dr)-v2(0.897*Dr+1.761*Dg+0.342*Db)/3)*v2(0.565,0.713);"+
                "Fa=sStep(Va,Vb,sqrt(pow(Px-V2x,2)+pow(Py-V2y,2)));"+
                "R=v4(max(Argb-(1-Fa)*c1rgb,0),Fa*Aa)#Va,0,1#Vb,0,1",
            MeanStandard: ""+
                "D=(SA(1,0)+SA(-1,0)+SA(0,1)+SA(0,-1)+A*2)/6;"+
                "V2=(v2(Db,Dr)-v2(0.897*Dr+1.761*Dg+0.342*Db)/3)*v2(0.565,0.713);"+
                "Fa=sStep(Va,Vb,sqrt(pow(Px-V2x,2)+pow(Py-V2y,2)));"+
                "R=v4(Argb,Fa*Aa)#Va,0,1#Vb,0,1",

        },
        RGBToCK(r,g,b) {
            const y = (r * 0.897 + g * 1.761 + b * 0.342) / 3;
            return [(b - y) * 0.565, (r - y) * 0.713];
        },
        callback(method, color1,RGBDist,range, mix, channels){
            var colours = {color1};
            var pString = this.namedFilters[method.replace(/ /g,"")];
            const p = this.RGBToCK(color1[0] / 255, color1[1] / 255, color1[2] / 255);
            RGBDist = (((RGBDist + 256) / 512) ** 2) * 512 - 256
            var cKTop = RGBDist + (Math.abs(range / 256) ** 2) * 256 * Math.sign(range);
            cKTop = cKTop > 256 ? 256 : cKTop < -256 ? -256 : cKTop;
            this.webGLFilters.procedural(undefined, undefined,pString, RGBDist, cKTop, 0 ,0, p, mix, channels,colours);
            return this.webGLFilters;
        },
        arguments : [{
                name : "Method",
                description : "Chromakey variant",
                type : "String",
                range : ["Remove And Bleed","Standard","Pull Hue","Mean Remove Bleed","Mean Standard"],

            },{
                name : "Old color",
                description : "Selects color to replace",
                type : "HexColor",
                range : {def : "#FFFFFF"},
            },{
                name : "RGBDist",
                description : "RGB distance threshold of color to replace",
                type : "Number",
                range : {min : -256, max : 256, step : 1, def : (-256+32)},
            },{
                name : "ChromaRange",
                description : "Range of chromakey",
                type : "Number",
                range : {min : -256, max : 256, step : 1, def : 32},
            },sArgs.mix,sArgs.channels
        ],
    });
    filterGL.filters.register("colorReplace", {
        name : "colorReplace",
        description : "Replaces pixels by color",
        webGLFilters : null,
        shader : null,
        namedFilters : {
            Remove: "R=dist(c1rgb,Brgb)<Va?v4(0):B#Va,0,1.73206",
            Keep: "R=dist(c1rgb,Brgb)>Va?v4(0):B#Va,0,1.73206",
            RemoveColor: "R=dist(c1rgb,Brgb)<Va?v4(c2rgb,Ba):B#Va,0,1.73206",
            KeepColor: "R=dist(c1rgb,Brgb)>Va?v4(c2rgb,Ba):B#Va,0,1.73206",
            RemoveAlpha: "R=dist(c1rgb,Brgb)<Va?v4(Brgb,Vb):B#Va,0,1.73206#Vb,0,1",
            KeepAlpha: "R=dist(c1rgb,Brgb)>Va?v4(Brgb,Vb):B#Va,0,1.73206#Vb,0,1",
            RemoveColorAlpha: "R=dist(c1rgb,Brgb)<Va?c2:B#Va,0,1.73206#Vb,0,1",
            KeepColorAlpha: "R=dist(c1rgb,Brgb)>Va?c2:B#Va,0,1.73206#Vb,0,1",
           /* Color: "R=dist(c1rgb,Brgb)<Va?v4(c2rgb,Ba):B#Va,0,1.73206",
            Alpha: "R=dist(c1rgb,Brgb)<Va?v4(Brgb,Vb):B#Va,0,1.73206#Vc,0,1",
            ColorandAlpha: "R=dist(c1rgb,Brgb)<Va?c2:B#Va,0,1.73206",
            WithPixelAbove: "R=dist(c1rgb,Brgb)<Va?SA(v2(0,-1)):B#Va,0,1.73206",
            WithPixelBelow: "R=dist(c1rgb,Brgb)<Va?SA(v2(0,1)):B#Va,0,1.73206",
            WithPixelLeft: "R=dist(c1rgb,Brgb)<Va?SA(v2(-1,0)):B#Va,0,1.73206",
            WithPixelRight: "R=dist(c1rgb,Brgb)<Va?SA(v2(1,0)):B#Va,0,1.73206",*/
        },
        callback(oldColor,method, RGBDist, changeColor, newColor, changeAlpha, newAlpha, mix, channels){

            method += (changeColor ? "Color" : "") + (changeAlpha ? "Alpha" : "");
            var pString = this.namedFilters[method.replace(/ /g,"")];
            const colours = {color1 : oldColor, color2 : [newColor[0], newColor[1], newColor[2]]};
            if (oldColor.length > 3 && isNaN(oldColor[3]) && oldColor[3].isPallet) {
                const pal = oldColor[3];
                const c = colours.color1 = [];
                if (newColor.length > 3 && isNaN(newColor[3]) && newColor[3].isPallet) {
                    const palN = newColor[3];
                    pal.each((r,g,b,idx) => {
                        if (idx >= palN.length) { return true }
                        c[0] = r;
                        c[1] = g;
                        c[2] = b;

                        palN.getRGBArray(idx % palN.length, colours.color2);
                        this.webGLFilters.procedural(undefined, undefined, pString, RGBDist, newAlpha, 0,0, [0.5,0.5], mix, channels, colours);
                    });
                } else {
                    pal.each((r,g,b,idx) => {
                        c[0] = r;
                        c[1] = g;
                        c[2] = b;
                        this.webGLFilters.procedural(undefined, undefined, pString, RGBDist, newAlpha, 0,0, [0.5,0.5], mix, channels, colours);
                    });
                }
            } else {
                this.webGLFilters.procedural(undefined, undefined, pString, RGBDist, newAlpha, 0,0, [0.5,0.5], mix, channels,colours);
            }
            return this.webGLFilters;
        },
        arguments : [{
                name : "Color",
                description : "Selects color to replace\nSelect a palllet sprite and left click to use a pallet",
                type : "HexColor",
                range : {def : "#FFFFFF", canUsePallet: true},
            },{
                name : "Method",
                description : "How pixels are replaced",
                type : "String",
                range : ["Remove","Keep"],
                itemHelp : [
                    "Remove pixels matching [Color]",
                    "Keep pixels matching [Color]",
                ],
            },{
                name : "RGBDist",
                description : "RGB distance threshold of color to replace",
                type : "Number",
                range : {min : -256, max : 256, step : 1, def : (-256+32)},
            },{
                name : "Change color",
                description : "If true change color value RGB",
                type : "Boolean",
                range : {def : false},
            },{
                name : "New color",
                description : "New RGB color\nSelect a palllet sprite and left click to use a pallet",
                type : "HexColor",
                range : {def : "#FFFFFF", canUsePallet: true},
            },{
                name : "Change Alpha",
                description : "If true change alpha value A",
                type : "Boolean",
                range : {def : false},
            },{
                name : "New Alpha",
                description : "New alpha value",
                type : "Number",
                range : {min : -256, max : 256, step : 1, def : 256},
            },sArgs.mix,sArgs.channels
        ],
    });
    filterGL.filters.register("pixelErode", {
        name : "pixelErode",
        description : "Removes pixels near transparent edges",
        webGLFilters : null,
        shader : null,
        callback(radius, erodeSteps,exposure,erodeType,mixin) {
            var glF = this.webGLFilters;

            var maxPerim = Math.ceil(Math.PI * 8 * 2);
            if (this.shader === null){
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float mixin;
                    uniform float perim;
                    uniform int erodeType;
                    uniform float radius;
                    uniform float exposure;
                    const float pi2 = ${(Math.PI * 2).toFixed(6)};
                    varying vec2 texCoord;
                    void main() {
                        vec4 color = texture2D(texture, texCoord);
                        vec2 pos = vec2(0.0,0.0);
                        float a;
                        float weight = 0.0;
                        if(color.a > 0.0){
                            for(float i = 0.0; i < ${maxPerim.toFixed(1)}; i += 1.0){
                                float a = (i/perim)*pi2;
                                pos.x = cos(a) * radius / texSize.x;
                                pos.y = sin(a) * radius / texSize.y;
                                vec4 samp = texture2D(texture, texCoord + pos);
                                if(samp.a < 1.0){
                                    if(erodeType == 0){
                                        weight += 1.0-samp.a;
                                    }else if(erodeType == 2){
                                        weight += 1.0-((samp.r + samp.g + samp.b) / 3.0);
                                    }else if(erodeType == 2){
                                        weight += ((samp.r + samp.g + samp.b) / 3.0);
                                    }
                                }
                                if(i >= perim-1.0 || weight >= perim * exposure) break;
                            }
                            if(weight > 0.0){
                                weight /= perim * exposure;
                                gl_FragColor = vec4(color.rgb,color.a-weight);
                                gl_FragColor = mix(color, gl_FragColor, mixin);
                            }else{
                                gl_FragColor = color;
                            }
                        }else{
                            gl_FragColor = color;
                        }
                    }
                `);
            }
            erodeType = ["alphaDist","darkFirst","lightFirst"].indexOf(erodeType);
            var perim = Math.PI * erodeSteps * 2;
            var count = radius;
            while(count > 0){
                if(count < erodeSteps){
                    perim = Math.PI * count * 2;
                }

                var uniformObj = {
                    mixin,perim,exposure,
                    erodeType : {type :"uniform1i", value :erodeType},
                    radius : erodeSteps,
                    texSize: [glF.width, glF.height] ,
                }
                glF.filter(this.shader, uniformObj);
                count -= erodeSteps;
            }

            return glF;
        },
        arguments : [{
                name : "radius",
                description : "Radius of outline",
                type : "Number",
                range : {min : 0.1, max : 8, step : 0.5, def : 1},
            },{
                name : "erodeSteps",
                description : "The amount of erode per pass",
                type : "Number",
                range : {min : 1, max : 3, step : 0.1, def : 1},
            },{
                name : "exposure",
                description : "The amount of erode as a factor of exposed edge. Higher values for slower erosion",
                type : "Number",
                range : {min : 0.2, max : 3, step : 0.1, def : 0.6},
            },{
                name : "erodeType",
                description : "How erosion is applied",
                type : "String",
                range : ["alphaDist","darkFirst","lightFirst"],
            },{
                name : "mixin",
                description : "Standard mix of result and original",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            }
        ],
    });
    filterGL.filters.register("imageEdgeFeather", {
        name : "imageEdgeFeather",
        description : "Adds an alpha feathered edge to image",
        webGLFilters : null,
        shader : null,
        callback(radius, curve, invert, sides) {
            var glF = this.webGLFilters;
            if (this.shader === null){
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float radius;
                    uniform float curve;
                    uniform int sides; // bit 1 topbot 2 left right
                    uniform int invert;
                    varying vec2 texCoord;
                    void main() {
                        vec4 color = texture2D(texture, texCoord);
                        float xSize = texSize.x / texSize.y;
                        vec2 p = vec2(texCoord.x * xSize, texCoord.y);
                        if (p.x > xSize / 2.0) { p.x = xSize - p.x; }
                        if (p.y > 0.5) { p.y = 1.0 - p.y; }
                        float a = 1.0;
                        if (sides == 3 && p.x < radius && p.y < radius) { a = clamp(1.0 - distance(vec2(radius, radius), p) / radius, 0.0, 1.0); }
                        else if (p.x < radius && sides >= 2) { a = 1.0 + (p.x - radius) / radius; }
                        else if (p.y < radius && (sides == 1 || sides == 3)) { a = 1.0 + (p.y - radius) / radius; }
                        a = color.a * pow(a, curve);
                        if (invert == 1) { a = 1.0 - a; }
                        gl_FragColor = vec4(color.rgb, a);
                    }
                `);
            }

            var uniformObj = {
                radius : radius / glF.height,
                curve : curve < 0 ? 1 / (1 - curve) : 1 + curve,
                texSize: [glF.width, glF.height] ,
                sides: { type: "uniform1i", value: sides === "All" ? 3 : sides === "Top bottom" ? 1 : 2 },
                invert: { type: "uniform1i", value: invert ? 1 : 0 },
            };
            glF.filter(this.shader, uniformObj);

            return glF;
        },
        arguments : [{
                name : "radius",
                description : "Radius in pixels to feather",
                type : "Number",
                range : {min : 1, max : 128, step : 1, def : 12},
            },{
                name : "curve",
                description : "Ease curve",
                type : "Number",
                range : {min : -3, max : 3, step : 0.1, def : 0},
            },{
                name : "invert",
                description : "Inverts alpha ",
                type : "Boolean",
                range : {def : false},
            },{
                name : "sides",
                description : "Which edges to feather",
                type : "String",
                range : ["All","Top bottom","Left right"]
            }
        ],
    });
    filterGL.filters.register("variance", {
        name : "variance",
        description : "Removes points",
        webGLFilters : null,
        shader : null,
        callback(cutoff, sCutoff, size ,type, mixin, channels) {
            var glF = this.webGLFilters;
            var angC = 6;
            if (this.shader === null || this.shaderSmall === null) {
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float cutoff;
                    uniform float sCutoff;
                    uniform float size;
                    uniform float mixin;
                    uniform float red;
                    uniform float green;
                    uniform float blue;
                    uniform float alpha;

                    uniform int type;
                    varying vec2 texCoord;
                    void main() {
                        vec4 color = texture2D(texture, texCoord);
                        vec4 newCol = vec4(0.0);
                        float vc = color.r + color.g + color.b + color.a;
                        float ux = 1.0 / texSize.x;
                        float uy = 1.0 / texSize.y;
                        float ang = 0.0;
                        mat2 m;
                        float mm=0.0;
                        float scale = 1.0;
                        for(int i = 0; i < 1; i ++){
                            m[0] = vec2(cos(ang),sin(ang)) * (scale + size);
                            m[1] = vec2(-sin(ang),cos(ang)) * (scale + size);
                            ang += cutoff;
                            scale += 0.1;
                            vec4 t = texture2D(texture, texCoord + vec2(0,-uy) * m)*(1.0/8.0);
                            vec4 b = texture2D(texture, texCoord + vec2(0,uy) * m)*(1.0/8.0);
                            vec4 l = texture2D(texture, texCoord + vec2(-ux,0 )* m)*(1.0/8.0);
                            vec4 r = texture2D(texture, texCoord + vec2(ux,0) * m)*(1.0/8.0);
                            vec4 T = texture2D(texture, texCoord + vec2(-ux,-uy) * m) * 0.70710678*(1.0/8.0);
                            vec4 B = texture2D(texture, texCoord + vec2(ux,uy) * m) * 0.70710678*(1.0/8.0);;
                            vec4 L = texture2D(texture, texCoord + vec2(-ux,uy )* m) * 0.70710678*(1.0/8.0);;
                            vec4 R = texture2D(texture, texCoord + vec2(ux,-uy) * m) * 0.70710678*(1.0/8.0);;
                            vec4 sums = vec4(t.r+b.r+l.r+r.r + T.r+B.r+L.r+R.r,
                                t.g+b.g+l.g+r.g+ T.g+B.g+L.g+R.g,
                                t.b+b.b+l.b+r.b+ T.b+B.b+L.b+R.b,
                                t.a+b.a+l.a+r.a+ T.a+B.a+L.a+R.a );
                            float mSum = (sums.r + sums.g + sums.b + sums.a);
                            vec4 dev = pow((sums-mSum)/4.0,vec4(2.0));
                            float variance = (dev.r + dev.g + dev.b + dev.a)/4.0;
                            vec4 dif = abs(color - sums);
                            float mDif = (dif.r + dif.g + dif.b + dif.a)/4.0;
                            color += sign(sums-color) * variance * (sums-mSum);
                        }
                        color.a = 1.0;
                        gl_FragColor = color;
                        gl_FragColor = mix(color, gl_FragColor, mixin);
                        gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha));
                    }
                `);
            }

            var uniformObj = {
                cutoff, size, mixin, sCutoff,
                type : {type : "uniform1i", value : type},
                red : channels.indexOf("R") > -1 ? 1 : 0,
                green : channels.indexOf("G") > -1 ? 1 : 0,
                blue : channels.indexOf("B") > -1 ? 1 : 0,
                alpha : channels.indexOf("A") > -1 ? 1 : 0,
                texSize: [glF.width, glF.height] ,
                type : {type : "uniform1i", value : type},

            };
            glF.filter(this.shader, uniformObj);

            return glF; // Not a must but allows users to chain filters
        },
        arguments : [{
                name : "cutoff",
                description : "Noise level cutoff smaller values remove more noise",
                type : "Number",
                range : {min : -2, max : 2, step : 0.1, def : 1},
            },{
                name : "symmetryCutoff",
                description : "Symmetry cutoff check that the area around the dirty point is symmetrical",
                type : "Number",
                range : {min : -8, max : 8, step : 0.1, def : 1},
            },{
                name : "size",
                description : "Pixel test radius in pixels",
                type : "Number",
                range : {min :-43, max : 32, step : 0.01, def : 1},
            },{
                name : "type of noise to remove",
                description : "Pixel test radius",
                type : "String",
                range : ["Lighter","Darker","All"]
            },{
                name : "mixin",
                description : "Standard mix of result and original",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "channels",
                description : "which channels to put back to the result",
                type : "String",
                range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
            }
        ],
    });
    filterGL.filters.register("monoPixelRemove", {
        name : "monoPixelRemove",
        description : "Removes pixels sourounded by same color",
        webGLFilters : null,
        shader : null,
        callback(type, dist, mixin, channels) {
            var glF = this.webGLFilters;
            var angC = 6;
            if (this.shader === null) {
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float dist;
                    uniform float mixin;
                    uniform float red;
                    uniform float green;
                    uniform float blue;
                    uniform float alpha;
                    uniform int type;
                    varying vec2 texCoord;
                    void main() {
                        vec4 color = texture2D(texture, texCoord);
                        gl_FragColor = color;
                        float ux = (1.0 / texSize.x) * dist;
                        float uy = (1.0 / texSize.y) * dist;
                        float vc = color.r + color.g + color.b + color.a;
                        vec4 t = texture2D(texture, texCoord + vec2(0,-uy));
                        vec4 b = texture2D(texture, texCoord + vec2(0,uy));
                        vec4 l = texture2D(texture, texCoord + vec2(-ux,0));
                        vec4 r = texture2D(texture, texCoord + vec2(ux,0));
                        vec4 tl = texture2D(texture, texCoord + vec2(-ux,-uy));
                        vec4 tr = texture2D(texture, texCoord + vec2(ux,-uy));
                        vec4 br = texture2D(texture, texCoord + vec2(ux,uy));
                        vec4 bl = texture2D(texture, texCoord + vec2(-ux,uy));

                        if(!all(equal(color,r)) && all(equal(l,r)) && all(equal(l,t)) && all(equal(l,b)) &&
                            all(equal(bl,br)) && all(equal(bl,tr)) && all(equal(bl,tl)) && all(equal(bl,r))){
                            float sum = t.r + t.g + t.b + t.a;
                            if((type == 0 && sum > vc) || (type == 1 && sum < vc) || (type == 2)){
                                gl_FragColor = mix(color, t, mixin);
                                gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha));
                            }
                        }

                    }
                `);
            }

            var uniformObj = {
                dist,mixin,
                type : {type : "uniform1i", value :  ["Lighter","Darker","All"].indexOf(type)},
                red : channels.indexOf("R") > -1 ? 1 : 0,
                green : channels.indexOf("G") > -1 ? 1 : 0,
                blue : channels.indexOf("B") > -1 ? 1 : 0,
                alpha : channels.indexOf("A") > -1 ? 1 : 0,
                texSize: [glF.width, glF.height] ,

            };
            glF.filter(this.shader, uniformObj);

            return glF; // Not a must but allows users to chain filters
        },
        arguments : [{
                name : "type",
                description : "Removes pixels that are lighter/darker/both",
                type : "String",
                range : ["Lighter","Darker","All"]
            },{
                name : "dist",
                description : "Size of pixel test zone",
                type : "Number",
                range : {min : 1, max : 12, step : 0.5, def : 1},
            },{
                name : "mixin",
                description : "Standard mix of result and original",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "channels",
                description : "which channels to put back to the result",
                type : "String",
                range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
            }
        ],
    });
    filterGL.filters.register("monoTailRemove", {
        name : "monoTailRemove",
        description : "Removes pixel tails and points sourounded by same color",
        webGLFilters : null,
        shader : null,
        callback(type, dist, pixels, tails, mixin, channels) {
            var glF = this.webGLFilters;
            var angC = 6;
            if (this.shader === null) {
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float dist;
                    uniform float mixin;
                    uniform float red;
                    uniform float green;
                    uniform float blue;
                    uniform float alpha;
                    uniform int type;
                    uniform int pixels;
                    uniform int tails;
                    varying vec2 texCoord;
                    void main() {
                        vec4 color = texture2D(texture, texCoord);
                        gl_FragColor = color;
                        vec4 newCol = color;
                        bool change = false;
                        float ux = (1.0 / texSize.x) * dist;
                        float uy = (1.0 / texSize.y) * dist;
                        float vc = color.r + color.g + color.b + color.a;
                        vec4 t = texture2D(texture, texCoord + vec2(0,-uy));
                        vec4 b = texture2D(texture, texCoord + vec2(0,uy));
                        vec4 l = texture2D(texture, texCoord + vec2(-ux,0));
                        vec4 r = texture2D(texture, texCoord + vec2(ux,0));

                        if(pixels == 1 && all(equal(l,r)) && all(equal(l,t)) && all(equal(l,b)) && !all(equal(color,r))){
                            newCol = t;
                            change = true;
                        }else if(tails == 1){
                            if(all(equal(color,t)) && all(equal(b,l)) && all(equal(b,r)) && !all(equal(b,t))){
                                change = true;
                                newCol = b;
                            }else if(all(equal(color,b)) && all(equal(t,l)) && all(equal(t,r)) && !all(equal(b,t))){
                                newCol = t;
                                change = true;
                            }else if(all(equal(color,l)) && all(equal(r,t)) && all(equal(r,b)) && !all(equal(l,r))){
                                newCol = t;
                                change = true;
                            }else if(all(equal(color,r)) && all(equal(l,t)) && all(equal(l,b)) && !all(equal(l,r))){
                                newCol = t;
                                change = true;
                            }
                        }
                        if(change){
                            float sum = newCol.r + newCol.g + newCol.b + newCol.a;
                            if((type == 0 && sum > vc) || (type == 1 && sum < vc) || (type == 2)){
                                gl_FragColor = mix(color, newCol, mixin);
                                gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha));
                            }
                        }

                    }
                `);
            }

            var uniformObj = {
                dist,mixin,
                pixels : {type : "uniform1i", value : pixels ? 1 : 0},
                tails : {type : "uniform1i", value : tails ? 1 : 0},
                type : {type : "uniform1i", value :  ["Lighter","Darker","All"].indexOf(type)},
                red : channels.indexOf("R") > -1 ? 1 : 0,
                green : channels.indexOf("G") > -1 ? 1 : 0,
                blue : channels.indexOf("B") > -1 ? 1 : 0,
                alpha : channels.indexOf("A") > -1 ? 1 : 0,
                texSize: [glF.width, glF.height] ,

            };
            glF.filter(this.shader, uniformObj);

            return glF; // Not a must but allows users to chain filters
        },
        arguments : [{
                name : "type",
                description : "Removes pixels that are lighter/darker/both",
                type : "String",
                range : ["Lighter","Darker","All"]
            },{
                name : "dist",
                description : "Size of pixel test zone",
                type : "Number",
                range : {min : 1, max : 12, step : 0.5, def : 1},
            },{
                name : "pixels",
                description : "If ticked removes issolated pixels ",
                type : "Boolean",
                range : {def : true},
            },{
                name : "tails",
                description : "If ticked removes pixel tails",
                type : "Boolean",
                range : {def : true},
            },{
                name : "mixin",
                description : "Standard mix of result and original",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "channels",
                description : "which channels to put back to the result",
                type : "String",
                range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
            }
        ],
    });
    filterGL.filters.register("pointClean", {
        name : "pointClean",
        description : "Removes symmetrical points",
        webGLFilters : null,
        shader : null,
        shaderSmall : null,
        smallData : [[], [0,-1,1,-1], [0,-2,2,-2], [0,-3,1,-3,3,-1], [0,-4,2,-4,3,-3,4,-2], [0,-5,1,-5,3,-5,5,-3,5,-1]],

        callback(cutoff, symmetryCutoff, size ,type, mixin, channels) {
            var glF = this.webGLFilters;
            var angC = 6;
            if (this.shader === null || this.shaderSmall === null) {
                this.shader = glF.Shader(null, null).useLinker();
                this.shaderSmall = glF.Shader(null, null).useLinker();
                this.shaderSmall.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float cutoff;
                    uniform float symmetryCutoff;
                    uniform float size;
                    uniform float mixin;
                    uniform float red;
                    uniform float green;
                    uniform float blue;
                    uniform float alpha;

                    uniform vec2 directions[5];
                    uniform int numberTests;
                    uniform int type;
                    varying vec2 texCoord;
                    void main() {
                        vec4 color = texture2D(texture, texCoord);
                        vec4 newCol = vec4(0.0);
                        float count = 0.0;
                        int nextAngle = 0;
                        int okWrite = 0;
                        for(int i = 0; i < ${angC}; i ++){
                            vec2 dir = directions[i] / texSize;
                            vec2 dir1 = vec2(-dir.y,dir.x);
                            nextAngle += 1;
                            vec4 top = texture2D(texture, texCoord + dir);
                            vec4 bot = texture2D(texture, texCoord - dir);
                            vec4 lef = texture2D(texture, texCoord + dir1);
                            vec4 rih = texture2D(texture, texCoord - dir1);
                            vec4 vC = (top + bot) / 2.0;
                            vec4 hC = (lef + rih) / 2.0;
                            float eDist = distance(vC,hC);
                            if(eDist < cutoff*2.0){
                                float disV = distance(vC,color);
                                float disH = distance(hC,color);
                                if(disV > cutoff && disH > cutoff){
                                    float distV1 = distance(top,bot);
                                    float distV2 = distance(lef,rih);
                                    if(distV1 <= symmetryCutoff && distV2 <= symmetryCutoff){
                                        newCol += vC + hC;
                                        count += 2.0;
                                        if(i == numberTests-1){
                                            okWrite = 1;
                                            break;
                                        }
                                    } else { break;}
                                } else { break;}
                            } else { break;}
                        }
                        if(okWrite == 1){
                            gl_FragColor = newCol / count;
                            gl_FragColor = mix(color, gl_FragColor, mixin);
                            gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha));
                        }else{
                            gl_FragColor = color;
                        }
                    }
                `);
                var angC = 8;
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    uniform vec2 texSize;
                    uniform float cutoff;
                    uniform float symmetryCutoff;
                    uniform float size;
                    uniform float mixin;
                    uniform float red;
                    uniform float green;
                    uniform float blue;
                    uniform float alpha;
                    uniform float crossDif;
                    uniform float radialDif;
                    uniform int type;
                    float seedF = 0.0;
                    const float randC1 = 43758.5453;
                    const vec3 randC2 = vec3(12.9898, 78.233, 151.7182);
                    float randomF() {
                        seedF = fract(sin(dot(gl_FragCoord.xyz + seedF, randC2)) * randC1 + seedF);
                        return seedF;
                    }
                    varying vec2 texCoord;
                    void main() {
                        vec4 color = texture2D(texture, texCoord);
                        float ang = randomF() * ${(Math.PI*2).toFixed(6)}; // get semi random angle
                        vec4 newCol = vec4(0.0);
                        float count = 0.0;
                        float xU = size / texSize.x;
                        float yU = size / texSize.y;
                        for(int i = 0; i < ${angC}; i ++){
                            vec2 dir = vec2(sin(ang) * xU,cos(ang) * yU);
                            vec2 dir1 = vec2(-dir.y,dir.x);
                            vec4 top = texture2D(texture, texCoord + dir) ; // vert line
                            vec4 bot = texture2D(texture, texCoord - dir);
                            vec4 lef = texture2D(texture, texCoord + dir1); // hor line
                            vec4 rih = texture2D(texture, texCoord - dir1);
                            vec4 vC = (top + bot) / 2.0;  // vertical
                            vec4 hC = (lef + rih) / 2.0;  // horzontal colour
                            float eDist = distance(vC,hC);
                            if(eDist < cutoff * 2.0){
                                vec4 hCc = (vC+hC)/2.0;
                                float disV = distance(hCc,color);
                                if(disV > cutoff){
                                    float distV1 = distance(top,bot);
                                    float distV2 = distance(lef,rih);
                                    if(distV1 <= symmetryCutoff && distV2 <= symmetryCutoff){
                                        newCol += hCc;
                                        count += 1.0;
                                    } else { break; }
                                } else { break; }
                            } else { break; }
                            ang += ${(Math.PI/(angC*2)).toFixed(6)};
                        }
                        if(count >= ${(angC).toFixed(1)}){
                            gl_FragColor = newCol / count;
                            gl_FragColor = mix(color, gl_FragColor, mixin);
                            gl_FragColor = mix(color, gl_FragColor, vec4(red,green,blue,alpha));
                        }else{
                            gl_FragColor = color;
                        }
                    }
                `);
            }
            if(size < 5){
                if(size < 1){
                    size = 1;
                }else{
                    size = Math.ceil(size);
                }
            }
            var sMax = size;
            var uniformObj = {
                cutoff, size, mixin, symmetryCutoff,//radialDif,crossDif,
                type : {type : "uniform1i", value : type},
                red : channels.indexOf("R") > -1 ? 1 : 0,
                green : channels.indexOf("G") > -1 ? 1 : 0,
                blue : channels.indexOf("B") > -1 ? 1 : 0,
                alpha : channels.indexOf("A") > -1 ? 1 : 0,
                texSize: [glF.width, glF.height] ,
                type : {type : "uniform1i", value : type},

            };
            uniformObj.size = size;
            if(size <= 5){
                uniformObj.directions = {type : "uniform2fv", value : this.smallData[size]};
                uniformObj.numberTests = {type : "uniform1i", value : this.smallData[size].length/2};
                glF.filter(this.shaderSmall, uniformObj);
            }else{
                glF.filter(this.shader, uniformObj);
            }
            return glF; // Not a must but allows users to chain filters
        },
        arguments : [{
                name : "cutoff",
                description : "Noise level cutoff smaller values remove more noise",
                type : "Number",
                range : {min : 0, max : 2, step : 0.1, def : 1},
            },{
                name : "symmetryCutoff",
                description : "Symmetry cutoff check that the area around the dirty point is symmetrical",
                type : "Number",
                range : {min : 0, max : 8, step : 0.1, def : 1},
            },{
                name : "size",
                description : "Pixel test radius in pixels",
                type : "Number",
                range : {min : 1, max : 32, step : 1, def : 1},
            },{
                name : "type of noise to remove",
                description : "Pixel test radius",
                type : "String",
                range : ["Lighter","Darker","All"]
            },{
                name : "mixin",
                description : "Standard mix of result and original",
                type : "Number",
                range : {min : 0, max : 1, step : 0.01, def : 1},
            },{
                name : "channels",
                description : "which channels to put back to the result",
                type : "String",
                range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
            }
        ],
    });
    filterGL.filters.register("tintFilter",   {
            webGLFilters : null,  // required
            shader : null,
            description : "Apply a colour to the image being filtered",
            callback(colorHex,alpha,mix,channels) {  // required
                var glF = this.webGLFilters; // alias for lazy programmers
                if(!this.shader){
                    this.shader = glF.Shader(null, `
                        uniform sampler2D texture;
                        ##standardMixUniforms##
                        uniform vec4 colorIn;
                        varying vec2 texCoord;
                        void main() {
                            vec4 src1Color = texture2D(texture, texCoord);
                            vec4 color = colorIn * ((src1Color.r + src1Color.g + src1Color.b) / 3.0);
                            ##standardMixResult##
                        }
                   `).useLinker();
                }
                var colorIn = glF.hex2RGB(colorHex);
                colorIn[3] = alpha;
                colorIn[0] /= 255;
                colorIn[1] /= 255;
                colorIn[2] /= 255;
                var uniformObj = Object.assign({ colorIn },
                    this.shader.getLinkedInUniforms(
                        "standardMixUniforms",[
                            mix,
                            channels,
                            glF.width,
                            glF.height
                        ]
                    )
                );
                glF.filter(this.shader, uniformObj);
                return glF;
            },
            arguments : [{
                    name : "color",
                    description : "The rgb hex color to tint the image as a 7 char string eg #FFFFFF",
                    type : "HexColor",
                    range : {def : "#FFFFFF"}, // def is default
                },{
                    name : "alpha",
                    description : "The amount of alpha to mix in.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "mix",
                    description : "The amount to mix the convolution array result with the original image, 1 is full result, 0 is original image.",
                    type : "Number",
                    range : {min : 0, max : 1, step : 0.01, def : 1},
                },{
                    name : "channels",
                    description : "Which channels to set. Note that if not using all the channels the result will be the desired color minus the missing channels.",
                    type : "String",
                    range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
                },
            ],
        }
    );
    filterGL.filters.register("oneBitNoise",{
        name : "oneBitNoise",
        description : "Dithers image to 1 bit (black white) using random noise ",
        webGLFilters : null,
        shader : null,
        callback(seedVal, mix, channels) {
            var glF = this.webGLFilters;
            if (this.shader === null) {
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    varying vec2 texCoord;
                    uniform float seedVal;
                    ##standardMixUniforms##
                    ##randomF##
                    void main() {
                        seedF = seedVal;
                        float sum;

                        vec4 color;
                        vec4 src1Color = texture2D(texture, texCoord);
                        float minC = min(min(src1Color.r, src1Color.g), src1Color.b);
                        float maxC = max(max(src1Color.r, src1Color.g), src1Color.b);
                        if(minC == maxC) sum = minC;
                        else sum = (maxC + minC) / 2.0;
                        if(sum < randomF()){
                            color = vec4(0.0,0.0,0.0,src1Color.a);
                        }else{
                            color = vec4(1.0,1.0,1.0,src1Color.a);
                        }
                        ##standardMixResult##
                    }
                `);
            }
            var uniformObj = Object.assign({
                    seedVal: seedVal / 32,
                },
                this.shader.getLinkedInUniforms(
                    "standardMixUniforms",[
                        mix,
                        channels,
                        glF.width,
                        glF.height
                    ]
                )
            );
            glF.filter(this.shader, uniformObj);
            return glF; // Not a must but allows users to chain filters
        },
        arguments : [{
            name : "seed",
            description : "Random seed value.",
            type : "Number",
            range : {min : 0, max : 32, step : 0.001, def : 1},
        },{
            name : "mix",
            description : "",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "channels",
            description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
            type : "String",
            range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
        }],
    });
    filterGL.filters.register("addNoise", {
        name : "addNoise",
        description : "adds noise to the image ",
        webGLFilters : null,
        shader : null,
        callback(seedVal, amount, offset,distribution,cover, mix, channels) {
            var glF = this.webGLFilters;
            if (this.shader === null) {
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    varying vec2 texCoord;
                    uniform float seedVal;
                    uniform float amount;
                    uniform float offset;
                    uniform float cover;
                    uniform float distribution;
                    ##standardMixUniforms##
                    ##randomF##
                    void main() {
                        seedF = seedVal;
                        vec4 color;
                        vec4 src1Color = texture2D(texture, texCoord);
                        float rand = pow(randomF()*0.8,distribution)*(1.0/0.8);
                        if(randomF() < offset){
                            rand = -rand;
                        }
                        if(randomF() < cover){
                            color = src1Color + vec4(rand * amount);
                        }else{
                            color = src1Color;
                        }
                        ##standardMixResult##
                    }
                `);
            }
            var uniformObj = Object.assign({
                    seedVal: seedVal / 32,
                    amount,
                    offset,
                    distribution,
                    cover,
                },
                this.shader.getLinkedInUniforms(
                    "standardMixUniforms",[
                        mix,
                        channels,
                        glF.width,
                        glF.height
                    ]
                )
            );
            glF.filter(this.shader, uniformObj);
            return glF; // Not a must but allows users to chain filters
        },
        arguments : [{
            name : "seed",
            description : "Random seed value.",
            type : "Number",
            range : {min : 0, max : 32, step : 0.001, def : 1},
        },{
            name : "amount",
            description : "The amount of noise to add",
            type : "Number",
            range : {min : 0, max : 2, step : 0.01, def : 1},
        },{
            name : "offset",
            description : "Add or subtract ratio 0.5 equally distributed. 0 All added 1 all subtracted",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 0.5},
        },{
            name : "distribution",
            description : "Tendency for noise to be distributed towards zero. 1 for even distribution, > 1 noise is grouped near to 0",
            type : "Number",
            range : {min : 1, max : 5, step : 0.2, def : 1},
        },{
            name : "cover",
            description : "Amount of pixels effected by noise filter. 0 no pixels are effected, 1 all pixels",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "mix",
            description : "",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "channels",
            description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
            type : "String",
            range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
        }],
    });
    filterGL.filters.register("colorNoise", {
        name : "colorNoise",
        description : "Adds RGB noise to the image with coverage scaled by inverse pixel value ",
        webGLFilters : null,
        shader : null,
        callback(seedVal, amount, offset,distribution,cover, mix, channels) {
            var glF = this.webGLFilters;
            if (this.shader === null) {
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    varying vec2 texCoord;
                    uniform float seedVal;
                    uniform float amount;
                    uniform float offset;
                    uniform float cover;
                    uniform float distribution;
                    ##standardMixUniforms##
                    ##randomF##
                    ##randomV3##
                    void main() {
                        seedF = seedVal;
                        vec4 color;
                        vec4 src1Color = texture2D(texture, texCoord);
                        vec3 rand = pow(randomV3()*0.8, vec3(distribution))*(1.0/0.8);
                        if(randomF() < offset){
                            rand = -rand;
                        }
                        if(randomF() < cover){
                            color = src1Color + vec4(rand * amount, src1Color.a);
                        }else{
                            color = src1Color;
                        }
                        ##standardMixResult##
                    }
                `);
            }
            var uniformObj = Object.assign({
                    seedVal: seedVal / 32,
                    amount,
                    offset,
                    distribution,
                    cover,
                },
                this.shader.getLinkedInUniforms(
                    "standardMixUniforms",[
                        mix,
                        channels,
                        glF.width,
                        glF.height
                    ]
                )
            );
            glF.filter(this.shader, uniformObj);
            return glF; // Not a must but allows users to chain filters
        },
        arguments : [{
            name : "seed",
            description : "Random seed value.",
            type : "Number",
            range : {min : 0, max : 32, step : 0.001, def : 1},
        },{
            name : "amount",
            description : "The amount of noise to add",
            type : "Number",
            range : {min : 0, max : 2, step : 0.01, def : 1},
        },{
            name : "offset",
            description : "Add or subtract ratio 0.5 equally distributed. 0 All added 1 all subtracted",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 0.5},
        },{
            name : "distribution",
            description : "Tendency for noise to be distributed towards zero. 1 for even distribution, > 1 noise is grouped near to 0",
            type : "Number",
            range : {min : 1, max : 5, step : 0.2, def : 1},
        },{
            name : "cover",
            description : "Amount of pixels effected by noise filter. 0 no pixels are effected, 1 all pixels",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "mix",
            description : "",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "channels",
            description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
            type : "String",
            range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
        }],
    });
    filterGL.filters.register("colorNoiseByValue", {
        name : "colorNoiseByValue",
        description : "Adds RGB noise to the image with coverage scaled by inverse pixel value ",
        webGLFilters : null,
        shader : null,
        callback(seedVal, amount, offset,distribution,cover,iterations, mix, channels) {
            var glF = this.webGLFilters;
            if (this.shader === null) {
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    varying vec2 texCoord;
                    uniform float seedVal;
                    uniform float amount;
                    uniform float offset;
                    uniform float cover;
                    uniform float distribution;
                    ##standardMixUniforms##
                    ##randomF##
                    ##randomV3##
                    void main() {
                        seedF = seedVal;
                        vec4 color;
                        vec4 src1Color = texture2D(texture, texCoord);
                        vec3 rand = pow(randomV3()*0.8, vec3(distribution))*(1.0/0.8);
                        if(randomF() < offset){
                            rand = -rand;
                        }
                        float coverVal = pow((src1Color.r + src1Color.g + src1Color.b) / 3.0, 1.0/4.0);
                        if(randomF() < cover * (1.0-coverVal)){
                            color = vec4(pow(pow(src1Color.rgb,vec3(2.2)) + rand * amount, vec3(1.0/2.2)), src1Color.a);
                        }else{
                            color = src1Color;
                        }
                        ##standardMixResult##
                    }
                `);
            }
            var uniformObj = Object.assign({
                    seedVal: seedVal / 32,
                    amount,
                    offset,
                    distribution,
                    cover,
                },
                this.shader.getLinkedInUniforms(
                    "standardMixUniforms",[
                        mix,
                        channels,
                        glF.width,
                        glF.height
                    ]
                )
            );
            if (iterations > 1) {
                for(var i = 1; i < iterations; i ++){
                    uniformObj.seedVal = Math.random();
                    glF.filter(this.shader,uniformObj); // no need to set uniforms again.
                }
            } else {
                glF.filter(this.shader, uniformObj);
            }
            return glF; // Not a must but allows users to chain filters
        },
        arguments : [{
            name : "seed",
            description : "Random seed value.",
            type : "Number",
            range : {min : 0, max : 32, step : 0.001, def : 1},
        },{
            name : "amount",
            description : "The amount of noise to add",
            type : "Number",
            range : {min : 0, max : 2, step : 0.01, def : 1},
        },{
            name : "offset",
            description : "Add or subtract ratio 0.5 equally distributed. 0 All added 1 all subtracted",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 0.5},
        },{
            name : "distribution",
            description : "Tendency for noise to be distributed towards zero. 1 for even distribution, > 1 noise is grouped near to 0",
            type : "Number",
            range : {min : 1, max : 5, step : 0.2, def : 1},
        },{
            name : "cover",
            description : "Amount of pixels effected by noise filter. 0 no pixels are effected, 1 all pixels",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "iterations",
            description : "Number of time to apply filter, each iteration a random seed is generated",
            type : "Number",
            range : {min : 1, max : 16, step : 1, def : 1},
        },{
            name : "mix",
            description : "",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "channels",
            description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
            type : "String",
            range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
        }],
    });
    filterGL.filters.register("multiplyNoise",  {
        name : "multiplyNoise",
        description : "adds noise to the image by multiplication ",
        webGLFilters : null,
        shader : null,
        callback(seedVal, amount, offset,distribution,cover, mix, channels) {
            var glF = this.webGLFilters;
            if (this.shader === null) {
                this.shader = glF.Shader(null, null).useLinker();
                this.shader.setFragmentSource(`
                    uniform sampler2D texture;
                    varying vec2 texCoord;
                    uniform float seedVal;
                    uniform float amount;
                    uniform float offset;
                    uniform float cover;
                    uniform float distribution;
                    ##standardMixUniforms##
                    ##randomF##
                    void main() {
                        seedF = seedVal;
                        vec4 color;
                        vec4 src1Color = texture2D(texture, texCoord);
                        float rand = pow(randomF()*0.8,distribution)*(1.0/0.8);
                        if(randomF() < offset){
                            rand = 1.0-rand* amount;
                        }else{
                            rand = 1.0 + rand* amount;
                        }
                        if(randomF() < cover){
                            color = src1Color * vec4(rand);
                        }else{
                            color = src1Color;
                        }
                        ##standardMixResult##
                    }
                `);
            }
            var uniformObj = Object.assign({
                    seedVal: seedVal / 32,
                    amount,
                    offset,
                    distribution,
                    cover,
                },
                this.shader.getLinkedInUniforms(
                    "standardMixUniforms",[
                        mix,
                        channels,
                        glF.width,
                        glF.height
                    ]
                )
            );
            glF.filter(this.shader, uniformObj);
            return glF; // Not a must but allows users to chain filters
        },
        arguments : [{
            name : "seed",
            description : "Random seed value.",
            type : "Number",
            range : {min : 0, max : 32, step : 0.001, def : 1},
        },{
            name : "amount",
            description : "The amount of noise to add",
            type : "Number",
            range : {min : 0, max : 2, step : 0.01, def : 1},
        },{
            name : "offset",
            description : "Add or subtract ratio 0.5 equally distributed. 0 All added 1 all subtracted",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 0.5},
        },{
            name : "distribution",
            description : "Tendency for noise to be distributed towards zero. 1 for even distribution, > 1 noise is grouped near to 0",
            type : "Number",
            range : {min : 1, max : 5, step : 0.2, def : 1},
        },{
            name : "cover",
            description : "Amount of pixels effected by noise filter. 0 no pixels are effected, 1 all pixels",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "mix",
            description : "",
            type : "Number",
            range : {min : 0, max : 1, step : 0.01, def : 1},
        },{
            name : "channels",
            description : "Which channels to set thresholds to If the string contains R then red is use G for green, B for blue and A for alpha.",
            type : "String",
            range : "RGB,RGBA,BW,Alpha,Red,Green,Blue,RedGreen,RedBlue,GreenBlue,RGBL,RGBAL,BWL,RGBD,RGBAD,BWD".split(","),
        }],
    });









})();
