var ModuleTest<<REPOSITORY_NAME>> = (function(global) {

var test = new Test(["<<REPOSITORY_NAME>>"], { // Add the ModuleName to be tested here (if necessary).
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
    });

if (IN_BROWSER || IN_NW || IN_EL || IN_WORKER || IN_NODE) {
    test.add([
        test<<REPOSITORY_NAME>>_method,
        test<<REPOSITORY_NAME>>_accessor,
    ]);
}
if (IN_BROWSER || IN_NW || IN_EL) {
    test.add([
    ]);
}
if (IN_WORKER) {
    test.add([
    ]);
}
if (IN_NODE) {
    test.add([
    ]);
}

// --- test cases ------------------------------------------
function test<<REPOSITORY_NAME>>_method(test, pass, miss) {

    var result = {
            0: new WebModule.<<REPOSITORY_NAME>>().method("a", "b") === "ab", // true
        };

    if ( /false/.test(JSON.stringify(result)) ) {
        test.done(miss());
    } else {
        test.done(pass());
    }
}

function test<<REPOSITORY_NAME>>_accessor(test, pass, miss) {

    var instance = new WebModule.<<REPOSITORY_NAME>>();
    instance.value = "a"; // setter

    if (instance.value === "a") { // getter
        test.done(pass());
    } else {
        test.done(miss());
    }
}

return test.run();

})(GLOBAL);

