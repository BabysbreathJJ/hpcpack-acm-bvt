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
        assert.fail('Should have base url', '', 'The test stopped by could not get base url, please confirm if you have passed one to run bvt.');
        return done(err);
    }

    let self = this;
    clusrunApi.get(`?lastid=${maxNum}&count=${jobNum}&reverse=true`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                console.log(info('The last 100 clusrun job is: '));
                console.log(JSON.stringify(res.body, null, "  "));
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
                done();
            } catch (err) {
                handleError(err, self);
                done(err);
            }
        })
})

it('should return task list with a specified job id', function (done) {
    console.log(title("\nshould return task list with a specified job id"));
    console.log(info("Job id is: ") + jobId);
    addContext(this, `Job id is ${jobId}`);
    let self = this;
    clusrunApi.get(`/${jobId}/tasks`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
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
                done();
            } catch (error) {
                handleError(error, self);
                done(error);
            }
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
    clusrunApi.get(`/${jobId}/tasks/${taskId}`)
        .set('Accpet', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
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
                expect(taskInfo).to.have.property('state');
                done();
            } catch (error) {
                handleError(error, self);
                done(error);
            }
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
    clusrunApi.get(`/${jobId}/tasks/${taskId}/result`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
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
                done();
            } catch (error) {
                handleError(error, self);
                done(error);
            }
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
    outputApi.get(`/${resultKey}/raw`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(err);
                }
                console.log(info(`task ${taskId} whole output:`));
                console.log(JSON.stringify(res.body), null, "  ");
                addContext(self, {
                    title: "Result body",
                    value: res.body
                });
                assert.isNotEmpty(res.body);
                done();
            } catch (error) {
                handleError(error, self);
                done(error);
            }
        });

})



it('should get partial output of a task', function (done) {
    console.log(title(`\nshould get partial output of a task`));
    console.log(info("Job id is: ") + jobId);
    console.log(info("Task id is: ") + taskId);
    addContext(this, `Job id is ${jobId}`);
    addContext(this, `Task id is ${taskId}`);

    let self = this;
    outputApi.get(`/${resultKey}/page?offset=${outputInitOffset}&pageSize=${outputPageSize}`)
        .set('Accept', 'application/json')
        .expect(200)
        .end(function (err, res) {
            try {
                if (err) {
                    handleError(err, self);
                    return done(er);
                }
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
                done();
            } catch (error) {
                handleError(error, self);
                done(error);
            }
        });
})