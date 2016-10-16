//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview Simple server-side logging methods which support the basic API
 *     found in the client with respect to logging levels etc.
 */
//  ========================================================================

/* eslint no-console:0 */

(function() {

    var Logger,
        Color;

    Color = require('./tibet_color');


    /**
     * Creates a new logger instance for use in logging leveled, colorized
     * output to the system console.
     * @param {Object} options Options for controlling the new instance. Common
     *     values of interest to the logger include 'level', 'debug',
     *     and those required by the 'Color' object found in tibet_color.js.
     * @return {Logger} The primitive logger instance.
     */
    Logger = function(options) {
        var level;

        this.options = options || {};

        if (this.options.debug) {
            level = Logger.DEBUG;
        } else {
            level = Logger.INFO;
        }
        this.setLevel(this.options.level || level);

        this.color = new Color(this.options);

        return this;
    };


    //  Standard TIBET logging levels. Used to filter based on level.
    Logger.TRACE = 1;
    Logger.DEBUG = 2;
    Logger.INFO = 3;
    Logger.WARN = 4;
    Logger.ERROR = 5;
    Logger.SEVERE = 6;
    Logger.FATAL = 7;
    Logger.SYSTEM = 8;


    /**
     * Levels in string form. Used to verify a logging level is valid.
     * @type {Array.<String>}
     */
    Logger.LEVELS = [
        'any',
        'trace',
        'debug',
        'info',
        'warn',
        'error',
        'severe',
        'fatal',
        'system'
    ];


    /**
     * Returns the currently set logging level for this instance.
     * @return {Number} The logging level as a numeric value.
     */
    Logger.prototype.getLevel = function() {
        return this.level;
    };


    /**
     * Returns the normalized level value from a string or numeric level
     * representation. Used to ensure level values are always numeric internally
     * to the logger and other methods.
     * @param {String|Number} aLevel The numeric or string level to normalize.
     * @return {Number} The numeric level value for the input level.
     */
    Logger.prototype.getLevelValue = function(aLevel) {
        var lvl;

        if (typeof aLevel === 'number') {
            lvl = aLevel;
        } else {
            lvl = Logger[aLevel.toUpperCase()];
            if (typeof lvl !== 'number') {
                throw new Error('InvalidLevel');
            }
        }

        return lvl;
    };


    /**
     * Sets the current logging level for this instance.
     * @param {String|Number} aLevel The numeric or string level to set.
     * @return {Number} The newly set logging level as a numeric value.
     */
    Logger.prototype.setLevel = function(aLevel) {
        var lvl;

        lvl = this.getLevelValue(aLevel);
        this.level = lvl;

        return this;
    };


    /**
     * Logs a message to the console, filtering it by the level provided and
     * optionally colorizing it using the colorizing spec given.
     * @param {String} msg The message to log.
     * @param {String} spec A colorizing spec per tibet_color.js requirements.
     * @param {Number|String} [level=Logger.INFO] The level to filter by.
     * @return {Logger} The logger instance.
     */
    Logger.prototype.log = function(msg, spec, level) {
        var lvl;

        if (this.options.silent === true) {
            return;
        }

        lvl = this.getLevelValue(level || Logger.INFO);
        if (lvl < this.getLevel()) {
            return;
        }

        console.log(this.color.colorize(msg, spec));

        return this;
    };


    Logger.prototype.trace = function(msg, spec) {
        var s;

        s = spec ? spec + '.trace' : 'trace';
        return this.log(msg, s, Logger.TRACE);
    };

    Logger.prototype.debug = function(msg, spec) {
        var s;

        s = spec ? spec + '.debug' : 'debug';
        return this.log(msg, s, Logger.DEBUG);
    };

    Logger.prototype.info = function(msg, spec) {
        var s;

        s = spec ? spec + '.info' : 'info';
        return this.log(msg, s, Logger.INFO);
    };

    Logger.prototype.warn = function(msg, spec) {
        var s;

        s = spec ? spec + '.warn' : 'warn';
        return this.log(msg, s, Logger.WARN);
    };

    Logger.prototype.error = function(msg, spec) {
        var s;

        s = spec ? spec + '.error' : 'error';
        return this.log(msg, s, Logger.ERROR);
    };

    Logger.prototype.severe = function(msg, spec) {
        var s;

        s = spec ? spec + '.severe' : 'severe';
        return this.log(msg, s, Logger.SEVERE);
    };

    Logger.prototype.fatal = function(msg, spec) {
        var s;

        s = spec ? spec + '.fatal' : 'fatal';
        return this.log(msg, s, Logger.FATAL);
    };

    Logger.prototype.system = function(msg, spec) {
        var s;

        s = spec ? spec + '.system' : 'system';
        return this.log(msg, s, Logger.SYSTEM);
    };

    /**
     * Write verbose output at the current logging level. Note that this is not
     * a leveled logging method, it's based purely on whether --verbose is true.
     */
    Logger.prototype.verbose = function(msg, spec) {
        var s;

        if (this.options.verbose !== true) {
            return;
        }

        return this.log(msg, spec);
    };

    //  ---
    //  Exports
    //  ---

    module.exports = Logger;
}());
