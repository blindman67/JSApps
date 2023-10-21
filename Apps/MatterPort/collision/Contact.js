var Contact = {};
export {Contact};
(function() {
    Contact.create = function(vertex) {
        return {
            vertex: vertex,
            normalImpulse: 0,
            tangentImpulse: 0
        };
    };
})();