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
 * @type {TP.sherpa.urieditor}
 */

//  ------------------------------------------------------------------------

TP.sherpa.Element.defineSubtype('urieditor');

TP.sherpa.urieditor.Inst.defineAttribute('$changingURIs');

TP.sherpa.urieditor.Inst.defineAttribute('sourceURI');

TP.sherpa.urieditor.Inst.defineAttribute('dirty');

TP.sherpa.urieditor.Inst.defineAttribute('localSourceContent');

TP.sherpa.urieditor.Inst.defineAttribute('changeHandler');

TP.sherpa.urieditor.Inst.defineAttribute(
        'head',
        {value: TP.cpc('> .head', TP.hc('shouldCollapse', true))});

TP.sherpa.urieditor.Inst.defineAttribute(
        'body',
        {value: TP.cpc('> .body', TP.hc('shouldCollapse', true))});

TP.sherpa.urieditor.Inst.defineAttribute(
        'foot',
        {value: TP.cpc('> .foot', TP.hc('shouldCollapse', true))});

TP.sherpa.urieditor.Inst.defineAttribute(
        'editor',
        {value: TP.cpc('> .body > xctrls|codeeditor', TP.hc('shouldCollapse', true))});

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @method tagAttachDOM
     * @summary Sets up runtime machinery for the element in aRequest
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have an Element to work from
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception.
        return;
    }

    TP.wrap(elem).configure();

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Type.defineMethod('tagDetachDOM',
function(aRequest) {

    /**
     * @method tagDetachDOM
     * @summary Tears down runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem;

    //  Make sure that we have an Element to work from
    if (!TP.isElement(elem = aRequest.at('node'))) {
        //  TODO: Raise an exception.
        return;
    }

    TP.wrap(elem).teardown();

    //  this makes sure we maintain parent processing - but we need to do it
    //  last because it nulls out our wrapper reference.
    this.callNextMethod();

    return;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('applyResource',
function() {

    var editor,

        newSourceText,

        sourceObj;

    editor = this.get('editor');

    if (TP.notValid(newSourceText = editor.getDisplayValue())) {
        editor.setDisplayValue('');

        this.isDirty(false);

        return this;
    }

    sourceObj = this.get('sourceURI');

    this.set('$changingURIs', true);

    sourceObj.setContent(newSourceText);
    this.set('localSourceContent', newSourceText);
    this.isDirty(false);

    this.set('$changingURIs', false);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('configure',
function() {

    var editorObj;

    editorObj = this.get('editor').$get('$editorObj');

    editorObj.setOption('theme', 'elegant');
    editorObj.setOption('tabMode', 'indent');
    editorObj.setOption('lineNumbers', true);
    editorObj.setOption('lineWrapping', true);

    this.set('changeHandler', this.updateEditorState.bind(this));

    editorObj.on('change', this.get('changeHandler'));

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('getSourceID',
function() {

    var sourceObj;

    if (TP.isValid(sourceObj = this.get('sourceURI'))) {
        return sourceObj.getLocation();
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('getToolbar',
function() {

    var toolbar;

    //  This is different depending on whether we're embedded in the inspector
    //  or in a tile

    if (TP.isTrue(this.hasAttribute('detached'))) {
        toolbar = TP.byCSSPath('> .foot', this, true);
    } else {
        toolbar = TP.byId('SherpaToolbar', this.getWindow());
    }

    return toolbar;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineHandler('ResourceApply',
function(aSignal) {

    this.applyResource();

    this.updateEditorState(this.get('editor').$get('$editorObj'));

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineHandler('ResourcePush',
function(aSignal) {

    this.pushResource();

    this.updateEditorState(this.get('editor').$get('$editorObj'));

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineHandler('ResourceRevert',
function(aSignal) {

    this.revertResource();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineHandler('ValueChange',
function(aSignal) {

    if (this.get('$changingURIs')) {
        return this;
    }

    if (this.isDirty()) {
        TP.confirm('Remote content changed. Abandon local changes?').then(
            function(abandonChanges) {

                if (abandonChanges) {
                    //  NB: This will reset both the localSourceContent cache
                    //  and our editor to whatever is in the URI and set the
                    //  URI's 'dirty' flag to false.
                    this.render();
                }
            }.bind(this));
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('pushResource',
function() {

    var sourceObj,

        putParams,
        putRequest;

    this.applyResource();

    sourceObj = this.get('sourceURI');

    putParams = TP.hc('method', TP.HTTP_PUT);
    putRequest = sourceObj.constructRequest(putParams);

    putRequest.defineHandler('RequestSucceeded',
        function(aResponse) {
        });

    putRequest.defineHandler('RequestFailed',
        function(aResponse) {
        });

    putRequest.defineHandler('RequestCompleted',
        function(aResponse) {
        });

    sourceObj.save(putRequest);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('render',
function() {

    var editor,
        editorObj,

        sourceObj,
        sourceResource,
        sourceStr,

        mimeType;

    editor = this.get('editor');

    sourceObj = this.get('sourceURI');

    if (TP.isValid(sourceObj)) {
        sourceResource =
            sourceObj.getResource(TP.hc('async', false)).get('result');
    }

    if (TP.notValid(sourceObj) ||
        TP.isEmpty(sourceResource)) {
        this.set('localSourceContent', '');
        editor.setDisplayValue('');

        return this;
    }

    editorObj = this.get('editor').$get('$editorObj');

    //  Try to get a MIME type from the URI - if we can't, then we just treat
    //  the content as plain text.
    if (TP.isEmpty(mimeType = sourceObj.getMIMEType())) {
        mimeType = TP.PLAIN_TEXT_ENCODED;
    }

    //  CodeMirror won't understand XHTML as distinct from XML.
    if (mimeType === TP.XHTML_ENCODED) {
        mimeType = TP.XML_ENCODED;
    }

    //  Set the editor's 'mode' to the computed MIME type
    editorObj.setOption('mode', mimeType);

    sourceStr = TP.str(sourceResource.get('data'));

    this.set('localSourceContent', sourceStr);
    this.isDirty(false);

    editorObj.setValue(sourceStr);

    /* eslint-disable no-extra-parens */
    (function() {
        editor.refreshEditor();
    }).fork(200);
    /* eslint-enable no-extra-parens */

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('revertResource',
function() {

    var editor,
        sourceText,
        editorObj,
        sourceObj;

    editor = this.get('editor');

    //  Now, update the local content to match what the remote content has
    sourceObj = this.get('sourceURI');

    sourceText = TP.str(sourceObj.getContent());

    if (TP.notValid(sourceText)) {
        editor.setDisplayValue('');
        this.set('localSourceContent', '');

        this.isDirty(false);

        return this;
    }

    editorObj = this.get('editor').$get('$editorObj');

    editorObj.setValue(sourceText);

    this.set('localSourceContent', sourceText);
    this.isDirty(false);

    /* eslint-disable no-extra-parens */
    (function() {
        editor.refreshEditor();
    }).fork(200);
    /* eslint-enable no-extra-parens */

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('setDetached',
function(isDetached, aNewURI) {

    var detachMark,

        oldURI,
        newURI,

        sourceObj;

    detachMark = TP.byCSSPath('.detach_mark', this.getNativeNode(), true, false);
    TP.elementHide(detachMark);

    //  Rewrite binding URI
    if (this.hasAttribute('bind:in')) {

        oldURI = TP.uc(this.getAttribute('bind:in'));

        newURI = TP.ifInvalid(
                    aNewURI, TP.uc('urn:tibet:' + this.getLocalID()));

        this.set('$changingURIs', true);
        oldURI.setResource(null);
        this.set('$changingURIs', false);

        this.setAttribute('bind:in', newURI.getLocation());

        sourceObj = this.get('sourceURI');
        newURI.setResource(sourceObj,
                            TP.request('signalChange', false));

        this.setAttribute('detached', true);
    }

    this.render();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('setSourceObject',
function(anObj) {

    var sourceObj;

    if (TP.isURI(sourceObj = this.get('sourceURI'))) {
        this.ignore(sourceObj, 'TP.sig.ValueChange');
    }

    sourceObj = anObj;

    if (!TP.isURI(sourceObj)) {

        this.render();

        return this;
    }

    this.observe(sourceObj, 'TP.sig.ValueChange');

    this.$set('sourceURI', sourceObj);

    this.render();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('setValue',
function(aValue, shouldSignal) {

    /**
     * @method setValue
     * @summary Sets the value of the receiver's node. For this type, this
     *     method sets the underlying data and renders the receiver.
     * @param {Object} aValue The value to set the 'value' of the node to.
     * @param {Boolean} shouldSignal Should changes be notified. For this type,
     *     this flag is ignored.
     * @returns {TP.sherpa.urieditor} The receiver.
     */

    if (this.get('$changingURIs')) {
        return this;
    }

    //  aValue here should be a TP.core.URI

    if (!TP.isURI(aValue)) {
        this.teardown();

        return this;
    }

    //  NB: This will call render()
    this.setSourceObject(aValue);

    //  By forking this, we give the console a chance to focus the input cell
    //  (which it really wants to do after executing a command) and then we can
    //  shift the focus back to us.
    (function() {
        this.get('editor').focus();
    }).bind(this).fork(500);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('updateEditorState',
function() {

    var editorObj,
        currentEditorStr,

        localSourceStr;

    editorObj = this.get('editor').$get('$editorObj');

    currentEditorStr = editorObj.getValue();

    if (TP.notValid(localSourceStr = this.get('localSourceContent'))) {
        return this;
    }

    this.isDirty(currentEditorStr !== localSourceStr);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('teardown',
function() {

    var sourceObj,
        editorObj;

    if (TP.isURI(sourceObj = this.get('sourceURI'))) {
        this.ignore(sourceObj, 'TP.sig.ValueChange');
    }

    editorObj = this.get('editor').$get('$editorObj');
    editorObj.off('change', this.get('changeHandler'));

    this.$set('editor', null, false);
    this.$set('changeHandler', null, false);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('$flag',
function(aProperty, aFlag) {

    /**
     * @method $flag
     * @summary Sets a specific property value to a boolean based on aFlag.
     * @param {String} aProperty The name of the boolean property being tested
     *     and/or manipulated.
     * @param {Boolean} [aFlag] The new value to optionally set.
     * @exception {TP.sig.InvalidParameter} When aProperty isn't a String.
     * @returns {?Boolean} The current flag state.
     */

    if (!TP.isString(aProperty)) {
        this.raise('TP.sig.InvalidParameter');
        return;
    }

    if (TP.isBoolean(aFlag)) {
        this.$set(aProperty, aFlag);
    }

    return this.$get(aProperty);
});

//  ------------------------------------------------------------------------

TP.sherpa.urieditor.Inst.defineMethod('isDirty',
function(aFlag) {

    /**
     * @method isDirty
     * @summary Returns true if the receiver's content has changed since it was
     *     last loaded from it's source URI or content data without being saved.
     * @param {Boolean} [aFlag] The new value to optionally set.
     * @returns {Boolean} Whether or not the content of the receiver is 'dirty'.
     */

    return this.$flag('dirty', aFlag);
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
