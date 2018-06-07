var URL = process.env.URL ? process.env.URL : 'http://evanclinuxdev1.eastasia.cloudapp.azure.com:8080/v1';
// var URL = 'http://evanclinuxdev1.eastasia.cloudapp.azure.com:8080/v1';
var URL = 'http://frontend.westus.azurecontainer.io/v1';
const addContext = require('mochawesome/addContext');
const chalk = require('chalk');
const error = chalk.bold.red;
const warning = chalk.keyword('orange');
const info = chalk.rgb(122, 162, 262);
const title = chalk.rgb(224, 154, 114);
const interval = 5000;
var should = require('chai').should(),
    expect = require('chai').expect,
    assert = require('chai').assert;
supertest = require('supertest'),
    diagBaseUrl = `${URL}/diagnostics`,
    api = supertest(`${URL}`),
    diagApi = supertest(diagBaseUrl),
    Loop = require('./loop.js');

console.log(info("The base url of rest api is: ") + `${URL}`);

function formateDateValue(num) {
    return num > 10 ? num : '0' + num;
}

function getTime() {
    let date = new Date();
    let year = date.getFullYear();
    let month = formateDateValue(date.getMonth() + 1);
    let day = formateDateValue(date.getDay());
    let hour = formateDateValue(date.getHours());
    let minute = formateDateValue(date.getMinutes());
    let second = formateDateValue(date.getSeconds());
    return `@${year}-${month}-${day} ${hour}:${minute}:${second}`;
}


describe('Diag-Job', function () {
    let nodes = [];
    let test = {};
    let jobId = '';
    let taskId = '';
    let jobState = '';
    let pingpong = {};
    let ring = {};
    let timeout = 0;
    let estimatedJobFinishTime = 30000;
    let perCallCost = 10000;

    this.timeout(perCallCost);
    before(function (done) {
        console.log(title("\nBefore all hook: "));
        addContext(this, `Config ${perCallCost} ms as the timeout value of every api call.`);
        addContext(this, `Config ${perCallCost} ms as the timeout value of every api call.`);
        addContext(this, {
            title: 'nodes api: ',
            value: `${URL}/nodes`
        });

        let self = this;
        api.get('/nodes')
            .set('Accept', 'application/json')
            .end(function (err, res) {
                try {
                    if (err !== null) {
                        console.log(error(err));
                        done(err);
                    }
                    console.log(info("The result body length returned from node api: ") + res.body.length);
                    addContext(self, {
                        title: 'Result body',
                        value: res.body
                    });
                    assert.isNotEmpty(res);
                    expect(res.body).to.be.an.instanceof(Array);
                    res.body.forEach(e => {
                        if (e.health == 'OK') {
                            nodes.push(e.id);
                        }
                    });
                    done();
                } catch (err) {
                    console.log(error(err));
                    done(err);
                }
            })
    })

    it('should have nodes data', function (done) {
        console.log(title("\nshould have nodes data:"));
        assert.isNotEmpty(nodes);
        addContext(this, {
            title: 'nodes',
            value: nodes
        });
        console.log(info("Health nodes: ") + nodes);
        done();
    })

    it('should return diag tests list', function (done) {
        console.log(title("\nshould return diag tests list:"));
        let self = this;
        diagApi.get('/tests')
            .set('Accept', 'application/json')
            .end((err, res) => {
                addContext(self, {
                    title: 'Result body',
                    value: res.body
                });
                assert.isArray(res.body);
                if (res.body.length > 0) {
                    pingpong = res.body.find((e) => {
                        return e.name == 'pingpong';
                    });
                    addContext(self, {
                        title: 'pingpong test',
                        value: pingpong
                    });
                    pingpong['arguments'] = "[]";
                    ring = res.body.find((e) => {
                        return e.name == 'ring';
                    });
                    ring['arguments'] = "[]";
                    addContext(self, {
                        title: 'ring test: ',
                        value: ring
                    });
                    console.log(info("pingpong: "));
                    console.log(JSON.stringify(pingpong, null, "  "));
                    console.log(info("ring: "));
                    console.log(JSON.stringify(ring, null, "  "));
                }
                done();
            });
    })

    it('should create a new pingpong diag test', function (done) {
        console.log(title("\nshould create a new pingpong diag test:"));
        let self = this;
        diagApi.post('')
            .set('Accept', 'application/json')
            .send({
                name: 'BVT-pingpong-test' + getTime(),
                targetNodes: nodes,
                jobType: 'diagnostics',
                diagnosticTest: pingpong
            })
            .expect(201)
            .end(function (err, res) {
                try {
                    if (err) {
                        console.log(error("Error: "));
                        console.log(err);
                        addContext(self, {
                            title: "Error",
                            value: err
                        });
                        return done(err);
                    }
                    console.log(info("New pingpong job location: ") + res.headers.location);
                    addContext(self, {
                        title: 'New pingpong job location',
                        value: res.headers.location
                    });
                    expect(res.headers.location).to.include('/v1/diagnostics/');
                    let locationData = res.headers.location.split('/');
                    jobId = locationData[locationData.length - 1];
                    done();
                } catch (err) {
                    done(err);
                }
            });
    })

    it('should get a pinpong diag test result before timeout', function (done) {
        let startTime = new Date();
        timeout = nodes.length * estimatedJobFinishTime;
        this.timeout(timeout);
        console.log(chalk.rgb(226, 144, 229)("Timeout for pingpong job is: ") + info(`${timeout} ms.`));
        console.log(chalk.rgb(226, 144, 229)(`Job progress  (get state every ${interval} ms): `));
        addContext(this, "Job timeout set to ${timeout} ms");
        addContext(this, "Job progress (get state every 1000 ms)");
        let loop = Loop.start(
            diagBaseUrl + '/' + jobId,
            {
                next: (result) => {
                    result = JSON.parse(result);
                    console.log(info("Job state: ") + result.state);
                    addContext(this, {
                        title: 'Job state: ',
                        value: result.state
                    });
                    let endTime = new Date();
                    let elapseTime = endTime - startTime;
                    if (result.state == 'Finished') {
                        console.log(info(`Job ends with Finished in ${elapseTime} ms`));
                        console.log(info(`The result returned when job finished is:`));
                        console.log(JSON.stringify(result, null, "  "));
                        addContext(this, {
                            title: 'Cost time:',
                            value: `Job ends with Finished in ${elapseTime} ms`
                        });
                        addContext(this, {
                            title: 'Final result:',
                            value: result
                        });
                        assert.ok(result.state === 'Finished', 'pingpong diagnostic finished in ' + elapseTime + ' ms.');
                        expect(result).to.have.property('aggregationResult');
                        done();
                        return false;
                    }
                    else if (result.state == 'Failed') {
                        console.log(info(`Job ends with Failed in ${elapseTime} ms`));
                        console.log(info(`The result returned when job failed is:`));
                        console.log(JSON.stringify(result, null, "  "));
                        addContext(this, {
                            title: 'Cost time:',
                            value: `Job ends with Failed in ${elapseTime} ms`
                        });
                        addContext(this, {
                            title: 'Final result:',
                            value: result
                        });
                        assert.ok(result.state === 'Failed', 'pingpong diagnostic failed in ' + elapseTime + ' ms.');
                        expect(result).to.have.property('aggregationResult');
                        done();
                        return false;
                    }

                    if (elapseTime > timeout) {
                        console.log(info(`Job ends with timeout in ${elapseTime} ms`));
                        console.log(info(`The result returned when job timeout is:`));
                        console.log(JSON.stringify(result, null, "  "));
                        addContext(this, {
                            title: 'Cost time:',
                            value: `Test ends with timeout in ${elapseTime} ms`
                        });
                        addContext(this, {
                            title: 'Job result when timeout:',
                            value: result
                        });
                        assert.fail("actual runtime " + elapseTime + ' ms', "expected time " + timeout + ' ms', "The pingpong diag test doesn't finished in expected time, time elapses: " + elapseTime + ' ms, the max time is ' + timeout + ' ms');
                        done();
                        return false;
                    }
                    return true;
                }
            },
            interval
        );
    })

    it('should create a new ring diag test', function (done) {
        console.log(title("\nshould create a new ring diag test:"));
        let self = this;
        diagApi.post('')
            .set('Accept', 'application/json')
            .send({
                name: 'BVT-ring-test' + getTime(),
                targetNodes: nodes,
                jobType: 'diagnostics',
                diagnosticTest: ring
            })
            .expect(201)
            .end((err, res) => {
                try {
                    if (err) {
                        console.log(error("Error: "));
                        console.log(err);
                        addContext(self, {
                            title: "Error",
                            value: err
                        });
                        return done(err);
                    }
                    console.log(info("New ring job location: ") + res.headers.location);
                    addContext(self, {
                        title: 'New ring job location',
                        value: res.headers.location
                    });
                    expect(res.headers.location).to.include('/v1/diagnostics/');
                    let locationData = res.headers.location.split('/');
                    jobId = locationData[locationData.length - 1];
                    done();
                } catch (err) {
                    done(err);
                }
            });
    })

    it('should get a ring diag test result before timeout', function (done) {
        let startTime = new Date();
        timeout = nodes.length * estimatedJobFinishTime;
        this.timeout(timeout);
        console.log(chalk.rgb(226, 144, 229)("Timeout for ring job is: ") + info(`${timeout} ms.`));
        console.log(chalk.rgb(226, 144, 229)(`Job progress  (get state every ${interval} ms): `));
        addContext(this, "Job timeout set to ${timeout} ms");
        addContext(this, "Job progress (get state every 1000 ms)");
        let loop = Loop.start(
            diagBaseUrl + '/' + jobId,
            {
                next: (result) => {
                    result = JSON.parse(result);
                    console.log(info("Job state: ") + result.state);
                    addContext(this, {
                        title: 'Job state: ',
                        value: result.state
                    });
                    let endTime = new Date();
                    let elapseTime = endTime - startTime;
                    if (result.state == 'Finished') {
                        console.log(info(`Job ends with Finished in ${elapseTime} ms`));
                        console.log(info(`The result returned when job finished is:`));
                        console.log(JSON.stringify(result, null, "  "));
                        addContext(this, {
                            title: 'Cost time:',
                            value: `Job ends with Finished in ${elapseTime} ms`
                        });
                        addContext(this, {
                            title: 'Final result:',
                            value: result
                        });
                        assert.ok(result.state === 'Finished', 'ring diagnostic finished in ' + elapseTime + ' ms.');
                        expect(result).to.have.property('aggregationResult');
                        done();
                        return false;
                    }
                    else if (result.state == 'Failed') {
                        console.log(info(`Job ends with Failed in ${elapseTime} ms`));
                        console.log(info(`The result returned when job failed is:`));
                        console.log(JSON.stringify(result, null, "  "));
                        addContext(this, {
                            title: 'Cost time:',
                            value: `Job ends with Failed in ${elapseTime} ms`
                        });
                        addContext(this, {
                            title: 'Final result:',
                            value: result
                        });
                        assert.ok(result.state === 'Failed', 'ring diagnostic failed in ' + elapseTime + ' ms.');
                        expect(result).to.have.property('aggregationResult');
                        done();
                        return false;
                    }

                    if (elapseTime > timeout) {
                        console.log(info(`Job ends with timeout in ${elapseTime} ms`));
                        console.log(info(`The result returned when job timeout is:`));
                        console.log(JSON.stringify(result, null, "  "));
                        addContext(this, {
                            title: 'Cost time:',
                            value: `Test ends with timeout in ${elapseTime} ms`
                        });
                        addContext(this, {
                            title: 'Job result when timeout:',
                            value: result
                        });
                        assert.fail("actual runtime " + elapseTime + ' ms', "expected time " + timeout + ' ms', "The pingpong diag test doesn't finished in expected time, time elapses: " + elapseTime + ' ms, the max time is ' + timeout + ' ms');
                        done();
                        return false;
                    }
                    return true;
                }
            },
            interval
        );
    })
});