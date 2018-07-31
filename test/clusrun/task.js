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
    clusrunBaseUrl = `${URL}/clusrun`,
    outputBaseUrl = `${URL}/output/clusrun`,
    clusrunApi = supertest(clusrunBaseUrl),
    outputApi = supertest(outputBaseUrl),
    perCallCost = common.perCallCost;


let jobId = -1;
let taskId = -1;
let jobNum = 100;
let resultKey = "";
let maxNum = Number.MAX_VALUE;
let outputInitOffset = -8192;
let outputPageSize = 8192;

before(function (done) {
    console.log(title("\nBefore all hook of clusrun task: "));
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
    console.time(info("clusrun task-before all hook get job list duration"));
    clusrunApi.get(`?lastid=${maxNum}&count=${jobNum}&reverse=true`)
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            console.log(info("The result body length returned from diag list api: ") + res.body.length);
            addContext(self, {
                title: 'clusrun list size',
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
                return done(err);
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
            console.timeEnd(info("clusrun task-before all hook get job list duration"));
        })
})

it('should return task list with a specified job id', function (done) {
    console.log(title("\nshould return task list with a specified job id"));
    console.log(info("Job id is: ") + jobId);
    addContext(this, `Job id is ${jobId}`);
    let self = this;
    console.time(info("clusrun-task list duration"));
    clusrunApi.get(`/${jobId}/tasks`)
        .set('Accept', 'application/json')
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
            expect(firstTask).to.have.property('jobType', 'ClusRun');
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
            console.timeEnd(info("clusrun-task list duration"));
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
    console.time(info("clusrun task-detailed task info duration"));
    clusrunApi.get(`/${jobId}/tasks/${taskId}`)
        .set('Accpet', 'application/json')
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
            console.timeEnd(info("clusrun task-detailed task info duration"));
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
    console.time(info("clusrun task-task result duration"));
    clusrunApi.get(`/${jobId}/tasks/${taskId}/result`)
        .set('Accept', 'application/json')
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
            resultKey = taskRes['resultKey'];
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusrun task-task result duration"));
        });
})

it('should get the whole output of a task', function (done) {
    console.log(title('\nshould get the whole output of a task'));
    console.log(info("Job id is: ") + jobId);
    console.log(info("Task id is: ") + taskId);
    addContext(this, `Job id is ${jobId}`);
    addContext(this, `Task id is ${taskId}`);
    expect(taskId).to.be.a('number');
    let self = this;
    console.time(info("clusrun task-whole output duration"));
    outputApi.get(`/${resultKey}/raw`)
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            console.log(info(`task ${taskId} whole output:`));
            console.log(JSON.stringify(res.body), null, "  ");
            addContext(self, {
                title: "Result body",
                value: res.body
            });
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusrun task-whole output duration"));
        });

})



it('should get partial output of a task', function (done) {
    console.log(title(`\nshould get partial output of a task`));
    console.log(info("Job id is: ") + jobId);
    console.log(info("Task id is: ") + taskId);
    addContext(this, `Job id is ${jobId}`);
    addContext(this, `Task id is ${taskId}`);

    let self = this;
    console.time(info("clusrun task-partial output duration"));
    outputApi.get(`/${resultKey}/page?offset=${outputInitOffset}&pageSize=${outputPageSize}`)
        .set('Accept', 'application/json')
        .timeout(perCallCost)
        .expect(200)
        .expect(function (res) {
            assert.isNotEmpty(res.body);
            console.log(info(`task ${taskId} partial output:`));
            console.log(JSON.stringify(res.body), null, "  ");
            addContext(self, {
                title: 'Output result',
                value: res.body
            });
            let result = res.body;
            expect(result).to.have.property('offset');
            expect(result).to.have.property('size');
        })
        .end(function (err, res) {
            if (err) {
                handleError(err, self);
                return done(err);
            }
            done();
            console.timeEnd(info("clusrun task-partial output duration"));
        });
})