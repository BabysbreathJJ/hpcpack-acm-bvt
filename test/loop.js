const request = require("request");
module.exports = class Loop {
    static start(url, observer, interval = 1500) {
        let looper = { url: url, ended: false };

        let _loop = () => {
            if (looper.ended) {
                return;
            }
            let ts = new Date().getTime();
            request(url, function (error, reponse) {
                if (error !== null) {
                    looper.ended = true;
                    if (observer.error) {
                        observer.error(err);
                    }
                }
                if (looper.ended) {
                    return;
                }
                let elapse = new Date().getTime() - ts;
                let n = observer.next(reponse, error);
                if (!n) {
                    looper.ended = true;
                    return;
                }
                let delta = interval - elapse;
                let _interval = delta > 0 ? delta : 0;
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