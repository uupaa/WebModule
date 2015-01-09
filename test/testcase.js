var ModuleTestREPOSITORY_NAME = (function(global) {

var _isNodeOrNodeWebKit = !!global.global;
var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

return new Test("REPOSITORY_NAME", {
        disable:    false,
        browser:    true,
        worker:     true,
        node:       true,
        button:     true,
        both:       true, // test the primary module and secondary module
    }).add([
        testREPOSITORY_NAME_value,
        testREPOSITORY_NAME_isNumber,
        testREPOSITORY_NAME_isInteger,
    ]).run().clone();

function testREPOSITORY_NAME_value(test, pass, miss) {

    var result = new REPOSITORY_NAME(123.4).value();

    if (result === 123.4) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

function testREPOSITORY_NAME_isNumber(test, pass, miss) {

    var result = [
            new REPOSITORY_NAME(123.4).isNumber(),  // true
            new REPOSITORY_NAME(123.0).isNumber()   // true
        ];

    if (!/false/.test(result.join())) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

function testREPOSITORY_NAME_isInteger(test, pass, miss) {

    var result = [
           !new REPOSITORY_NAME(123.4).isInteger(), // !false -> true
            new REPOSITORY_NAME(123.0).isInteger()  // true
        ];

    if (!/false/.test(result.join())) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

})(WEBMODULE_IDIOM);

