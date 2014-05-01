var ModuleTest = (function(global) {

var testParam = {
        disable:    false,
        node:       true,
        browser:    true,
        worker:     true,
        button:     true,
        both:       true,
        primary:    global["Zzz"],
        secondary:  global["Zzz_"],
    };

var items = [
        testZzz_value,
        testZzz_isNumber,
        testZzz_isInteger,
    ];

new Test(testParam).add(items).run();

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

return items;
})((this || 0).self || global);

