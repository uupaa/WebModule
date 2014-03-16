new Test().add([
        testZzz_value,
        testZzz_isNumber,
        testZzz_isInteger,
    ]).run(function(err, test) {
        if (1) {
            err || test.worker(function(err, test) {
                if (!err && typeof Zzz_ !== "undefined") {
                    var name = Test.swap(Zzz, Zzz_);

                    new Test(test).run(function(err, test) {
                        Test.undo(name);
                    });
                }
            });
        }
    });

function testZzz_value(next) {

    var result = new Zzz(123.4).value();

    if (result !== 123.4) {
        console.log("testZzz_value ng");
        next && next.miss(); // see Task.js
    } else {
        console.log("testZzz_value ok");
        next && next.pass(); // see Task.js
    }
}

function testZzz_isNumber(next) {

    var result = [
            new Zzz(123.4).isNumber(),  // true
            new Zzz(123.0).isNumber()   // true
        ];

    if (/false/.test(result.join())) {
        console.log("testZzz_isNumber ng");
        next && next.miss();
    } else {
        console.log("testZzz_isNumber ok");
        next && next.pass();
    }
}

function testZzz_isInteger(next) {

    var result = [
           !new Zzz(123.4).isInteger(), // !false -> true
            new Zzz(123.0).isInteger()  // true
        ];

    if (/false/.test(result.join())) {
        console.log("testZzz_isInteger ng");
        next && next.miss();
    } else {
        console.log("testZzz_isInteger ok");
        next && next.pass();
    }
}

