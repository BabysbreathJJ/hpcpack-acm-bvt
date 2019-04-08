var common = require("../common");
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
const interval = 5000;
var expect = common.expect,
    assert = common.assert,
    supertest = common.supertest,
    clusrunBaseUrl = `${URL}/clusrun`,
    api = supertest(`${URL}`),
    clusrunApi = supertest(clusrunBaseUrl),
    perCallCost = common.perCallCost,
    handleError = common.handleError;

let nodes = [];
let clusrunJobId = -1;
let estimatedJobFinishTime = 30000;

before(function (done) {
    console.log(title(`\nBefore all hook of clusrun job:`));
    addContext(this, `Config ${perCallCost} ms as the timeout value of every api call.`);
    addContext(this, {
        title: 'nodes api: ',
        value: `${URL}/nodes`
    });

    if (URL == '') {
        try {
            assert.fail('Should have base url', '', 'The test stopped by could not get base url, please confirm if you have passed one to run bvt.');
        } catch (error) {
            return done(error);
        }
    }

    let self = this;
    console.time(info("clusrun job-before all hook get nodes duration"));
    api.get('/nodes')
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            console.log(info("The result body length returned from node api: ") + res.body.length);
            addContext(self, {
                title: 'Result body',
                value: res.body
            });
            assert.isNotEmpty(res.body);
            expect(res.body).to.be.an.instanceof(Array);
            res.body.forEach(e => {
                if (e.health == 'OK') {
                    nodes.push(e.id);
                }
            });
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusrun job-before all hook get nodes duration"));
        })

})

it('should have nodes data', function (done) {
    console.log(title("\nshould have nodes data:"));
    try {
        addContext(this, {
            title: 'nodes',
            value: nodes
        });
        console.log(info("Health nodes: ") + nodes);
        assert.isNotEmpty(nodes);
    } catch (error) {
        handleError(error, this);
        return done(error);
    }
    done();
})

it('should return 400 Bad Request when create a new clusrun without commandline property', function (done) {
    console.log(title('\nshould return 400 Bad Request when create a new clusrun without commandline: '));
    let self = this;
    console.time(info("clusrun-400 without commandline property duration"));
    clusrunApi.post('')
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .send({
            targetNodes: nodes
        })
        .expect(400)
        .expect(function (res) {
            console.log(info("400 return value: "));
            console.log(JSON.stringify(res, null, "  "));
            addContext(self, {
                title: '400 retrun value',
                value: res.text
            });
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusrun-400 without commandline property duration"));
        })
})

it('should return 400 Bad Request when create a new clusrun without targetNodes property', function (done) {
    console.log(title('\nshould return 400 Bad Request when create a new clusrun without targetNodes property:'));
    let self = this;
    console.time(info("clusrun-400 without target nodes duration"));
    clusrunApi.post('')
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .send({
            commandLine: "whoami"
        })
        .expect(400)
        .expect(function (res) {
            console.log(info("400 return value: "));
            console.log(JSON.stringify(res, null, "  "));
            addContext(self, {
                title: '400 retrun value',
                value: res
            });
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusrun-400 without target nodes duration"));
        })
})

it('should create a new clusrun job', function (done) {
    console.log(title("\nshould create a new clusrun job"));
    let self = this;
    console.time(info("clusrun-create a new clusrun duration"));
    clusrunApi.post('')
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .send({
            commandLine: "whoami",
            targetNodes: nodes
        })
        .expect(201)
        .expect(function (res) {
            console.log(info('New clusrun job location: ') + res.headers.location);
            addContext(self, {
                title: 'New clusrun job location',
                value: res.headers.location
            });
            expect(res.headers.location).to.include('/clusrun/');
            let locationData = res.headers.location.split('/');
            clusrunJobId = locationData[locationData.length - 1];
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusrun-create a new clusrun duration"));
        })
})

it('should cancel a clusrun job', function (done) {
    console.log(title('\nshould cancel a clusrun job'));
    let self = this;
    console.time(info("clusurn-cancel a clusrun duration"));
    clusrunApi.patch(`/${clusrunJobId}`)
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .send({
            request: 'cancel'
        })
        .expect(200)
        .expect(function (res) {
            console.log(info("The cancel result:"));
            console.log(JSON.stringify(res.text, null, "  "));
            addContext(self, {
                title: 'The cancel result',
                value: res.text
            });
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusurn-cancel a clusrun duration"));
        })
})

it('should return detailed info with a specified clusrun job id', function (done) {
    console.log(title('\nshould return detailed job info with a specified clusrun job id'));
    let self = this;
    console.time(info("clusrun-job detailed info duration"));
    clusrunApi.get(`/${clusrunJobId}`)
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            console.log(info(`Clusrun ${clusrunJobId} detailed info:`));
            console.log(JSON.stringify(res.body, null, "  "));
            addContext(self, {
                title: `Clusrun ${clusrunJobId} detailed info`,
                value: res.body
            });
            assert.isNotEmpty(res.body);
            let result = res.body;
            expect(result).to.have.property('createdAt');
            expect(result['id']).to.eql(Number(clusrunJobId));
            expect(result).to.have.property('targetNodes');
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusrun-job detailed info duration"));
        })
})

it('should create a simple command line clusrun job', function (done) {
    console.log(title("\nshould create a somple command line clusrun job"));
    let self = this;
    console.time(info("clusrun-create a simple command line clusrun job duration"));
    clusrunApi.post('')
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .send({
            commandLine: "hostname",
            targetNodes: nodes
        })
        .expect(201)
        .expect(function (res) {
            console.log(info('New clusrun job location: ') + res.headers.location);
            addContext(self, {
                title: 'New clusrun job location',
                value: res.headers.location
            });
            expect(res.headers.location).to.include('/clusrun/');
            let locationData = res.headers.location.split('/');
            clusrunJobId = locationData[locationData.length - 1];
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusrun-create a simple command line clusrun job duration"));
        })
})


it('should get simple command line result before timeout', function (done) {
    let timeout = nodes.length * estimatedJobFinishTime;
    let maxTime = new Date().getTime() + timeout;
    let self = this;
    console.log(info(`Timeout for clusrun job is: ${timeout} ms.`));
    console.log(info(`Job progress  (get state every ${interval} ms): `));
    addContext(this, `Job timeout set to ${timeout} ms`);
    addContext(this, `Job progress (get state every 1000 ms)`);
    console.time(info("clurun job-hostname result duration"));
    let loop = Loop.start(
        clusrunBaseUrl + '/' + clusrunJobId,
        perCallCost, {
            next: function (res, err) {
                let endTime = new Date().getTime();
                if (err) {
                    console.log(err);
                    if (err.code == 'ETIMEDOUT' && endTime < maxTime) {
                        return true;
                    }
                    handleError(err, self);
                    console.timeEnd(info("clurun job-hostname result duration"));
                    done(err);
                    return false;
                }

                result = res.body;
                result = JSON.parse(result);
                pingpongJobState = result.state;
                console.log(info("Job state: ") + result.state);
                addContext(self, {
                    title: 'Job state',
                    value: result.state
                });
                if (result.state == 'Finished') {
                    console.log(info(`Job ends with Finished in ${maxTime - endTime} ms`));
                    console.log(info(`The result returned when job finished is:`));
                    console.log(JSON.stringify(result, null, "  "));
                    addContext(self, {
                        title: 'Cost time',
                        value: `Job ends with Finished in ${maxTime - endTime} ms`
                    });
                    addContext(self, {
                        title: 'Final result',
                        value: result
                    });
                    assert.ok(result.state === 'Finished', `clusrun get hostname job is finished in ${maxTime - endTime} ms.`);
                    console.timeEnd(info("clurun job-hostname result duration"));
                    done();
                    return false;
                } else if (result.state == 'Failed') {
                    console.log(info(`Job ends with Failed in ${maxTime - endTime} ms`));
                    console.log(info(`The result returned when job failed is:`));
                    console.log(JSON.stringify(result, null, "  "));
                    addContext(self, {
                        title: 'Cost time',
                        value: `Job ends with Failed in ${maxTime - endTime} ms`
                    });
                    addContext(self, {
                        title: 'Final result',
                        value: result
                    });
                    assert.ok(result.state === 'Failed', `clusrun get hostname job is failed in ${maxTime - endTime} ms.`);
                    console.timeEnd(info("clurun job-hostname result duration"));
                    done();
                    return false;
                } else if (result.state == 'Canceled') {
                    console.log(info(`Job ends with Canceled in ${maxTime - endTime} ms`));
                    console.log(info(`The result returned when job canceled is:`));
                    console.log(JSON.stringify(result, null, "  "));
                    addContext(self, {
                        title: 'Cost time',
                        value: `Job ends with Canceled in ${maxTime - endTime} ms`
                    });
                    addContext(self, {
                        title: 'Final result',
                        value: result
                    });
                    assert.ok(result.state === 'Canceled', `clusrun get hostname job is canceled in ${maxTime - endTime} ms.`);
                    console.timeEnd(info("clurun job-hostname result duration"));
                    done();
                    return false;
                }

                if (endTime >= maxTime) {
                    console.log(info(`The result returned when job timeout is:`));
                    console.log(JSON.stringify(result, null, "  "));
                    addContext(self, {
                        title: 'Cost time',
                        value: `Test ends with timeout in ${maxTime - endTime > 0 ? maxTime - endTime : (endTime - maxTime + timeout)} ms`
                    });
                    addContext(self, {
                        title: 'Job result when timeout',
                        value: result
                    });
                    try {
                        assert.fail(`actual runtime ${maxTime - endTime > 0 ? maxTime - endTime : (endTime - maxTime + timeout)} ms`, "expected time " + timeout + ' ms', `The clusrun get hostname job doesn't finished in expected time, time elapses: ${maxTime - endTime > 0 ? maxTime - endTime : (endTime - maxTime + timeout)} ms`, `the max time is ${timeout} ms`);
                    } catch (error) {
                        handleError(error, self);
                        done(error);
                        console.timeEnd(info("clurun job-hostname result duration"));
                    }
                    return false;
                }
                return true;
            }
        },
        interval
    );
})