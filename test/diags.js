var should = require('chai').should(),
    expect = require('chai').expect,
    assert = require('chai').assert;
supertest = require('supertest'),
    diagBaseUrl = 'http://evanclinuxdev1.eastasia.cloudapp.azure.com:8080/v1/diagnostics',
    api = supertest('http://evanclinuxdev1.eastasia.cloudapp.azure.com:8080/v1'),
    diagApi = supertest('http://evanclinuxdev1.eastasia.cloudapp.azure.com:8080/v1/diagnostics'),
    Loop = require('./loop.js');


describe('Diag', function () {
    let nodes = [];
    let test = {};
    let jobId = '';
    let taskId = '';
    let jobState = '';
    let pingpong = {};
    let ring = {};
    let timeout = 0;

    before((done) => {
        api.get('/nodes')
            .set('Accept', 'application/json')
            .end((err, res) => {
                res.body.forEach(e => {
                    if (e.health == 'OK') {
                        nodes.push(e.id);
                    }
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
                    pingpong = res.body.find((e) => {
                        return e.name == 'pingpong';
                    });
                    pingpong.arguments = "[]";
                    ring = res.body.find((e) => {
                        return e.name == 'ring';
                    });
                    ring.arguments = "[]";
                }
                done();
            });
    })

    it('should create a new pingpong diag test', (done) => {
        if (nodes.length > 4) {
            nodes = nodes.slice(0, 4);
        }
        diagApi.post('')
            .set('Accept', 'application/json')
            .send({
                name: 'diag-BVT-test',
                targetNodes: nodes,
                jobType: 'diagnostics',
                diagnosticTest: pingpong
            })
            .expect(201)
            .end((err, res) => {
                expect(res.headers.location).to.include('/v1/diagnostics/');
                let locationData = res.headers.location.split('/');
                jobId = locationData[locationData.length - 1];
                done();
            });
    })


    this.timeout(nodes.length * 30000);
    it('should get a pinpong diag test result before timeout', (done) => {
        let startTime = new Date();
        timeout = nodes.length * 30000;
        console.log(timeout);
        let loop = Loop.start(
            diagBaseUrl + '/' + jobId,
            {
                next: (result) => {
                    result = JSON.parse(result);
                    console.log(result.state);
                    let endTime = new Date();
                    let elapseTime = endTime - startTime;
                    if (result.state == 'Finished') {
                        assert.ok(result.state === 'Finished', 'pingpong diag test finished in ' + elapseTime + ' ms.');
                        done();
                        return false;
                    }
                    else if (result.state == 'Failed') {
                        assert.ok(result.state === 'Failed', 'pingpong diag test faied in ' + elapseTime + ' ms.');
                        done();
                        return false;
                    }

                    if (elapseTime > timeout) {
                        assert.fail("actual runtime " + elapseTime + ' ms', "expected time " + timeout + ' ms', "The pingpong diag test doesn't finished in expected time, time elapses: " + elapseTime + ' ms, the max time is ' + timeout + ' ms');
                        done();
                        return false;
                    }
                    return true;
                }
            },
            10000
        );
    })

    // it('should create a new ring diag test', (done) => {
    //     if (nodes.length > 4) {
    //         nodes = nodes.slice(0, 4);
    //     }
    //     diagApi.post('')
    //         .set('Accept', 'application/json')
    //         .send({
    //             name: 'diag-BVT-test',
    //             targetNodes: nodes,
    //             jobType: 'diagnostics',
    //             diagnosticTest: ring
    //         })
    //         .expect(201)
    //         .end((err, res) => {
    //             expect(res.headers.location).to.include('/v1/diagnostics/');
    //             let locationData = res.headers.location.split('/');
    //             jobId = locationData[locationData.length - 1];
    //             done();
    //         });
    // })

});
