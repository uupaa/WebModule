var ModuleTest<<REPOSITORY_NAME>> = (function(global) {

global["BENCHMARK"] = false;

var test = new Test("<<REPOSITORY_NAME>>", {
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     true,  // enable worker test.
        node:       true,  // enable node test.
        nw:         true,  // enable nw.js test.
        el:         true,  // enable electron (render process) test.
        button:     true,  // show button.
        both:       true,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
        callback:   function() {
        },
        errorback:  function(error) {
            console.error(error.message);
        }
    }).add([
        // Generic test
        test<<REPOSITORY_NAME>>_value,
        test<<REPOSITORY_NAME>>_concat,
    ]);

if (IN_BROWSER || IN_NW || IN_EL) {
    test.add([
        // Browser, NW.js and Electron test
    ]);
} else if (IN_WORKER) {
    test.add([
        // WebWorkers test
    ]);
} else if (IN_NODE) {
    test.add([
        // Node.js test
    ]);
}

// --- test cases ------------------------------------------
function test<<REPOSITORY_NAME>>_value(test, pass, miss) {

    var instance = new WebModule.<<REPOSITORY_NAME>>("a");

    if (instance.value === "a") {
        instance.value = "b";

        if (instance.value === "b") {
            test.done(pass());
            return;
        }
    }
    test.done(miss());
}

function test<<REPOSITORY_NAME>>_concat(test, pass, miss) {

    var result = {
            0: new WebModule.<<REPOSITORY_NAME>>(   ).concat("a") === "a", // true
            1: new WebModule.<<REPOSITORY_NAME>>("b").concat("b") === "bb" // true
        };

    if ( /false/.test(JSON.stringify(result)) ) {
        test.done(miss());
    } else {
        test.done(pass());
    }
}

return test.run();

})(GLOBAL);

