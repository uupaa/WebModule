var ModuleTestREPOSITORY_NAME = (function(global) {

var _isNodeOrNodeWebKit = !!global.global;
var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

var test = new Test("REPOSITORY_NAME", {
        disable:    false,
        browser:    true,
        worker:     true,
        node:       true,
        nw:         true,
        button:     true,
        both:       true, // test the primary module and secondary module
        ignoreError:false,
    }).add([
        testREPOSITORY_NAME_value,
        testREPOSITORY_NAME_isNumber,
        testREPOSITORY_NAME_isInteger,
    ]);

if (_runOnBrowser || _runOnNodeWebKit) {
    //test.add([]);
} else if (_runOnWorker) {
    //test.add([]);
} else if (_runOnNode) {
    //test.add([]);
}

return test.run().clone();

function testREPOSITORY_NAME_value(test, pass, miss) {

    var result = new REPOSITORY_NAME(123.4).value();

    if (result === 123.4) {
        test.done(pass());
    } else {
        test.done(miss());
    }
}

function testREPOSITORY_NAME_isNumber(test, pass, miss) {

    var result = {
            0: new REPOSITORY_NAME(123.4).isNumber(),  // true
            1: new REPOSITORY_NAME(123.0).isNumber()   // true
        };

    if (/false/.test(JSON.stringify(result, null, 2))) {
        test.done(miss());
    } else {
        test.done(pass());
    }
}

function testREPOSITORY_NAME_isInteger(test, pass, miss) {

    var result = {
            0: !new REPOSITORY_NAME(123.4).isInteger(), // (!false) -> true
            1:  new REPOSITORY_NAME(123.0).isInteger()  // true
        };

    if (/false/.test(JSON.stringify(result, null, 2))) {
        test.done(miss());
    } else {
        test.done(pass());
    }
}

})(WEBMODULE_IDIOM);

