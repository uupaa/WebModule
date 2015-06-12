#!/usr/bin/env node

var cp          = require("child_process");
var sourceDir   = process.argv[1].split("/").slice(0, -2).join("/") + "/";
var json        = require(sourceDir + "package.json");

cp.exec("open " + json.url + "/wiki/");

