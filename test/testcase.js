var ModuleTestREPOSITORY_NAME = (function(global) {

var _isNodeOrNodeWebKit = !!global.global;
var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

var test = new Test("REPOSITORY_NAME", {
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     true,  // enable worker test.
        node:       true,  // enable node test.
        nw:         true,  // enable nw.js test.
        button:     true,  // show button.
        both:       true,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
    }).add([
        testREPOSITORY_NAME_value,
        testREPOSITORY_NAME_concat,
        testREPOSITORY_NAME_concat$,
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

    var instance = new REPOSITORY_NAME("a");

    if (instance.value === "a") {
        instance.value = "b";

        if (instance.value === "b") {
            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

function testREPOSITORY_NAME_concat(test, pass, miss) {

    var result = {
            0: new REPOSITORY_NAME(   ).concat("a") === "a", // true
            1: new REPOSITORY_NAME("b").concat("b") === "bb" // true
        };

    if (/false/.test(JSON.stringify(result, null, 2))) {
        test.done(miss());
    } else {
        test.done(pass());
    }
}

function testREPOSITORY_NAME_concat$(test, pass, miss) {

    var result = {
            0: new REPOSITORY_NAME(   ).concat$("a").value === "a", // true
            1: new REPOSITORY_NAME("b").concat$("b").value === "bb" // true
        };

    if (/false/.test(JSON.stringify(result, null, 2))) {
        test.done(miss());
    } else {
        test.done(pass());
    }
}

})(WEBMODULE_IDIOM);

