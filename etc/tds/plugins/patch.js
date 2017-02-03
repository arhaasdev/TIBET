/**
 * @overview Supports sending standard diff/patch formatted files to the server.
 *     This is normally disabled but when enabled it allows the Sherpa to send
 *     client-side edits to the server for integration with on-file source code.
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     open source waivers to keep your derivative work source code private.
 */

(function(root) {

    'use strict';

    //  ---
    //  File Patch Middleware
    //  ---

    /**
     * Processes requests to patch a source file with client-side changes.
     * Changes can be in the form of an entire file or a patch/diff formatted
     * patch file. The target path must reside under tds.patch_root for the
     * patch to be valid. The default is ~app_src which restricts patches to
     * application assets in the application's source directory.
     * @param {Object} options Configuration options shared across TDS modules.
     * @returns {Function} A function which will configure/activate the plugin.
     */
    module.exports = function(options) {
        var app,
            localDev,
            logger,
            meta,
            path,
            fs,
            diff,
            TDS;

        //  ---
        //  Config Check
        //  ---

        app = options.app;
        TDS = app.TDS;

        localDev = options.localDev;
        logger = options.logger;

        meta = {type: 'plugin', name: 'patch'};
        logger.system('loading middleware', meta);

        //  ---
        //  Requires
        //  ---

        path = require('path');
        fs = require('fs');
        diff = require('diff');

        //  Ensure we have default option slotting for this plugin.
        options.tds_patch = options.tds_patch || {};

        //  ---
        //  Middleware
        //  ---

        TDS.patch = function(req, res, next) {
            var body,
                data,
                type,
                target,
                text,
                content,
                patchRoot,
                url,
                err,
                ignoreChangedFiles,
                localPath;

            err = function(code, message) {
                logger.error(message, meta);
                res.status(code);
                res.send(message);
                res.end();
                return;
            };

            logger.info('Processing patch request.', meta);

            body = req.body;
            if (body === '' || body === null || body === undefined) {
                return err(400, 'No patch data provided.');
            }

            // TODO: parsing?
            data = body;

            // ---
            // verify type
            // ---

            type = data.type;
            if (!type) {
                return err(400, 'No patch type provided.');
            }

            if (type !== 'diff' && type !== 'file') {
                return err(400, 'Invalid patch type ' + type + '.');
            }

            // ---
            // verify target
            // ---

            target = data.target;
            if (!target) {
                return err(400, 'No patch target provided.');
            }

            url = TDS.expandPath(target);
            if (!url) {
                return err(400, 'Unable to resolve patch target url.');
            }

            patchRoot = path.resolve(TDS.expandPath(
                TDS.getcfg('tds.patch.root')));

            if (url.indexOf(patchRoot) !== 0) {
                return err(403, 'Patch target outside patch directory.');
            }

            // ---
            // verify content
            // ---

            content = data.content;
            if (!content) {
                return err(400, 'No patch content provided.');
            }

            // ---
            // process the patch
            // ---

            logger.info('Processing patch for ' + url, meta);

            // TODO: remove sync versions

            if (type === 'diff') {
                // Read the target and applyPatch using JsDiff to get content.

                try {
                    text = fs.readFileSync(url, {encoding: 'utf8'});
                    if (!text) {
                        throw new Error('NoData');
                    }
                } catch (e) {
                    return err(500, 'Error reading file data: ' + e.message);
                }

                text = diff.applyPatch(text, content);

                if (text === false) {
                    return err(500, 'Error generating patch');
                }

            } else {
                // Supplied content is the new file text.
                text = content;
            }

            if (data.nowatch === true) {
                ignoreChangedFiles =
                    TDS.getcfg('tds.watch.ignore_changed_files');
                if (!ignoreChangedFiles) {
                    ignoreChangedFiles = [];
                    TDS.setcfg('tds.watch.ignore_changed_files',
                                ignoreChangedFiles);
                }

                localPath = url.replace(TDS.expandPath('~app'), '');
                if (localPath.charAt(0) === '/') {
                    localPath = localPath.slice(1);
                }

                ignoreChangedFiles.push(localPath);
            }

            try {
                fs.writeFileSync(url, text);
            } catch (e) {
                return err(500, 'Error writing file ' + url + ': ' + e.message);
            }

            res.send(url + ' successfully patched.');
            res.end();
        };

        //  ---
        //  Routes
        //  ---

        app.patch('*', localDev,
            options.parsers.json, TDS.patch);
    };

}(this));

