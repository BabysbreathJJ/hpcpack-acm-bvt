var URL = process.env.URL ? process.env.URL : '';
// var URL = 'https://hpcpackacm.azurewebsites.net/v1';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
const addContext = require('mochawesome/addContext');
const chalk = require('chalk');
const error = chalk.bold.red;
const warning = chalk.keyword('orange');
const info = chalk.rgb(122, 162, 262);
const title = chalk.rgb(224, 154, 114);
var should = require('chai').should(),
    expect = require('chai').expect,
    assert = require('chai').assert;
supertest = require('supertest'),
    api = supertest(`${URL}`),
    Loop = require('./loop.js');

const perCallCost = 10000;

console.log(info("The base url of rest api is: ") + `${URL}`);

function formateDateValue(num) {
    return num > 9 ? num : '0' + num;
}

function getTime() {
    let date = new Date();
    let year = date.getFullYear();
    let month = formateDateValue(date.getMonth() + 1);
    let day = formateDateValue(date.getDate());
    let hour = formateDateValue(date.getHours());
    let minute = formateDateValue(date.getMinutes());
    let second = formateDateValue(date.getSeconds());
    return `@${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

function handleError(err, self) {
    console.log(error(err));
    addContext(self, {
        title: "Error",
        value: err
    });
}

module.exports = {
    getTime: getTime,
    handleError: handleError,
    URL: URL,
    addContext: addContext,
    error: error,
    warning: warning,
    info: info,
    title: title,
    should: should,
    expect: expect,
    assert: assert,
    supertest: supertest,
    Loop: Loop,
    perCallCost: perCallCost
}