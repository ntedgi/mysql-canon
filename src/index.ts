import {connectAndQuery, executeTransaction} from './mysql';

import {getRandomInt, invokeAsyncFunctionTimes, writeLogToFile} from './utils';

import {eventEmitter} from './event-handler';
const throat = require('throat')(10);

function generateInsertValues<T extends Record<string, any>>(data: T[]): string {
    return data.map(row => {
        const values = Object.values(row).map(value => {
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
        const res = await connectAndQuery(query, 'main', 'write');
        eventEmitter.emit('success', {type: 'updateAssets', time: Date.now()-startTime});
        writeLogToFile('done update assets');
    } catch (e) {
        writeLogToFile('got exception updateAssets');
    }
}

const randomNumbers = [] as any[];

async function updateBids() {
    try {
        const values = [];
        let randomVal = getRandomInt(0, 2000000000000);
        randomNumbers.push(randomVal);
        while (randomNumbers.includes(randomVal)) {
            randomVal = getRandomInt(0, 2000000000000);
        }
        randomNumbers.push(randomVal);

        for (let i = 0; i < 1000; i++) {
            values.push([randomVal, 'US', 1234, '0.001']);
        }

        const insertValues = generateInsertValues(values);

        const startTime = Date.now();
        const insertQuery = `insert into openx.ox_campaign_multiple_bid (campaign_id, country_code, app_id, revenue) values ${insertValues} on duplicate key update revenue = revenue`;
        await Promise.all([
            connectAndQuery(insertQuery, 'openx','write'),
        ]);
        eventEmitter.emit('success', {type: 'updateBids', time: Date.now()-startTime});
        writeLogToFile('done update bids');
    } catch (e) {
        writeLogToFile('got exception on updateBids');
    }
}

async function selectCampaign() {
    try {
        const startTime = Date.now();
        const query = `select * from openx.ox_campaigns where mobile_app_id=4184`;
        await connectAndQuery(query, 'openx', 'read');
        eventEmitter.emit('success', {type: 'selectCampaign', time: Date.now()-startTime});
        writeLogToFile('done select campaigns');
    } catch (e) {
        writeLogToFile('got exception on selectCampaign');
    }
}

async function selectCampaigns() {
    try {
        const startTime = Date.now();
        const query = 'select * from openx.ox_campaigns where network_id = 1446 and campaign_type=33 limit 10';
        await connectAndQuery(query, 'openx', 'read');
        eventEmitter.emit('success', {type: 'selectCampaigns', time: Date.now()-startTime});
        writeLogToFile('done select campaigns');
    } catch (e) {
        writeLogToFile('got exception on selectCampaign');
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

        const res = await executeTransaction(queries, 'openx');
        eventEmitter.emit('success', {type: 'insertCampaigns', time: Date.now()-startTime});
        writeLogToFile('done insert campaign');
    } catch (e) {
        writeLogToFile('got exception on insertCampaigns');
        console.log(e)
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}


(async () => {
    eventEmitter.emit('start');
    setInterval(() => {
        eventEmitter.emit('log');
        
    },5000)
    for (let i = 0; i < 7; i++) {
        const promiseArr=[
            ...invokeAsyncFunctionTimes(insertCampaigns, 50),
            ...invokeAsyncFunctionTimes(selectCampaigns, 20),
            ...invokeAsyncFunctionTimes(selectCampaign, 60),
            ...invokeAsyncFunctionTimes(updateBids, 60),
            ...invokeAsyncFunctionTimes(updateAssets, 60)
        ].map(fn=>throat(fn));
        await Promise.all(promiseArr);
        writeLogToFile(`done ${i} iteration`);
        console.log(`done ${i} iteration`);
        if(i===0) {
            eventEmitter.emit('clear_warmup');
            await sleep(5000);
        }
        await sleep(1000);
    }
    eventEmitter.emit('end');
})();
