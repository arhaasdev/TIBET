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
 * @type {TP.tds.TDSURLHandler}
 * @summary A subtype of HTTPURLHandler that manages URLs coming from the TDS.
 *     The TDS can provide change notifications about the URLs it manages and
 *     this type can then dispatch those changes into the TIBET change
 *     notification system.
 */

//  ------------------------------------------------------------------------

TP.core.HTTPURLHandler.defineSubtype('tds.TDSURLHandler');

TP.tds.TDSURLHandler.addTraits(TP.core.RemoteURLWatchHandler);

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

TP.tds.TDSURLHandler.set('uriConfigName', 'tds.watch.uri');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.tds.TDSURLHandler.Type.defineMethod('getWatcherSignalType',
function() {

    /**
     * @method getWatcherSignalType
     * @summary Returns the TIBET type of the watcher signal. This will be the
     *     signal that the signal source sends when it wants to notify URIs of
     *     changes.
     * @returns {TP.sig.TDSFileChange} The type that will be instantiated
     *     to construct new signals that notify observers that the *remote*
     *     version of the supplied URI's resource has changed.
     */

    return TP.sig.TDSFileChange;
});

//  ------------------------------------------------------------------------

TP.tds.TDSURLHandler.Type.defineMethod('patch',
function(targetURI, aRequest) {

    /**
     * @method patch
     * @summary Patches the remote version of the resource pointed to by the
     *     supplied URI by saving a patch in the 'unified diff' format to the
     *     endpoint of a server (such as the TDS) that can handle a patching
     *     operation against that kind of remote resource.
     * @param {TP.core.URI} targetURI The URI to patch. NOTE that this URI will
     *     not have been rewritten/resolved.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} The request's response object.
     */

    var request,
        response,

        localResult,
        localContent,

        promise;

    request = targetURI.constructRequest(aRequest);
    response = request.getResponse();

    if (!TP.canInvoke(targetURI, 'getLocation')) {
        request.fail();
        return response;
    }

    //  First, try to get the URI's content as a TP.core.Content object
    localResult =
        targetURI.getResource(
            TP.hc('resultType', TP.core.Content)
        ).get('result');

    //  If that was successful, use 'asCleanString()'. This gives a more
    //  'TIBETan' representation (especially if it's markup).
    if (TP.isKindOf(localResult, TP.core.Content)) {
        localContent = localResult.asCleanString();
    } else {

        //  Otherwise, just use the raw text.
        localResult = targetURI.getResource(
                        TP.hc('resultType', TP.TEXT)).get('result');
        localContent = TP.str(localResult);
    }

    //  This call will generate a patch using the supplied local content and
    //  will fetch the remote content from the targetURI *as it currently exists
    //  on the server* but *without updating the targetURI's resource with the
    //  remote content*.
    promise = targetURI.computeDiffPatchAgainst(localContent);

    promise.then(
            function(diffPatch) {
                if (TP.notEmpty(diffPatch)) {
                    return this.sendPatch(targetURI, diffPatch);
                }
                return null;
            }.bind(this)).then(
            function(successfulPatch) {

                targetURI.isDirty(false);

                request.set('result', successfulPatch);
                request.complete();
            });

    return response;
});

//  ------------------------------------------------------------------------

TP.tds.TDSURLHandler.Type.defineMethod('sendPatch',
function(targetURI, patch) {

    /**
     * @method sendPatch
     * @summary Sends an HTTP POST with the supplied diff patch String and
     *     virtual resource location to the server to try to patch the remote
     *     version of the resource pointed to by the receiver.
     * @param {TP.core.URI} targetURI The URI to patch. NOTE that this URI will
     *     not have been rewritten/resolved.
     * @param {String} patch A 'unified diff' patch String that will be used
     *     to patch the remote version of the resource pointed to by the
     *     receiver.
     * @returns {Promise} A Promise whose resolved value will be a Boolean
     *     indicating whether the patch operation was successful.
     */

    var patchVirtualLoc,
        promise;

    //  Make sure that we have non-empty diff patch and virtual location
    //  Strings.
    if (TP.isEmpty(patch)) {
        return TP.extern.Promise.resolve(false);
    }

    patchVirtualLoc = targetURI.getVirtualLocation();
    if (TP.isEmpty(patchVirtualLoc)) {
        return this.raise('TP.sig.InvalidOperation',
            'Unable to locate source path for content.');
    }

    promise = TP.extern.Promise.construct(
                function(resolver, rejector) {

                    var patchRequest;

                    //  Construct a POST request for the patching operation.
                    //  Note here how it has a JSON mimetype, which is what the
                    //  patching service for the TDS expects.
                    patchRequest = targetURI.constructRequest(
                                            TP.hc('mimetype', TP.JSON_ENCODED));

                    patchRequest.defineHandler('RequestSucceeded',
                                                    function() {
                                                        resolver(true);
                                                    });

                    patchRequest.defineHandler('RequestFailed',
                                                    function() {
                                                        resolver(false);
                                                    });

                    //  Set the body for the request to the patching service URL
                    //  to what the patching service expects to see.
                    patchRequest.atPut('body',
                                            TP.hc('type', 'diff',
                                                    'nowatch', true,
                                                    'target', patchVirtualLoc,
                                                    'content', patch));

                    targetURI.httpPatch(patchRequest);
                });

    return promise;
});

//  ------------------------------------------------------------------------

TP.tds.TDSURLHandler.Type.defineMethod('save',
function(targetURI, aRequest) {

    /**
     * @method save
     * @summary Saves URI data content. This is the default data persistence
     *     method for most URI content. In this type, this will call 'patch' if
     *     the supplied URI points to content that is 'patchable' by the TDS.
     * @param {TP.core.URI} targetURI The URI to save. NOTE that this URI will
     *     not have been rewritten/ resolved.
     * @param {TP.sig.Request|TP.core.Hash} aRequest An object containing
     *     request information accessible via the at/atPut collection API of
     *     TP.sig.Requests.
     * @returns {TP.sig.Response} The request's response object.
     */

    var request,
        response;

    request = targetURI.constructRequest(aRequest);
    response = request.getResponse();

    if (!TP.canInvoke(targetURI, 'getLocation')) {
        request.fail();
        return response;
    }

    //  If the request didn't specifically define the method to be HTTP_PATCH or
    //  the URI can't produce a diff patch or we're currently running tests
    //  in the test harness, then don't try to do a PATCH - just do a regular
    //  save (i.e. PUT or POST).
    if (request.at('method') !== TP.HTTP_PATCH ||
        !targetURI.canDiffPatch() ||
        TP.sys.isTesting()) {
        return this.callNextMethod();
    }

    return this.patch(targetURI, aRequest);
});

//  ------------------------------------------------------------------------

TP.tds.TDSURLHandler.Type.defineHandler('TDSFileChange',
function(aSignal) {

    /**
     * @method handleTDSFileChange
     * @summary Handles when a TDS-managed resource has changed.
     * @param {TP.sig.TDSFileChange} aSignal The signal indicating that a
     *     TDS-managed resource has changed.
     * @returns {TP.tds.TDSURLHandler} The receiver.
     */

    var payload,
        data,
        path,
        fileName,
        url;

    //  Make sure that we have a payload
    if (TP.notValid(payload = aSignal.getPayload())) {
        return;
    }

    //  And that we have SSE data in that payload
    data = payload.at('data');
    if (TP.notValid(data)) {
        return;
    }

    //  If we can't determine the file path we can't take action in any case.
    path = data.at('path');
    if (TP.isEmpty(path)) {
        return;
    }

    //  Strip any enclosing quotes from the path.
    path = path.asString().stripEnclosingQuotes();

    fileName = TP.uriExpandPath(path);

    //  If we can successfully create a URL from the data, then process the
    //  change.
    if (TP.isURI(url = TP.uc(fileName))) {
        TP.core.URI.processRemoteResourceChange(url);
    }

    return this;
});

//  =======================================================================
//  Registration
//  ========================================================================

//  Make sure the remote url watcher knows about this handler type, but wait to
//  do this after the type has been fully configured to avoid api check error.
TP.core.RemoteURLWatchHandler.registerWatcher(TP.tds.TDSURLHandler);

//  =======================================================================
//  TP.sig.TDSFileChange
//  ========================================================================

TP.sig.RemoteURLChange.defineSubtype('TDSFileChange');

//  We configure our REMOTE_NAME to the same SSE-level event that the TDS is
//  configured to send. When the SSE channel signals that event it will be
//  transformed into a TDSFileChange signal we handle to do the processing.
TP.sig.TDSFileChange.Type.defineConstant('REMOTE_NAME',
    TP.sys.cfg('tds.watch.event'));

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
