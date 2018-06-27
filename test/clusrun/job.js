var common = require("../common");
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
var expect = common.expect,
    assert = common.assert,
    supertest = common.supertest,
    clusrunBaseUrl = `${URL}/clusrun`,
    api = supertest(`${URL}`),
    clusrunApi = supertest(clusrunBaseUrl),
    perCallCost = common.perCallCost;

var handleError = common.handleError;

let nodes = [];
let clusrunJobId = -1;

before(function (done) {
    console.log(title(`\nBefore all hook of clusrun job:`));
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
    api.get('/nodes')
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
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
                done();
            } catch (err) {
                handleError(err, self);
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

it('should return 400 Bad Request when create a new clusrun without commandline property', function (done) {
    console.log(title('\nshould return 400 Bad Request when create a new clusrun without commandline: '));
    let self = this;
    clusrunApi.post('')
        .set('Accept', 'application/json')
        .send({
            targetNodes: nodes
        })
        .expect(400)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                console.log(info("400 return value: ") + res);
                addContext(self, {
                    title: '400 retrun value',
                    value: res
                });
                done();
            } catch (error) {
                handleError(error);
                done(error);
            }
        })
})

it('should return 400 Bad Request when create a new clusrun without targetNodes property', function (done) {
    console.log(title('\nshould return 400 Bad Request when create a new clusrun without targetNodes property:'));
    let self = this;
    clusrunApi.post('')
        .set('Accept', 'application/json')
        .send({
            commandLine: "whoami"
        })
        .expect(400)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                console.log(info("400 return value: ") + res);
                addContext(self, {
                    title: '400 retrun value',
                    value: res
                });
                done();
            } catch (error) {
                handleError(error, self);
                done(error);
            }
        })
})

it('should create a new clusrun job', function (done) {
    console.log(title("\nshould create a new clusrun job"));
    let self = this;
    clusrunApi.post('')
        .set('Accept', 'application/json')
        .send({
            commandLine: "whoami",
            targetNodes: nodes
        })
        .expect(201)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                console.log(info('New clusrun job location: ') + res.headers.location);
                addContext(self, {
                    title: 'New clusrun job location',
                    value: res.headers.location
                });
                expect(res.headers.location).to.include('/clusrun/');
                let locationData = res.headers.location.split('/');
                clusrunJobId = locationData[locationData.length - 1];
                done();
            } catch (error) {
                handleError(error);
                done(error);
            }
        })
})

it('should cancel a clusrun job', function (done) {
    console.log(title('\nshould cancel a clusrun job'));
    let self = this;
    clusrunApi.patch(`/${clusrunJobId}`)
        .set('Accept', 'application/json')
        .send({
            request: 'cancel'
        })
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                console.log(info("The cancel result:"));
                console.log(JSON.stringify(res.text, null, "  "));
                addContext(self, {
                    title: 'The cancel result',
                    value: res.text
                });
                done();
            } catch (error) {
                handleError(error, self);
                done(error);
            }
        })
})

it('should return detailed info with a specified clusrun job id', function (done) {
    console.log(title('\nshould return detailed job info with a specified clusrun job id'));
    let self = this;
    clusrunApi.get(`/${clusrunJobId}`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
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
                done();
            } catch (error) {
                handleError(error);
                done(error);
            }
        })
})

