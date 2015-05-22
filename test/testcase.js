var ModuleTestREPOSITORY_NAME = (function(global) {

global["BENCHMARK"] = false;

if (console && !console.table) {
    console.table = console.dir;
}

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

if (IN_BROWSER || IN_NW) {
    //test.add([]);
} else if (IN_WORKER) {
    //test.add([]);
} else if (IN_NODE) {
    //test.add([]);
}

// --- test cases ------------------------------------------
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

return test.run().clone();

})(GLOBAL);

