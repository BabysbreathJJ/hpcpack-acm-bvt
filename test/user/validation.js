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
    validationBaseUrl = `${URL}/validation`,
    validationApi = supertest(validationBaseUrl),
    perCallCost = common.perCallCost,
    authorization = common.authorization;

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

it('should login failed', function (done) {
    console.log(title('\nshould return 401 unauthorized'));
    let self = this;
    console.time(info("invalid user duration"));
    validationApi.get('')
        .set('Accept', 'application/json')
        .set('Authorization', 'test')
        .timeout(perCallCost)
        .expect(401)
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("invalid user state duration"));
        })
})

it('should login success', function (done) {
    console.log(title('\nshould return 204'));
    let self = this;
    console.time(info("valid user duration"));
    validationApi.get('')
        .set('Accept', 'application/json')
        .set('Authorization', authorization)
        .timeout(perCallCost)
        .expect(204)
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("dashboard-nodes state duration"));
        })
})