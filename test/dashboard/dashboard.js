var common = require("../common");
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
const error = common.error;
var expect = common.expect,
    assert = common.assert,
    supertest = common.supertest,
    handleError = common.handleError,
    dashboardBaseUrl = `${URL}/dashboard`,
    dashboardApi = supertest(dashboardBaseUrl),
    perCallCost = common.perCallCost;

let timeout = 1000 * 60; //set timeout as 1 minute

before(function (done) {
    if (URL == '') {
        try {
            assert.fail('Should have base url', '', 'The test stopped by could not get base url, please confirm if you have passed one to run bvt.');
        } catch (error) {
            return done(error);
        }
    }
    done();
})

it('should return nodes state info', function (done) {
    console.log(title('\nshould return nodes state info'));
    let self = this;
    console.time(info("dashboard-nodes state duration"));
    dashboardApi.get('/nodes')
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            console.log(info("The result body returned by nodes api is"));
            console.log(JSON.stringify(res.body, null, "  "));
            assert.isNotEmpty(res.body);
            expect(res.body).to.have.property('data');
            let result = res.body.data;
            expect(result).to.have.property('OK');
            expect(result).to.have.property('Warning');
            expect(result).to.have.property('Error');
            assert.isNumber(result['OK'], 'The number of OK node');
            assert.isNumber(result['Warning'], 'The number of Warning node');
            assert.isNumber(result['Error'], 'The number of Error node');
            addContext(self, {
                title: `dashboard-nodes state info`,
                value: res.body
            });
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("dashboard-nodes state duration"));
        })
})

it('should return statistic of diagnostic jobs by state', function (done) {
    console.log(title("\nshould return statistic of diagnostic jobs by state"));
    console.log(info(`Timeout for diagnostic jobs state info: ${timeout} ms`));
    addContext(this, `Timeout for dashboard diagnostic jobs state info is ${timeout} ms`);
    let self = this;
    console.time(info("dashboard-diag jobs duration"));
    dashboardApi.get('/diagnostics')
        .set('Accept', 'application/json')
        .timeout(timeout)
        .expect(200)
        .expect(function (res) {
            console.log(info("The result body returned by diagnostic api is"));
            console.log(JSON.stringify(res.body, null, "  "));
            assert.isNotEmpty(res.body);
            expect(res.body).to.have.property('data');
            let result = res.body.data;
            expect(result).to.have.property('Queued');
            expect(result).to.have.property('Running');
            expect(result).to.have.property('Finished');
            expect(result).to.have.property('Finishing');
            expect(result).to.have.property('Canceling');
            expect(result).to.have.property('Canceled');
            expect(result).to.have.property('Failed');
            assert.isNumber(result['Queued'], 'The number of Queued diagnostic job');
            assert.isNumber(result['Running'], 'The number of Running diagnostic job');
            assert.isNumber(result['Finished'], 'The number of Finished diagnostic job');
            assert.isNumber(result['Finishing'], 'The number of Finishing diagnostic job');
            assert.isNumber(result['Canceling'], 'The number of Canceling diagnostic job');
            assert.isNumber(result['Failed'], 'The number of Failed diagnostic job');
            addContext(self, {
                title: `dashboard diagnostic job info`,
                value: res.body
            });
        })
        .end((err, res) => {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("dashboard-diag jobs duration"));
        })
})

it('should return statistic of clusrun jobs by state', function (done) {
    console.log(title("\nshould return statistic of clusrun jobs by state"));
    console.log(info(`Timeout for clusrun jobs state info: ${timeout} ms`));
    addContext(this, `Timeout for dashboard clusrun jobs state info is ${timeout} ms`);
    let self = this;
    console.time(info("dashboard-clusurn jobs duration"));
    dashboardApi.get('/clusrun')
        .set('Accept', 'application/json')
        .timeout(timeout)
        .expect(200)
        .expect(function (res) {
            console.log(info("The result body returned by clusrun api is"));
            console.log(JSON.stringify(res.body, null, "  "));
            assert.isNotEmpty(res.body);
            expect(res.body).to.have.property('data');
            let result = res.body.data;
            expect(result).to.have.property('Queued');
            expect(result).to.have.property('Running');
            expect(result).to.have.property('Finished');
            expect(result).to.have.property('Finishing');
            expect(result).to.have.property('Canceling');
            expect(result).to.have.property('Canceled');
            expect(result).to.have.property('Failed');
            assert.isNumber(result['Queued'], 'The number of Queued diagnostic job');
            assert.isNumber(result['Running'], 'The number of Running diagnostic job');
            assert.isNumber(result['Finished'], 'The number of Finished diagnostic job');
            assert.isNumber(result['Finishing'], 'The number of Finishing diagnostic job');
            assert.isNumber(result['Canceling'], 'The number of Canceling diagnostic job');
            assert.isNumber(result['Failed'], 'The number of Failed diagnostic job');
            addContext(self, {
                title: `dashboard clusrun job info`,
                value: res.body
            });
        })
        .end((err, res) => {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("dashboard-clusurn jobs duration"));
        })
})