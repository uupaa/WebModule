#!/usr/bin/env node

(function(global) {

// --- console colors ---
var ERR  = "\u001b[31m"; // RED
var WARN = "\u001b[33m"; // YELLOW
var INFO = "\u001b[32m"; // GREEN
var CLR  = "\u001b[0m";  // WHITE
var LB   = "\n";         // line break

var GREP_DEVICE   = "xcrun simctl list | grep -v com | grep iPhone\\ 5s";
var START         = "xcrun instruments -w ";
var TEMPLATE_FILE = "/Applications/Xcode.app/Contents/Applications/Instruments.app/Contents/PlugIns/AutomationInstrument.xrplugin/Contents/Resources/Automation.tracetemplate";

var cp = require("child_process");
var options = { verbose: true };

_getUUID(GREP_DEVICE, function(uuid) {
    cp.exec(START + uuid + " -t " + TEMPLATE_FILE, function(err, stdout, stderr) {
        if (options.verbose) {
            console.log(INFO + stdout + CLR);
            //console.log(ERR  + stderr + CLR);
        }
    });
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

