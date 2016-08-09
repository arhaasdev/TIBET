//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 * @overview The 'tibet user' command. Lists known users, or adds a user, or
 *     updates a user password. This is a simple convenience method to let you
 *     have a small set of user data stored in the tds.json file. For serious
 *     user administration you should rely on authentication strategies other
 *     than the simple default provided with the TDS.
 */
//  ========================================================================

/* eslint indent:0 */

(function() {

'use strict';

var CLI,
    crypto,
    Cmd;

CLI = require('./_cli');
crypto = require('crypto');

//  ---
//  Type Construction
//  ---

Cmd = function() {};
Cmd.Parent = require('./_cmd');
Cmd.prototype = new Cmd.Parent();


//  ---
//  Type Attributes
//  ---

/**
 * The command execution context.
 * @type {Cmd.CONTEXTS}
 */
Cmd.CONTEXT = CLI.CONTEXTS.PROJECT;

/**
 * The command name for this type.
 * @type {string}
 */
Cmd.NAME = 'user';

//  ---
//  Instance Attributes
//  ---

/* eslint-disable quote-props */
Cmd.prototype.PARSE_OPTIONS = CLI.blend(
    {
        'string': ['pass', 'env'],
        'default': {
            'env': 'development'
        }
    },
    Cmd.Parent.prototype.PARSE_OPTIONS);
/* eslint-enable quote-props */

/**
 * The command usage string.
 * @type {string}
 */
Cmd.prototype.USAGE = 'tibet user <username> [--pass <password>] [--env <env>]';


//  ---
//  Instance Methods
//  ---

/**
 * Perform the actual command processing.
 * @returns {Number} A return code. Non-zero indicates an error.
 */
Cmd.prototype.execute = function() {
    var data,
        env,
        file,
        hex,
        json,
        pass,
        user,
        users;

    if (this.options._.length !== 2) {
        return this.usage();
    }

    if (this.options._.length > 1) {
        user = this.options._[1];
    }

    file = CLI.expandPath('~tds_file');
    json = require(file);
    if (!json) {
        this.error('Unable to load tds config file: ' + file);
        return 1;
    }

    //  Drill down into the environment provided. All TDS settings are intended
    //  to reside below either 'default' or an environment-specific root.
    env = json[this.options.env];
    if (!env) {
        this.error('Unable to find environment: ' + this.options.env);
        return 1;
    }

    pass = this.options.pass;

    users = env.users;
    if (CLI.notValid(users)) {
        users = {};
        env.users = users;
    }

    if (CLI.isEmpty(pass)) {
        //  User lookup.
        data = users[user];
        if (CLI.isValid(data)) {
            this.info('User was found.');
        } else {
            this.error('User not found.');
        }
        return;
    } else {
        //  Password update.
        hex = crypto.createHash('md5').update(pass).digest('hex');

        data = users[user];
        if (CLI.isValid(data)) {
            //  Update
            users[user] = hex;
            this.info('User updated.');
        } else {
            //  Insert
            users[user] = hex;
            this.info('User added.');
        }

        //  Write out the changes.
        CLI.beautify(JSON.stringify(env)).to(file);
    }
};

module.exports = Cmd;

}());
