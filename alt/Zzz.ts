// @name: Zzz.js

export class Zzz {
    static name = "Zzz";
    static repository = "https://github.com/uupaa/Zzz.js";

    _value: number;

    constructor(value:number) {
        this._value = value;
    }
    value():number {
        return this._value;
    }
    isNumber():boolean {
        return typeof this._value === "number";
    }
    isInteger():boolean {
        return typeof this._value === "number" &&
               Math.ceil(this._value) === this._value;
    }
}

