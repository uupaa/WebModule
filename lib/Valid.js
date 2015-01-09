// Valid.js
(function(global) {
"use strict";

// --- dependency modules ----------------------------------
// --- define / local variables ----------------------------
//var _isNodeOrNodeWebKit = !!global.global;
//var _runOnNodeWebKit =  _isNodeOrNodeWebKit &&  /native/.test(setTimeout);
//var _runOnNode       =  _isNodeOrNodeWebKit && !/native/.test(setTimeout);
//var _runOnWorker     = !_isNodeOrNodeWebKit && "WorkerLocation" in global;
//var _runOnBrowser    = !_isNodeOrNodeWebKit && "document" in global;

var TYPED_ARRAYS = [
        "Int8Array", "Uint8Array", "Uint8ClampedArray",
        "Int16Array", "Uint16Array",
        "Int32Array", "Uint32Array",
        "Float32Array", "Float64Array"
    ];
var SPLITTER = /,|\x7c|\x2f/; // Value.keys(value, "a,b|c/d")
var TYPE_SYNONYMS = {
        //informal  formal
        "omit":     "Omit",
        "null":     "Null",
        "void":     "Undefined",
        "Void":     "Undefined",
        "undefined":"Undefined",
        "INTEGER":  "Integer",
        "INT32":    "Int32",
        "INT16":    "Int16",
        "INT8":     "Int8",
        "UINT32":   "Uint32",
        "UINT16":   "Uint16",
        "UINT8":    "Uint8",
        "percent":  "Percent",
    };
var _hook = {}; // { type: callback, ... }

// --- class / interfaces ----------------------------------
function Valid(value,       // @arg Boolean
               api,         // @arg Function
               highlihgt) { // @arg String = ""
    if (!value) {
        if (global["Help"]) {
            global["Help"](api, highlihgt || "");
        }
        throw new Error("Validation Error: " + api["name"] + "(" + highlihgt + ") is invalid value.");
    }
}

//{@dev
Valid["repository"] = "https://github.com/uupaa/Valid.js";
//}@dev

Valid["args"]  = Valid_args;  // Valid.args(api:Function, args:Array|ArrayLike):void
Valid["type"]  = Valid_type;  // Valid.type(value:Any, types:String):Boolean
Valid["some"]  = Valid_some;  // Valid.some(value:String|null|undefined, candidate:String|Object, ignoreCase:Boolean = false):Boolean
Valid["keys"]  = Valid_keys;  // Valid.keys(value:Object|null|undefined, keys:String):Boolean
Valid["json"]  = Valid_json;  // Valid.json(json:Object, scheme:Object):Boolean
Valid["stack"] = Valid_stack; // Valid.stack(message:String = "", depth:Integer = 3):String

// --- extension ---
Valid["register"]     = Valid_register;     // Valid.register(type:HookTypeString, callback:Function):void
Valid["unregister"]   = Valid_unregister;   // Valid.unregister(type:HookTypeString):void
Valid["isRegistered"] = Valid_isRegistered; // Valid.isRegistered(type:HookTypeString):Boolean

// --- implements ------------------------------------------
function Valid_args(api,    // @arg Function
                    args) { // @arg Array|ArrayLike
    if (global["Reflection"]) {
        global["Reflection"]["getFunctionAttribute"](api, "arg")["arg"].forEach(function(item, index) {
            var type = item["type"];

            if (item["optional"]) {
                type += "|omit";
            }
            if ( !Valid_type(args[index], type) ) {
                if (global["Help"]) {
                    global["Help"](api, item["name"]);
                }
                throw new Error(api["name"] + "(" + item["name"] + ") is invalid type.");
            }
        });
    }
}

function Valid_type(value,   // @arg Any
                    types) { // @arg TypeNameString - "Type1", "Type1|Type2|omit"
                             //        NativeTypeNameString:  Array, Number, null ...
                             //        SpecialTypeNameString: Integer, TypedArray, omit ...
                             //        ComplexTypeNameString: URLString, FunctionArray ...
                             // @ret Boolean
    if (arguments.length >= 3) {
        throw new Error("The maximum length of Valid.type arguments are 2.");
    }
    return types.split(SPLITTER).some(_some);

    function _some(type) { // @arg NativeTypeNameString|SpecialTypeNameString|ComplexTypeNameString
                           // @ret Boolean
        type = TYPE_SYNONYMS[type] || type;

        // --- special keywords ---
        switch (type) {
        case "Any":         return true;
        case "this":        return value instanceof global[_getBaseClassName(value)];
        case "Omit":        return value === null || value === undefined;
        case "TypedArray":  return _isTypedArray(value);
        case "Null":        return value === null;
        case "Undefined":   return value === undefined;
        case "Array":       return Array.isArray(value);
        case "Object":      return (value || 0).constructor === ({}).constructor;
        case "FunctionArray":
                            return Array.isArray(value) && _isFunctionArray(value);
        case "Percent":     return typeof value === "number" && value >= 0.0 && value <= 1.0;
        // --- integer ---
        case "Integer":     return _isInt(value);
        case "Int32":       return _isInt(value)  && value <= 0x7fffffff && value >= -0x80000000;
        case "Int16":       return _isInt(value)  && value <= 0x7fff     && value >= -0x8000;
        case "Int8":        return _isInt(value)  && value <= 0x7f       && value >= -0x80;
        case "Uint32":      return _isUint(value) && value <= 0xffffffff;
        case "Uint16":      return _isUint(value) && value <= 0xffff;
        case "Uint8":       return _isUint(value) && value <= 0xff;
        // --- color ---
        case "AARRGGBB":
        case "RRGGBBAA":    return _isUint(value) && value <= 0xffffffff; // Uint32
        case "RRGGBB":      return _isUint(value) && value <= 0xffffff;   // Uint24
        // --- postMessage ---
        case "TransferableObject":
                            return _isArrayBuffer(value) ||
                                   _isCanvasProxy(value) ||
                                   _isMessagePort(value);
        case "TransferableObjects":
        case "TransferableObjectArray":
                            return _isTransferableObjects(value);
        }
        if (value === null || value === undefined) {
            return false;
        }

        var constructorName = _getConstructorName(value);
        var baseClassName   = _getBaseClassName(value);

        if (constructorName === type || baseClassName === type) {
            return true;
        }
        if (type in global) { // Is this global Class?
            return baseClassName === type;
        }

        // Valid.register(type) matching
        if (type in _hook) {
            return _hook[type](type, value);
        }

        // greedy complex type matching
        //
        //      "FooIntegerIDString" in global -> false
        //         "IntegerIDString" in global -> false
        //                "IDString" in global -> false
        //                  "String" in global -> true
        //
        var token = _splitComplexTypeName(type);

        if (token.length > 1) {
            for (var i = 0, iz = token.length; i < iz; ++i) {
                var compositeTypes = token.slice(i).join("");

                if (compositeTypes in global) {
                    return _some(compositeTypes);
                }
            }
        }
        return false;
    }

    function _isInt(value) {
        return typeof value === "number" && Math.ceil(value) === value;
    }
    function _isUint(value) {
        return typeof value === "number" && Math.ceil(value) === value && value >= 0;
    }
}

function _splitComplexTypeName(type) { // @arg PascalCaseString - "FooIntegerIDString"
                                       // @ret StringArray      - ["Foo", "Integer", "ID", "String"]
    var token = [];

    type.replace(/([A-Z]+)[a-z0-9]+/g, function(_, a) {
        if (a.length === 1) {
            // "String" -> { _: "String", a: "S" }
            token.push(_);
        } else {
            // "IDString" -> { _: "IDString", a: "IDS" }
            token.push( _.slice(0, a.length - 1) ); // "ID"
            token.push( _.slice(a.length - 1) );    // "String"
        }
    });
    return token;
}

function _getBaseClassName(value) { // @arg Any
                                    // @ret String
    // Object.prototype.toString.call(new Error());     -> "[object Error]"
    // Object.prototype.toString.call(new TypeError()); -> "[object Error]"
    return Object.prototype.toString.call(value).split(" ")[1].slice(0, -1); // -> "Error"
}

function _getConstructorName(value) { // @arg Any - instance, exclude null and undefined.
                                      // @ret String
    // _getConstructorName(new (function Aaa() {})); -> "Aaa"
    return value.constructor["name"] ||
          (value.constructor + "").split(" ")[1].split("\x28")[0]; // for IE
}

function _isTypedArray(value) { // @arg Any
                                // @ret Boolean
    var className = _getBaseClassName(value).toLowerCase();

    return TYPED_ARRAYS.some(function(typeName) {
                return className === typeName.toLowerCase();
            });
}

function _isTransferableObjects(value) { // @arg Any
    if (Array.isArray(value)) {
        return value.some(function(v) {
            return _isArrayBuffer(v) || _isCanvasProxy(v) || _isMessagePort(v);
        });
    }
    return false;
}
function _isArrayBuffer(value) {
    if (global["ArrayBuffer"]) {
        return value instanceof global["ArrayBuffer"];
    }
    return false;
}
function _isCanvasProxy(value) {
    if (global["CanvasProxy"]) {
        return value instanceof global["CanvasProxy"];
    }
    return false;
}
function _isMessagePort(value) {
    if (global["MessagePort"]) {
        return value instanceof global["MessagePort"];
    }
    return false;
}
function _isFunctionArray(value) {
    return value.every(function(fn) {
        return typeof fn === "function";
    });
}

function Valid_some(value,        // @arg String|null|undefined - "a"
                    candidate,    // @arg Object|String - "a|b|c"
                    ignoreCase) { // @arg Boolean = false
                                  // @ret Boolean - true -> has, false -> has not
    ignoreCase = ignoreCase || false;

    if (value === null || value === undefined) {
        return true; // [!]
    }
    var keys = typeof candidate === "string"              ? candidate.split(SPLITTER)
             : candidate.constructor === ({}).constructor ? Object.keys(candidate)
             : [];

    if (ignoreCase) {
        value = value.toLowerCase();
    }
    return keys.some(function(token) {
        if (ignoreCase) {
            return value === token.toLowerCase();
        }
        return value === token;
    });
}

function Valid_keys(value,  // @arg Object|null|undefined - { key1, key2 }
                    keys) { // @arg String - valid choices. "a,b" or "a|b" or "a/b"
                            // @ret Boolean - false is invalid value.
    if (value === null || value === undefined) {
        return true; // [!]
    }
    if (value.constructor === ({}).constructor) {
        var items = keys.replace(/ /g, "").split(SPLITTER);

        return Object.keys(value).every(function(key) {
            return items.indexOf(key) >= 0;
        });
    }
    return false;
}

function Valid_json(json,     // @arg JSONObject
                    scheme) { // @arg JSONObject
                              // @ret Boolean - false is invalid.
    var rv = _json(json, scheme, "");

    if (rv) {
        return true;
    }
    console.log("json: " + JSON.stringify(json, null, 2));
    console.log("scheme: " + JSON.stringify(scheme, null, 2));
    return false;
}

function _json(json, scheme, path) {
    path = path || "";
    return Object.keys(scheme).every(function(schemeKey) {
        var schemeType = Object.prototype.toString.call(scheme[schemeKey]).slice(8, -1);

        if (schemeKey in json) {
            if ( !Valid_type(json[schemeKey], schemeType) ) {
                console.error("Valid.json type missmatch: " + path + schemeKey + " is not " + schemeType);
                return false;
            } else if (schemeType === "Object" || schemeType === "Array") {
                return _json(json[schemeKey], scheme[schemeKey], path + schemeKey + ".");
            }
            return true;
        }
        console.error("Valid.json unknown property: " + path + schemeKey);
        return false;
    });
}

function Valid_stack(message, // @arg String = ""
                     depth) { // @arg Integer = 3
    depth = depth || 3;
    var rv = "";

    try {
        throw new Error();
    } catch (o_o) {
        rv = (message || "") + "\n" +
             o_o.stack.split("\n").slice(depth).join("\n");
    }
    return rv;
}

function Valid_register(type,       // @arg HookTypeString
                        callback) { // @arg Function - callback(type, value):Boolean
    _hook[type] = callback;
}

function Valid_unregister(type) { // @arg HookTypeString
    delete _hook[type];
}

function Valid_isRegistered(type) { // @arg HookTypeString
                                    // @ret Boolean
    return type in _hook;
}

// --- validate / assertions -------------------------------
//{@dev
//function $valid(val, fn, hint) { if (global["Valid"]) { global["Valid"](val, fn, hint); } }
//function $type(obj, type) { return global["Valid"] ? global["Valid"].type(obj, type) : true; }
//function $keys(obj, str) { return global["Valid"] ? global["Valid"].keys(obj, str) : true; }
//function $some(val, str, ignore) { return global["Valid"] ? global["Valid"].some(val, str, ignore) : true; }
//function $args(fn, args) { if (global["Valid"]) { global["Valid"].args(fn, args); } }
//}@dev

// --- exports ---------------------------------------------
if (typeof module !== "undefined") {
    module["exports"] = Valid;
}
global["Valid"] = Valid;

})((this || 0).self || global);

