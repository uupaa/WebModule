#!/usr/bin/env node

var fs                 = require("fs");
var readline           = require("readline");
var childProcess       = require("child_process");
var Task               = require("uupaa.task.js");
var argv               = process.argv.slice(2);

var repositoryFullName = process.cwd().split("/").pop();
var repositoryName     = repositoryFullName.indexOf(".") >= 0
                       ? repositoryFullName.split(".").slice(0, -1).join(".")
                       : repositoryFullName;

var fromDir            = process.argv[1].split("/").slice(0, -1).join("/") + "/";
var toDir              = process.cwd() + "/";

// console.log( "repositoryFullName: " + repositoryFullName  ); // "Foo.js"
// console.log( "repositoryName:     " + repositoryName      ); // "Foo"
// console.log( "fromDir:            " + fromDir             ); // "/Users/uupaa/oss/WebModule/"
// console.log( "toDir:              " + toDir               ); // "/Users/uupaa/oss/Foo.js"

var file = toDir + "/package.json";
var json = JSON.parse(fs.readFileSync(file, "UTF-8"));

argv.forEach(function(module) {
    var target = json.dependencies;

    if (module in target) {
        delete target[module]; // remove key
    } else {
        //
    }
});

fs.writeFileSync(file, JSON.stringify(json, null, 2));

