var ModuleTestZzz = (function(global) {

var _inNode    = "process"        in global;
var _inWorker  = "WorkerLocation" in global;
var _inBrowser = "document"       in global;

return new Test("Zzz", {
        disable:    false,
        browser:    true,
        worker:     true,
        node:       true,
        button:     true,
        both:       true,
    }).add([
        testZzz_value,
        testZzz_isNumber,
        testZzz_isInteger,
    ]).run().clone();

function testZzz_value(next) {

    var result = new Zzz(123.4).value();

    if (result === 123.4) {
        console.log("testZzz_value ok");
        next && next.pass();
    } else {
        console.error("testZzz_value ng");
        next && next.miss();
    }
}

function testZzz_isNumber(next) {

    var result = [
            new Zzz(123.4).isNumber(),  // true
            new Zzz(123.0).isNumber()   // true
        ];

    if (!/false/.test(result.join())) {
        console.log("testZzz_isNumber ok");
        next && next.pass();
    } else {
        console.error("testZzz_isNumber ng");
        next && next.miss();
    }
}

function testZzz_isInteger(next) {

    var result = [
           !new Zzz(123.4).isInteger(), // !false -> true
            new Zzz(123.0).isInteger()  // true
        ];

    if (!/false/.test(result.join())) {
        console.log("testZzz_isInteger ok");
        next && next.pass();
    } else {
        console.error("testZzz_isInteger ng");
        next && next.miss();
    }
}

})((this || 0).self || global);

