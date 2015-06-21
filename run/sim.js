#!/usr/bin/env node

(function(global) {

var SIM_OPEN        = "xcrun simctl openurl __UUID__ __URL__";
var SIM_ENUM_DEVICE = "xcrun simctl list | grep -v com";
var SIM_START       = "xcrun instruments -w __UUID__";
//var SIM_SHUTDOWN  = "xcrun simctl shutdown ";
var KILL_SIM_PROCESS = "kill `ps -e | grep 'iOS Simulator' | grep -v 'grep' | awk '{print $1}'`";
// --- console colors ---
var ERR  = "\u001b[31m"; // RED
var WARN = "\u001b[33m"; // YELLOW
var INFO = "\u001b[32m"; // GREEN
var CLR  = "\u001b[0m";  // WHITE
var LB   = "\n";         // line break

var cp = require("child_process");
var argv = process.argv.slice(2);
var options = { verbose: true };

if (argv[0] === "stop") {
    cp.exec(KILL_SIM_PROCESS);
} else {
    start(open);
}

function start(next) {
    _enumDevieceList(function(deviceList, bootedDeviceUUID) {
        if (bootedDeviceUUID) {
            next();
        } else {
            var uuid = deviceList["iPhone 5s"].uuid;

            cp.exec(SIM_START.replace("__UUID__", uuid), function(err, stdout, stderr) {
                if (options.verbose) {
                    console.log(INFO + stdout + CLR);
                }
                setTimeout(function() {
                    next();
                }, 3000); // lazy
            });
        }
    });
}

function open() {
    _enumDevieceList(function(deviceList, bootedDeviceUUID) {
        if (bootedDeviceUUID) {
            var url = argv[0];

            cp.exec(SIM_OPEN.replace("__UUID__", bootedDeviceUUID).
                             replace("__URL__", url), function(err, stdout, stderr) {
                if (options.verbose) {
                    console.log(INFO + stdout + CLR);
                    //console.log(ERR  + stderr + CLR);
                }
            });
        } else {
            if (options.verbose) {
                console.log(WARN + "Page open fail. because iOS Simulator shutdown." + CLR);
                console.log(WARN + "Please try again after waiting for a while." + CLR);
            }
        }
    });
}

// enum iOS Simulator devices
function _enumDevieceList(callback) {
    cp.exec(SIM_ENUM_DEVICE, function(err, stdout, stderr) {

        // iPhone 5 (E6AA0287-6C06-4F03-A61E-C96B75B587CD) (Booted)
        // ~~~~~~~~  ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~   ~~~~~~ 
        //   name                  uuid                      state

        var lines = (stdout || "").trim();
        var deviceList = {};
        var bootedDeviceUUID = "";

        lines.split("\n").forEach(function(line) {
            if (/(iPhone|iPad|iPod)/.test(line)) {
                if (/unavailable/.test(line)) { return; }

                var name = line.split("(")[0].trim();
                var uuid = line.split("(")[1].split(")")[0].trim();
                var state = line.split("(")[2].split(")")[0].trim();

                deviceList[name] = { uuid: uuid, state: state };

                if (state === "Booted") {
                    bootedDeviceUUID = uuid;
                }
            }
        });
        callback(deviceList, bootedDeviceUUID);
    });
}

})(GLOBAL);

