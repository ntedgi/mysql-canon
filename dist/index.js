"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const _mysql = require("./mysql");
const _utils = require("./utils");
const _eventhandler = require("./event-handler");
const throat = require('throat')(10);
function generateInsertValues(data) {
    return data.map((row)=>{
        const values = Object.values(row).map((value)=>{
            if (typeof value === 'string') {
                return `'${value.replace(/'/g, "''")}'`; // Escape single quotes in strings
            } else if (value === null || value === undefined) {
                return 'NULL';
            }
            return value;
        });
        return `(${values.join(', ')})`;
    }).join(', ');
}
async function updateAssets() {
    try {
        const startTime = Date.now();
        const query = `UPDATE main.assets
SET duration = duration * 1.01
WHERE mobile_application_id in (560385, 710389, 560385,681203,409067,4184,583967,582489,493979,643674)`;
        const res = await (0, _mysql.connectAndQuery)(query, 'main', 'write');
        _eventhandler.eventEmitter.emit('success', {
            type: 'updateAssets',
            time: Date.now() - startTime
        });
        (0, _utils.writeLogToFile)('done update assets');
    } catch (e) {
        (0, _utils.writeLogToFile)('got exception updateAssets');
    }
}
const randomNumbers = [];
async function updateBids() {
    try {
        const values = [];
        let randomVal = (0, _utils.getRandomInt)(0, 2000000000000);
        randomNumbers.push(randomVal);
        while(randomNumbers.includes(randomVal)){
            randomVal = (0, _utils.getRandomInt)(0, 2000000000000);
        }
        randomNumbers.push(randomVal);
        for(let i = 0; i < 1000; i++){
            values.push([
                randomVal,
                'US',
                1234,
                '0.001'
            ]);
        }
        const insertValues = generateInsertValues(values);
        const startTime = Date.now();
        const insertQuery = `insert into openx.ox_campaign_multiple_bid (campaign_id, country_code, app_id, revenue) values ${insertValues} on duplicate key update revenue = revenue`;
        await Promise.all([
            (0, _mysql.connectAndQuery)(insertQuery, 'openx', 'write')
        ]);
        _eventhandler.eventEmitter.emit('success', {
            type: 'updateBids',
            time: Date.now() - startTime
        });
        (0, _utils.writeLogToFile)('done update bids');
    } catch (e) {
        (0, _utils.writeLogToFile)('got exception on updateBids');
    }
}
async function selectCampaign() {
    try {
        const startTime = Date.now();
        const query = `select * from openx.ox_campaigns where mobile_app_id=4184`;
        await (0, _mysql.connectAndQuery)(query, 'openx', 'read');
        _eventhandler.eventEmitter.emit('success', {
            type: 'selectCampaign',
            time: Date.now() - startTime
        });
        (0, _utils.writeLogToFile)('done select campaigns');
    } catch (e) {
        (0, _utils.writeLogToFile)('got exception on selectCampaign');
    }
}
async function selectCampaigns() {
    try {
        const startTime = Date.now();
        const query = 'select * from openx.ox_campaigns where network_id = 1446 and campaign_type=33 limit 10';
        await (0, _mysql.connectAndQuery)(query, 'openx', 'read');
        _eventhandler.eventEmitter.emit('success', {
            type: 'selectCampaigns',
            time: Date.now() - startTime
        });
        (0, _utils.writeLogToFile)('done select campaigns');
    } catch (e) {
        (0, _utils.writeLogToFile)('got exception on selectCampaign');
    }
}
async function insertCampaigns() {
    try {
        const startTime = Date.now();
        const campaignInsertQuery = `insert into openx.ox_campaigns (network_id, campaign_type, mobile_app_id, origin, campaignname, suspended) values (1446,33,162091,5,'test',0)`;
        const bannerInsertQuery = `insert into openx.ox_banners (campaignid, url, impression_url) values ('@campaignId','test_url','test_url')`;
        const queries = [
            campaignInsertQuery,
            `SET @campaignId = LAST_INSERT_ID()`,
            bannerInsertQuery
        ];
        const res = await (0, _mysql.executeTransaction)(queries, 'openx');
        _eventhandler.eventEmitter.emit('success', {
            type: 'insertCampaigns',
            time: Date.now() - startTime
        });
        (0, _utils.writeLogToFile)('done insert campaign');
    } catch (e) {
        (0, _utils.writeLogToFile)('got exception on insertCampaigns');
        console.log(e);
    }
}
function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
(async ()=>{
    _eventhandler.eventEmitter.emit('start');
    setInterval(()=>{
        _eventhandler.eventEmitter.emit('log');
    }, 5000);
    for(let i = 0; i < 7; i++){
        const promiseArr = [
            ...(0, _utils.invokeAsyncFunctionTimes)(insertCampaigns, 50),
            ...(0, _utils.invokeAsyncFunctionTimes)(selectCampaigns, 20),
            ...(0, _utils.invokeAsyncFunctionTimes)(selectCampaign, 60),
            ...(0, _utils.invokeAsyncFunctionTimes)(updateBids, 60),
            ...(0, _utils.invokeAsyncFunctionTimes)(updateAssets, 60)
        ].map((fn)=>throat(fn));
        await Promise.all(promiseArr);
        (0, _utils.writeLogToFile)(`done ${i} iteration`);
        console.log(`done ${i} iteration`);
        if (i === 0) {
            _eventhandler.eventEmitter.emit('clear_warmup');
            await sleep(5000);
        }
        await sleep(1000);
    }
    _eventhandler.eventEmitter.emit('end');
})();

//# sourceMappingURL=index.js.map