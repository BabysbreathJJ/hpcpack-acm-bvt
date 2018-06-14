var common = require("../common");
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
var handleError = common.handleError;
var expect = common.expect,
    assert = common.assert;
supertest = common.supertest,
    diagBaseUrl = `${URL}/diagnostics`,
    diagApi = supertest(diagBaseUrl),
    perCallCost = common.perCallCost;


let jobId = -1;
let taskId = -1;
let maxNum = Number.MAX_VALUE;

let taskQueryTimeout = 1000 * 3;
const interval = 500;


before(function (done) {
    console.log(title("\nBefore all hook of diag task: "));
    addContext(this, `Config ${perCallCost} ms as the timeout value of every api call.`);
    addContext(this, {
        title: 'diag lsit api: ',
        value: `${diagBaseUrl}`
    });
    if (URL == '') {
        assert.fail('Should have base url', '', 'The test stopped by could not get base url, please confirm if you have passed one to run bvt.');
    }

    let self = this;
    diagApi.get(`?lastid=${maxNum}&count=100&reverse=true`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                console.log(info('The last 100 diag job is: '));
                console.log(JSON.stringify(res.body, null, "  "));
                console.log(info("The result body length returned from diag list api: ") + res.body.length);
                addContext(self, {
                    title: 'Diag list size',
                    value: res.body.length
                });
                assert.isNotEmpty(res.body);
                expect(res.body).to.be.an.instanceof(Array);
                expect(res.body.length).to.be.above(1);
                let job = res.body.find(function (ele) {
                    return ele.state == 'Finished'
                });
                jobId = job.id;
                console.log(info("The selected job id is: ") + jobId);
                addContext(self, {
                    title: 'Job id',
                    value: jobId
                });
                done();
            } catch (err) {
                handleError(err, self);
                done(err);
            }
        })
})

it('should return task list with a specified job id', function (done) {
    console.log(title("\nshould return task list with a specified job id"));
    console.log(info(`Considering the task may be not created, so we query the task every ${interval}(ms) in ${taskQueryTimeout}(ms)`));
    let self = this;
    this.timeout(taskQueryTimeout);
    let startTime = new Date();
    diagApi.get(`/${jobId}/tasks`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                done(err);
                return false;
            }
            result = res.body;
            assert.isArray(result);
            addContext(self, {
                title: 'Result body',
                value: result
            });
            console.log(info(`The task number of job ${jobId} is: `) + result.length);
            expect(result.length).to.be.above(1);
            let firstTask = result[0];
            expect(firstTask).to.have.property('jobId', Number(jobId));
            expect(firstTask).to.have.property('jobType', 'Diagnostics');
            taskId = firstTask['id'];
            console.log(info(`The first task id of job ${jobId}: `) + taskId);
            addContext(self, {
                title: `The first task id of job ${jobId}`,
                value: taskId
            });
            done();
        })
})

it('should get result of a specified task', function (done) {
    console.log("\nshould get a specified task info");
    console.log(info("Job id is: ") + jobId);
    console.log(info("Task id is: ") + taskId);
    expect(taskId).to.be.a('number');
    let self = this;
    diagApi.get(`/${jobId}/tasks/${taskId}`)
        .set('Accpet', 'application/json')
        .expect(200)
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            assert.isNotEmpty(res.body);
            addContext(self, {
                title: 'Result body',
                value: res.body
            });
            console.log(JSON.stringify(res.body, null, "  "));
            let taskInfo = res.body;
            expect(taskInfo).to.have.property('jobId', Number(jobId));
            expect(taskInfo).to.have.property('id', taskId);
            done();
        });
})
