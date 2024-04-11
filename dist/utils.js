"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    getRandomInt: function() {
        return getRandomInt;
    },
    invokeAsyncFunctionTimes: function() {
        return invokeAsyncFunctionTimes;
    },
    writeLogToFile: function() {
        return writeLogToFile;
    }
});
const _fs = /*#__PURE__*/ _interop_require_wildcard(require("fs"));
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
const filePath = `./logfile-${process.argv[2]}-${process.argv[3]}.log`;
function getRandomInt(min, max) {
    // Ensure the range is valid
    if (min > max) {
        throw new Error("Minimum value must be less than or equal to the maximum value.");
    }
    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function writeLogToFile(logMessage) {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${logMessage}\n`;
    _fs.appendFile(filePath, logEntry, (err)=>{
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
    if (logMessage.includes('exception')) {
        console.error(logMessage);
        process.exit(1);
    }
}
function invokeAsyncFunctionTimes(func, times) {
    const promises = [];
    for(let i = 0; i < times; i++){
        promises.push(func);
    }
    return promises;
}

//# sourceMappingURL=utils.js.map