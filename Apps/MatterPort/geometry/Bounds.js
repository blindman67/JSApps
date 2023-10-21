
import {Vec2} from "../geometry/Vector.js";
const Bounds = (() => {
    class Bounds {
        min = new Vec2();
        max = new Vec2();
        constructor(vertices) {
            vertices && this.envelop(vertices);
        };
        irate() {
            this.min.x = Infinity;
            this.min.y = Infinity;
            this.max.x = -Infinity;
            this.max.y = -Infinity;     
        }
        addBounds(bounds) {
            this.min.minVec(bounds.min);
            this.max.maxVec(bounds.max);
        }
        addPoint(point) {
            this.min.minVec(point);
            this.max.maxVec(point);
        }            
        envelop(vertices, velocity) {
            var i; 
            this.min.x = Infinity;
            this.min.y = Infinity;
            this.max.x = -Infinity;
            this.max.y = -Infinity;
            for (i = 0; i < vertices.length; i++) {
                const vertex = vertices[i];
                this.min.minVec(vertex);
                this.max.maxVec(vertex);
            }
            if (velocity) {
                this.min.min(this.min.x + velocity.x, this.min.y + velocity.y);
                this.max.max(this.max.x + velocity.x, this.max.y + velocity.y);
            }
        }
        contains(point) {
            return point.x >= this.min.x && point.x <= this.max.x && point.y >= this.min.y && point.y <= this.max.y;
        }
        overlaps(bounds) {
            return (this.min.x <= bounds.max.x && this.max.x >= bounds.min.x  && this.max.y >= bounds.min.y && this.min.y <= bounds.max.y);
        }
        translate(vec) {
            this.min.x += vec.x;
            this.min.y += vec.y;
            this.max.x += vec.x;
            this.max.y += vec.y;
        }
        shift(pos) {
            const deltaX = this.max.x - this.min.x;
            const deltaY = this.max.y - this.min.y;
            this.min.x = pos.x;
            this.max.x = pos.x + deltaX;
            this.min.y = pos.y;
            this.max.y = pos.y + deltaY;
        }        
        static create(vertices) {
            return new Bounds(vertices);
        };
        static update(bounds, vertices, velocity) {
            bounds.min.x = Infinity;
            bounds.max.x = -Infinity;
            bounds.min.y = Infinity;
            bounds.max.y = -Infinity;
            for (var i = 0; i < vertices.length; i++) {
                var vertex = vertices[i];
                if (vertex.x > bounds.max.x) bounds.max.x = vertex.x;
                if (vertex.x < bounds.min.x) bounds.min.x = vertex.x;
                if (vertex.y > bounds.max.y) bounds.max.y = vertex.y;
                if (vertex.y < bounds.min.y) bounds.min.y = vertex.y;
            }
            if (velocity) {
                if (velocity.x > 0) { bounds.max.x += velocity.x; }
                else { bounds.min.x += velocity.x; }
                if (velocity.y > 0) { bounds.max.y += velocity.y; }
                else { bounds.min.y += velocity.y; }
                
            }
        }
        static contains(bounds, point) {
            return point.x >= bounds.min.x && point.x <= bounds.max.x && point.y >= bounds.min.y && point.y <= bounds.max.y;
        }
        static overlaps(boundsA, boundsB) {
            return (boundsA.min.x <= boundsB.max.x && boundsA.max.x >= boundsB.min.x  && boundsA.max.y >= boundsB.min.y && boundsA.min.y <= boundsB.max.y);
        }
        static translate(bounds, vector) {
            bounds.min.x += vector.x;
            bounds.max.x += vector.x;
            bounds.min.y += vector.y;
            bounds.max.y += vector.y;
        }
        static shift(bounds, pos) {
            var deltaX = bounds.max.x - bounds.min.x, deltaY = bounds.max.y - bounds.min.y;
            bounds.min.x = pos.x;
            bounds.max.x = pos.x + deltaX;
            bounds.min.y = pos.y;
            bounds.max.y = pos.y + deltaY;
        }
    };
    return Bounds;
})();
export {Bounds};