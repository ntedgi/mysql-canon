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
    connectAndQuery: function() {
        return connectAndQuery;
    },
    executeTransaction: function() {
        return executeTransaction;
    }
});
const _promise = /*#__PURE__*/ _interop_require_default(require("mysql2/promise"));
const _utils = require("./utils");
const _eventhandler = require("./event-handler");
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
const process = require("process");
const dbs = {
    eu: {
        row: "dev-binlog-row-bar-jacob-instance.cro7ngosdr6q.eu-west-1.rds.amazonaws.com",
        mixed: ""
    },
    us: {
        row: "dev-binlog-row-bar-jacob-demand-us-instance.c488z2dafhwr.us-east-1.rds.amazonaws.com",
        mixed: ""
    }
};
const dbsRegion = process?.argv[2] === "eu" ? dbs.eu : dbs.us;
const connectionString = {
    host: process?.argv[3] === "row" ? dbsRegion.row : dbsRegion.mixed,
    user: "app",
    password: "g@nDur@$",
    connectTimeout: 30000,
    waitForConnections: true
};
const mainPool = _promise.default.createPool({
    ...connectionString,
    connectionLimit: 5,
    database: "main"
});
const writeOpenXPool = _promise.default.createPool({
    ...connectionString,
    connectionLimit: 5,
    database: "openx"
});
const readOpenXPool = _promise.default.createPool({
    ...connectionString,
    connectionLimit: 5,
    database: "openx"
});
console.log("connectionString:", connectionString);
const newConnectionHandler = (connection, mode)=>{
    if (process?.argv[2] === "us" && mode === "write") {
        console.log("set aurora_replica_read_consistency to openXPool connection created");
        connection.query("SET aurora_replica_read_consistency = 'session'");
    }
    console.log("openXPool connection created");
    connection.on("error", (err)=>{
        console.error("openXPool connection error:", err);
    });
};
writeOpenXPool.on("connection", (connection)=>{
    newConnectionHandler(connection, "write");
});
readOpenXPool.on("connection", (connection)=>{
    newConnectionHandler(connection, "read");
});
mainPool.on("connection", (connection)=>{
    newConnectionHandler(connection, "write");
});
async function connectAndQuery(query, database = "main", mode) {
    const connection = await getConnection(database, mode);
    try {
        await connection.execute(query);
        // Close the connection
        releaseConnection(connection, database, mode);
    // return response;
    } catch (error) {
        _eventhandler.eventEmitter.emit("error");
        console.error("error:", error);
        (0, _utils.writeLogToFile)(`Mysql connectAndQuery Error occurred:, ${error}`);
        releaseConnection(connection, database, mode);
    }
}
// Function to get a new database connection
async function getConnection(database, mode) {
    return database === "main" ? mainPool.getConnection() : mode == "write" ? writeOpenXPool.getConnection() : readOpenXPool.getConnection();
}
function releaseConnection(conn, database, mode) {
    return database === "main" ? mainPool.releaseConnection(conn) : mode == "write" ? writeOpenXPool.releaseConnection(conn) : readOpenXPool.releaseConnection(conn);
}
// Function to start a transaction
async function startTransaction(conn) {
    await conn.beginTransaction();
}
// Function to execute a query within a transaction
async function executeTransactionQuery(conn, query, params = []) {
    const [rows] = await conn.execute(query);
    return rows;
}
// Function to commit a transaction
async function commitTransaction(conn) {
    await conn.commit();
}
// Function to rollback a transaction
async function rollbackTransaction(conn) {
    await conn.rollback();
}
async function executeTransaction(queries, database = "main") {
    const conn = await getConnection(database, "write");
    try {
        // if (process?.argv[2] === "us") {
        //   await conn.execute(`SET aurora_replica_read_consistency = ''`);
        // }
        await startTransaction(conn);
        const results = [];
        for (const query of queries){
            const result = await executeTransactionQuery(conn, query);
            results.push(result);
        }
        await commitTransaction(conn);
        return results;
    } catch (error) {
        _eventhandler.eventEmitter.emit("error");
        console.error("error::", error);
        await rollbackTransaction(conn);
        throw error;
    } finally{
        releaseConnection(conn, database, "write");
    }
}

//# sourceMappingURL=mysql.js.map