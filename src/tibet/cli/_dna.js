//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview Common supertype for cloning-related operations like tibet clone
 *     and tibet type.
 */
//  ========================================================================

/* eslint indent:0, object-curly-newline:0, consistent-this:0 */

//  TODO
/* eslint-disable no-unreachable */

(function() {

'use strict';

var CLI,
    path,
    find,
    fs,
    handlebars,
    helpers,
    Cmd;

CLI = require('./_cli');
path = require('path');
find = require('findit');
fs = require('fs');
handlebars = require('handlebars');
helpers = require('../../../etc/helpers/config_helpers');

//  ---
//  Type Construction
//  ---

Cmd = function() {
    //  empty
};
Cmd.Parent = require('./_cmd');
Cmd.prototype = new Cmd.Parent();

//  Augment our prototype with XML config methods.
helpers.extend(Cmd, CLI);

//  ---
//  Instance Attributes
//  ---

/**
 * The command execution context. Clone can only be done outside of a project.
 * @type {Cmd.CONTEXTS}
 */
Cmd.CONTEXT = CLI.CONTEXTS.OUTSIDE;

/**
 * The name of the optional configuration file in DNA directories. This file is
 * read but not copied/processed during operation.
 * @type {String}
 */
Cmd.prototype.DNA_CONFIG = '__dna.json';

/**
 * The default template to use from the DNA_ROOT location.
 * @type {string}
 */
Cmd.prototype.DNA_DEFAULT = 'default';

/**
 * Where are the dna templates we should clone from? This value will be joined
 * with the current file's load path to create the absolute root path.
 * @type {string}
 */
Cmd.prototype.DNA_ROOT = '../../../../dna/';

/**
 * Whether the command needs --force when a destination directory already
 * exists. Clone does, type commands don't.
 * @type {Boolean}
 */
Cmd.prototype.NEEDS_FORCE = true;

/**
 * A pattern used to determine if a resource can/should have config entries
 * added for it during packaging.
 */
Cmd.prototype.PACKAGED_RESOURCE = /.+\.(js|jscript|json|xml|xhtml|xsl|xsd|css)$/;

/**
 * Command argument parsing options.
 * @type {Object}
 */
/* eslint-disable quote-props */
Cmd.prototype.PARSE_OPTIONS = CLI.blend(
    {
        'boolean': ['force', 'list'],
        'string': ['dir', 'dna', 'name'],
        'default': {}
    },
    Cmd.Parent.prototype.PARSE_OPTIONS);
/* eslint-enable quote-props */

/**
 * A list of products to be added to configuration data as needed.
 * @type {Array.<string>}
 */
Cmd.prototype.products = null;

/**
 * The name of the key for template substitutions. Default is 'appname'. Other
 * common options are 'typename' and 'tagname'.
 * @type {String}
 */
Cmd.prototype.TEMPLATE_KEY = 'appname';

//  ---
//  Instance Methods
//  ---

/**
 * Check arguments and configure default values prior to running prereqs.
 * @return {Object}
 */
Cmd.prototype.configure = function() {
    var options;

    options = this.options;

    options.name = options._[1] || options.name;
    options.dirname = options._[2] || options.dir || './' + options.name;
    options.dna = options.dna || this.DNA_DEFAULT;

    this.trace(CLI.beautify(JSON.stringify(options)));

    return options;
};


/**
 * Updates the receiver's configuration data based on any configuration data
 * pulled in from the DNA directory. This allows each dna template to provide
 * custom values for certain configuration parameters.
 * @param {Object} config The dna-specific configuration object.
 */
Cmd.prototype.configureForDNA = function(config) {
    return 0;
};


/**
 * Runs the specific command in question.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.execute = function() {
    var options,
        code;

    options = this.options;

    //  Just list if that option was specified.
    if (options.list) {
        return this.executeList();
    }

    //  Clone the dna to working destination directory.
    code = this.executeMakeWorkingDir();
    if (code !== 0) {
        return code;
    }

    //  Clone the dna to working destination directory.
    code = this.executeClone();
    if (code !== 0) {
        return code;
    }

    //  Process files in the working directory. This has async/event-driven
    //  activity so the remaining aspects (position, package, etc) are done from
    //  within the 'end' event handler in that routine.
    code = this.executeProcess();

    return code;
};


/**
 * Removes any working directory which might have been constructed.
 */
Cmd.prototype.executeCleanup = function(code) {
    var options,
        working,
        msg,
        err;

    options = this.options;
    working = options.tmpdir;

    if (!CLI.sh.test('-e', working)) {
        return;
    }

    msg = 'Cleaning up working directory';
    if (arguments.length > 0 && code !== 0) {
        this.warn(msg + ' after error.');
    } else {
        this.log(msg + '.');
    }

    err = CLI.sh.rm('-rf', working);
    if (err) {
        this.error('Error removing working directory: ' + err);
        return 1;
    }

    return 0;
};


/**
 * Clone the DNA content to a working directory prior to individual file
 * processing (templating etc.); This working directory will be processed
 * and/or relocated once the file content has been processed.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.executeClone = function() {
    var options,
        dna,
        working,
        err,
        flags;

    options = this.options;
    dna = options.dna;

    working = options.tmpdir;

    // NOTE there are some minor quirks/deviations from how the same command
    // might work at the command line depending on your shell etc.
    flags = options.force ? '-rf' : '-r';

    // NOTE: a trailing slash says to copy source content, not source directory.
    CLI.sh.cp(flags, dna + path.sep, working);
    err = CLI.sh.error();
    if (err) {
        this.error('Error cloning dna directory: ' + err);
        this.executeCleanup(1);
        return 1;
    }

    // HACK: due to a bug in shelljs with hidden files copy any at the root.
    CLI.sh.cp(flags, path.join(dna, '.*'), working);
    err = CLI.sh.error();
    if (err) {
        this.error('Error copying hidden files: ' + err);
        this.executeCleanup(1);
        return 1;
    }

    return 0;
};


/**
 * List the available dna templates for this command.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.executeList = function() {
    var dir,
        list,
        err,
        cmd;

    cmd = this;

    dir = path.join(module.filename, this.DNA_ROOT);
    if (CLI.sh.test('-d', dir)) {
        list = CLI.sh.ls('-A', dir);
        err = CLI.sh.error();
        if (CLI.sh.error()) {
            this.error('Error checking dna directory: ' + err);
            return 1;
        }
    } else {
        cmd.info(dir);
    }

    if (list) {
        list.forEach(function(item) {
            if (item.charAt(0) === '.') {
                return;
            }
            cmd.log(item);
        });
    }

    return 0;
};


/**
 * Create a working directory to clone and process for new content.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.executeMakeWorkingDir = function() {
    var options,
        name,
        tmpdir,
        working,
        os,
        err;

    options = this.options;
    name = options.name;

    os = require('os');
    tmpdir = os.tmpdir();

    //  Start locally so it's easy to diff/merge from same parent.
    working = path.join(process.cwd(), '_' + name + '_');
    options.tmpdir = working;

    if (CLI.sh.test('-e', working)) {
        if (!options.force) {
            //  Use OS tmpdir if local dir won't work.
            working = path.join(tmpdir, name);
            options.tmpdir = working;
            if (CLI.sh.test('-e', working)) {
                this.error('Unable to find a working directory.');
                return 1;
            }
        } else {
            this.executeCleanup();
        }
    }

    CLI.sh.mkdir('-p', working);
    err = CLI.sh.error();
    if (err) {
        this.error('Error creating working directory: ' + err);
        return 1;
    } else {
        this.log('working in: ' + working);
    }

    return 0;
};


/**
 * Performs any updates to the application package that are needed. The default
 * implementation simply returns.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.executePackage = function() {
    var code;

    code = 0;

    this.log('adjusting package entries...');

    this.executeCleanup(code);

    this.summarize();

    return code;
};


/**
 * Repositions the working directory or directory content to the final
 *     destination location.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.executePosition = function() {
    var options,
        dest,
        working,
        err,
        finder,
        code,
        skips,
        cmd;

    this.log('positioning files...');

    cmd = this;

    this.products = [];

    options = this.options;

    dest = options.dest;
    working = options.tmpdir;

    //  If the target dir doesn't exist we make that directory so we can then
    //  iterate across the working dir files via the finder logic below.
    if (!CLI.sh.test('-e', dest)) {
        cmd.verbose('creating target directory: ' + dest);
        CLI.sh.mkdir('-p', dest);
        err = CLI.sh.error();
        if (err) {
            this.error('Error creating destination directory: ' + err);
            this.executeCleanup(code);
            return 1;
        }
    }

    //  Target directory already exist. Only choice now is to try to move files
    //  iteratively and log those that we can't move without destroying data.
    finder = find(working);
    code = 0;

    skips = [];

    finder.on('error', function(e) {
        cmd.error('Error positioning working tree: ' + e);
        code = 1;
    });

    // Ignore hidden directories and the node_modules directory.
    finder.on('directory', function(dir, stat, stop) {
        var base,
            target;

        base = path.basename(dir);
        if (base.charAt(0) === '.' || base === 'node_modules') {
            stop();
        }

        //  Check for target directories and create as needed.
        target = path.join(dest, dir.replace(working, ''));
        cmd.verbose('checking directory: ' + target);
        if (!CLI.sh.test('-d', target)) {
            cmd.debug('creating target directory: ' + target);
            CLI.sh.mkdir('-p', target);
        }
    });

    // Ignore links. (There shouldn't be any...but just in case.).
    finder.on('link', function(link) {
        cmd.warn('Ignoring link: ' + link);
    });

    finder.on('file', function(file) {
        var target,
            exists,
            err2;

        //  Ignore any configuration file we see.
        if (path.basename(file) === cmd.DNA_CONFIG) {
            return;
        }

        cmd.verbose('positioning file: ' + file);

        target = path.join(dest, file.replace(working, ''));
        exists = CLI.sh.test('-e', target);
        if (exists && !options.force) {
            cmd.info('skipping existing file: ' + target);
            skips.push(target);
        } else {
            if (exists) {
                //  Must be forcing...
                cmd.warn('replacing existing file: ' + target);
                CLI.sh.mv('-f', file, target);
            } else {
                //  No flags for mv here or (at least on current shelljs) this
                //  will fail.
                CLI.sh.mv(file, target);
            }
            err2 = CLI.sh.error();
            if (CLI.sh.error()) {
                cmd.error('Error positioning file: ' + err2);
                return 1;
            }

            //  If we really added the file and it matches our "config-able"
            //  pattern add it to the products list used by updatePackage.
            if (cmd.PACKAGED_RESOURCE.test(target)) {
                cmd.verbose('tracking ' + target);
                cmd.products.push([file, target]);
            }
        }
    });

    finder.on('end', function() {
        if (code === 0) {
            cmd.log('positioning complete...');
            code = cmd.executePackage();
        } else {
            cmd.executeCleanup(code);
        }
    });

    return code;
};


/**
 * Performs any post-processing necessary after executeProcess and prior to
 * executePosition. This is typically used to overlay base DNA content with
 * specific template or style content.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.executePostProcess = function() {
    return 0;
};


/**
 * Performs template processing on the content of the working directory.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.executeProcess = function() {
    var options,
        badexts,
        badpaths,
        params,
        finder,
        cmd,
        working,
        code;

    options = this.options;

    cmd = this;

    working = options.tmpdir;

    badexts = ['.bmp', '.png', '.gif', '.jpg', '.ico', '.jpeg'];
    badpaths = ['.DS_Store'];

    cmd.log('processing files...');

    //  Delegate production of template parameters to the specific command.
    //  Common differences here are appname vs. typename (root.ns.type).
    params = this.getTemplateParameters();

    //  ---
    //  Process templated content to inject name.
    //  ---

    finder = find(working);
    code = 0;

    finder.on('error', function(e) {
        cmd.error('Error processing working tree: ' + e);
        code = 1;
    });

    // Ignore hidden directories and the node_modules directory.
    finder.on('directory', function(dir, stat, stop) {
        var base;

        cmd.verbose('processing dir: ' + dir);

        base = path.basename(dir);
        if (base.charAt(0) === '.' || base === 'node_modules') {
            stop();
        }
    });

    // Ignore links. (There shouldn't be any...but just in case.).
    finder.on('link', function(link) {
        cmd.warn('Ignoring link: ' + link);
    });

    finder.on('file', function(file) {

        var content,  // File content after template injection.
            data,     // File data.
            template; // The compiled template content.

        if (badexts.indexOf(path.extname(file)) !== -1 ||
            badpaths.indexOf(path.basename(file)) !== -1) {
            return;
        }

        cmd.verbose('processing file: ' + file);
        try {
            data = fs.readFileSync(file, {encoding: 'utf8'});
            if (!data) {
                throw new Error('Empty');
            }
        } catch (e) {
            cmd.error('Error reading ' + file + ': ' + e.message);
            code = 1;
            return;
        }

        try {
            template = handlebars.compile(data);
            if (!template) {
                throw new Error('InvalidTemplate');
            }
        } catch (e) {
            cmd.error('Error compiling template ' + file + ': ' +
                e.message);
            code = 1;
            return;
        }

        try {
            content = template(params);
            if (!content) {
                throw new Error('InvalidContent');
            }
        } catch (e) {
            cmd.error('Error injecting template data in ' + file +
                ': ' + e.message);
            code = 1;
            return;
        }

        if (data === content) {
            cmd.verbose('ignoring static file: ' + file);
        } else {
            cmd.verbose('updating file: ' + file);
            try {
                fs.writeFileSync(file, content);
            } catch (e) {
                cmd.error('Error writing file ' + file + ': ' + e.message);
                code = 1;
                return;
            }
        }

        //  Allow command to process the file name and rename it from template
        //  format to final format as needed.
        code = cmd.executeRename(file);
    });

    finder.on('end', function() {
        if (code === 0) {
            cmd.log('templating complete...');

            //  Do any post-processing necessary to refine/replace the baseline
            //  DNA before we reposition the working dir files.
            code = cmd.executePostProcess();
            if (code !== 0) {
                return;
            }

            //  Note that positioning will trigger package updates if successful
            //  so we don't need to do that here.
            code = cmd.executePosition();
        } else {
            cmd.executeCleanup(code);
        }
    });

    return code;
};


/**
 * Invoked by executeProcess on a file-by-file basis to optionally rename a
 * templated file to a permanent name.
 * @param {String} file The filename to check for renaming.
 */
Cmd.prototype.executeRename = function(file) {
    var params,
        regex,
        code,
        cmd,
        fname,
        newname;

    code = 0;

    cmd = this;

    fname = file;

    //  The parameters that feed templating for this command are the same things
    //  we can use in the renaming process to rename template files.
    params = this.getTemplateParameters();
    Object.keys(params).forEach(function(key) {
        var value;

        regex = new RegExp('__' + key + '__', 'g');

        value = params[key];

        // Rename the file if it also has a name which matches our
        // name that's templated.
        try {
            if (regex.test(fname)) {
                newname = fname.replace(regex, value);
                CLI.sh.mv(fname, newname);
                fname = newname;
            }
        } catch (e) {
            cmd.error('Error renaming template ' + fname + ': ' + e.message);
            code = 1;
        }
    });

    return code;
};


/**
 * Return the key/value pairs representing parameters necessary for templating
 * for this command.
 * @returns {Object} The key/value pairs templates will be expecting.
 */
Cmd.prototype.getTemplateParameters = function() {
    var options,
        obj,
        name,
        dna,
        params;

    if (this.params) {
        return this.params;
    }

    options = this.options;

    name = options.name;
    dna = options.dna;

    //  NOTE that we don't use the full path for the dna reference here to avoid
    //  embedding real paths in the output.
    obj = {};
    obj[this.TEMPLATE_KEY] = name;
    obj.dna = dna.slice(dna.lastIndexOf(path.sep) + 1);

    params = CLI.blend(obj, options);
    this.params = params;

    this.trace(CLI.beautify(JSON.stringify(params)));

    return params;
};


/**
 * Verifies any prerequisites to running the execute() method. For this command
 * the primary validations are the DNA and destination directory checks.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.prereqs = function() {
    var options,
        code;

    options = this.options;

    //  Require at least a name to create via this operation.
    if (!options.name && !options.list) {
        this.usage();
        return 1;
    }

    //  Name has to be a valid JS identifier or it won't work in the various
    //  templates which ultimately generate client-side code.
    if (!CLI.isJSIdentifier(options.name)) {
        this.error('Name must be a valid JS identifier: ' + options.name);
        return 1;
    }

    code = this.verifyDNA();
    if (code === 0) {
        code = this.verifyDestination();
    }

    return code;
};


/**
 * Write a summary of what the command has done.
 */
Cmd.prototype.summarize = function() {
    return;
};


/**
 * Verifies that the destination location is proper for the current command.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.verifyDestination = function() {
    var options,
        dirname,
        dest,
        list,
        err;

    options = this.options;
    dirname = options.dirname;

    //  ---
    //  Verify destination directory
    //  ---

    if (dirname === '.') {
        // Destination will be our current directory, and we'll end up adjusting
        // our dirname to be whatever the current directory name is.
        dest = process.cwd();
        options.dest = dest;

        dirname = dest.slice(dest.lastIndexOf(path.sep) + 1);
        options.dirname = dirname;

        list = CLI.sh.ls('-A', dest);
        err = CLI.sh.error();
        if (CLI.sh.error()) {
            this.error('Error checking destination directory: ' + err);
            return 1;
        }

        if (list.length !== 0 && this.NEEDS_FORCE) {
            if (options.force) {
                this.warn('--force specified, ignoring existing content.');
            } else {
                this.error('Current directory is not empty. Use --force to ignore.');
                return 1;
            }
        }
    } else {
        dest = CLI.expandPath(dirname);
        options.dest = dest;

        if (CLI.sh.test('-e', dest) && this.NEEDS_FORCE) {
            if (options.force) {
                this.warn('--force specified, removing and rebuilding ' + dest);
                err = CLI.sh.rm('-rf', dest);
                if (err) {
                    this.error('Error removing destination directory: ' + err);
                    return 1;
                }
            } else {
                this.error('Destination directory ' + dest +
                    ' already exists.' +
                    ' Use --force to replace.');
                return 1;
            }
        }
    }

    return 0;
};


/**
 * Verifies that the DNA directory is valid so it can be cloned.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.verifyDNA = function() {
    var dna,
        options,
        config,
        dnaconfig,
        template,
        content;

    options = this.options;
    dna = options.dna;

    //  ---
    //  Confirm the DNA
    //  ---

    if (CLI.isEmpty(dna)) {
        this.error('Invalid/empty dna: ' + dna);
        return 1;
    }

    //  DNA can be entered as 'typename' (CompiledTag) but we convert to
    //  lowercase to normalize for directory use.
    dna = dna.toLowerCase();

    //  If the dna reference is a tag name we leave the full scan to reflection
    //  during a later phase.
    if (/:|[a-zA-Z0-9]\./.test(dna)) {
        return this.configureForDNA({});
    }

    // If the dna reference doesn't include either a / or dot indicating a
    // path then we work strictly from the TIBET dna directory choices.
    if (/\.|\//.test(dna)) {
        // Try to resolve as an absolute reference.
        if (!CLI.sh.test('-e', dna)) {
            // Try to resolve as a relative reference.
            dna = path.join(process.cwd(), dna);
            if (!CLI.sh.test('-e', dna)) {
                this.error('Unable to locate dna: ' + dna);
                return 1;
            }
            options.dna = dna;
        }
    } else {
        // Try to resolve as pre-built library dna.
        dna = path.join(module.filename, this.DNA_ROOT, dna);
        if (!CLI.sh.test('-e', dna)) {
            this.error('Unable to locate dna: ' + dna);
            return 1;
        }
        options.dna = dna;
    }

    //  Once we've verified the DNA we can try to load any DNA-specific
    //  configuration which is used to refine remaining processes.
    config = path.join(dna, this.DNA_CONFIG);
    if (CLI.sh.test('-e', config)) {
        try {
            dnaconfig = require(config);
        } catch (e) {
            this.error('Error loading DNA config: ' + e.message);
            return 1;
        }

        try {
            template = handlebars.compile(JSON.stringify(dnaconfig));
            if (!template) {
                throw new Error('InvalidTemplate');
            }
        } catch (e) {
            this.error('Error compiling template ' + config + ': ' +
                e.message);
            return 1;
        }

        try {
            content = template(this.options);
            if (!content) {
                throw new Error('InvalidConfig');
            }
        } catch (e) {
            this.error('Error injecting template data in ' + config +
                ': ' + e.message);
            return 1;
        }

        try {
            dnaconfig = JSON.parse(content);
        } catch (e) {
            this.error('Error parsing dna config: ' + config +
                ': ' + e.message);
            return 1;
        }

        this.trace('dna config: ' +
            CLI.beautify(JSON.stringify(dnaconfig)));

        return this.configureForDNA(dnaconfig);
    }

    return 0;
};


module.exports = Cmd;

}());
