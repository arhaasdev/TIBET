//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview The 'tibet couch' command. Provides utilities for interacting
 *     with CouchDB from the TIBET command line, particularly with respect
 *     to 'couchapp' functionality.
 */
//  ========================================================================

/* eslint indent:0, consistent-this:0 */

(function() {

'use strict';

var CLI,
    Cmd,
    couch,
    path,
    sh,
    fs,
    mime,
    zlib,
    crypto,
    readFile,
    Promise;

CLI = require('./_cli');

//  ---
//  Type Construction
//  ---

Cmd = function() { /* init */ };
Cmd.Parent = require('./_couchdb'); //  NOTE we inherit from 'couchdb' command.
Cmd.prototype = new Cmd.Parent();

couch = require('../../../etc/helpers/couch_helpers');
path = require('path');
Promise = require('bluebird');
sh = require('shelljs');
zlib = require('zlib');
crypto = require('crypto');

fs = require('fs');
readFile = Promise.promisify(fs.readFile);

//  Adjust mime mapping for files we use that don't look up correctly.
mime = require('mime-types');
mime.types.opts = 'text/plain';
mime.types.pegjs = 'text/plain';
mime.types.tmx = 'application/xml';


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
Cmd.NAME = 'couch';


//  ---
//  Instance Attributes
//  ---

//  NOTE the parse options here are just for the 'couch' command itself.
//  Subcommands need to parse via their own set of options.
Cmd.prototype.PARSE_OPTIONS = CLI.blend({}, Cmd.Parent.prototype.PARSE_OPTIONS);


/**
 * The command usage string.
 * @type {String}
 */
Cmd.prototype.USAGE = 'tibet couch <compactdb|createdb|listall|push|pushapp|removeapp|removedb|view> [<args>]';


//  ---
//  Instance Methods
//  ---

/**
 * Check arguments and configure default values prior to running prereqs.
 * @returns {Object} An options object usable by the command.
 */
Cmd.prototype.configure = function() {
    var confirm,
        parts,
        arg1;

    //  Explicit flag always wins.
    if (this.hasArgument('confirm')) {
        this.options.confirm = this.getArgument('confirm');
        this.options;
    } else {
        //  Configuration flag value overrides 'defaults' in PARSE_OPTIONS.
        confirm = CLI.getcfg('cli.couch.confirm');
        if (CLI.isValid(confirm)) {
            this.options.confirm = confirm;
        }
    }

    //  All commands allow target specification via a dotted arg1 value. Since
    //  most commands operate on a database or database and appname we default
    //  to assuming dbname[.appname]. Subcommands may alter this as needed.
    arg1 = this.getArgument(1);
    if (arg1) {
        parts = arg1.split('.');
        switch (parts.length) {
            case 1:
                this.options.db_name = parts[0];
                break;
            case 2:
                this.options.db_name = parts[0];
                this.options.db_app = parts[1];
                break;
            default:
                this.options.db_name = parts[0];
                this.options.db_app = parts[1];
                //  abstract place to hold part 3 (viewname, something else?)
                this.options.db_ref = parts[2];
                break;
        }
    }

    return this.options;
};


/**
 */
Cmd.prototype.executeCompactdb = function() {
    var cmd,
        params,
        db_url,
        db_name,
        app_name,
        result,
        nano;

    cmd = this;

    params = CLI.blend(this.options, {requestor: this, needsapp: false});
    params = couch.getCouchParameters(params);

    db_url = params.db_url;
    db_name = params.db_name;
    app_name = params.app_name;

    result = CLI.prompt.question(
        'Compact database [' + couch.maskCouchAuth(db_url) + '/' + db_name +
            '] ? Enter database name to confirm: ');
    if (!result || result.trim().toLowerCase() !== db_name) {
        this.log('database compaction cancelled.');
        return 0;
    }

    this.log('compacting database: ' +
        couch.maskCouchAuth(db_url) + '/' + db_name);

    nano = require('nano')(db_url);
    nano.db.compact(db_name, app_name,
        function(error) {
            if (error) {
                CLI.handleError(error, 'compactdb', 'couch');
                return;
            }

            cmd.log('database compacted.');
        });
};


/**
 * Create a new CouchDB database.
 */
Cmd.prototype.executeCreatedb = function() {
    var cmd,
        params,
        db_url,
        db_name,
        nano;

    cmd = this;

    params = CLI.blend(this.options, {requestor: this, needsapp: false});
    params = couch.getCouchParameters(params);
    db_url = params.db_url;
    db_name = params.db_name;

    this.log('creating database: ' +
        couch.maskCouchAuth(db_url) + '/' + db_name);

    nano = require('nano')(db_url);
    nano.db.create(db_name,
        function(error) {
            if (error) {
                CLI.handleError(error, 'createdb', 'couch');
                return;
            }

            cmd.log('database ready at ' +
                couch.maskCouchAuth(db_url) + '/' + db_name);
        });
};


/**
 * List all available databases for a particular CouchDB server.
 */
Cmd.prototype.executeListall = function() {
    var cmd,
        params,
        db_url,
        nano;

    cmd = this;

    params = CLI.blend(
                this.options, {
                    requestor: this,
                    needsapp: false,
                    needsdb: false
                });
    params = couch.getCouchParameters(params);
    db_url = params.db_url;

    nano = require('nano')(db_url);
    nano.db.list(function(error, list) {
        if (error) {
            CLI.handleError(error, 'listall', 'couch');
            return;
        }

        list.sort().forEach(function(db) {
            cmd.log(db);
        });
    });
};


/**
 * Pushes content to a CouchDB database. You can push individual JSON documents
 * or directories containing JSON documents.
 */
Cmd.prototype.executePush = function() {
    var id,
        fullpath;

    id = this.getArgument(1);

    if (CLI.notEmpty(id)) {
        fullpath = CLI.expandPath(id);
        if (!sh.test('-e', fullpath)) {
            this.error('Source path not found: ' + fullpath);
            return;
        }

        if (sh.test('-d', fullpath)) {
            return this.pushDir(fullpath);
        } else {
            //  Has to be a JSON document.
            if (path.extname(fullpath) !== '.json') {
                this.error('Can only push JSON documents.');
                return;
            }
            return this.pushFile(fullpath);
        }
    } else {
        this.error('No source document reference provided.');
        return 1;
    }
};


/**
 * Push a project's couch/app/{appname} content to CouchDB.
 */
Cmd.prototype.executePushapp = function() {
    var cmd,
        arg1,
        parts,
        params,
        db_url,
        db_name,
        db_app,
        doc_name,
        doc_url,
        target,
        insertAll,
        updateAll,
        list,
        err,
        couchAttachment,
        couchDigest,
        couchMime,
        db,
        dbGet,
        db_config,
        nano;

    cmd = this;

    arg1 = this.getArgument(1);
    if (!arg1) {
        this.usage('tibet couch pushapp [<[dbname.]appname>]');
        return;
    }

    //  Assume appname as solo parameter, db.app when dotted.
    parts = arg1.split('.');
    switch (parts.length) {
        case 1:
            delete this.options.db_name;
            this.options.db_app = parts[0];
            break;
        case 2:
            this.options.db_name = parts[0];
            this.options.db_app = parts[1];
            break;
        default:
            this.usage('tibet couch pushapp [<[dbname.]appname>]');
            return;
    }

    params = CLI.blend(this.options, {requestor: this});
    params = couch.getCouchParameters(params);
    db_url = params.db_url;
    db_name = params.db_name;
    db_app = params.db_app;

    doc_name = '_design/' + db_app;
    doc_url = db_url + '/' + db_name + '/' + doc_name;

    db_config = {
        attachments: {
            compression_level: 8    //  default
        }
    };

    //  Access the database configuration data. We use this for gzip
    //  level confirmation and other potential processing.
    require('nano')(db_url).relax({db: '_config'}, function(err2, dat) {
        if (err2) {
            //  ERROR here usually means 'you are not a server admin' or
            //  something similar. NOTE we leave default value in place
            //  and just return here. Default is set in outer scope.
            return;
        }

        db_config = dat;
    });

    //  Helper function when the document doesn't exist yet.
    insertAll = function(files) {

        return new Promise(function(resolve, reject) {
            var attachments,
                newdoc,
                fullpath;

            attachments = [];

            files.forEach(function(item) {
                var spec,
                    json;

                spec = {};

                //  TODO: Not sure how to send the content header for an
                //  individual attachment (or if it's even necessary). Check
                //  back on this.
                if (/\.gz$/.test(item)) {
                    return false;
                }

                spec.name = couchAttachment(item);
                spec.content_type = couchMime(item);
                spec.data = fs.readFileSync(item);

                //  One thing we have to adjust during push is that we need
                //  to reset the app_root to point to app_head. This is
                //  needed since couch will want to work from db_app which
                //  doesn't allow for the typical app_root of '~/public'.
                if (/tibet.json$/.test(spec.name)) {
                    json = JSON.parse(spec.data);
                    if (!json.path) {
                        json.path = {};
                    }
                    json.path.app_root = '~';
                    spec.data = JSON.stringify(json);
                }

                attachments.push(spec);
            });

            attachments.forEach(function(item) {
                cmd.verbose(item.name + ', ' + item.content_type + ', ' +
                    item.data.length + ' bytes.');
            });

            // cmd.log('pushing document content: ' +
            //      couch.maskCouchAuth(doc_url));

            //  The base document. Be sure to set the _id here to match the
            //  document name passed to the multipart insert below.
            newdoc = {
                _id: doc_name
            };

            //  Ensure we also capture any views, shows, lists, etc...
            //  NOTE we add appname if actual app directory isn't found.
            fullpath = CLI.expandPath(CLI.getcfg('path.tds_couch_defs'));
            if (sh.test('-d', path.join(fullpath, db_app))) {
                fullpath = path.join(fullpath, db_app);
            } else {
                fullpath = path.join(fullpath, CLI.getProjectName());
            }
            newdoc = couch.populateDesignDoc(newdoc, fullpath, params, true);

            //  Make sure we at least got rewrites..or it won't work at all.
            if (!newdoc.rewrites) {
                newdoc.rewrites = [
                    {from: '/', to: 'index.html'},
                    {from: '/api', to: '../../'},
                    {from: '/api/*', to: '../../*'},
                    {from: '/*', to: '*'}
                ];
            }

            //  Do the deed...and cross our fingers :)
            nano = require('nano')(db_url + '/' + db_name);
            nano.multipart.insert(newdoc, attachments, doc_name,
                function(error) {
                    if (error) {
                        CLI.handleError(error, 'pushapp', 'couch');
                        return;
                    }

                    cmd.log('application ready at ' +
                        couch.maskCouchAuth(doc_url) + '/index.html');
                    resolve();
                });
        });
    };


    couchAttachment = function(fullname, base) {
        var root,
            name;

        root = base || CLI.expandPath('~app');

        name = fullname.replace(root, '');
        if (name && name.charAt(0) === '/') {
            name = name.slice(1);
        }
        return name;
    };


    couchMime = function(attachment) {
        var type;

        type = mime.lookup(attachment);
        if (!type) {
            cmd.warn('Defaulting to text/plain for ' +
                attachment);
            type = 'text/plain';
        }
        return type;
    };


    couchDigest = function(data, options, zipper) {

        return new Promise(function(resolve, reject) {
            var compute;

            //  Helper function to do the computation once we've determined
            //  if we need to compress the content first or not.
            compute = function(content) {
                var hex,
                    buf;

                //  Capture the md5 hash of the content in hex string form.
                hex = crypto.createHash('md5').update(
                    content).digest('hex');

                //  Convert the hex hash form into base64.
                buf = new Buffer(hex, 'hex');

                //  Always prepend the hashing model.
                resolve('md5-' + buf.toString('base64'));
            };

            //  Encoding is provided from att_encoding_info on the document.
            //  If an attachment was encoded this will contain the approach.
            if (options.encoding === 'gzip') {
                zipper(data, {level: options.level}, function(err2, zipped) {
                    if (err2) {
                        reject(err2);
                        return;
                    }
                    resolve(compute(zipped));
                });
            } else {
                resolve(compute(data));
            }
        });
    };


    //  Helper function when the document exists. then we need to compare
    //  to see which attachments need to be updated.
    updateAll = function(existing, files) {

        return new Promise(function(resolve, reject) {
            var doc_atts,
                root,
                attachments,
                newdoc;

            root = CLI.expandPath('~app');

            doc_atts = existing._attachments || {};
            existing._attachments = {};
            attachments = [];

            // cmd.log(beautify(JSON.stringify(doc_atts)));

            Promise.settle(files.map(function(item) {
                var name,
                    encoding,
                    digest,
                    current;

                //  TODO: Revisit why we ignore the gz files. Would storing
                //  and loading these speed things up?
                if (/\.gz$/.test(item)) {
                    return Promise.reject('ignore');
                }

                name = couchAttachment(item, root);

                current = doc_atts[name];
                if (current) {

                    encoding = current.encoding;
                    digest = current.digest;

                    return new Promise(function(resolve2, reject2) {

                        //  existing attachment, does the digest match?
                        readFile(item).then(function(dat) {
                            var json,
                                data,
                                level;

                            if (/tibet.json$/.test(name)) {
                                json = JSON.parse(dat);
                                if (!json.path) {
                                    json.path = {};
                                }
                                json.path.app_root = '~';
                                data = JSON.stringify(json);
                            } else {
                                data = dat;
                            }

                            //  Store the data. We'll need this for push.
                            current.data = data;

                            //  Set the compression level for gzip to the one our
                            //  database is configured to use for attachments.
                            level = db_config.attachments.compression_level;

                            couchDigest(data,
                                {level: level, encoding: encoding}, zlib.gzip).then(
                            function(result) {
                                if (result === digest) {
                                    resolve2('unchanged');
                                } else {
                                    resolve2('update');
                                }
                            },
                            function(err3) {
                                cmd.error(err3);
                                reject2(err3);
                            });
                        },
                        function(err2) {
                            reject2(err2);
                        });
                    });
                } else {
                    //  new attachment
                    return Promise.resolve('insert');
                }

            })).then(function(results) {
                var fullpath;

                results.forEach(function(result, index) {
                    var file_name,
                        att_name,
                        data;

                    if (result.isFulfilled()) {
                        file_name = files[index];
                        att_name = couchAttachment(file_name);

                        cmd.verbose(result.value() + ': ' + att_name);

                        //  Existing attachments will have been read already
                        //  to compare digests. We can reuse that data.
                        if (doc_atts[att_name]) {
                            data = doc_atts[att_name].data;
                        } else {
                            //  New file. Have to read it.
                            data = fs.readFileSync(file_name);
                        }

                        attachments.push({
                            name: att_name,
                            content_type: couchMime(att_name),
                            data: data
                        });
                    } else {
                        cmd.verbose(result.reason() + ': ' + files[index]);
                    }
                });

                //  Ensure we also capture any views, shows, lists, etc...
                //  NOTE we add 'default' if the actual app directory isn't found.
                fullpath = CLI.expandPath(CLI.getcfg('path.tds_couch_defs'));
                if (sh.test('-d', path.join(fullpath, db_app))) {
                    fullpath = path.join(fullpath, db_app);
                } else {
                    fullpath = path.join(fullpath, 'default');
                }
                newdoc = couch.populateDesignDoc(existing, fullpath, params, true);

                //  Do the deed...and cross our fingers :)
                nano = require('nano')(db_url + '/' + db_name);
                nano.multipart.insert(newdoc, attachments, doc_name,
                    function(error) {
                        if (error) {
                            cmd.error(error);
                            reject(error);
                            return;
                        }

                        cmd.log('application ready at ' +
                            couch.maskCouchAuth(doc_url) + '/index.html');
                        resolve();
                    });
            });
        });
    };


    //  ---
    //  Actual "work" begins below...
    //  ---

    cmd.log('marshalling content for: ' +
        couch.maskCouchAuth(doc_url));

    //  Scan application directory and get the full list of files.
    target = CLI.expandPath('~app');
    if (sh.test('-d', target)) {
        list = sh.find(target).filter(function(fname) {
            //  TODO:   add configuration-driven ignore checks here.
            //  Remove any files which don't pass our ignore criteria.
            return !sh.test('-d', fname) &&
                !fname.match(/node_modules/) &&
                !fname.match(/tds\/tds_cfg/) &&
                !fname.match(/\.DS_Store/);
        });
        err = sh.error();
        if (sh.error()) {
            cmd.error('Error checking ~app directory: ' + err);
            return -1;
        }
    } else {
        cmd.error(target + ' is not a directory.');
        return -1;
    }

    //  Try to access the design document for the application. If it's
    //  already there then this is an update operation rather than a clean
    //  insert. That means checking digests to determine which subset we
    //  want to actually update.

    db = require('nano')(db_url + '/' + db_name);
    dbGet = Promise.promisify(db.get);

    dbGet(doc_name, {att_encoding_info: true}).then(
        function(response) {
            var existing;

            // cmd.log(beautify(JSON.stringify(response)));

            if (Array.isArray(response)) {
                existing = response.filter(function(item) {
                    return item._id === doc_name;
                })[0];
            } else {
                existing = response;
            }

            updateAll(existing, list).then(
                function() {
                    return;
                },
                function(err2) {
                    CLI.handleError(err2, 'pushapp', 'couch');
                    return;
                });
        },
        function(error) {
            if (error.reason === 'missing') {
                //  No document? Clean start then.
                insertAll(list).then(
                    function() {
                        return;
                    },
                    function(err2) {
                        CLI.handleError(err2, 'pushapp', 'couch');
                        return;
                    });
            } else {
                CLI.handleError(error, 'pushapp', 'couch');
                return;
            }
        });
};


/**
 * Remove a pushed application from a CouchDB database.
 */
Cmd.prototype.executeRemoveapp = function() {
    var cmd,
        arg1,
        parts,
        params,
        db_url,
        db_name,
        db_app,
        result,
        db,
        dbGet,
        doc_name;

    cmd = this;

    arg1 = this.getArgument(1);
    if (!arg1) {
        this.usage('tibet couch removeapp [<[dbname.]appname>]');
        return;
    }

    //  Assume appname as solo parameter, db.app when dotted.
    parts = arg1.split('.');
    switch (parts.length) {
        case 1:
            delete this.options.db_name;
            this.options.db_app = parts[0];
            break;
        case 2:
            this.options.db_name = parts[0];
            this.options.db_app = parts[1];
            break;
        default:
            this.usage('tibet couch removeapp [<[dbname.]appname>]');
            return;
    }

    params = CLI.blend(this.options, {requestor: this});
    params = couch.getCouchParameters(params);
    db_url = params.db_url;
    db_name = params.db_name;
    db_app = params.db_app;

    doc_name = '_design/' + db_app;

    result = CLI.prompt.question(
        'Delete ENTIRE application [' +
        couch.maskCouchAuth(db_url) + '/' + db_name + '/' + doc_name +
        '] ? Enter application name to confirm: ');
    if (!result || result.trim().toLowerCase() !== db_app) {
        this.log('application removal cancelled.');
        return 0;
    }

    this.log('deleting ' +
        couch.maskCouchAuth(db_url) + '/' + db_name + '/' + doc_name);

    db = require('nano')(db_url + '/' + db_name);
    dbGet = Promise.promisify(db.get);

    dbGet(doc_name, {att_encoding_info: true, revs_info: true}).then(function(response) {
        db.destroy(doc_name, response._rev,
            function(error) {
                if (error) {
                    CLI.handleError(error, 'removeapp', 'couch');
                    return;
                }

                cmd.log('application removed.');
            });

    }).catch(function(err) {
        CLI.debug(params);
        CLI.handleError(err, 'removeapp', 'couch');
        return;
    });
};


/**
 * Remove an active CouchDB database.
 */
Cmd.prototype.executeRemovedb = function() {
    var cmd,
        params,
        db_url,
        db_name,
        result,
        nano;

    cmd = this;

    params = CLI.blend(this.options, {requestor: this, needsapp: false});
    params = couch.getCouchParameters(params);
    db_url = params.db_url;
    db_name = params.db_name;

    result = CLI.prompt.question(
        'Delete ENTIRE database [' +
        couch.maskCouchAuth(db_url) + '/' + db_name +
        '] ? Enter database name to confirm: ');
    if (!result || result.trim().toLowerCase() !== db_name) {
        this.log('database removal cancelled.');
        return 0;
    }

    this.log('deleting database: ' +
        couch.maskCouchAuth(db_url) + '/' + db_name);

    nano = require('nano')(db_url);
    nano.db.destroy(db_name,
        function(error) {
            if (error) {
                CLI.handleError(error, 'removedb', 'couch');
                return;
            }

            cmd.log('database removed.');
        });
};


/**
 * Executes a specific TWS database view and outputs the results.
 */
Cmd.prototype.executeView = function() {
    var appname,
        viewname,
        dbParams,
        viewParams,
        method,
        thisref,
        arg1,
        parts,
        db;

    thisref = this;

    this.reparse({
        boolean: ['docs', 'keys', 'values', 'rows'],
        default: {
            docs: false,
            rows: false,
            keys: false,
            values: false
        }
    });

    arg1 = this.getArgument(1);
    if (!arg1) {
        this.usage('tibet couch view <[dbname.][appname.]viewname> [viewParamJSON]');
        return;
    }

    //  View parsing of arg1 is different in that viewname is required, so we
    //  assume single values are viewnames. 2 parts are app.view, and 3 parts
    //  are db.app.view.
    parts = arg1.split('.');
    switch (parts.length) {
        case 1:
            delete this.options.db_name;
            delete this.options.db_app;
            viewname = parts[0];
            break;
        case 2:
            delete this.options.db_name;
            this.options.db_app = parts[0];
            viewname = parts[1];
            break;
        case 3:
            this.options.db_name = parts[0];
            this.options.db_app = parts[1];
            viewname = parts[2];
            break;
        default:
            this.usage('tibet couch view <[dbname.][appname.]viewname> [viewParamJSON]');
            return;
    }

    if (!viewname) {
        this.usage('tibet couch view <[dbname.][appname.]viewname> [viewParamJSON]');
        return;
    }

    //  View parameters can be provided as a JSON block.
    viewParams = this.getArgument(1);
    if (CLI.notValid(viewParams)) {
        viewParams = {};
    } else {
        try {
            viewParams = JSON.parse(viewParams);
        } catch (e) {
            this.error('Invalid view param JSON: ' + e.message);
            return;
        }
    }
    viewParams.include_docs = this.options.docs;

    dbParams = CLI.blend(this.options, {requestor: this});
    dbParams = couch.getCouchParameters(dbParams);

    db = couch.getCouchDatabase(dbParams);
    appname = dbParams.db_app;

    if (this.options.keys) {
        method = 'viewAsyncKeys';
    } else if (this.options.values) {
        method = 'viewAsyncValues';
    } else if (this.options.rows) {
        method = 'viewAsyncRows';
    } else {
        method = 'viewAsyncDocs';
        viewParams.include_docs = true;
    }

    db[method](appname, viewname, viewParams).then(function(rows) {
        //  NOTE we're basically always in '--verbose' mode here since we don't
        //  know the type of document in the result and don't want to ass_ume
        //  any particular schema per se.
        thisref.log(CLI.beautify(rows));
    }).catch(function(err) {
        if (err.message === 'missing_named_view') {
            thisref.error('View not found: ' + viewname);
        } else {
            CLI.debug(CLI.beautify(dbParams));
            CLI.handleError(err, 'couch', 'view');
            return;
        }
    });
};


module.exports = Cmd;

}());
