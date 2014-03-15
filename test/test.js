new Test().add([
        testZzz,
    ]).run().worker(function(err, test) {
        if (!err && typeof Zzz_ !== "undefined") {
            var name = Test.swap(Zzz, Zzz_);

            new Test(test).run(function(err, test) {
                Test.undo(name);
            });
        }
    });

function testZzz(next) {

    if (true) {
        console.log("testXxx ok");
        next && next.pass();
    } else {
        console.log("testXxx ng");
        next && next.miss();
    }
}

