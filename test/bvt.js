var common = require('./common');
const perCallCost = common.perCallCost;
function importTest(name, path) {
    describe(name, function () {
        this.timeout(perCallCost);
        require(path);
    });
}



describe("hpc-acm-bvt", function () {
    importTest('Node', './node/node');
    importTest('Diag-job', './diagnostic/job');
    importTest('Diag-task', './diagnostic/task');
    after(function () {
        console.log(common.info("\nAll tests ends"));
    });
})