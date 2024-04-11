const filePath = `./logfile-${process.argv[2]}-${process.argv[3]}.log`;
import * as fs from "fs";

export function getRandomInt(min: number, max: number): number {
    // Ensure the range is valid
    if (min > max) {
        throw new Error("Minimum value must be less than or equal to the maximum value.");
    }

    // The maximum is exclusive and the minimum is inclusive
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
export function writeLogToFile(logMessage: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp}: ${logMessage}\n`;

    fs.appendFile(filePath, logEntry, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });

    if(logMessage.includes('exception')) {
        console.error(logMessage);
        process.exit(1);
    }

}
export function invokeAsyncFunctionTimes(func: () => Promise<any>, times: number) {
    const promises :(() => Promise<any>)[] = [];
    for (let i = 0; i < times; i++) {
        promises.push(func);
    }

    return promises;
}
