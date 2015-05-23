#!/usr/bin/env node

(function(global) {

// alt/ ディレクトリ以下のファイルを検索し、
// 各ファイルを個別に es6 から es5 にダウンコンパイルした結果を lib/ 以下に出力します

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
var mod      = require(wmlib + "ModuleSystem.js");
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

// TODO: impl

})(GLOBAL);

