#!/usr/bin/env node

(function(global) {

// --- console colors ---
var ERR  = "\u001b[31m"; // RED
var WARN = "\u001b[33m"; // YELLOW
var INFO = "\u001b[32m"; // GREEN
var CLR  = "\u001b[0m";  // WHITE
var LB   = "\n";         // line break

var GREP_BOOTED_DEVICE = "xcrun simctl list | grep Booted";
var SHUTDOWN           = "xcrun simctl shutdown ";

var cp = require("child_process");
var options = { verbose: true };

_getUUID(GREP_BOOTED_DEVICE, function(uuid) {
    if (uuid) {
        cp.exec(SHUTDOWN + uuid, function() {});
    }
});

function _getUUID(command, callback) {
    cp.exec(command, function(err, stdout, stderr) {

        // iPhone 5 (E6AA0287-6C06-4F03-A61E-C96B75B587CD) (Booted)
        //           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        //                         UUID

        var uuid = 0;
        var line = (stdout || "").trim();

        if (options.verbose) {
            console.log(INFO + line + CLR);
        }

        if (!err && line) {
            uuid = line.split(")")[0].split("(")[1]; // E6AA0287-6C06-4F03-A61E-C96B75B587CD
        }
        callback(uuid);
    });
}

})((this || 0).self || global);


