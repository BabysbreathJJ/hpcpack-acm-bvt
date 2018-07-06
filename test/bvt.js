var common = require('./common');
const maxTimeout = 1000 * 60 * 60 * 24;
function importTest(name, path) {
    describe(name, function () {
        this.timeout(maxTimeout);
        require(path);
    });
}



describe("hpc-acm-bvt", function () {
    importTest('Dashboard', './dashboard/dashboard');
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