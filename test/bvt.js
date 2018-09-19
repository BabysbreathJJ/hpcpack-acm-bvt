var common = require('./common');
const maxTimeout = 1000 * 60 * 60 * 24;
var URL = common.URL;
const addContext = common.addContext;
const info = common.info;
const title = common.title;
var expect = common.expect,
    assert = common.assert,
    supertest = common.supertest,
    handleError = common.handleError,
    perCallCost = common.perCallCost,
    authorization = common.authorization;

function importTest(name, path) {
    describe(name, function () {
        this.timeout(maxTimeout);
        require(path);
    });
}



describe("hpc-acm-bvt", function () {
    importTest('Validation', './user/validation')
    importTest('Dashboard', './dashboard/dashboard');
    importTest('Node-list', './node/node-list');
    importTest('Node', './node/node');
    importTest('Metrics', './node/metrics');
    importTest('Diag-job', './diagnostic/job');
    importTest('Diag-task', './diagnostic/task');
    importTest('Clusrun-job', './clusrun/job');
    importTest('Clusrun-task', './clusrun/task');
    after(function () {
        console.log(common.info("\nAll tests ends"));
    });
})