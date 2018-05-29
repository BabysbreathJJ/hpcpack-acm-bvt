var should = require('chai').should(),
    expect = require('chai').expect,
    assert = require('chai').assert;
supertest = require('supertest'),
    api = supertest('http://evanclinuxdev1.eastasia.cloudapp.azure.com:8080/v1'),
    diagApi = supertest('http://evanclinuxdev1.eastasia.cloudapp.azure.com:8080/v1/diagnostics');

describe('Diag', function () {
    var nodes = [];
    var test = {};
    var jobId = '';
    var taskId = '';
    var jobState = '';

    before((done) => {
        api.get('/nodes')
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.body.forEach(element => {
                    nodes.push(element.id);
                });
                done();
            });
    });

    it('should have nodes data', (done) => {
        assert.isNotEmpty(nodes);
        done();
    })

    it('should return diag tests list', (done) => {
        diagApi.get('/tests')
            .set('Accept', 'application/json')
            .end((err, res) => {
                assert.isArray(res.body);
                if (res.body.length > 0) {
                    test = res.body[0];
                }
                done();
            });
    })

    it('should create a new diag test', (done) => {
        if (nodes.length > 4) {
            nodes = nodes.slice(0, 4);
        }
        diagApi.post('')
            .set('Accept', 'application/json')
            .send({
                name: 'diag-BVT-test',
                targetNodes: nodes,
                jobType: 'diagnostics',
                diagnosticTest: test
            })
            .expect(201)
            .end((err, res) => {
                expect(res.headers.location).to.include('/v1/diagnostics/');
                let locationData = res.headers.location.split('/');
                jobId = locationData[locationData.length - 1];
                done();
            });
    })

    this.timeout(200000);
    it('should finish a diag test of 4 nodes in 3 minutes', (done) => {
        setTimeout(function () {
            diagApi.get('/' + jobId)
                .set('Accept', 'application/json')
                .end((err, res) => {
                    expect(res.body.state).equal('Finished');
                    done();
                });
        }, 180000)

    })
});

