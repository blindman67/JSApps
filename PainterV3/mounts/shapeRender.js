var options;
const NAME = "ShapeRender";
function dialog() {
    commandLine({args : [], name: ""+NAME+"Dialog",
        batch :`##mountDialogBatch ${UID}
#setShape if $opt === "%0" {;$shapeUI = "%0";$m.shape = $shapeUI;}            

//======================================================================================================================
// directive mountDialogBatch implements
// #start $m = mounted.mount(${UID});$firstRun = true
// #endMenu jumpSub setMenuOptions;jump doAgain;label setMenuOptions
// #menuRefreshed jump doAgain
// #menu jumpSub setMenuOptions;menu title $title;menu options $options;menu exit "Exit";menu exit "Dis Sel";menu exit "Dis All";menu extra 1;menu keep;label doAgain;$opt = call menu;if $opt === "exit"  {;exit;};if $opt === "dis all"  {;$res = $m.dismount("dismount");exit;};if $opt === "dis sel"  {;$res = $m.dismount("selected");$res = mounted.hasMount(${UID});if $res===false {;exit;};}
// #setMenu if $firstRun !== true {;menuUpdate %0 %1 %2 %3 %4 %5 %6 %7 %8 %9;};$firstRun = false;exitSub
// #setMenuLong if $firstRun !== true {
// #setMenuLongEnd };$firstRun = false;exitSub
//======================================================================================================================


$res = ""
#start
$m.clearExtraCommands = true

$shapeUI = $m.shape
$settinValA = $m.settinValA
$settinValB = $m.settinValB
$settinValC = $m.settinValC
$title = "${NAME} options"
$options = ""
$options = $options + "$shapeUI,Current shape is,"
$options = $options + "$settinValA,slider SettingA 0 2 0.01 0.01 #000,,"
$options = $options + "$settinValB,slider SettingB 0 2 0.01 0.01 #000,,"
$options = $options + "$settinValC,slider SettingC 0 1 0.01 0.01 #000,,"
$options = $options + "Circle,"
$options = $options + "Ellipse,"
$options = $options +  "Pie,"
$options = $options +  "Ellipse Pie,"
$options = $options +  "Star3,"
$options = $options +  "Star4,"
$options = $options +  "Star5,"
$options = $options +  "Star6,"
$options = $options +  "Star7,"
$options = $options +  "Star8,"
$options = $options +  "Star9,"
$options = $options +  "Arrow A,"
$options = $options +  "Arrow B,"
$options = $options +  "Arrow C,"
$options = $options +  "Rounded Rectangle,"
$options = $options +  "Rounded Box,,"
$options = $options +  "Add selected,,"


#menu


if $opt === "menuextra1" {

    if $m.menuExtra === true {

        jumpSub refreshMenu
        $m.clearExtraCommands = true
        #menuRefreshed
    }
}

if $opt === "Add selected" {

    $m.dialogMessage = "addSelected"
}
if $opt === "settinValA" {
    $m.settinValA = $settinValA
}
if $opt === "settinValB" {
    $m.settinValB = $settinValB
}
if $opt === "settinValC" {
    $m.settinValC = $settinValC
}
$opt = $opt.replace(/ /g,"")

#setShape Circle
#setShape Pie
#setShape ArrowA
#setShape ArrowB
#setShape ArrowC
#setShape EllipsePie
#setShape Star3
#setShape Star4
#setShape Star5
#setShape Star6
#setShape Star7
#setShape Star8
#setShape Star9
#setShape RoundedRectangle
#setShape RoundedBox


    
    
#endMenu

    #setMenu $shapeUI $settinValA $settinValB $settinValC
    
label refreshMenu
    $shapeUI = $m.shape
    $settinValA = $m.settinValA
    $settinValB = $m.settinValB
    $settinValC = $m.settinValC        
    #setMenu $shapeUI $settinValA $settinValB $settinValC
    
    

`});
}    
args = args.join(" ");
if(args[0] === "help" || args[0] === "?"  || args[0] === "Help") { return  }
else if(args[0] === "Dialog" || args[0] === "dialog") { dialog() } 
else { return mount() }
function mount(){
    options = {
        shape : "circle", 
        A : 0.0,
        B : 0.25,
        C : 0.0,
    };    
    var menuExtraFlag = -1;
    const mount = {
        help(){},
        dialog,
        type: "renderer",
        set clearExtraCommands(value) { menuExtraFlag = -1 },
        get menuExtra() { return menuExtraFlag > -1 },
        set menuExtra(id) {
            if(menuExtraFlag === -1){
                menuExtraFlag = id;
                setTimeout(() => issueCommand(commands.quickDialogExtras + id) , 0);
            }   
        },
        get UID() { return UID },
        set dialogMessage(val) {
            if(val === "addSelected") {
                var count = 0;
                selection.each(spr => {
                    if(!items.includes(spr)) {
                        if(spr.type.cutter) {
                            addSprite(spr);
                            count ++;
                        }
                    }
                });
                if(count === 0) {
                    log.info("Did not find any selected cutters.");
                }
            }
        },
        set shape(val) { options.shape = val ? val.toLowerCase() :""; updateOptions("shape")},
        get shape() {return  options.shape},
        set settinValA(val) {options.A = val; updateOptions("A")},
        set settinValB(val) {options.B = val; updateOptions("B")},
        set settinValC(val) {options.C = val; updateOptions("C")},
        get settinValA() {return options.A},
        get settinValB() {return options.B},
        get settinValC() {return options.C},
        canDismountSingleItem : true,
        dismount(itemUID) {
            if(itemUID) {
                var item = items.find(i => i.guid === itemUID);
                if(item) {
                    removeSprite(item);
                    for(let i = 0; i < items.length; i ++) {
                        if(items[i] === undefined) {
                            items.splice(i--,1);
                        }
                    }
                    if(items.length !== 0) { return }
                } else {
                    return;
                }
                
            }
            for(const item of items) { 
                removeSprite(item);
            }

            items = undefined;
            dismount(UID, true);
            selection.removeEvent("change", updateOptionsFromSelection);  
            animation.removeEvent("change", update);
            return "closed";               
                      
        }
    }

    function updateOptionsFromSelection() {
        selection.each(spr => {
            if(mounted.mountHasItem(UID, spr.guid)) {
                Object.assign(options, spr.shapeRender);
                mount.menuExtra = 1;
                return true;
            }
        })
    }
    function updateOptions(optName) {
        selection.each(spr => {
            if(mounted.mountHasItem(UID, spr.guid)) { spr.shapeRender[optName] = options[optName] }
        })
    }
    function update() {  }    
    const paths = {
        box : [-1,-1,1,-1,1,1,-1,1],
        boxUseA : [0,0,0,0,0,0,0,0],
        boxUseB : [0,0,0,0,0,0,0,0],
        star5 : [],
        star5A : [],
        star5B : [],
        arrow_A: [-0.3,-1, 0.3,-1, 0.3,4.4, 1,4.4, 0,1, -1,4.4, -0.3,4.4],
        arrow_AA: [0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0,0],
        arrow_AB: [0,2,4,12],
        arrow_AC: [5,7,11,13],
        arrow_B: [ 
            0,-1, 
            0.4,4.4, 
            1,4.4, 
            0,1, 
            -1,4.4, 
            -0.4,4.4
            ],
        arrow_BA: [0,0, 0,0, 0,0, 0,0, 0,0, 0,0],
        arrow_BB: [2,10],
        arrow_BC: [3,5,9,11],        
        arrow_C: [-0.6,-1, 0, -1, 0.6,-1, 0.2,3.4, 1,4.4, 0,1, -1,4.4, -0.2,3.4],
        arrow_CA: [0,0, 0,0, 0,0, 0,0, 0,0, 0,0, 0,0,0,0],
        arrow_CB: [0,4,6,14],
        arrow_CC: [3, 7,9,13,15],
    }
    for(let j = 3; j <10; j ++) {
        const s = [];
        const sA = [];
        const sB = [];
        for(let i = 0; i < 1; i += 1/j) {
            const a = i * Math.PI * 2 - Math.PI / 2;
            const a1 = a + (Math.PI * 2) / j / 2;
            const x = Math.cos(a);
            const y = Math.sin(a);
            s.push(x,y)
            const x1 = Math.cos(a1);
            const y1 = Math.sin(a1);
            s.push(x1,y1)     
            sA.push(0,0,0,0)     
            sB.push(0,0,0,0)     
        }       
        paths["star" + j] = s;
        paths["star" + j + "A"] = sA;
        paths["star" + j + "B"] = sB;
    }
    
    
    function roundedPath(ctx, points, radius) {
        var i,cross, o, len, len2, x1,y1,x2,y2,x3,y3,p1,p2,p3,a,b,c,vx1,vx2,vy1,vy2,ang,d1,as,ae,x,y,nx1,ny1,nx2,ny2;
        var r = radius;
        o = points;//pointsToCoords(points);
        len = (len2 = o.length) / 2;
        for(i = 0; i < len; i ++ ){
            p1 = i * 2;
            p2 = ((i + 1) * 2) % len2;
            p3 = ((i + len - 1) * 2) % len2;
            x1 = o[p1];
            y1 = o[p1 + 1];
            x2 = o[p2];
            y2 = o[p2 + 1];
            x3 = o[p3];
            y3 = o[p3 + 1];
            vx1 = x2 - x1;
            vy1 = y2 - y1;
            vx2 = x3 - x1;
            vy2 = y3 - y1;
            a = Math.sqrt(vx1 * vx1 + vy1 * vy1);
            b = Math.sqrt(vx2 * vx2 + vy2 * vy2);
            c = Math.sqrt(Math.pow(x2 - x3, 2) + Math.pow(y2 - y3, 2));
            nx1 = vx1 / a;
            ny1 = vy1 / a;
            nx2 = vx2 / b;
            ny2 = vy2 / b;
            ang = Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
            d1 = Math.sqrt(Math.pow(r / Math.sin(ang / 2), 2) - r * r);
            cross = nx1 * ny2 - nx2 * ny1;
            if (cross < 0) { 
                as = Math.atan2(-nx2, ny2); 
                ae = Math.atan2(nx1, -ny1); 
                x = x1 + nx1 * d1 - (-ny1) * r;
                y = y1 + ny1 * d1 - nx1 * r;
                if(i === 0){
                    ctx.moveTo(
                        x + Math.cos(as) * r,
                        y + Math.sin(as) * r
                    );
                }                                
                ctx.arc(x, y, r, as, ae, true);
            } else {
                as = Math.atan2(nx2, -ny2);
                ae = Math.atan2(-nx1, ny1);
                x = x1 + nx1 * d1 + -ny1 * r;
                y = y1 + ny1 * d1 + nx1 * r;
                if(i === 0){
                    ctx.moveTo(
                        x + Math.cos(as) * r,
                        y + Math.sin(as) * r
                    );
                }                          
                ctx.arc(x, y, r, as, ae);
            }
        }
        ctx.closePath();
        return ctx;
    }
    
    const shapes = {
        arrowa(ctx, spr, opts) { shapes.arrow("arrow_A",ctx,spr, opts) },
        arrowb(ctx, spr, opts) { shapes.arrow("arrow_B",ctx,spr, opts) },
        arrowc(ctx, spr, opts) { shapes.arrow("arrow_C",ctx,spr, opts) },
        arrow(name,ctx, spr, opts) {            
            ctx.globalAlpha = spr.a;
            ctx.fillStyle = spr.rgb.css;
            const p = paths[name];
            const pA = paths[name+"A"];
            const pB = paths[name+"B"];
            const pC = paths[name+"C"];
            const mat = spr.key.m;
            const w = Math.abs(spr.w / 2);
            const h = Math.abs(spr.h / 2);
            const r = Math.min(w,h);
            ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);       
            for(var i = 0; i < p.length; i+= 2){
                pA[i] = p[i] * w;
                pA[i+1] = p[i+1] * h;
            }
            for(const idx of pB) { pA[idx] *= opts.B }
            for(const idx of pC) { pA[idx] = p[idx] < 0 ?-h -p[idx] * w * opts.C : h - p[idx] * w * opts.C }
            ctx.beginPath();
            roundedPath(ctx,pA, (r / 2) * opts.A);
            ctx.setTransform(1,0,0,1,0,0);
            ctx.fill("evenodd");
        },       
        star3(ctx, spr, opts) { shapes.star("star3",ctx,spr, opts) },
        star4(ctx, spr, opts) { shapes.star("star4",ctx,spr, opts) },
        star5(ctx, spr, opts) { shapes.star("star5",ctx,spr, opts) },
        star6(ctx, spr, opts) { shapes.star("star6",ctx,spr, opts) },
        star7(ctx, spr, opts) { shapes.star("star7",ctx,spr, opts) },
        star8(ctx, spr, opts) { shapes.star("star8",ctx,spr, opts) },
        star9(ctx, spr, opts) { shapes.star("star9",ctx,spr, opts) },
        star(name,ctx, spr, opts) {            
            ctx.globalAlpha = spr.a;
            ctx.fillStyle = spr.rgb.css;
            const mat = spr.key.m;
            const r = Math.abs(spr.w / 2);
            const r1 = r * opts.B;
            const p = paths[name];
            const pA = paths[name + "A"];
            const pB = paths[name + "B"];
            ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);       
            for(var i = 0; i < p.length; i+= 4){
                pB[i]     = (pA[i]     = p[i] * r) * opts.C;
                pB[i + 1] = (pA[i + 1] = p[i + 1] * r) * opts.C;
                pB[i + 2] = (pA[i + 2] = p[i + 2] * r1) * opts.C;
                pB[i + 3] = (pA[i + 3] = p[i + 3] * r1) * opts.C;
            }
            ctx.beginPath();
            roundedPath(ctx,pA, (r / 2) * opts.A);
            if (opts.C > 0) {
                roundedPath(ctx,pB, (r / 2) * opts.A * opts.C);
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.fill("evenodd");
        },       
        roundedbox(ctx, spr, opts) {            
            ctx.globalAlpha = spr.a;
            ctx.fillStyle = spr.rgb.css;
            const mat = spr.key.m;
            const r = Math.abs(spr.w / 2);
            ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);       
            for(var i = 0; i < paths.boxUseA.length; i+= 2){
                paths.boxUseB[i] = (paths.boxUseA[i] = paths.box[i] * r) * opts.C;
                paths.boxUseB[i+ 1] = (paths.boxUseA[i+1] = paths.box[i+1] * r) * opts.C;
            }
            ctx.beginPath();
            roundedPath(ctx,paths.boxUseA, (r / 2) * opts.A);
            if (opts.C > 0) {
                roundedPath(ctx,paths.boxUseB, (r / 2) * opts.A * opts.C);
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.fill("evenodd");
        },
        roundedrectangle(ctx, spr, opts) {            
            ctx.globalAlpha = spr.a;
            ctx.fillStyle = spr.rgb.css;
            const mat = spr.key.m;
            const w = Math.abs(spr.w / 2);
            const h = Math.abs(spr.h / 2);
            const r = Math.min(w,h);
            ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);       
            for(var i = 0; i < paths.boxUseA.length; i+= 2){
                paths.boxUseB[i] = (paths.boxUseA[i] = paths.box[i] * w) * opts.C;
                paths.boxUseB[i+ 1] = (paths.boxUseA[i+1] = paths.box[i+1] * h) * opts.C;
            }
            ctx.beginPath();
            roundedPath(ctx,paths.boxUseA, (r / 2) * opts.A);
            if (opts.C > 0) {
                roundedPath(ctx,paths.boxUseB, (r / 2) * opts.A * opts.C);
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.fill("evenodd");
        },
        circle(ctx, spr, opts) {
            
            ctx.globalAlpha = spr.a;
            ctx.fillStyle = spr.rgb.css;
            const mat = spr.key.m;
            const r = Math.abs(spr.w / 2);
            ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);            
            ctx.beginPath();
            ctx.arc(0, 0, r,0,Math.PI * 2);
            if (opts.C > 0) {
                ctx.arc(0, 0, r * opts.C,0,Math.PI * 2, true);
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.fill();
        },
        ellipse(ctx, spr, opts) {
            
            ctx.globalAlpha = spr.a;
            ctx.fillStyle = spr.rgb.css;
            const mat = spr.key.m;
            const rx = Math.abs(spr.w / 2);
            const ry = Math.abs(spr.h / 2);
            ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);            
            ctx.beginPath();
            ctx.ellipse(0, 0, rx, ry,0,0,Math.PI * 2);
            if (opts.C > 0) {
                ctx.ellipse(0, 0, rx * opts.C, ry * opts.C, 0, 0, Math.PI * 2, true);
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.fill();
        },        
        pie(ctx, spr, opts) {
            ctx.globalAlpha = spr.a;
            ctx.fillStyle = spr.rgb.css;
            const mat = spr.key.m;
            const r = Math.abs(spr.w / 2);
            ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);   
            ctx.beginPath();
            if(opts.C > 0) {
                ctx.arc(0, 0, r,              Math.PI * opts.A,                           Math.PI * opts.A + Math.PI * opts.B);
                ctx.arc(0, 0, r * opts.C , Math.PI * opts.A + Math.PI * opts.B, Math.PI * opts.A, true);
            }else{
                ctx.moveTo(0,0);
                ctx.arc(0, 0, r,Math.PI * opts.A, Math.PI * opts.A + Math.PI * opts.B);
                ctx.closePath();
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.fill();           
        },
        ellipsepie(ctx, spr, opts) {
            ctx.globalAlpha = spr.a;
            ctx.fillStyle = spr.rgb.css;
            const mat = spr.key.m;
            const r = Math.abs(spr.w / 2);
            ctx.transform(mat[0], mat[1], mat[2], mat[3], mat[4], mat[5]);   
            const rx = Math.abs(spr.w / 2);
            const ry = Math.abs(spr.h / 2);
            ctx.beginPath();


            
            if(opts.C > 0) {
                ctx.ellipse(0, 0, rx,             ry,       0, Math.PI * opts.A,                           Math.PI * opts.A + Math.PI * opts.B);
                ctx.ellipse(0, 0, rx * opts.C ,ry * opts.C, 0, Math.PI * opts.A + Math.PI * opts.B, Math.PI * opts.A, true);
            }else{
                ctx.moveTo(0,0);
                ctx.ellipse(0, 0, rx, ry, 0,Math.PI * opts.A, Math.PI  * opts.A + Math.PI  * opts.B);
                ctx.closePath();
            }
            ctx.setTransform(1,0,0,1,0,0);
            ctx.fill();           
        }
    }
    function renderItem(spr, type, data) {
        const opts = spr.shapeRender;
        if(shapes[opts.shape]) { 
            const m = data.m;
            data.c.setTransform(m[0], m[1], m[2], m[3], m[4], m[5]);
            shapes[opts.shape](data.c, spr, opts);
        }
    };    
;    
    function addSprite(spr, opts = options) {
        items.push(spr);
        spr.type.renderable = true;
        spr.type.hideOutline = true;
        spr.addEvent("oncopied", copiedItem, UID);
        spr.addEvent("onrender", renderItem, UID);
        spr.shapeRender = {...opts};
        mounted.add(spr.guid,UID);
    }
    function removeSprite(spr) {
        const idx = items.indexOf(spr);
        if (idx > -1) {
            spr.type.renderable = false;
            spr.type.hideOutline = false;
            spr.removeEvent("oncopied", copiedItem);
            spr.removeEvent("onrender", renderItem);
            delete spr.shapeRender;
            mounted.removeMountFromItem(spr.guid,UID);
            items[idx] = undefined;
        }
    }
        
    function copiedItem(spr, type, data) {
        addSprite(data.copy, data.copy.shapeRender);
    };
    
    var items = [];
    if(selection.length > 0) {
        const loaned = [];
        selection.each(spr => { if(spr.type.cutter) { loaned.push(spr) } });
        if (loaned.length > 0) {  
            mounted.addMount(mount);
            for(const item of loaned) {  addSprite(item)  }


            selection.addEvent("change", updateOptionsFromSelection, UID);         
            animation.addEvent("change", update, UID);         


            return mount;
        }
    }
    log.warn("Shape render requiers at least 1 cutter selected");    

};