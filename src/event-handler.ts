const EventEmitter = require("node:events");

const eventEmitter = new EventEmitter();

interface mapper {
  [key: string]: number;
}

interface arrayMapper {
  [key: string]: number[];
}

let startTime = 0;
let errorCount = 0;
let successCount = 0;
let avreageRunTimeDuration: mapper = {};
let avreageRunTimeCounter: mapper = {};
let runTimeArray: arrayMapper = {};

const formatMemoryUsage = (data: number) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;

const memoryData = process.memoryUsage();

const memoryUsage = {
  rss: `${formatMemoryUsage(memoryData.rss)} -> Resident Set Size - total memory allocated for the process execution`,
  heapTotal: `${formatMemoryUsage(memoryData.heapTotal)} -> total size of the allocated heap`,
  heapUsed: `${formatMemoryUsage(memoryData.heapUsed)} -> actual memory used during the execution`,
  external: `${formatMemoryUsage(memoryData.external)} -> V8 external memory`
};

eventEmitter.on("start", () => {
  startTime = Date.now();
  console.log(`started benchmark.. ${startTime}`);
});
eventEmitter.on("error", () => {
  errorCount++;
});
eventEmitter.on("success", (data: { type: string; time: number }) => {
  const { type, time } = data;
  avreageRunTimeDuration[type] = avreageRunTimeDuration[type] ? avreageRunTimeDuration[type] + time : time;
  avreageRunTimeCounter[type] = avreageRunTimeCounter[type] ? avreageRunTimeCounter[type] + 1 : 1;
  if (runTimeArray[type]) {
    runTimeArray[type].push(time);
  } else
    runTimeArray[type] = [time];
  successCount++;

});
eventEmitter.on("end", () => {
  console.log(`finish benchmark total time: ${Date.now() - startTime}`);
  process.exit(0);
});

eventEmitter.on("log", () => {
  console.log("--------------------------------- \n");
  console.log(`total error count: ${errorCount}`);
  console.log(`total success count: ${successCount}`);
  console.log(`average query run time: `);
  Object.keys(avreageRunTimeDuration).forEach((key) => {
      console.log(`${key}: ${avreageRunTimeDuration[key] / avreageRunTimeCounter[key]}`);
    }
  );
  Object.keys(memoryUsage).forEach((key) => {
    console.log(`${key}: ${memoryUsage[key]}`);
  });
  console.log("--------------------------------- \n");
});

eventEmitter.on("clear_warmup", () => {
  errorCount = 0;
  successCount = 0;
  avreageRunTimeDuration = {};
  avreageRunTimeCounter = {};
  runTimeArray = {};
  console.log("clearing warmup data to remove connection lags...");
  console.log("clearing warmup data to remove connection lags...");

});

export {
  eventEmitter
};