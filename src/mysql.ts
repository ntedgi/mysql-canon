import mysql from "mysql2/promise";
import { writeLogToFile } from "./utils";
import { eventEmitter } from "./event-handler";

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
  connectTimeout: 30000,
  waitForConnections: true
};
const mainPool = mysql.createPool({ ...connectionString, connectionLimit: 5, database: "main" });
const writeOpenXPool = mysql.createPool({ ...connectionString, connectionLimit: 5, database: "openx" });
const readOpenXPool = mysql.createPool({ ...connectionString, connectionLimit: 5, database: "openx" });

console.log("connectionString:", connectionString);

const newConnectionHandler = (connection: mysql.PoolConnection, mode: string) => {
  if (process?.argv[2] === "us" && mode === "write") {
    console.log("set aurora_replica_read_consistency to openXPool connection created");
    connection.query("SET aurora_replica_read_consistency = 'session'");
  }
  console.log("openXPool connection created");
  connection.on("error", (err: any) => {
    console.error("openXPool connection error:", err);
  });
};

writeOpenXPool.on("connection", (connection) => {
  newConnectionHandler(connection, "write");
});

readOpenXPool.on("connection", (connection) => {
  newConnectionHandler(connection, "read");
});


mainPool.on("connection", (connection) => {
  newConnectionHandler(connection, "write");
});


export async function connectAndQuery(query: any, database = "main", mode: string) {
  const connection = await getConnection(database,mode);

  try {
    await connection.execute(query);

    // Close the connection
    releaseConnection(connection, database, mode);
    // return response;
  } catch (error) {
    eventEmitter.emit("error");
    console.error("error:", error);
    writeLogToFile(`Mysql connectAndQuery Error occurred:, ${error}`);
    releaseConnection(connection, database, mode);

  }
}

// Function to get a new database connection
async function getConnection(database: any, mode: string) {
  return (database === "main") ? mainPool.getConnection() : mode == "write" ? writeOpenXPool.getConnection() : readOpenXPool.getConnection();
}

function releaseConnection(conn, database, mode: string) {
  return (database === "main") ? mainPool.releaseConnection(conn) : mode == "write" ? writeOpenXPool.releaseConnection(conn) : readOpenXPool.releaseConnection(conn);
}

// Function to start a transaction
async function startTransaction(conn: mysql.Connection) {
  await conn.beginTransaction();
}

// Function to execute a query within a transaction
async function executeTransactionQuery(conn: mysql.Connection, query: string, params: any[] = []) {
  const [rows] = await conn.execute(query);
  return rows;
}

// Function to commit a transaction
async function commitTransaction(conn: mysql.Connection) {
  await conn.commit();
}

// Function to rollback a transaction
async function rollbackTransaction(conn: mysql.Connection) {
  await conn.rollback();
}

// Exported function to handle a transaction
export async function executeTransaction(queries: any, database = "main") {
  const conn = await getConnection(database, "write");
  try {
    // if (process?.argv[2] === "us") {
    //   await conn.execute(`SET aurora_replica_read_consistency = ''`);
    // }
    await startTransaction(conn);

    const results = [];
    for (const query of queries) {
      const result = await executeTransactionQuery(conn, query);
      results.push(result);
    }
    await commitTransaction(conn);
    return results;
  } catch (error) {
    eventEmitter.emit("error");
    console.error("error::", error);
    await rollbackTransaction(conn);
    throw error;
  } finally {
    releaseConnection(conn, database,"write");
  }
}