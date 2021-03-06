//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

/**
 * @type {TP.sherpa.couchDocumentURIInsertionAssistant}
 */

//  ------------------------------------------------------------------------

TP.tag.CustomTag.defineSubtype('sherpa.couchDocumentURIInsertionAssistant');

//  Note how this property is TYPE_LOCAL, by design.
TP.sherpa.couchDocumentURIInsertionAssistant.defineAttribute('themeURI', TP.NO_RESULT);

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.sherpa.couchDocumentURIInsertionAssistant.Inst.defineAttribute('head',
    TP.cpc('> .head', TP.hc('shouldCollapse', true)));

TP.sherpa.couchDocumentURIInsertionAssistant.Inst.defineAttribute('body',
    TP.cpc('> .body', TP.hc('shouldCollapse', true)));

TP.sherpa.couchDocumentURIInsertionAssistant.Inst.defineAttribute('foot',
    TP.cpc('> .foot', TP.hc('shouldCollapse', true)));

TP.sherpa.couchDocumentURIInsertionAssistant.Inst.defineAttribute('data');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.couchDocumentURIInsertionAssistant.Inst.defineHandler('DialogCancel',
function(anObject) {

    /**
     * @method handleDialogCancel
     * @summary Handles when the user has 'canceled' the dialog (i.e. wants to
     *     proceed without taking any action).
     * @param {TP.sig.DialogCancel} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.couchDocumentURIInsertionAssistant} The receiver.
     */

    var modelURI;

    //  We observed the model URI when we were set up - we need to ignore it now
    //  on our way out.
    modelURI = TP.uc('urn:tibet:couchDocumentURIInsertionAssistant_source');
    this.ignore(modelURI, 'ValueChange');

    //  Focus and set the cursor to the end of the Sherpa's input cell after
    //  1000ms
    setTimeout(
        function() {
            var consoleGUI;

            consoleGUI =
                TP.bySystemId('SherpaConsoleService').get('$consoleGUI');

            consoleGUI.focusInput();
            consoleGUI.setInputCursorToEnd();
        }, 1000);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.couchDocumentURIInsertionAssistant.Inst.defineHandler('DialogOk',
function(anObject) {

    /**
     * @method handleDialogOk
     * @summary Handles when the user has 'ok-ed' the dialog (i.e. wants to
     *     proceed by taking the default action).
     * @param {TP.sig.DialogOk} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.couchDocumentURIInsertionAssistant} The receiver.
     */

    var modelURI,

        suppliedData,

        result,
        resultData,
        info,

        schemaText,

        tSchema,
        schemaObj,

        schemaFile,

        newTPElem,
        newElem,

        targetElem,
        targetTPElem,

        remoteLoc,

        localID,
        localLoc,

        doc,

        newLoadServiceElem,
        newSaveServiceElem,
        newSaveButtonElem,

        insertionFunc,

        schemaURI,

        saveRequest;

    //  We observed the model URI when we were set up - we need to ignore it now
    //  on our way out.
    modelURI = TP.uc('urn:tibet:couchDocumentURIInsertionAssistant_source');
    this.ignore(modelURI, 'ValueChange');

    if (TP.notValid(suppliedData = this.get('data'))) {
        return this;
    }

    result = TP.uc('urn:tibet:couchDocumentURIInsertionAssistant_source').
                getResource().get('result');

    if (TP.notValid(result)) {
        return this;
    }

    if (TP.notValid(resultData = result.get('data'))) {
        return this;
    }

    info = TP.hc(resultData).at('info');

    //  ---

    schemaText = info.at('schema');

    if (!TP.isJSONString(schemaText)) {
        //  Schema wasn't JSON. Exit here.
        //  TODO: Raise an exception
        return this;
    }

    tSchema = TP.json2js(schemaText);

    schemaObj = TP.json.JSONSchemaContent.construct(tSchema);

    // schemaFile = info.at('schemaFile');
    schemaFile = null;

    //  ---

    targetElem = suppliedData.at('insertionPoint');
    if (!TP.isElement(targetElem)) {
        //  No insertion point? Exit here.
        //  TODO: Raise an exception
        return this;
    }

    targetTPElem = TP.wrap(targetElem);

    //  Create a new xctrls:propertysheet element from the computed JSON schema.
    newTPElem = TP.xctrls.propertysheet.from(schemaObj);
    newElem = TP.unwrap(newTPElem);

    localID = suppliedData.at('insertionID');
    localLoc = 'urn:tibet:' + localID;

    remoteLoc = suppliedData.at('uri').getLocation();

    //  ---

    newTPElem.setAttribute('bind:scope', localLoc + '#jpath($)');

    doc = TP.nodeGetDocument(newElem);

    newLoadServiceElem =
        TP.elem('<tibet:service' +
                ' id="' + localID + '_loader"' +
                ' href="' + remoteLoc + '"' +
                ' result="' + localLoc + '"' +
                ' watched="true"' +
                ' on:TP.sig.AttachComplete="TP.sig.UIActivate"/>');
    TP.nodeAppendChild(newElem, newLoadServiceElem, false);
    TP.nodeAppendChild(newElem, doc.createTextNode('\n'), false);

    newSaveServiceElem =
        TP.elem('<tibet:service' +
                ' id="' + localID + '_saver"' +
                ' href="' + remoteLoc + '"' +
                ' body="' + localLoc + '"' +
                ' result="' + localLoc + '_result"' +
                ' method="PUT"' +
                ' mimetype="application/json"/>');
    TP.nodeAppendChild(newElem, newSaveServiceElem, false);
    TP.nodeAppendChild(newElem, doc.createTextNode('\n'), false);

    newSaveButtonElem =
        TP.xhtmlnode(
                '<xctrls:button' +
                ' class="saveButton"' +
                ' on:click="{signal: UIActivate, ' +
                            'origin: \'' + localID + '_saver' + '\'}">' +
                '<xctrls:label>Save Property Sheet</xctrls:label>' +
                '</xctrls:button>');
    TP.nodeAppendChild(newElem, newSaveButtonElem, false);
    TP.nodeAppendChild(newElem, doc.createTextNode('\n'), false);

    //  ---

    //  Create a function that will perform the insertion. We do this because,
    //  if we have a schema file path defined, we need to save it before we
    //  insert the new element.

    insertionFunc = function() {

        //  Tell the main Sherpa object that it should go ahead and process DOM
        //  mutations to the source DOM.
        TP.bySystemId('Sherpa').set('shouldProcessDOMMutations', true);

        //  Insert the new property sheet into target element at the inserted
        //  position.
        newTPElem = targetTPElem.insertContent(
                                    newTPElem, info.at('insertionPosition'));

        newElem = TP.unwrap(newTPElem);
        newElem[TP.INSERTION_POSITION] = info.at('insertionPosition');
        newElem[TP.SHERPA_MUTATION] = TP.INSERT;

        //  Focus and set the cursor to the end of the Sherpa's input cell after
        //  500ms
        setTimeout(
            function() {
                var consoleGUI;

                consoleGUI =
                    TP.bySystemId('SherpaConsoleService').get('$consoleGUI');

                consoleGUI.focusInput();
                consoleGUI.setInputCursorToEnd();
            }, 500);

        //  Focus the halo onto the inserted element after 1000ms
        setTimeout(
            function() {
                var halo;

                halo = TP.byId('SherpaHalo', this.getNativeDocument());

                //  This will move the halo off of the old element. Note that we
                //  do *not* check here whether or not we *can* blur - we
                //  definitely want to blur off of the old DOM content - it's
                //  probably gone now anyway.
                halo.blur();

                //  Focus the halo on our new element, passing true to actually
                //  show the halo if it's hidden.
                if (newTPElem.haloCanFocus(halo)) {
                    halo.focusOn(newTPElem, true);
                }
            }.bind(this), 1000);

        //  Set up a timeout to delete those flags after a set amount of time
        setTimeout(
            function() {
                delete newElem[TP.INSERTION_POSITION];
                delete newElem[TP.SHERPA_MUTATION];
            }, TP.sys.cfg('sherpa.mutation_flag_clear_timeout', 5000));
    }.bind(this);

    //  ---

    //  Now, check to see if we have a schema file path defined. If not, execute
    //  the insertion function immediately. If so, save the schema file and then
    //  execute the insertion function
    if (TP.isEmpty(schemaFile)) {
        insertionFunc();
    } else {

        schemaURI = TP.uc(schemaFile);
        schemaURI.set('shouldPatch', false);

        schemaURI.setContent(schemaText);

        if (!TP.isURI(schemaURI)) {
            insertionFunc();
        } else {

            saveRequest = schemaURI.constructRequest(
                                        TP.hc('method', TP.HTTP_PUT));

            saveRequest.defineHandler(
                'RequestSucceeded',
                    function(aResponse) {

                        var newContentElem;

                        newContentElem =
                            TP.elem('<tibet:content' +
                                    ' name="' + localID + '"' +
                                    ' baseType="TP.core.JSONContent"' +
                                    ' schema="' + schemaFile + '"');

                        TP.nodeInsertBefore(
                            newElem, newContentElem, newLoadServiceElem, false);

                        insertionFunc();
                    });

            saveRequest.defineHandler(
                'RequestFailed',
                    function(aResponse) {
                        insertionFunc();
                    });

            schemaURI.save(saveRequest);
        }
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.couchDocumentURIInsertionAssistant.Inst.defineMethod('generatePathData',
function(anElement) {

    /**
     * @method generatePathData
     * @summary Generates the data that will be used to display the path from
     *     the top-level of the Element's document down through the descendant
     *     chain to the supplied Element.
     * @param {Element} anElement The element to generate the path to.
     * @returns {TP.sherpa.couchDocumentURIInsertionAssistant} The receiver.
     */

    var targetTPElem,

        nodes,

        info;

    targetTPElem = TP.wrap(anElement);

    //  Get the supplied element's ancestor chain and build a list from that.
    nodes = targetTPElem.getAncestors();

    //  Unshift the supplied element onto the front.
    nodes.unshift(targetTPElem);

    //  Reverse the list so that the top-most anscestor is first and the
    //  supplied element is last.
    nodes.reverse();

    info = TP.ac();

    //  Concatenate the filtered child elements onto the list.
    nodes.perform(
        function(aNode) {
            var node;

            node = TP.canInvoke(aNode, 'getNativeNode') ?
                                    aNode.getNativeNode() :
                                    aNode;

            if (!TP.isElement(node)) {
                return;
            }

            info.push(TP.elementGetFullName(node));
        });

    return info;
});

//  ------------------------------------------------------------------------

TP.sherpa.couchDocumentURIInsertionAssistant.Inst.defineMethod('setData',
function(anObj) {

    /**
     * @method setData
     * @summary Sets the receiver's data object to the supplied object.
     * @param {Object} aDataObject The object to set the receiver's internal
     *     data to.
     * @returns {TP.sherpa.couchDocumentURIInsertionAssistant} The receiver.
     */

    var data,

        definitionName,

        pojoSchema,

        schemaText,

        modelObj,
        newInsertionInfo,

        modelURI,

        insertionPosition,
        insertionPointElem,

        breadcrumbTPElem,
        breadcrumbData;

    this.$set('data', anObj);

    //  ---

    //  Grab the JSON data from the source URI.
    data = anObj.at('uri').getResource(
                TP.hc('resultType', TP.core.Content)).get('result').get('data');

    definitionName = 'Couch_Doc_' + data.at('_id');

    //  Build a JSON Schema from the POJO data and with the ID of the Couch
    //  document as the JSON Schema 'definition name'.
    pojoSchema = TP.json.JSONSchemaType.buildSchemaFrom(data, definitionName);

    if (TP.notValid(pojoSchema)) {
        return this;
    }

    //  Grab the text of the POJO schema object and format it out, using plain
    //  text encoding. This will become the value of the schema textarea.
    schemaText = TP.json(pojoSchema);
    schemaText = TP.sherpa.pp.runFormattedJSONModeOn(
                        schemaText,
                        TP.hc('outputFormat', TP.PLAIN_TEXT_ENCODED));

    //  ---

    //  Build the model object.
    modelObj = TP.hc();

    //  Register a hash to be placed at the top-level 'info' slot in the model.
    newInsertionInfo = TP.hc();
    modelObj.atPut('info', newInsertionInfo);

    //  The data for the chosen tag or entered tag names
    newInsertionInfo.atPut('schema', schemaText);
    // newInsertionInfo.atPut('schemaFile',
    //                        '~app_dat/' + definitionName + '.json');

    //  If we were handed an insertion position, then use it. Otherwise, default
    //  it to TP.BEFORE_END
    insertionPosition = anObj.at('insertionPosition');
    if (TP.isEmpty(insertionPosition)) {
        insertionPosition = TP.BEFORE_END;
    }
    newInsertionInfo.atPut('insertionPosition', insertionPosition);

    //  ---

    //  Set up a model URI and observe it for change ourself. This will allow us
    //  to regenerate the tag representation as the model changes.
    modelURI = TP.uc('urn:tibet:couchDocumentURIInsertionAssistant_source');

    //  Construct a JSONContent object around the model object so that we can
    //  bind to it using the more powerful JSONPath constructs
    modelObj = TP.core.JSONContent.construct(TP.js2json(modelObj));

    //  Set the resource of the model URI to the model object, telling the URI
    //  that it should observe changes to the model (which will allow us to get
    //  notifications from the URI which we're observing above) and to go ahead
    //  and signal change to kick things off.
    modelURI.setResource(
        modelObj,
        TP.hc('observeResource', true, 'signalChange', true));

    //  ---

    insertionPointElem = anObj.at('insertionPoint');
    newInsertionInfo.atPut('insertionPoint', insertionPointElem);

    //  If we were handed an Element as an insertion point, then we generate the
    //  data that will show a path to it.
    if (TP.isElement(insertionPointElem)) {
        breadcrumbData = this.generatePathData(insertionPointElem);
    } else {
        breadcrumbData = TP.ac();
    }

    //  Set the value of the breadcrumb to that data.
    breadcrumbTPElem = TP.byId(
                        'couchDocumentURIInsertionAssistant_InsertionBreadcrumb',
                        this.getNativeNode());
    breadcrumbTPElem.setValue(breadcrumbData);

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
