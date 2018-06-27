var common = require("../common");
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
var expect = common.expect,
    assert = common.assert,
    supertest = common.supertest,
    handleError = common.handleError,
    metricsBaseUrl = `${URL}/metrics`,
    metircsApi = supertest(metricsBaseUrl);

let category = "";

before(function (done) {
    if (URL == '') {
        assert.fail('Should have base url', '', 'The test stopped by could not get base url, please confirm if you have passed one to run bvt.');
        return done(err);
    }
    done();
})

it('should return metrics categories', function (done) {
    console.log(title(`\nshould return metrics categories:`));
    let self = this;
    metircsApi.get(`/categories`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
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
                done();
            } catch (error) {
                handleError(error, self);
                done(error);
            }
        })
})

it('should return metric info of a node', function (done) {
    console.log(title(`\nshould return metric info of a node`));
    let self = this;
    metircsApi.get(`/${category}`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                console.log(info(`${category} info of nodes:`));
                console.log(JSON.stringify(res.body, null, "  "));
                addContext(self, {
                    title: `${category} info of nodes:`,
                    value: res.body
                });
                expect(res.body).to.have.property('category');
                expect(res.body).to.have.property('values');
                assert.isNotEmpty(res.body['values']);
                done();
            } catch (error) {
                handleError(error);
                done(error);
            }
        })
})