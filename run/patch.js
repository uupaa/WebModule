#!/usr/bin/env node

(function(global) {

var CONSOLE_COLOR = {
        RED:    "\u001b[31m",
        YELLOW: "\u001b[33m",
        GREEN:  "\u001b[32m",
        CLEAR:  "\u001b[0m"
    };

var fs = require("fs");

patch(process.cwd() + "/" + "package.json");

function patch(file) {
    var packagejson1 = fs.readFileSync(file, "UTF-8");
    var packagejson2 = packagejson1.replace(/"version":(\s+)"(\d+)\.(\d+)\.(\d+)"/, function(_, space, major, minor, patch) {
                return '"version":' + space + '"' + major + "." + minor + "." + (parseInt(patch, 10) + 1) + '"';
            });

    var json1 = JSON.parse(packagejson1);
    var json2 = JSON.parse(packagejson2);
    var version1 = parseInt(json1.version.split(".")[2] || 0, 10);
    var version2 = parseInt(json2.version.split(".")[2] || 0, 10);

    if (version1 + 1 === version2) {
        console.log("update patch version. " + json1.version + " -> " + json2.version);
        fs.writeFileSync(file, packagejson2);
        //console.log( fs.readFileSync(file, "UTF-8") );
    } else {
        console.error("format error.");
    }
}

})((this || 0).self || global);

