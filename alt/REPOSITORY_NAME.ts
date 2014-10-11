export class REPOSITORY_NAME {
    static name = "REPOSITORY_NAME";
    static repository = "https://github.com/GITHUB_USER_NAME/REPOSITORY_NAME.js";

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

