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
    nodeBaseUrl = `${URL}/nodes`,
    nodeApi = supertest(nodeBaseUrl),
    authorization = common.authorization;

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

it('should return nodes list', function (done) {
    console.log(title(`\nshould return nodes list:`));
    let self = this;
    console.time(info("node-list duration"));
    nodeApi.get('')
        .set('Accept', 'application/json')
        .set('Authorization', authorization)
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
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("node-list duration"));
        })
})
