var common = require("../common");
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
const error = common.error;
var handleError = common.handleError;
var expect = common.expect,
    assert = common.assert,
    supertest = common.supertest,
    perCallCost = common.perCallCost,
    diagBaseUrl = `${URL}/diagnostics`,
    diagApi = supertest(diagBaseUrl),
    perCallCost = common.perCallCost,
    authorization = common.authorization;


let jobId = -1;
let taskId = -1;
let jobNum = 100;

before(function (done) {
    console.log(title("\nBefore all hook of diag task: "));
    addContext(this, `Config ${perCallCost} ms as the timeout value of every api call.`);
    addContext(this, {
        title: 'diag list base url: ',
        value: `${diagBaseUrl}`
    });

    if (URL == '') {
        try {
            assert.fail('Should have base url', '', 'The test stopped by could not get base url, please confirm if you have passed one to run bvt.');
        } catch (error) {
            return done(error);
        }
    }

    let self = this;
    console.time(info("diag task-before all hook diga list duration"));
    diagApi.get(`?lastid=0&count=${jobNum}&reverse=true`)
        .set('Accept', 'application/json')
        .set('Authorization', authorization)
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
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
            if (job == undefined || job == null) {
                console.log(error(`Couldn't find a Finished job in recent ${jobNum} jobs`));
                assert.fail(`Should find a Finished job in recent ${jobNum} jobs`, '', `Couldn't find a Finished job in recent ${jobNum} jobs`);
            }
            jobId = job.id;
            console.log(info("The selected job id is: ") + jobId);
            addContext(self, {
                title: 'Job id',
                value: jobId
            });
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("diag task-before all hook diga list duration"));
        })
})

it('should return task list with a specified job id', function (done) {
    console.log(title("\nshould return task list with a specified job id"));
    console.log(info("Job id is: ") + jobId);
    addContext(this, `Job id is ${jobId}`);
    let self = this;
    console.time(info("diag task-task list of a job duration"));
    diagApi.get(`/${jobId}/tasks`)
        .set('Accept', 'application/json')
        .set('Authorization', authorization)
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            result = res.body;
            assert.isArray(result);
            addContext(self, {
                title: 'Result body',
                value: result
            });
            console.log(info(`The task number of job ${jobId} is: `) + result.length);
            expect(result.length).to.be.above(0);
            let firstTask = result[0];
            expect(firstTask).to.have.property('jobId', Number(jobId));
            expect(firstTask).to.have.property('jobType', 'Diagnostics');
            taskId = firstTask['id'];
            console.log(info(`The first task id of job ${jobId}: `) + taskId);
            addContext(self, {
                title: `The first task id of job ${jobId}`,
                value: taskId
            });
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("diag task-task list of a job duration"));
        })
})

it('should get detailed task info with a specified task id', function (done) {
    console.log("\nshould get detailed task info with a specified task id");
    console.log(info("Job id is: ") + jobId);
    console.log(info("Task id is: ") + taskId);
    addContext(this, `Job id is ${jobId}`);
    addContext(this, `Task id is ${taskId}`);
    expect(taskId).to.be.a('number');
    let self = this;
    console.time(info("diag task-task info duration"));
    diagApi.get(`/${jobId}/tasks/${taskId}`)
        .set('Accpet', 'application/json')
        .set('Authorization', authorization)
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            assert.isNotEmpty(res.body);
            addContext(self, {
                title: 'Result body',
                value: res.body
            });
            console.log(JSON.stringify(res.body, null, "  "));
            let taskInfo = res.body;
            expect(taskInfo).to.have.property('jobId', Number(jobId));
            expect(taskInfo).to.have.property('id', taskId);
            expect(taskInfo).to.have.property('state');
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("diag task-task info duration"));
        });
})

it('should get a task result with a specified task id', function (done) {
    console.log("\nshould get result of a specified task id");
    console.log(info("Job id is: ") + jobId);
    console.log(info("Task id is: ") + taskId);
    addContext(this, `Job id is ${jobId}`);
    addContext(this, `Task id is ${taskId}`);
    expect(taskId).to.be.a('number');
    let self = this;
    console.time(info("diag task-task result uration"));
    diagApi.get(`/${jobId}/tasks/${taskId}/result`)
        .set('Accept', 'application/json')
        .set('Authorization', authorization)
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            assert.isNotEmpty(res.body);
            addContext(self, {
                title: "Result body",
                value: res.body
            });
            console.log(info(`task ${taskId} result is:`));
            console.log(JSON.stringify(res.body, null, "  "));
            let taskRes = res.body;
            expect(taskRes).to.have.property('jobId', jobId);
            expect(taskRes).to.have.property('taskId', taskId);
            expect(taskRes).to.have.property('resultKey');
        })
        .end(function (err, res) {
            console.timeEnd(info("diag task-task result uration"));
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
        });
})