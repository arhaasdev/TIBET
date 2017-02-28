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
 * @type {TP.tibet.style}
 * @summary A subtype of TP.core.ElementNode that implements the ability to put
 *         'static data' in the page.
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('tibet:style');

TP.tibet.style.Type.set('uriAttrs', TP.ac('href'));
TP.tibet.style.Type.set('reloadableUriAttrs', TP.ac('href'));

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

/**
 * The dictionary of known global vars for less compilations.
 * @type {Object}
 */
TP.tibet.style.Type.defineAttribute('lessGlobalVars');

//  ------------------------------------------------------------------------

TP.tibet.style.Type.defineMethod('initialize',
function() {

    /**
     * @method initialize
     * @summary Performs one-time type initialization.
     */

    this.refreshLessGlobals();

    return;
});

//  ------------------------------------------------------------------------

TP.tibet.style.Type.defineMethod('refreshLessGlobals',
function() {

    /**
     * @method refreshLessGlobals
     * @summary Updates the object containing global values passed to less
     *     worker thread processes. The values typically involve 'path'
     *     variables from the system configuration dictionary.
     */

    var cfg,
        globalVars;

    //  Get all of the cfg variables starting with 'path.'
    cfg = TP.sys.cfg('path');

    //  Create a POJO to hold vars since we'll be using via worker thread.
    globalVars = {};

    //  Iterate over all of the 'path.' variables, getting each key and slicing
    //  the 'path.' part off of it. Any remaining periods ('.') in the key are
    //  replaced with '-'. Then, quote the value so that LESS doesn't have
    //  issues with spaces, etc.
    cfg.getKeys().forEach(
        function(aKey) {
            var val;

            //  If the cfg data has a real value for that key, get the key and
            //  slice off the 'path.' portion. Any remaining periods ('.') in
            //  the key are then replaced with '-'. Then, quote the value so
            //  that LESS doesn't have issues with spaces, etc.
            if (TP.notEmpty(val = cfg.at(aKey))) {
                globalVars[aKey.slice(5).replace(/\./g, '-')] =
                    '"' + TP.uriResolveVirtualPath(val) + '"';
            }
        });

    this.$set('lessGlobalVars', globalVars);

    return;
});

//  ------------------------------------------------------------------------
//  Tag Phase Support
//  ------------------------------------------------------------------------

TP.tibet.style.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @method tagAttachDOM
     * @summary Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        tpElem,

        href;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return this.raise('TP.sig.InvalidNode');
    }

    tpElem = TP.wrap(elem);

    //  If we're not empty, then we reload from our child text content.
    if (!tpElem.isEmpty()) {

        tpElem.reloadFromContent();

    } else if (TP.notEmpty(href = TP.elementGetAttribute(elem, 'href', true))) {

        //  Otherwise, if our 'href' attribute isn't empty, then we reload from
        //  the content that can be found at the end of the URI contained there.
        tpElem.reloadFromAttrHref(href);

    } else {

        //  Raise an exception
        return this.raise('TP.sig.InvalidNode');
    }

    return;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.tibet.style.Inst.defineMethod('compileAndInsertLESS',
function(lessLoc, lessText) {

    /**
     * @method compileAndInsertLESS
     * @summary Compiles the supplied less text and inserts into the document of
     * the supplied style element.
     * @param {String} lessLoc The location that the LESS was found in. If the
     *     LESS source came from inline content on a 'tibet:style' element, this
     *     will be the location of the document plus a nonsensical name to
     *     satisfy the LESS compiler. If its from a 'tibet:style' element with
     *     an href, then it will be that href.
     * @param {String} lessText The source LESS text to compile.
     */

    var ourID,
        lessParams,
        lessWorker;

    //  Get our local ID, assigning it if necessary.
    ourID = this.getLocalID(true);

    TP.documentEnsureHeadElement(this.getNativeDocument());

    lessParams = TP.hc('filename', lessLoc,
                        'rootpath', TP.uriCollectionPath(lessLoc),
                        'globalVars', this.getType().get('lessGlobalVars'),
                        'elemID', ourID,
                        'paths', TP.ac(lessLoc));

    //  Obtain a 'LESS worker' and ask it to compile the LESS text.
    lessWorker = TP.core.LESSWorker.getWorker();
    lessWorker.compile(lessText, lessParams).then(
            function(result) {
                var cssText,
                    cssImports,
                    cssElemID,

                    natNode,
                    natDoc,

                    styleElems,

                    insertionPoint,

                    cssImportIDs,

                    existingStyleElem,
                    generatedStyleElem,

                    cssGeneratedID;

                if (TP.notValid(result)) {
                    return;
                }

                cssText = result.at('css');
                cssImports = result.at('imports');

                //  If there were valid compilation options (as set above in the
                //  'lessParams' variable), extract the element ID as supplied
                //  there. It is necessary to pass this above and use it here
                //  since workers are asynchronous and closured variables are
                //  inadequate.
                if (TP.isValid(result.at('compilationOptions'))) {

                    cssElemID = result.at('compilationOptions').at('elemID');
                }

                natNode = this.getNativeNode();
                natDoc = this.getNativeDocument();

                //  Because of a quirk of the way that we invoke the LESSCSS
                //  processor (running it in a worker thread rather than in the
                //  main UI canvas document), we need to manually ensure that
                //  all of the referenced '@imports' are actually put into the
                //  document.

                if (TP.notEmpty(cssElemID) && cssElemID.endsWith('_import')) {
                    insertionPoint = natNode;
                } else {
                    //  Try to compute an insertion point for any '@import'ed
                    //  stylesheets by first looking for any other 'html:' or
                    //  'tibet:' style elements that contain the word 'import'
                    //  anywhere in their ID
                    styleElems = TP.byCSSPath('style[id*="import"]',
                                                natDoc,
                                                false,      //  No autocollapse
                                                false);     //  No wrap
                    if (TP.notEmpty(styleElems)) {
                        //  Found one - insert after the last 'import' style
                        //  element, which means before it's next sibling
                        insertionPoint = styleElems.last().nextSibling;
                    } else {
                        //  Otherwise, there are no 'import' style elements -
                        //  see if there are any others.
                        styleElems = TP.byCSSPath(
                                                'style',
                                                natDoc,
                                                false,      //  No autocollapse
                                                false);     //  No wrap

                        if (TP.notEmpty(styleElems)) {
                            //  Insert before the first style element
                            insertionPoint = styleElems.first();
                        } else {
                            insertionPoint = natNode;
                        }
                    }
                }

                //  Sometimes, if the document that contains these elements is
                //  redrawn quickly, these elements will have gone away before
                //  this asynchronous servicing can happen. We test for that by
                //  testing the insertion point here. If it's no longer an
                //  Element, then we may as well exit.
                if (!TP.isElement(insertionPoint)) {
                    return;
                }

                //  Note here that, in order to try to preserve CSS rule order,
                //  we try to insert the '@imported' style sheets at the top.

                //  We track the IDs of the style elements representing the
                //  @imports here. Then we can configure the main element to
                //  depend on those loading.
                cssImportIDs = TP.ac();

                cssImports.forEach(
                        function(aPath) {
                            var isCSS,
                                extension,
                                styleElem,

                                sheetID;

                            isCSS = false;

                            //  If the extension is '.css', then we're dealing
                            //  with a non-LESS CSS file.
                            extension = TP.uriExtension(aPath);
                            if (extension === 'css') {
                                isCSS = true;
                            }

                            //  Compute an ID from the last part of the path
                            //  followed by '_import'.
                            sheetID = TP.uriName(aPath).replace(/\./g, '_') +
                                        '_import';
                            styleElem = TP.byId(sheetID, natDoc, false);

                            //  If there isn't an existing style element with
                            //  that name, create one and insert it.
                            if (!TP.isElement(styleElem)) {

                                if (isCSS) {
                                    styleElem =
                                        TP.documentConstructCSSStyleElement(
                                            natDoc);
                                } else {
                                    styleElem = TP.documentConstructElement(
                                                    natDoc,
                                                    'tibet:style',
                                                    TP.w3.Xmlns.TIBET);
                                }

                                TP.elementSetAttribute(
                                                    styleElem,
                                                    'href',
                                                    aPath);

                                TP.elementSetAttribute(
                                                    styleElem,
                                                    'id',
                                                    sheetID);

                                cssImportIDs.push(sheetID);

                                //  Go ahead and insert the new element - note
                                //  here how we *always* awaken the content.
                                //  Because we're being called asynchronously,
                                //  it's impossible to tell if we're already
                                //  part of an awaken cycle or not. But, because
                                //  of our check above to determine whether we
                                //  already exist, we don't have to worry about
                                //  multiple awakenings.
                                styleElem = TP.nodeInsertBefore(
                                                    insertionPoint.parentNode,
                                                    styleElem,
                                                    insertionPoint,
                                                    true);
                            } else {

                                //  The style element was already in the
                                //  document (because another sheet brought it
                                //  in), but it might not be positioned
                                //  ahead of the element that's referencing it
                                //  ('natNode' in this case).
                                if (TP.nodeComparePosition(
                                    natNode, styleElem, TP.FOLLOWING_NODE)) {

                                    //  Detach it and reposition it in front of
                                    //  the node that's referencing it.
                                    TP.nodeDetach(styleElem);
                                    TP.nodeInsertBefore(natNode.parentNode,
                                                        styleElem,
                                                        natNode,
                                                        false);

                                    //  See if it also already has a generated
                                    //  representation.
                                    generatedStyleElem =
                                        TP.byId(
                                            TP.lid(styleElem) + '_generated',
                                            natDoc,
                                            false);
                                    if (TP.isElement(generatedStyleElem)) {

                                        //  Detach it and reposition it in front
                                        //  of the style element that it's a
                                        //  generated representation of.
                                        TP.nodeDetach(generatedStyleElem);
                                        TP.nodeInsertBefore(
                                                    styleElem.parentNode,
                                                    generatedStyleElem,
                                                    styleElem.nextSibling,
                                                    false);
                                    }
                                }
                            }
                        });

                //  If there is no existing native CSS 'style' element that
                //  would've been generated for this element, create one and set
                //  its content.
                if (!TP.isElement(
                    existingStyleElem =
                    TP.byCSSPath(
                        '[for="' + cssElemID + '"]', natDoc, true, false))) {

                    insertionPoint = natNode.nextSibling;

                    //  Always insert the 'compiled representation' just after
                    //  the original. Make sure that if it's not an Element or
                    //  if it has been detached (which can happen due to DOM
                    //  structural changes when content is being loaded -
                    //  sometimes <script> elements are moved around, for
                    //  instance), that we set the insertion point to null.
                    if (!TP.isElement(insertionPoint) ||
                        TP.nodeIsDetached(insertionPoint)) {
                        insertionPoint = null;
                    }

                    generatedStyleElem = TP.documentAddCSSStyleElement(
                                                    natDoc,
                                                    cssText,
                                                    insertionPoint);

                    //  Compute and set an ID for our generated (real) CSS style
                    //  sheet.
                    cssGeneratedID = cssElemID + '_generated';
                    TP.elementSetAttribute(
                                generatedStyleElem, 'id', cssGeneratedID, true);

                    //  Set an attribute on our newly created style element that
                    //  links it back to the source element.
                    TP.elementSetAttribute(generatedStyleElem,
                                            'for',
                                            cssElemID,
                                            true);

                    //  If the original element has a 'tibet:type' attribute on
                    //  it, copy it over to the generated version. Note that we
                    //  do *not* do this for imported stylesheets above.
                    if (this.hasAttribute('tibet:type')) {
                        TP.elementSetAttribute(generatedStyleElem,
                                                'tibet:type',
                                                this.getAttribute('tibet:type'),
                                                true);
                    }

                    //  If @imports were detected and we've gathered a set of
                    //  IDs representing them, then we join those together using
                    //  the TP.JOIN separator character and set the 'dependsOn'
                    //  attribute to that value. This will be used by the
                    //  generated style element to determine when all of its
                    //  @imports have been loaded.
                    if (TP.notEmpty(cssImportIDs)) {
                        TP.elementSetAttribute(generatedStyleElem,
                                                'dependsOn',
                                                cssImportIDs.join(TP.JOIN),
                                                true);
                    }
                } else {

                    //  Otherwise, just set the content of the existing one.
                    TP.cssStyleElementSetContent(existingStyleElem, cssText);
                }

                //  Work around Chrome (and possibly others) stupidity
                //  TODO: Commented out for now - doesn't seem to need it.
                // TP.windowForceRepaint(TP.nodeGetWindow(natDoc));

            }.bind(this)).catch(
            function(err) {
                TP.ifError() ?
                    TP.error('Error compiling LESS in: ' + lessLoc +
                                TP.str(err)) : 0;
            });

    return;
});

//  ------------------------------------------------------------------------

TP.tibet.style.Inst.defineMethod('reloadFromAttrHref',
function(anHref) {

    /**
     * @method reloadFromAttrHref
     * @summary Reloads the receiver with the content found at the end of the
     *     href.
     * @param {String} anHref The URL that the receiver will use to reload its
     *     content.
     * @returns {TP.html.link} The receiver.
     */

    var doc,

        generatedStyleID,
        ourID,

        newStyleElem,
        existingStyleElem,

        ext,
        hrefURI,
        hrefLocation,
        fetchRequest,
        newHref,

        styleURI,
        fetchOptions,
        inlineStyleContent,
        inlinedStyleElem;

    if (TP.notEmpty(anHref)) {

        ext = TP.uriExtension(anHref);

        hrefURI = TP.uc(anHref);
        hrefLocation = hrefURI.getLocation();

        switch (ext) {

            case 'less' :

                //  The style is some LESS CSS. Go fetch it and, when it's
                //  returned, compile and insert it into the document. Note how
                //  we *don't* specify 'refresh' here, since we want the latest
                //  content as set into the URL.
                fetchRequest = TP.request('async', true, 'resultType', TP.TEXT);
                fetchRequest.defineHandler(
                        'RequestSucceeded',
                            function(aResponse) {
                                var fetchLoc,
                                    fetchResult;

                                //  Note here how we grab the 'whole location'
                                //  of the URI and supply that to the LESS
                                //  processor. No need to do the 'nonsensical
                                //  file name' trick - we have the real LESS
                                //  file here.
                                fetchLoc = hrefLocation;
                                fetchResult = aResponse.get('result');

                                //  Run the LESS compiler and insert the
                                //  results.
                                this.compileAndInsertLESS(
                                            fetchLoc, fetchResult);
                            }.bind(this));
                hrefURI.getResource(fetchRequest);

                break;

            default:

                doc = this.getNativeDocument();

                //  Get our local ID, assigning it if necessary.
                ourID = this.getLocalID(true);

                //  Compute an ID for our generated (real) CSS style sheet.
                generatedStyleID = ourID + '_generated';

                if (this.getAttribute('type') === TP.ietf.Mime.TIBET_CSS) {

                    styleURI = TP.uc(hrefLocation);

                    //  Note how we *don't* specify 'refresh' here, since we
                    //  want the latest content as set into the URL.
                    fetchOptions = TP.hc('async', false, 'resultType', TP.TEXT);
                    inlineStyleContent =
                        styleURI.getResource(fetchOptions).get('result');

                    //  Set the content of an inlined XHTML style element that
                    //  contains the inlined style, resolving @import statements
                    //  and possible rewriting CSS url(...) values. Note that
                    //  this will generate a new style element if it has to.
                    inlinedStyleElem = TP.documentInlineCSSURIContent(
                                            doc,
                                            styleURI,
                                            inlineStyleContent,
                                            this.getNativeNode().nextSibling,
                                            true);

                    //  Make sure also to set the style element's 'id'
                    //  attribute, so that the above 'uniquing' logic will work
                    //  for future occurrences of this element being processed
                    //  (which ensures that we don't add the same element more
                    //  than once).
                    TP.elementSetAttribute(inlinedStyleElem,
                                            'id',
                                            generatedStyleID,
                                            true);
                } else {

                    //  If there is no existing 'style' element, create one and
                    //  set its content.
                    if (!TP.isElement(
                            existingStyleElem =
                            TP.byCSSPath(
                                '[for="' + ourID + '"]', doc, true, false))) {

                        //  Just some CSS - link it in.
                        newStyleElem = TP.documentAddCSSLinkElement(
                                                doc,
                                                hrefLocation,
                                                this.getNativeNode().nextSibling);

                        TP.elementSetAttribute(
                                newStyleElem, 'id', generatedStyleID, true);

                        //  Set an attribute on our newly created style element
                        //  that links it back to the source element.
                        TP.elementSetAttribute(newStyleElem, 'for', ourID, true);

                    } else {

                        //  Otherwise, just compute a new href from the old href
                        //  value that is guaranteed to be unique and set the
                        //  'href' property of the existing style element to it,
                        //  thereby guaranteeing a reload of the content.
                        newHref = TP.uriAddUniqueQuery(hrefLocation);

                        existingStyleElem.href = newHref;
                    }
                }
        }
    }

    return;
});

//  ------------------------------------------------------------------------

TP.tibet.style.Inst.defineMethod('reloadFromContent',
function() {

    /**
     * @method reloadFromContent
     * @summary Reloads the receiver with the child text content found inside of
     *     the receiver.
     * @returns {null}
     */

    var resourceStr,

        doc,

        generatedStyleID,
        ourID,

        type,

        currentDir,
        currentLoc,

        newStyleElem,
        existingStyleElem;

    doc = this.getNativeDocument();

    //  Get our local ID, assigning it if necessary.
    ourID = this.getLocalID(true);

    //  Compute an ID for our generated (real) CSS style sheet.
    generatedStyleID = ourID + '_generated';

    resourceStr = this.getTextContent();

    //  If there's a 'type' attribute, that should have the type of style
    //  that we're being asked to process.
    type = this.getAttribute('type');

    switch (type) {
        case 'less':

            //  Note that, due to a limitation of the LESS API, we can't
            //  just provide a 'root path' that url()s can be resolved
            //  against. So we get our document's collection path and attach
            //  a nonsensical filename to it before supplying that to the
            //  LESS compilation routine.
            currentDir = TP.uriCollectionPath(TP.documentGetLocation(doc));
            currentLoc = TP.uriJoinPaths(currentDir, 'fluffy.less');

            this.compileAndInsertLESS(currentLoc, resourceStr);

            break;

        default:

            //  If there is no existing 'style' element, create one and set
            //  its content.
            if (!TP.isElement(
                    existingStyleElem =
                    TP.byCSSPath(
                        '[for="' + ourID + '"]', doc, true, false))) {

                //  Just some CSS
                newStyleElem = TP.documentAddCSSStyleElement(
                                    doc,
                                    resourceStr,
                                    this.getNativeNode().nextSibling);

                TP.elementSetAttribute(
                        newStyleElem, 'id', generatedStyleID, true);

                //  Set an attribute on our newly created style element that
                //  links it back to the source element.
                TP.elementSetAttribute(newStyleElem, 'for', ourID, true);
            } else {
                //  Otherwise, just set the content of the existing one.
                TP.cssStyleElementSetContent(existingStyleElem, resourceStr);
            }
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.tibet.style.Inst.defineMethod('serializeCloseTag',
function(storageInfo) {

    /**
     * @method serializeCloseTag
     * @summary Serializes the closing tag for the receiver.
     * @description At this type level, this method, in conjunction with the
     *     'serializeOpenTag' method, will always produce the 'XML version' of
     *     an empty tag (i.e. '<foo/>' rather than '<foo></foo>').
     * @param {TP.core.Hash} storageInfo A hash containing various flags for and
     *     results of the serialization process. Notable keys include:
     *          'wantsXMLDeclaration': Whether or not the document node should
     *          include an 'XML declaration' at the start of it's serialization.
     *          The default is false.
     *          'result': The current serialization result as it's being built
     *          up.
     *          'store': The key under which the current serialization result
     *          will be stored.
     *          'stores': A hash of 1...n serialization results that were
     *          generated during the serialization process. Note that nested
     *          nodes might generated results that will go into different
     *          stores, and so they will all be stored here, each keyed by a
     *          unique key (which, by convention, will be the URI they should be
     *          saved to).
     * @returns {String} A serialization of the closing tag of the receiver.
     */

    var attrNode;

    attrNode = this.getNativeNode().attributes.type;
    if (TP.isAttributeNode(attrNode)) {
        //  If the 'type' attribute is 'TIBET_CSS', that means it was
        //  auto-populated and shouldn't be written.
        if (attrNode.value === TP.ietf.Mime.TIBET_CSS) {
            return TP.CONTINUE;
        }
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.tibet.style.Inst.defineMethod('serializeOpenTag',
function(storageInfo) {

    /**
     * @method serializeOpenTag
     * @summary Serializes the opening tag for the receiver.
     * @description At this type level, this method performs a variety of
     *     transformations and filtering of various attributes. See the code
     *     below for more details. One notable transformation is that this
     *     method, in conjunction with the 'serializeCloseTag' method,  will
     *     always produce the 'XML version' of an empty tag (i.e. '<foo/>'
     *     rather than '<foo></foo>').
     * @param {TP.core.Hash} storageInfo A hash containing various flags for and
     *     results of the serialization process. Notable keys include:
     *          'wantsXMLDeclaration': Whether or not the document node should
     *          include an 'XML declaration' at the start of it's serialization.
     *          The default is false.
     *          'result': The current serialization result as it's being built
     *          up.
     *          'store': The key under which the current serialization result
     *          will be stored.
     *          'stores': A hash of 1...n serialization results that were
     *          generated during the serialization process. Note that nested
     *          nodes might generated results that will go into different
     *          stores, and so they will all be stored here, each keyed by a
     *          unique key (which, by convention, will be the URI they should be
     *          saved to).
     * @returns {String} A serialization of the opening tag of the receiver.
     */

    var attrNode;

    attrNode = this.getNativeNode().attributes.type;
    if (TP.isAttributeNode(attrNode)) {
        //  If the 'type' attribute is 'TIBET_CSS', that means it was
        //  auto-populated and shouldn't be written.
        if (attrNode.value === TP.ietf.Mime.TIBET_CSS) {
            return TP.CONTINUE;
        }
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.tibet.style.Inst.defineMethod('setContent',
function(aContentObject, aRequest) {

    /**
     * @method setContent
     * @summary Sets the content of the receiver's native DOM counterpart to
     *     the value supplied.
     * @param {Object} aContentObject An object to use for content.
     * @param {TP.sig.Request} aRequest A request containing control parameters.
     * @returns {null}
     */

    this.callNextMethod();

    //  reload from the child text content found inside ourself.
    this.reloadFromContent();

    return null;
});

//  ------------------------------------------------------------------------

TP.tibet.style.Inst.defineMethod('setAttrHref',
function(anHref) {

    /**
     * @method setAttrHref
     * @summary Sets the href that the receiver will use to retrieve its
     *     content.
     * @param {String} anHref The URL that the receiver will use to fetch its
     *     content.
     */

    this.$setAttribute('href', anHref);

    //  reload from the content found at the href.
    this.reloadFromAttrHref(anHref);

    //  setting an attribute returns void according to the spec
    return;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
