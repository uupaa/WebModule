#!/usr/bin/env node

var fs   = require("fs");
var cp   = require("child_process");
var json = JSON.parse(fs.readFileSync("./package.json", "utf8"));

//console.log("open " + json.url + "/wiki/");

cp.exec("open " + json.url + "/wiki/");

