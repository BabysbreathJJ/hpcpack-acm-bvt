var common = require("../common");
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
var expect = common.expect,
    assert = common.assert,
    supertest = common.supertest,
    handleError = common.handleError,
    perCallCost = common.perCallCost,
    metricsBaseUrl = `${URL}/metrics`,
    metircsApi = supertest(metricsBaseUrl),
    authorization = common.authorization;

let category = "";

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

it('should return metrics categories', function (done) {
    console.log(title(`\nshould return metrics categories:`));
    let self = this;
    console.time(info("node-metric category duration"));
    metircsApi.get(`/categories`)
        .set('Accept', 'application/json')
        .set('Authorization', authorization)
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            console.log(info(`Metircs categories:`));
            console.log(JSON.stringify(res.body, null, "  "));
            addContext(self, {
                title: 'Metircs categories',
                value: res.body
            });
            assert.isNotEmpty(res.body);
            expect(res.body).to.be.an.instanceof(Array);
            expect(res.body).to.have.lengthOf.above(0);
            category = res.body[0];
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("node-metric category duration"));
        })
})

it('should return metric info of a node', function (done) {
    console.log(title(`\nshould return metric info of a node`));
    let self = this;
    console.time(info("node-mertic info duration"));
    metircsApi.get(`/${category}`)
        .set('Accept', 'application/json')
        .set('Authorization', authorization)
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            console.log(info(`${category} info of nodes:`));
            console.log(JSON.stringify(res.body, null, "  "));
            addContext(self, {
                title: `${category} info of nodes:`,
                value: res.body
            });
            expect(res.body).to.have.property('category');
            expect(res.body).to.have.property('values');
            assert.isNotEmpty(res.body['values']);
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("node-mertic info duration"));
        })
})