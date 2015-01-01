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

console.log( INFO + "  done." + CLR);

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

    json = upgradeXBuild(json);
    json = upgradeTarget(json);

    fs.writeFileSync(targetPackageJSON, JSON.stringify(json, null, 2));
}

function upgradeXBuild(json) {
    if (!("x-build" in json)) { return json; }

    console.log( INFO + "  upgrade x-build to webmodule..." + CLR);

    var build = json["x-build"];

    json.webmodule = {
        source: build.source,
        output: build.output,
        target: build.target,
        label: build.label,
    };
    delete json["x-build"];
    return json;
}

function upgradeTarget(json) {
// Before
//
//  "webmodule": {
//    "develop":      false,
//    "source":       ["lib/REPOSITORY_NAME.js"],       <- sprit this
//    "output":       "release/REPOSITORY_NAME.min.js", <- sprit this
//    "target":       ["all"],                          <- remove this
//    "label":        ["@dev"]
//  },
//
// After
//
//  "webmodule": {
//    "develop":      false,                            <- stay
//    "label":        ["@dev"],                         <- stay
//    "browser": {                                      <- add if target.has.browser
//      "source":     ["lib/REPOSITORY_NAME.js"],
//      "output":     "release/REPOSITORY_NAME.b.min.js",
//    },
//    "worker": {                                       <- add if target.has.worker
//      "source":     ["lib/REPOSITORY_NAME.js"],
//      "output":     "release/REPOSITORY_NAME.w.min.js",
//    },
//    "node": {                                         <- add if target.has.node
//      "source":     ["lib/REPOSITORY_NAME.js"],
//      "output":     "release/REPOSITORY_NAME.b.min.js",
//    }
//  },
//
    var wm = json["webmodule"];

    if (!("target" in wm)) { return json; }
    console.log( INFO + "  upgrade webmodule.target..." + CLR);

    var result = JSON.parse(JSON.stringify(json));

    result.webmodule = {
        develop: json.webmodule.develop || false,
        label:   json.webmodule.label   || ["@dev"]
    };

    var target = json.webmodule.target.join("");

    if ( /(all|browser)/i.test(target) ) {
        result.webmodule.browser = {
            source: json.webmodule.source,
            output: json.webmodule.output.replace(/.js$/, ".b.js")
        };
    }
    if ( /(all|worker)/i.test(target) ) {
        result.webmodule.worker = {
            source: json.webmodule.source,
            output: json.webmodule.output.replace(/.js$/, ".w.js")
        };
    }
    if ( /(all|node)/i.test(target) ) {
        result.webmodule.node = {
            source: json.webmodule.source,
            output: json.webmodule.output.replace(/.js$/, ".n.js")
        };
    }
    return result;
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

})((this || 0).self || global);

