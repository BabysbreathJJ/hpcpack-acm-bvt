const request = require("request");

module.exports = class Loop {
    static start(url, timeout, observer, interval = 1500) {
        let looper = { url: url, ended: false };

        let _loop = () => {
            if (looper.ended) {
                return;
            }
            let ts = new Date().getTime();
            request(url, { timeout: timeout }, function (error, response) {
                if (looper.ended) {
                    return;
                }
                let retry = false;
                if (error && error.code === 'ETIMEDOUT') {
                    retry = true;
                }
                let elapse = new Date().getTime() - ts;
                let cont = observer.next(response, error);
                if (!cont) {
                    looper.ended = true;
                    return;
                }
                let delta = interval - elapse;
                let _interval = ((delta < 0) || retry) ? 0 : delta;
                setTimeout(_loop, _interval);
            }
            );
        };
        _loop();
        return looper;
    }

    static stop(looper) {
        looper.ended = true;
    }

    static isStopped(looper) {
        return looper.ended;
    }
}