var ModuleTestZzz = (function(global) {

var _runOnNode = "process" in global;
var _runOnWorker = "WorkerLocation" in global;
var _runOnBrowser = "document" in global;

return new Test("Zzz", {
        disable:    false,
        browser:    true,
        worker:     true,
        node:       true,
        button:     true,
        both:       true, // test the primary module and secondary module
    }).add([
        testZzz_value,
        testZzz_isNumber,
        testZzz_isInteger,
    ]).run().clone();

function testZzz_value(next) {

    var result = new Zzz(123.4).value();

    if (result === 123.4) {
        next && next.pass();
    } else {
        next && next.miss();
    }
}

function testZzz_isNumber(next) {

    var result = [
            new Zzz(123.4).isNumber(),  // true
            new Zzz(123.0).isNumber()   // true
        ];

    if (!/false/.test(result.join())) {
        next && next.pass();
    } else {
        next && next.miss();
    }
}

function testZzz_isInteger(next) {

    var result = [
           !new Zzz(123.4).isInteger(), // !false -> true
            new Zzz(123.0).isInteger()  // true
        ];

    if (!/false/.test(result.join())) {
        next && next.pass();
    } else {
        next && next.miss();
    }
}

})((this || 0).self || global);

