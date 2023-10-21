

import {Composite} from "../body/Composite.js";
import {Constraint} from "../constraint/Constraint.js";
import {Common} from "../core/Common.js";
import {Body} from "../body/Body.js";
import {Bodies} from "./Bodies.js";
const Composites = (() => {
    class Composites {
        stack(xx, yy, columns, rows, columnGap, rowGap, callback) {
            var stack = Composite.create({ label: 'Stack' }), x = xx, y = yy, lastBody, i = 0;
            for (var row = 0; row < rows; row++) {
                var maxHeight = 0;
                for (var column = 0; column < columns; column++) {
                    var body = callback(x, y, column, row, lastBody, i);
                    if (body) {
                        var bodyHeight = body.bounds.max.y - body.bounds.min.y,
                            bodyWidth = body.bounds.max.x - body.bounds.min.x;
                        if (bodyHeight > maxHeight) { maxHeight = bodyHeight; }
                        body.translate({ x: bodyWidth * 0.5, y: bodyHeight * 0.5 });
                        x = body.bounds.max.x + columnGap;
                        Composite.addBody(stack, body);
                        lastBody = body;
                        i += 1;
                    } else {
                        x += columnGap;
                    }
                }
                y += maxHeight + rowGap;
                x = xx;
            }
            return stack;
        }
        chain(composite, xOffsetA, yOffsetA, xOffsetB, yOffsetB, options) {
            var bodies = composite.bodies;
            for (var i = 1; i < bodies.length; i++) {
                var bodyA = bodies[i - 1],
                    bodyB = bodies[i],
                    bodyAHeight = bodyA.bounds.max.y - bodyA.bounds.min.y,
                    bodyAWidth = bodyA.bounds.max.x - bodyA.bounds.min.x,
                    bodyBHeight = bodyB.bounds.max.y - bodyB.bounds.min.y,
                    bodyBWidth = bodyB.bounds.max.x - bodyB.bounds.min.x;
                var defaults = {
                    bodyA: bodyA,
                    pointA: { x: bodyAWidth * xOffsetA, y: bodyAHeight * yOffsetA },
                    bodyB: bodyB,
                    pointB: { x: bodyBWidth * xOffsetB, y: bodyBHeight * yOffsetB }
                };
                var constraint = Common.extend(defaults, options);
                Composite.addConstraint(composite, Constraint.create(constraint));
            }
            composite.label += ' Chain';
            return composite;
        }
        mesh(composite, columns, rows, crossBrace, options) {
            const bodies = composite.bodies;
            var row, col;
            for (row = 0; row < rows; row++) {
                for (col = 1; col < columns; col++) {
                    const bodyA = bodies[(col - 1) + (row * columns)];
                    const bodyB = bodies[col + (row * columns)];
                    Composite.addConstraint(composite, Constraint.create(Common.extend({bodyA, bodyB}, options)));
                }
                if (row > 0) {
                    for (col = 0; col < columns; col++) {
                        const bodyA = bodies[col + ((row - 1) * columns)];
                        const bodyB = bodies[col + (row * columns)];
                        Composite.addConstraint(composite, Constraint.create(Common.extend({bodyA, bodyB }, options)));
                        if (crossBrace && col > 0) {
                            const bodyA = bodies[(col - 1) + ((row - 1) * columns)];
                            Composite.addConstraint(composite, Constraint.create(Common.extend({bodyA, bodyB}, options)));
                        }
                        if (crossBrace && col < columns - 1) {
                            const bodyA = bodies[(col + 1) + ((row - 1) * columns)];
                            Composite.addConstraint(composite, Constraint.create(Common.extend({bodyA, bodyB }, options)));
                        }
                    }
                }
            }
            composite.label += ' Mesh';
            return composite;
        }
        pyramid(xx, yy, columns, rows, columnGap, rowGap, callback) {
            return this.stack(xx, yy, columns, rows, columnGap, rowGap, function(x, y, column, row, lastBody, i) {
                const actualRows = Math.min(rows, Math.ceil(columns / 2));
                const lastBodyWidth = lastBody ? lastBody.bounds.max.x - lastBody.bounds.min.x : 0;
                if (row > actualRows) { return; }
                row = actualRows - row;
                const start = row;
                const end = columns - 1 - row;
                if (column < start || column > end) { return; }
                if (i === 1) {
                    Body.translate(lastBody, { x: (column + (columns % 2 === 1 ? 1 : -1)) * lastBodyWidth, y: 0 });
                }
                const xOffset = lastBody ? column * lastBodyWidth : 0;
                return callback(xx + xOffset + column * columnGap, y, column, row, lastBody, i);
            });
        }
    };
    return new Composites();
})();
export {Composites};