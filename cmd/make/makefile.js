/**
 * @overview TIBET platform "makefile". Targets here focus on packaging the
 *     various portions of the platform for inclusion in TIBET applications.
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     source code privacy waivers to keep your TIBET-based source code private.
 */

(function() {

    'use strict';

    module.exports = function(Make) {

        Make.loadTasks();

        Make.defineTaskOptions('build', {timeout: 600000});
        Make.defineTaskOptions('build_tibet', {timeout: 600000});
        Make.defineTaskOptions('build_all', {timeout: 1200000});
    };

}());
