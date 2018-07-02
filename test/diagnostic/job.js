var common = require("../common");
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
const interval = 5000;
var expect = common.expect,
    assert = common.assert,
    supertest = common.supertest,
    diagBaseUrl = `${URL}/diagnostics`,
    api = supertest(`${URL}`),
    diagApi = supertest(diagBaseUrl),
    Loop = common.Loop,
    perCallCost = common.perCallCost;

var getTime = common.getTime;
var handleError = common.handleError;

let nodes = [];
let ringJobId = -1;
let pingpongJobId = -1;
let pingpongJobState = "";
let pingpong = {};
let ring = {};
let timeout = 0;
let estimatedJobFinishTime = 30000;

before(function (done) {
    console.log(title("\nBefore all hook of diag job: "));
    addContext(this, `Config ${perCallCost} ms as the timeout value of every api call.`);
    addContext(this, {
        title: 'nodes api: ',
        value: `${URL}/nodes`
    });
    if (URL == '') {
        assert.fail('Should have base url', '', 'The test stopped by could not get base url, please confirm if you have passed one to run bvt.');
        return done(err);
    }

    let self = this;
    console.time(info("duration"));
    api.get('/nodes')
        .set('Accept', 'application/json')
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
            console.timeEnd(info("duration"));
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
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
    console.time(info("duration"));
    diagApi.get('/tests')
        .set('Accept', 'application/json')
        .expect(200)
        .expect(function (res) {
            assert.isArray(res.body);
            addContext(self, {
                title: 'Result body',
                value: res.body
            });
            console.log(info("The result body length is: ") + res.body.length);
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
        })
        .end(function (err, res) {
            console.timeEnd(info("duration"));
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
        });
})

it('should return 400 Bad Request when create a new diag with empty diagnosticTest property', function (done) {
    console.log(title("\nshould return 400 Bad Request when create a new diag with empty diagnosticTest:"));
    let self = this;
    console.time(info("duration"));
    diagApi.post('')
        .set('Accept', 'application/json')
        .send({
            name: 'BVT-empty-diag-test' + getTime(),
            targetNodes: nodes,
            jobType: 'diagnostics',
            diagnosticTest: {}
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
            console.timeEnd(info("duration"));
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
        });
})

it('should return 400 Bad Request when create a new with empty targetNodes', function (done) {
    console.log(title("\nshould return 400 Bad Request when create a new with empty targetNodes:"));
    let self = this;
    console.time(info("duration"));
    diagApi.post('')
        .set('Accept', 'application/json')
        .send({
            name: 'BVT-empty-diag-test' + getTime(),
            targetNodes: [],
            jobType: 'diagnostics',
            diagnosticTest: pingpong
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
            console.timeEnd(info("duration"));
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
        });
})

it('should create a new pingpong diag test', function (done) {
    console.log(title("\nshould create a new pingpong diag test:"));
    let self = this;
    console.time(info("duration"));
    diagApi.post('')
        .set('Accept', 'application/json')
        .send({
            name: 'BVT-pingpong-test' + getTime(),
            targetNodes: nodes,
            jobType: 'diagnostics',
            diagnosticTest: pingpong
        })
        .expect(201)
        .expect(function (res) {
            console.log(info("New pingpong job location: ") + res.headers.location);
            addContext(self, {
                title: 'New pingpong job location',
                value: res.headers.location
            });
            expect(res.headers.location).to.include('/diagnostics/');
            let locationData = res.headers.location.split('/');
            pingpongJobId = locationData[locationData.length - 1];
        })
        .end(function (err, res) {
            console.timeEnd(info("duration"));
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
        });
})

it('should return detailed info with a specified diag job id', function (done) {
    console.log(title('\nshould return detailed info with a specified diag job id'));
    let self = this;
    console.time(info("duration"));
    diagApi.get(`/${pingpongJobId}`)
        .set('Accept', 'application/json')
        .expect(200)
        .expect(function (res) {
            console.log(info(`Diag ${pingpongJobId} detailed info:`));
            console.log(JSON.stringify(res.body, null, "  "));
            addContext(self, {
                title: `Diage ${pingpongJobId} detailed info`,
                value: res.body
            });
            assert.isNotEmpty(res.body);
            let result = res.body;
            expect(result).to.have.property('createdAt');
            expect(result['id']).to.eql(Number(pingpongJobId));
            expect(result).to.have.property('targetNodes');
        })
        .end(function (err, res) {
            console.timeEnd(info("duration"));
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
        });
})

it('should get a pinpong diag test result before timeout', function (done) {
    let startTime = new Date();
    timeout = nodes.length * estimatedJobFinishTime;
    this.timeout(timeout);
    console.log(info(`Timeout for pingpong job is: ${timeout} ms.`));
    console.log(info(`Job progress  (get state every ${interval} ms): `));
    addContext(this, `Job timeout set to ${timeout} ms`);
    addContext(this, `Job progress (get state every 1000 ms)`);
    console.time(info("duration"));
    try {
        let loop = Loop.start(
            diagBaseUrl + '/' + pingpongJobId,
            {
                next: (res, err) => {
                    if (err) {
                        handleError(err, self);
                        Loop.stop(loop);
                        console.timeEnd(info("duration"));
                        return done(err);
                    }
                    result = res.body;
                    result = JSON.parse(result);
                    pingpongJobState = result.state;
                    console.log(info("Job state: ") + result.state);
                    addContext(this, {
                        title: 'Job state',
                        value: result.state
                    });
                    let endTime = new Date();
                    let elapseTime = endTime - startTime;
                    if (result.state == 'Finished') {
                        console.log(info(`Job ends with Finished in ${elapseTime} ms`));
                        console.log(info(`The result returned when job finished is:`));
                        console.log(JSON.stringify(result, null, "  "));
                        addContext(this, {
                            title: 'Cost time',
                            value: `Job ends with Finished in ${elapseTime} ms`
                        });
                        addContext(this, {
                            title: 'Final result',
                            value: result
                        });
                        assert.ok(result.state === 'Finished', 'pingpong diagnostic finished in ' + elapseTime + ' ms.');
                        Loop.stop(loop);
                        console.timeEnd(info("duration"));
                        return done();
                    }
                    else if (result.state == 'Failed') {
                        console.log(info(`Job ends with Failed in ${elapseTime} ms`));
                        console.log(info(`The result returned when job failed is:`));
                        console.log(JSON.stringify(result, null, "  "));
                        addContext(this, {
                            title: 'Cost time',
                            value: `Job ends with Failed in ${elapseTime} ms`
                        });
                        addContext(this, {
                            title: 'Final result',
                            value: result
                        });
                        assert.ok(result.state === 'Failed', 'pingpong diagnostic failed in ' + elapseTime + ' ms.');
                        Loop.stop(loop);
                        console.timeEnd(info("duration"));
                        return done();
                    }

                    if (elapseTime > timeout) {
                        console.log(info(`Job ends with timeout in ${elapseTime} ms`));
                        console.log(info(`The result returned when job timeout is:`));
                        console.log(JSON.stringify(result, null, "  "));
                        addContext(this, {
                            title: 'Cost time',
                            value: `Test ends with timeout in ${elapseTime} ms`
                        });
                        addContext(this, {
                            title: 'Job result when timeout',
                            value: result
                        });
                        assert.fail("actual runtime " + elapseTime + ' ms', "expected time " + timeout + ' ms', "The pingpong diag test doesn't finished in expected time, time elapses: " + elapseTime + ' ms, the max time is ' + timeout + ' ms');
                        Loop.stop(loop);
                        console.timeEnd(info("duration"));
                        return done();
                    }
                    return true;
                }
            },
            interval
        );
    } catch (error) {
        handleError(error, this);
        done(error);
    }

})

it('should get aggregation result with a specified job id', function (done) {
    let self = this;
    console.log(title('\nshould get aggregation result with a specified job id:'));
    addContext(self, `To get aggregationResult of job ${pingpongJobId}`);
    console.time(info("duration"));
    if (pingpongJobState == "Finished") {
        diagApi.get(`/${pingpongJobId}/aggregationresult`)
            .set('Accept', 'application/json')
            .expect(200)
            .expect(function (res) {
                console.log(info(`Diag job ${pingpongJobId}'s aggregation result is:`));
                console.log(JSON.stringify(JSON.stringify(res.body), null, "  "));
                addContext(self, {
                    title: `Aggregation result`,
                    value: res.body
                });
                assert.isNotEmpty(res.body);
            })
            .end(function (err, res) {
                console.timeEnd(info("duration"));
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                done();
            })
    }
    else {
        diagApi.get(`/${pingpongJobId}/aggregationresult`)
            .set('Accept', 'application/json')
            .expect(404)
            .expect(function (res) {
                console.log(info(`Diag job ${pingpongJobId}'s aggregation result is:`));
                console.log(JSON.stringify(JSON.stringify(res.body), null, "  "));
                addContext(self, {
                    title: `Aggregation result`,
                    value: res.body
                });
                assert.isNotEmpty(res.body);
            })
            .end((err, res) => {
                console.timeEnd(info("duration"));
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                done();
            })
    }

})

it('should create a new ring diag test', function (done) {
    console.log(title("\nshould create a new ring diag test:"));
    let self = this;
    console.time(info("duration"));
    diagApi.post('')
        .set('Accept', 'application/json')
        .send({
            name: 'BVT-ring-test' + getTime(),
            targetNodes: nodes,
            jobType: 'diagnostics',
            diagnosticTest: ring
        })
        .expect(201)
        .expect(function (res) {
            console.log(info("New ring job location: ") + res.headers.location);
            addContext(self, {
                title: 'New ring job location',
                value: res.headers.location
            });
            expect(res.headers.location).to.include('/v1/diagnostics/');
            let locationData = res.headers.location.split('/');
            ringJobId = locationData[locationData.length - 1];
        })
        .end((err, res) => {
            console.timeEnd(info("duration"));
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
        });
})

it('should cancel a diag test', function (done) {
    console.log(title("\nshould cancel diag test:"));
    console.log(info("The job id to cancel is ") + ringJobId);
    let self = this;
    console.time(info("duration"));
    diagApi.patch(`/${ringJobId}`)
        .set('Accept', 'application/json')
        .send({
            request: 'cancel'
        })
        .expect(200)
        .expect(function (res) {
            console.log(info("The cancel result: "));
            console.log(JSON.stringify(res.text, null, "  "));
            addContext(self, {
                title: 'The cancel result',
                value: res.text
            });
        })
        .end(function (err, res) {
            console.timeEnd(info("duration"));
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
        })
})
