//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ------------------------------------------------------------------------

/**
 * @type {TP.tsh.toggleRemoteWatch}
 */

//  ------------------------------------------------------------------------

TP.core.ActionElementNode.defineSubtype('tsh:toggleRemoteWatch');

TP.tsh.toggleRemoteWatch.addTraits(TP.tsh.Element);

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.tsh.toggleRemoteWatch.Type.defineMethod('tshExecute',
function(aRequest) {

    /**
     * @method tshExecute
     * @summary Runs the receiver, effectively invoking its action.
     * @param {TP.sig.Request} aRequest The request containing command input for
     *     the shell.
     * @returns {Object} A value which controls how the outer TSH processing
     *     loop should continue. Common values are TP.CONTINUE, TP.DESCEND, and
     *     TP.BREAK.
     */

    var shell,
        currentlyWatching,
        watchSources,
        args;

    shell = aRequest.at('cmdShell');

    //  If either one of the debugging flags is turned on, then echo the
    //  debugging information.
    if (shell.getArgument(aRequest, 'tsh:debug', null, false)) {
        return this.printDebug(aRequest, true, false);
    }

    if (shell.getArgument(aRequest, 'tsh:debugresolve', null, false)) {
        return this.printDebug(aRequest, true, true);
    }

    currentlyWatching = TP.sys.cfg('uri.watch_remote_changes');
    watchSources = TP.sys.cfg('uri.remote_watch_sources');
    watchSources.convert(
                function(aLocation) {
                    return TP.uriExpandPath(aLocation);
                });

    //  Then, if a URI was supplied, we add it to the 'uri.remote_watch_sources'
    //  Array.
    args = shell.getArgument(aRequest, 'ARGV');
    if (TP.notEmpty(args)) {

        args.forEach(
            function(argLoc) {
                var argURI,
                    deletedCount;

                argURI = TP.uc(argLoc);
                deletedCount = watchSources.remove(argURI.getLocation());

                //  Didn't find it - add the argument's URI string value.
                if (deletedCount === 0) {
                    watchSources.push(argURI.getLocation());
                }
            });

        //  If watch sources is not empty, activate any watchers, otherwise
        //  deactivate any active ones.
        if (TP.notEmpty(watchSources)) {
            TP.core.RemoteURLWatchHandler.activateWatchers();
        } else {
            TP.core.RemoteURLWatchHandler.deactivateWatchers();
        }
    } else if (TP.notEmpty(watchSources)) {
        //  If we have watch sources, but the flag is already true, then we
        //  deactivate any active watchers.
        if (TP.isTrue(currentlyWatching)) {
            TP.core.RemoteURLWatchHandler.deactivateWatchers();
        } else {
            TP.core.RemoteURLWatchHandler.activateWatchers();
        }
    } else {
        //  watch sources was empty, so we just deactivate any active watchers.
        TP.core.RemoteURLWatchHandler.deactivateWatchers();
    }

    //  Note here how we go after the stored value - we might have changed it
    //  above.
    if (TP.isTrue(TP.sys.cfg('uri.watch_remote_changes'))) {
        aRequest.stdout('Remote resource change monitoring activated for: ');

        //  Set cmdAsIs to false to get fancy JSON formatting.
        aRequest.stdout(TP.jsoncc(watchSources), TP.hc('cmdAsIs', false));
    } else {
        aRequest.stdout('Remote resource change monitoring deactivated');
    }

    aRequest.stdout('Remote resource change processing is ' +
        (TP.sys.cfg('uri.process_remote_changes') === true ? 'on' : 'off'));

    aRequest.complete(TP.TSH_NO_VALUE);

    return;
});

//  ------------------------------------------------------------------------

TP.core.TSH.addHelpTopic('toggleRemoteWatch',
    TP.tsh.toggleRemoteWatch.Type.getMethod('tshExecute'),
    'Toggles whether to watch remote resource changes. Requires TDS.',
    ':toggleRemoteWatch',
    '');

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
