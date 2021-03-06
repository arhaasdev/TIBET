//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview A common supertype for commands like 'tibet couch' and 'tibet tws'
 *     which interact with CouchDB as their primary task.
 */
//  ========================================================================

/* eslint indent:0, consistent-this:0 */

(function() {

'use strict';

var CLI,
    Cmd,
    couch,
    path,
    sh;

CLI = require('./_cli');

//  ---
//  Type Construction
//  ---

Cmd = function() { /* init */ };
Cmd.Parent = require('./_multi');   //  NOTE we inherit from 'multi' here.
Cmd.prototype = new Cmd.Parent();

couch = require('../../../etc/helpers/couch_helpers');
path = require('path');
sh = require('shelljs');

//  ---
//  Type Attributes
//  ---

/**
 * The command execution context.
 * @type {Cmd.CONTEXTS}
 */
Cmd.CONTEXT = CLI.CONTEXTS.ANY;

/**
 * The command name for this type.
 * @type {String}
 */
Cmd.NAME = '_couchdb';


//  ---
//  Instance Attributes
//  ---

//  NOTE the parse options here are just for the 'couch' command itself.
//  Subcommands need to parse via their own set of options.

/* eslint-disable quote-props */
Cmd.prototype.PARSE_OPTIONS = CLI.blend({
boolean: ['confirm'],
    default: {
        confirm: true
    }
}, Cmd.Parent.prototype.PARSE_OPTIONS);
/* eslint-enable quote-props */


//  ---
//  Instance Methods
//  ---


//  ---
//  Utilities
//  ---

/**
* Low-level routine for fetching a document. The document object should be
* provided along with any options which are proper for nano.db.get.
* @param {String} id The document ID to retrieve from CouchDB.
* @param {Object} [options] A nano-compatible db.get options object.
* @param {Object} [params] Couch parameters if available.
* @returns {Promise} A promise with 'then' and 'catch' options.
*/
Cmd.prototype.dbGet = function(id, options, params) {
    var server,
        db,
        db_url,
        db_name,
        db_app,
        dbParams;

    dbParams = params || couch.getCouchParameters({
        requestor: CLI,
        confirm: this.options.confirm,
        cfg_root: 'tds.tasks'
    });

    db_url = dbParams.db_url;
    db_name = dbParams.db_name;
    db_app = dbParams.db_app;

    if (!db_url || !db_name || !db_app) {
        this.error('Unable to determine CouchDB parameters.');
        return;
    }

    server = couch.server(db_url);
    db = server.use(db_name);

    return db.getAsync(id, options).then(function(result) {
        return result[0];
    });
};


/**
* Low-level routine for inserting/updating a document.
* @param {Object} doc The JavaScript object to be inserted.
* @param {Object} [options] nano-compatible options db.insert.
* @param {Object} [params] Couch parameters if available.
* @returns {Promise} A promise with 'then' and 'catch' options.
*/
Cmd.prototype.dbInsert = function(doc, options, params) {
    var server,
        db,
        db_url,
        db_name,
        db_app,
        dbParams;

    dbParams = params || couch.getCouchParameters({
        requestor: CLI,
        confirm: this.options.confirm,
        cfg_root: 'tds.tasks'
    });

    db_url = dbParams.db_url;
    db_name = dbParams.db_name;
    db_app = dbParams.db_app;

    if (!db_url || !db_name || !db_app) {
        this.error('Unable to determine CouchDB parameters.');
        return;
    }

    server = couch.server(db_url);
    db = server.use(db_name);

    return db.insertAsync(doc, options).then(function(result) {
        return result[0];
    });
};


/**
* Low-level listing routine for displaying results of running a view.
* @param {String} viewname The view to execute to produce results.
* @param {Object} [options] nano-compatible options db.view.
* @param {Object} [params] Couch parameters if available.
* @returns {Promise} A promise with 'then' and 'catch' options.
*/
Cmd.prototype.dbView = function(viewname, options, params) {
    var server,
        db,
        db_url,
        db_name,
        db_app,
        dbParams;

    dbParams = params || couch.getCouchParameters({
        requestor: CLI,
        confirm: this.options.confirm,
        cfg_root: 'tds.tasks'
    });

    db_url = dbParams.db_url;
    db_name = dbParams.db_name;
    db_app = dbParams.db_app;

    if (!db_url || !db_name || !db_app) {
        this.error('Unable to determine CouchDB parameters.');
        return;
    }

    server = couch.server(db_url);
    db = server.use(db_name);

    return db.viewAsyncRows(db_app, viewname, options);
};


/**
* Pushes all JSON documents in a specified directory to the current
* database. Typically invoked by by executePush variants to load sets of data.
* @param {String} dir The directory to load. Note that this call is _not_
*     recursive so only documents in the top level are loaded. Also note this
*     value will be run through the CLI's expandPath routine to expand any
*     virtual path values.
*/
Cmd.prototype.pushDir = function(dir, options) {
    var fullpath,
        thisref,
        opts,
        ask;

    thisref = this;

    fullpath = CLI.expandPath(dir);
    if (!CLI.sh.test('-e', fullpath)) {
        this.error('Unable to find ' + fullpath);
        return;
    }

    if (!CLI.sh.test('-d', fullpath)) {
        this.error('Target is not a directory: ' + fullpath);
        return;
    }

    opts = options || {};

    if (CLI.isValid(opts.confirm)) {
        ask = opts.confirm;
    } else {
        ask = this.options.confirm;
    }

    if (CLI.notValid(opts.db_url)) {
        opts = CLI.blend(opts, couch.getCouchParameters({
            requestor: CLI,
            confirm: ask,
            cfg_root: 'tds.tasks'
        }));
    }

    sh.ls(path.join(fullpath, '*.json')).forEach(function(file) {
        if (path.basename(file).charAt(0) === '_') {
            thisref.warn('ignoring: ' + file);
            return;
        }

        //  Force confirmation off here. We don't want to prompt for every
        //  individual file.
        thisref.pushFile(file, opts);
    });
};


/**
 * Pushes a single JSON document into the current database.
 * @param {String} file The file name to be loaded. Note that this will be run
 *     through the CLI's expandPath routine to handle any virtual paths.
 * @param {Object} [options] A block containing database parameters and/or
 *     instructions about whether to confirm database information.
 */
Cmd.prototype.pushFile = function(file, options) {
    var dat,
        doc,
        fullpath;

    fullpath = CLI.expandPath(file);

    if (!CLI.sh.test('-e', fullpath)) {
        this.error('Unable to find ' + fullpath);
        return;
    }

    dat = sh.cat(fullpath);
    if (!dat) {
        this.error('No content read for file: ' + fullpath);
    }

    try {
        doc = JSON.parse(dat);
    } catch (e) {
        this.error('Error parsing ' + fullpath + ': ' + e.message);
        return;
    }

    this.pushOne(fullpath, doc, options);
};


/**
 * Pushes an actual document object (JSON which has been parsed or a JavaScript
 * POJO) associated with a particular source file path. The path is necessary to
 * ensure that the document at that location is updated with the _id value
 * returned by CouchDB if the upload is successful, or that the _rev is updated.
 * @param {String} fullpath A full absolute path for the source of the document.
 * @param {Object} doc The javascript object to upload as a document.
 * @param {Object} [options] A block containing database parameters and/or
 *     instructions about whether to confirm database information.
 */
Cmd.prototype.pushOne = function(fullpath, doc, options) {
    var params,
        db_url,
        db_name,
        nano,
        db,
        thisref,
        ask,
        opts;

    thisref = this;

    opts = options || {};

    if (CLI.isValid(opts.confirm)) {
        ask = opts.confirm;
    } else {
        ask = this.options.confirm;
    }

    if (CLI.notValid(opts.db_url)) {
        params = couch.getCouchParameters({
            requestor: CLI,
            confirm: ask,
            cfg_root: 'tds.tasks'
        });
    } else {
        params = opts;
    }

    db_url = params.db_url;
    db_name = params.db_name;

    if (!db_url || !db_name) {
        this.error('Unable to determine CouchDB parameters.');
        return;
    }

    nano = require('nano')(db_url);
    db = nano.use(db_name);

    if (doc._id) {
        //  Have to fetch to get the proper _rev to update...
        db.get(doc._id, function(err, response) {
            var rev;

            if (err) {
                if (err.message !== 'missing') {
                    //  most common error will be 'missing' document due to
                    //  deletion, purge, etc.
                    thisref.error(fullpath + ' =>');
                    CLI.handleError(err, Cmd.NAME, 'pushOne', false);
                    return;
                }

                //  missing...don't worry about rev check...

                delete doc._rev;    //  clear any _rev to avoid update conflict

                thisref.log('inserting: ' + fullpath);

            } else {
                //  Set revs to match so we can compare actual 'value' other
                //  than the rev. If they're the same we can skip the insert.
                rev = response._rev;
                delete response._rev;

                if (CLI.isSameJSON(doc, response)) {
                    thisref.log('skipping: ' + fullpath);
                    return;
                }

                doc._rev = rev;
                thisref.log('updating: ' + fullpath);
            }

            db.insert(doc, function(err2, response2) {
                if (err2) {
                    thisref.error(fullpath + ' =>');
                    CLI.handleError(err2, Cmd.NAME, 'pushOne', false);
                    return;
                }

                thisref.log(fullpath + ' =>\n' + CLI.beautify(response2));

                //  Set the document ID to the response ID so we know it.
                doc._id = response2.id;
                delete doc._rev;
                CLI.beautify(doc).to(fullpath);
            });

        });
    } else {

        this.log('uploading: ' + fullpath);

        //  No clue...appears to be first time we've inserted this doc.
        db.insert(doc, function(err, response) {
            if (err) {
                thisref.error(fullpath + ' =>');
                CLI.handleError(err, Cmd.NAME, 'pushOne', false);
                return;
            }

            thisref.log(fullpath + ' =>\n' + CLI.beautify(response));

            //  Set the document ID to the response ID so we know it.
            doc._id = response.id;
            delete doc._rev;
            CLI.beautify(doc).to(fullpath);
        });
    }

    return;
};


module.exports = Cmd;

}());
