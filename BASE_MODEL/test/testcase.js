var ModuleTest<<REPOSITORY_NAME>> = (function(global) {

global["BENCHMARK"] = false;

var test = new Test("<<REPOSITORY_NAME>>", {
        disable:    false, // disable all tests.
        browser:    true,  // enable browser test.
        worker:     true,  // enable worker test.
        node:       true,  // enable node test.
        nw:         true,  // enable nw.js test.
        button:     true,  // show button.
        both:       true,  // test the primary and secondary modules.
        ignoreError:false, // ignore error.
        callback:   function() {
        },
        errorback:  function(error) {
        }
    }).add([
        // generic test
        test<<REPOSITORY_NAME>>_value,
        test<<REPOSITORY_NAME>>_concat,
    ]);

if (IN_BROWSER || IN_NW) {
    test.add([
        // browser and node-webkit test
    ]);
} else if (IN_WORKER) {
    test.add([
        // worker test
    ]);
} else if (IN_NODE) {
    test.add([
        // node.js and io.js test
    ]);
}

// --- test cases ------------------------------------------
function test<<REPOSITORY_NAME>>_value(test, pass, miss) {

    var instance = new <<REPOSITORY_NAME>>("a");

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
            0: new <<REPOSITORY_NAME>>(   ).concat("a") === "a", // true
            1: new <<REPOSITORY_NAME>>("b").concat("b") === "bb" // true
        };

    if ( /false/.test(JSON.stringify(result)) ) {
        test.done(miss());
    } else {
        test.done(pass());
    }
}

return test.run();

})(GLOBAL);

