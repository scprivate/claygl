define(function(require) {

    var Easing = require('./easing');

    /**
     * @constructor
     * @alias qtek.animation.Clip
     * @param {object} [opts]
     * @param {object} [opts.target]
     * @param {number} [opts.life]
     * @param {number} [opts.delay]
     * @param {number} [opts.gap]
     * @param {number} [opts.playbackRatio]
     * @param {boolean|number} [opts.loop] If loop is a number, it indicate the loop count of animation
     * @param {string|function} [opts.easing]
     * @param {function} [opts.onframe]
     * @param {function} [opts.ondestroy]
     * @param {function} [opts.onrestart]
     */
    var Clip = function(opts) {

        opts = opts || {};

        /**
         * @type {object}
         */
        this.target = opts.target;

        if (typeof(opts.life) !== 'undefined') {
            /**
             * @type {number}
             */
            this.life = opts.life;
        }
        if (typeof(opts.delay) !== 'undefined') {
            /**
             * @type {number}
             */
            this.delay = opts.delay;
        }
        if (typeof(opts.gap) !== 'undefined') {
            /**
             * @type {number}
             */
            this.gap = opts.gap;
        }

        if (typeof(opts.playbackRatio) !== 'undefined') {
            /**
             * @type {number}
             */
            this.playbackRatio = opts.playbackRatio;
        } else {
            this.playbackRatio = 1;
        }

        this._currentTime = new Date().getTime();
        
        this._startTime = this._currentTime + this.delay;

        this._elapsedTime = 0;

        this._loop = opts.loop === undefined ? false : opts.loop;
        this.setLoop(this._loop);

        if (typeof(opts.easing) !== 'undefined') {
            this.setEasing(opts.easing);
        }

        if (typeof(opts.onframe) !== 'undefined') {
            /**
             * @type {function}
             */
            this.onframe = opts.onframe;
        }

        if (typeof(opts.ondestroy) !== 'undefined') {
            /**
             * @type {function}
             */
            this.ondestroy = opts.ondestroy;
        }

        if (typeof(opts.onrestart) !== 'undefined') {
            /**
             * @type {function}
             */
            this.onrestart = opts.onrestart;
        }

    };

    Clip.prototype = {

        gap : 0,

        life : 0,

        delay : 0,
        
        /**
         * @param {number|boolean} loop
         */
        setLoop : function(loop) {
            this._loop = loop;
            if (loop) {
                if (typeof(loop) == 'number') {
                    this._loopRemained = loop;
                } else {
                    this._loopRemained = 1e8;
                }   
            }
        },

        /**
         * @param {string|function} easing
         */
        setEasing : function(easing) {
            if (typeof(easing) === 'string') {
                easing = Easing[easing];
            }
            this.easing = easing;
        },

        /**
         * @param  {number} time
         * @return {string}
         */
        step : function(time) {
            if (time < this._startTime) {
                this._currentTime = time;
                return;
            }

            this._elapse(time);

            var percent = this._elapsedTime / this.life;

            if (percent < 0) {
                return;
            }
            if (percent > 1) {
                percent = 1;
            }

            var schedule;
            if (this.easing) {
                schedule = this.easing(percent);
            }else{
                schedule = percent;
            }
            this.fire('frame', schedule);

            if (percent == 1) {
                if (this._loop && this._loopRemained > 0) {
                    this.restart();
                    this._loopRemained--;
                    return 'restart';
                } else {
                    // Mark this clip to be deleted
                    // In the animation.update
                    this._needsRemove = true;

                    return 'destroy';
                }
            } else {
                return null;
            }
        },

        /**
         * @param  {number} time
         * @return {string}
         */
        setTime : function(time) {
            return this.step(time + this._startTime);
        },

        restart : function() {
            // If user leave the page for a while, when he gets back
            // All clips may be expired and all start from the beginning value(position)
            // It is clearly wrong, so we use remainder to add a offset
            var time = new Date().getTime();
            this._elapse(time);

            var remainder = this._elapsedTime % this.life;
            this._startTime = time - remainder + this.gap;
            this._elapsedTime = 0;
        },

        _elapse: function(time) {
            this._elapsedTime += (time - this._currentTime) * this.playbackRatio;
            this._currentTime = time;
        },
        
        fire : function(eventType, arg) {
            var eventName = 'on' + eventType;
            if (this[eventName]) {
                this[eventName](this.target, arg);
            }
        }
    };
    Clip.prototype.constructor = Clip;

    return Clip;
});