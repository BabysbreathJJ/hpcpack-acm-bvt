var common = require("../common");
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
var expect = common.expect,
    assert = common.assert,
    supertest = common.supertest,
    handleError = common.handleError,
    nodeBaseUrl = `${URL}/nodes`,
    nodeApi = supertest(nodeBaseUrl);

var getTime = common.getTime;

let nodeId = -1;

before(function (done) {
    if (URL == '') {
        assert.fail('Should have base url', '', 'The test stopped by could not get base url, please confirm if you have passed one to run bvt.');
        return done(err);
    }
    done();
})

it('should return nodes list', function (done) {
    console.log(title(`\nshould return nodes list:`));
    let self = this;
    console.time(info("duration"));
    nodeApi.get('')
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
            nodeId = res.body[0]['id'];

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

it('should return corresponding detail info with specified node id', function (done) {
    console.log(title(`\nshould return corresponding detail node info with specified id:`));
    let self = this;
    console.time(info("duration"));
    nodeApi.get(`/${nodeId}`)
        .set('Accept', 'application/json')
        .expect(200)
        .expect(function (res) {
            console.log(info(`The detail info of node ${nodeId}:`));
            console.log(JSON.stringify(res.body, null, "  "));
            assert.isNotEmpty(res.body);
            let result = res.body;
            expect(result).to.have.property('id', nodeId);
            expect(result).to.have.property('state');
            expect(result).to.have.property('health');
            addContext(self, {
                title: `node ${nodeId}`,
                value: result
            })
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

it('should return node event with specified node id', function (done) {
    console.log(title('\nshould return node event with specified id:'));
    let self = this;
    console.time(info("duration"));
    nodeApi.get(`/${nodeId}/events`)
        .set('Accept', 'application/json')
        .expect(200)
        .expect(function (res) {
            console.log(info(`The event info of node ${nodeId}:`));
            console.log(JSON.stringify(res.body, null, "  "));
            expect(res.body).to.be.an.instanceof(Array);
            addContext(self, {
                title: `The event info of node ${nodeId}`,
                value: res.body
            })
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

it('should return metadata of a node', function (done) {
    console.log(title(`\nshould return metadata of a node:`));
    let self = this;
    console.time(info("duration"));
    nodeApi.get(`/${nodeId}/metadata`)
        .set('Accept', 'application/json')
        .expect(200)
        .expect(function (res) {
            console.log(info(`The meatadata of node ${nodeId}:`));
            console.log(JSON.stringify(res.body, null, "  "));
            addContext(self, {
                title: `The metadata of node ${nodeId}`,
                value: res.body
            });
            let result = res.body;
            expect(result).to.have.property('network');
            let network = result['network'];
            assert.isNotEmpty(network);
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

it('should return Azure scheduled events of a node', function (done) {
    console.log(title(`\nshould return Azure sheduled events of a node:`));
    let self = this;
    console.time(info("duration"));
    nodeApi.get(`/${nodeId}/scheduledevents`)
        .set('Accept', 'application/json')
        .expect(200)
        .expect(function (res) {
            console.log(info(`The Azure scheduled events of node ${nodeId}:`));
            console.log(JSON.stringify(res.body, null, "  "));
            addContext(self, {
                title: `Azure scheduled events of node ${nodeId}`,
                value: res.body
            });
            expect(res.body).to.have.property('Events');
            expect(res.body['Events']).to.be.an.instanceof(Array);
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

it('should return job info with specified node id', function (done) {
    console.log(title('\nshould return job info with specified node id:'));
    let self = this;
    console.time(info("duration"));
    nodeApi.get(`/${nodeId}/jobs`)
        .set('Accept', 'application/json')
        .expect(200)
        .expect(function (res) {
            console.log(info(`The job info of node ${nodeId} is:`));
            console.log(JSON.stringify(res.body, null, "  "));
            addContext(self, {
                title: `The job info of node ${nodeId}`,
                value: res.body
            });
            expect(res.body).to.be.an.instanceOf(Array);
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

it('should return node metric history', function (done) {
    console.log(title(`\nshould return node metric history`));
    let self = this;
    console.time(info("duration"));
    nodeApi.get(`/${nodeId}/metricHistory`)
        .set('Accept', 'application/json')
        .expect(200)
        .expect(function (res) {
            let now = getTime();
            console.log(info(`Metric history of node ${nodeId} at ${now}:`));
            console.log(JSON.stringify(res.body, null, "  "));
            addContext(self, {
                title: `Metric history of node ${nodeId} at ${now}`,
                value: res.body
            });
            assert.isNotEmpty(res.body);
            let result = res.body;
            expect(result).to.have.property('span');
            expect(result).to.have.property('data');
            assert.isNotEmpty(result['data']);
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