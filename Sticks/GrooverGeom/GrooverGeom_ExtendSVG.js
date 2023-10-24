"use strict";

groover.geom.Geom.prototype.addSVG = function(){
    var geom; 
    geom = this;
    
    this.extensions.svg = {   // add extensions 
        functions : ["asSVGPath","asSVG","fromSVG"],
        info : "Provides helper functions to convert between Geom primitives and SVG"
    }; 
    if(geom.Vec){
        var proto = geom.Vec.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    };
    if(geom.Line){
        var proto = geom.Line.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
    if(geom.Bezier){
        var proto = geom.Bezier.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
    if(geom.PrimitiveArray){
        var proto = geom.PrimitiveArray.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
    if(geom.VecArray){
        var proto = geom.VecArray.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
    if(geom.Circle){
        var proto = geom.Circle.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
    if(geom.Arc){
        var proto = geom.Arc.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
    if(geom.Rectangle){    
        var proto = geom.Rectangle.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
    if(geom.Triangle){
        var proto = geom.Triangle.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
    if(geom.Box){
        var proto = geom.Box.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
    if(geom.Empty){
        var proto = geom.Empty.prototype;
        proto.asSVGPath = function (){
            var svgPath = "";
            return svgPath;// returns path
        };
        proto.asSVG = function (){
            var svg = "";
            return svg;// returns svg
        };
        proto.fromSVG = function (svg){
            return this;// returns this
        };
    }
}
