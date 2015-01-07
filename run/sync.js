#!/usr/bin/env node

(function(global) {

// --- console colors ---
var ERR  = "\u001b[31m"; // RED
var WARN = "\u001b[33m"; // YELLOW
var INFO = "\u001b[32m"; // GREEN
var CLR  = "\u001b[0m";  // WHITE
var LB   = "\n";         // line break

var fs       = require("fs");
var cp       = require("child_process");
var readline = require("readline");
var wmlib    = process.argv[1].split("/").slice(0, -2).join("/") + "/lib/"; // "WebModule/lib/"
var mod      = require(wmlib + "Module.js");
var Task     = require(wmlib + "Task.js");
var argv     = process.argv.slice(2);

var repositoryFullName = process.cwd().split("/").pop();
var repositoryName     = repositoryFullName.indexOf(".") >= 0
                       ? repositoryFullName.split(".").slice(0, -1).join(".")
                       : repositoryFullName;

var sourceDir          = process.argv[1].split("/").slice(0, -2).join("/") + "/";
var targetDir          = process.cwd() + "/";
var sourcePacakgeJSON  = sourceDir + "MODULE_package.json";
var targetPackageJSON  = targetDir + "package.json";

console.log( INFO + "  - repositoryFullName:  " + repositoryFullName + CLR );       // "Foo.js"
console.log( INFO + "  - repositoryName:      " + repositoryName     + CLR );       // "Foo"
console.log( INFO + "  - copy source dir:     " + sourceDir          + CLR );       // "/Users/uupaa/oss/WebModule/"
console.log( INFO + "  - copy target dir:     " + targetDir          + CLR );       // "/Users/uupaa/oss/Foo.js/"
console.log( INFO + "  - source package.json: " + sourcePacakgeJSON  + CLR );       // "/Users/uupaa/oss/my/WebModule/MODULE_package.json"
console.log( INFO + "  - target package.json: " + targetPackageJSON  + CLR + LB );  // "/Users/uupaa/oss/my/Foo.js/package.json"

sync();
upgrade();
sortKeys();
prettyPrint();
buildWMTools("./test/wmtools.js");
migrateSourceCode();

console.log("  done.");

function buildWMTools(output) { // @arg PathString
    var libs = ["Reflection.js", "Console.js", "Valid.js", "Help.js", "Task.js", "Test.js"];
    var dir = "../WebModule/lib/";
    var js = libs.map(function(lib) {
            return fs.readFileSync(dir + lib, "UTF-8")
        }).join("\n");

    js = "// ['" + libs.join("', '") + "'].join()\n\n" + js;

    // overwrite if there is a difference in the old file.
    if (fs.existsSync(output)) {
        var oldjs = fs.readFileSync(output, "UTF-8");

        if (oldjs !== js) {
            fs.writeFileSync(output, js); // overwrite
        }
    } else {
        fs.writeFileSync(output, js);
    }
}

function prettyPrint() {
    var json = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));
    var txt = JSON.stringify(json, null, 2);

    txt = txt.replace(/: \[([^\]]*)\],/g, function(_, items) {
        return ': [' + items.trim().replace(/\s*\n+\s*/g, " ") + '],';
    });

    fs.writeFileSync(targetPackageJSON, txt);
}

// WebModule/MODULE_package.json sync to YOURWebModule/package.json
function sync() {
    var srcJSON = JSON.parse(fs.readFileSync(sourcePacakgeJSON, "UTF-8").replace(/REPOSITORY_FULLNAME/g, repositoryFullName));
    var tgtJSON = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));

    tgtJSON.scripts = srcJSON.scripts;

    fs.writeFileSync(targetPackageJSON, JSON.stringify(tgtJSON, null, 2));
}

// package.json convert "x-build": { ... } to "webmodule": { ... }
function upgrade() {
    var json = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));

    json = mod.upgradePackageJSON(json);

    fs.writeFileSync(targetPackageJSON, JSON.stringify(json, null, 2));
}

function sortKeys() {
    var json = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));
    var order = ["name", "version", "description", "url", "keywords",
                 "repository", "scripts", "webmodule",
                 "dependencies", "devDependencies", "lib", "main",
                 "author", "license", "contributors"];

    var keys = Object.keys(json).sort(function(a, b) {
        var pos1 = order.indexOf(a);
        var pos2 = order.indexOf(b);

        if (pos1 < 0) { pos1 = 999; }
        if (pos2 < 0) { pos2 = 999; }

        return pos1 - pos2;
    });

    var result = {};
    keys.forEach(function(key) {
        result[key] = json[key];
    });

    fs.writeFileSync(targetPackageJSON, JSON.stringify(result, null, 2));
}

function migrateSourceCode() {
    var DEPRECATED_CODES = {
            "NODE":     /_runOnNode\s*\=\s*"process" in global/,
            "WORKER":   /_runOnWorker\s*\=\s*"WorkerLocation" in global/,
            "BROWSER":  /_runOnBrowser\s*\=\s*"document" in global/,
            "EXPORTS":  /if\s*\("process" in global\)\s*\{/
        };

    var json = JSON.parse(fs.readFileSync(targetPackageJSON, "UTF-8"));
    var sources = ["test/testcase.js"];

    for (var key in json.webmodule) { // develop, label, browser, worker, node, nw, ...
        switch (key) {
        case "browser":
        case "worker":
        case "node":
        case "nw":
            sources = sources.concat(json.webmodule[key].source);
            break;
        }
    }
    sources = mod.toUniqueArray(sources);
    if (sources.length) {
        sources.forEach(function(file) {
            var js = fs.readFileSync(file, "UTF-8");

            dumpDeprecatedCode(file, js, DEPRECATED_CODES.NODE);
            dumpDeprecatedCode(file, js, DEPRECATED_CODES.WORKER);
            dumpDeprecatedCode(file, js, DEPRECATED_CODES.BROWSER);
            dumpDeprecatedCode(file, js, DEPRECATED_CODES.EXPORTS);
        });
    }

    function dumpDeprecatedCode(file, js, rex) {
        if (rex.test(js)) {
            js.split("\n").forEach(function(line, index) {
                if (rex.test(line)) {
                    console.log(WARN + "  Found deprecated code( " + file + ":" + index + " )" +
                                "\t" + rex.source.replace(/\\s\*/g, " ").replace(/\\/g, "") + CLR);

                }
            });
        }
    }
}

})((this || 0).self || global);

