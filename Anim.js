function raf() {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x] + 'CancelAnimationFrame'] ||    // Webkit中此取消方法的名字变了
            window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
}
raf()


// http://cubic-bezier.com/
var NEWTON_ITERATIONS = 4;
var NEWTON_MIN_SLOPE = 0.01; //0.001;
var SUBDIVISION_PRECISION = 0.00001; //0.0000001;
var SUBDIVISION_MAX_ITERATIONS = 10;
var kSplineTableSize = 11;
var kSampleStepSize = 1.0 / (kSplineTableSize - 1.0);

var float32ArraySupported = typeof Float32Array === 'function';

function A(aA1, aA2) { return 1.0 - 3.0 * aA2 + 3.0 * aA1; }
function B(aA1, aA2) { return 3.0 * aA2 - 6.0 * aA1; }
function C(aA1) { return 3.0 * aA1; }

// Returns x(t) given t, x1, and x2, or y(t) given t, y1, and y2.
function calcBezier(aT, aA1, aA2) { return ((A(aA1, aA2) * aT + B(aA1, aA2)) * aT + C(aA1)) * aT; }

// Returns dx/dt given t, x1, and x2, or dy/dt given t, y1, and y2.
function getSlope(aT, aA1, aA2) { return 3.0 * A(aA1, aA2) * aT * aT + 2.0 * B(aA1, aA2) * aT + C(aA1); }

function binarySubdivide(aX, aA, aB, mX1, mX2) {
    var currentX, currentT, i = 0;
    do {
        currentT = aA + (aB - aA) / 2.0;
        currentX = calcBezier(currentT, mX1, mX2) - aX;
        if (currentX > 0.0) {
            aB = currentT;
        } else {
            aA = currentT;
        }
    } while (Math.abs(currentX) > SUBDIVISION_PRECISION && ++i < SUBDIVISION_MAX_ITERATIONS);
    return currentT;
}

function newtonRaphsonIterate(aX, aGuessT, mX1, mX2) {
    for (var i = 0; i < NEWTON_ITERATIONS; ++i) {
        var currentSlope = getSlope(aGuessT, mX1, mX2);
        if (currentSlope === 0.0) {
            return aGuessT;
        }
        var currentX = calcBezier(aGuessT, mX1, mX2) - aX;
        aGuessT -= currentX / currentSlope;
    }
    return aGuessT;
}
function bezier(mX1, mY1, mX2, mY2, back) {
    if (!(0 <= mX1 && mX1 <= 1 && 0 <= mX2 && mX2 <= 1)) { // eslint-disable-line yoda
        throw new Error('bezier x values must be in [0, 1] range');
    }
    // Precompute samples table
    var sampleValues = float32ArraySupported ? new Float32Array(kSplineTableSize) : new Array(kSplineTableSize);
    if (mX1 !== mY1 || mX2 !== mY2) {
        for (var i = 0; i < kSplineTableSize; ++i) {
            sampleValues[i] = calcBezier(i * kSampleStepSize, mX1, mX2);
        }
    }

    function getTForX(aX) {
        var intervalStart = 0.0;
        var currentSample = 1.0;
        // var currentSample =4
        var lastSample = kSplineTableSize - 1;

        for (; currentSample !== lastSample && sampleValues[currentSample] <= aX; ++currentSample) {
            intervalStart += kSampleStepSize;
        }
        --currentSample;

        // Interpolate to provide an initial guess for t
        var dist = (aX - sampleValues[currentSample]) / (sampleValues[currentSample + 1] - sampleValues[currentSample]);
        var guessForT = intervalStart + dist * kSampleStepSize;

        var initialSlope = getSlope(guessForT, mX1, mX2);
        if (initialSlope >= NEWTON_MIN_SLOPE) {
            return newtonRaphsonIterate(aX, guessForT, mX1, mX2);
        } else if (initialSlope === 0.0) {
            return guessForT;
        } else {
            return binarySubdivide(aX, intervalStart, intervalStart + kSampleStepSize, mX1, mX2);
        }
    }

    return function BezierEasing(x) {
        if (mX1 === mY1 && mX2 === mY2) {
            return x; // linear
        }
        // Because JavaScript number are imprecise, we should guarantee the extremes are right.
        if (x === 0) {
            return 0;
        }
        if (x === 1) {
            return 1;
        }
        let end = calcBezier(getTForX(x), mY1, mY2)
        if (back) {
            end = end > 0.5 ? 1 - end : end
        }
        return end
    }
}

// Anim.js
var SPAN = 0.0167
let Anim = {
    init(duration, progress, easing) {
        let child = {
            duration: duration,
            easing: easing ? easing : Anim.ease.ease,
            progress: progress,
            stoping: false,
            replay: 0,
            yoyo: false,
            callbackTime: 1,
            delay: 0,
            play(finished, isback = false) {
                let duration = child.duration, delay = child.delay
                let n = 0, p = 0, dp = 0
                let ones = () => {
                    if (child.stoping) { child.stoping = false; return }
                    if (dp < delay) {
                        dp += SPAN
                        requestAnimationFrame(ones)
                        return
                    }
                    n += SPAN
                    let cease = child.easing
                    let eas
                    let backNum = 1
                    if (child.yoyo === true) {
                        backNum = 0
                        eas = bezier(cease[0], cease[1], cease[2], cease[3], true)
                    } else {
                        eas = bezier(cease[0], cease[1], cease[2], cease[3])
                    }
                    p = eas(n / duration)
                    if (isback) p = 1 - p
                    child.progress(p)
                    if (n < duration) {
                        requestAnimationFrame(ones)
                    } else {
                        child.progress(backNum)
                        if (child.replay > 1) {
                            child.replay--
                            n = 0
                            requestAnimationFrame(ones)
                        } else {
                            if (finished) finished()
                        }
                    }
                }
                requestAnimationFrame(ones)
            },
            playBack(finished) {
                this.play(finished, true)
            },
            stop() {
                child.stoping = true
            }
        }
        return child
    },
    queue(anims) {
        let child = {
            anims: anims || [],
            replayAnims: [],
            replay: 0,
            play(finished) {
                if (child.replay) child.replayAnims = child.anims
                if (child.anims.length) {
                    function ones() {
                        let anims = child.anims.shift()
                        anims.play(function () {
                            if (child.anims.length) {
                                requestAnimationFrame(ones)
                            } else if (child.replay > 1) {
                                child.replay--
                                child.anims = child.replayAnims
                                requestAnimationFrame(ones)
                            } else {
                                child.anims = []
                                child.replayAnims = []
                                if (finished) finished()
                            }
                        })
                    }
                    requestAnimationFrame(ones)
                }
            }
        }
        return child
    },
    ease: {
        ease: [0.25, 0.1, 0.25, 1],
        linear: [0, 0, 1, 1],
        easeIn: [.42, 0, 1, 1],
        easeOut: [0, 0, .58, 1],
        easeInOut: [.42, 0, .58, 1],
        spring: [.32, 1.59, .41, .94],
        superEase: [.58, .21, .28, .98],
    },
    motion(a, b, p, key) {
        let _a = a
        let _b = b
        if (key != null && p < 0.999) {
            let list = this.motionList
            if (list[key] === undefined) {
                list[key] = a
                list[key + '___b'] = b
            }
            else {
                _a = list[key]
                _b = list[key + '___b']
            }
        }
        else {
            this.motionList[key] = undefined
            this.motionList[key + '___b'] = undefined
        }
        let end = _a + (_b - _a) * p
        return end
    },
    motionList: {},
}

module.exports = Anim
