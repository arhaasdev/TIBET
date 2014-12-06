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
 * @type {TP.sherpa.console}
 * @synopsis
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('sherpa:console');

//  ----------------------------------------------------------------------------
//  Type Constants
//  ----------------------------------------------------------------------------

//  the default prompt separator/string (>>)
TP.sherpa.console.Type.defineConstant('DEFAULT_PROMPT', '&#160;&#187;');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Type.defineMethod('tagAttachDOM',
function(aRequest) {

    /**
     * @name tagAttachDOM
     * @synopsis Sets up runtime machinery for the element in aRequest.
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem;

    if (TP.isElement(elem = aRequest.at('node'))) {
        this.addStylesheetTo(TP.nodeGetDocument(elem));
    }

    return;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

//  should IO be concealed? this is used to simulate "password" mode
TP.sherpa.console.Inst.defineAttribute('conceal', false);

//  Is the command line currently concealed from view?
TP.sherpa.console.Inst.defineAttribute('concealedInput');

TP.sherpa.console.Inst.defineAttribute(
        'consoleInput',
        {'value': TP.cpc('xctrls|codeeditor#SherpaConsoleInput', true)});

TP.sherpa.console.Inst.defineAttribute(
        'consoleOutput');
  //      {'value': TP.cpc('xctrls|codeeditor#SherpaConsoleOutput', true)});

TP.sherpa.console.Inst.defineAttribute('currentEvalMarker');
TP.sherpa.console.Inst.defineAttribute('evalMarkAnchorMatcher');

TP.sherpa.console.Inst.defineAttribute('currentInputMarker');

TP.sherpa.console.Inst.defineAttribute('currentPromptMarker');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('setup',
function() {

    /**
     * @name setup
     */

    var consoleInputTPElem,
        consoleInputStartupComplete,

        outputScreenElem;

    consoleInputTPElem = this.get('consoleInput');

    //  Make sure to observe setup on the console input here, because it won't
    //  be fully formed when this line is executed.
    consoleInputStartupComplete = function(aSignal) {

        var hudTPElem,
            consoleOutputTPElem,
            consoleOutputStartupComplete;

        consoleInputStartupComplete.ignore(
                aSignal.getOrigin(), aSignal.getSignalName());

        consoleInputTPElem.setEditorEventHandler('viewportChange',
                function () {
                    this.adjustInputSize();
                }.bind(this));

        //  NB: We need to create the log view *before* we set up the console
        //  service.
        //this.setupLogView();

        outputScreenElem =
            TP.byOID('SherpaWorld').createScreenElement('consoleOut', 0);

        //  Set up the consoleOutput element.
        consoleOutputTPElem = TP.wrap(outputScreenElem).addContent(
                '<xctrls:codeeditor id="SherpaConsoleOutput"' +
                ' stubHref="~ide_root/html/sherpa_console_output_stub.html"/>');
        this.set('consoleOutput', consoleOutputTPElem);

        //  Make sure to observe setup on the console input here, because it
        //  won't be fully formed when this line is executed.
        consoleOutputStartupComplete = function(aSignal) {
            consoleOutputStartupComplete.ignore(
                    aSignal.getOrigin(), aSignal.getSignalName());

            //  NB: We have to set up the ConsoleService this *after* we put in
            //  the output view.
            this.setupConsoleService();

            hudTPElem = TP.byOID('SherpaHUD', this.getNativeWindow());
            this.observe(hudTPElem, 'HiddenChange');

            this.setAttribute('hidden',
                                TP.bc(hudTPElem.getAttribute('hidden')));

            //  Grab the CodeMirror constructor so that we can use it to run
            //  modes, etc.
            TP.extern.CodeMirror = consoleOutputTPElem.$getEditorConstructor();
        }.bind(this);

        consoleOutputStartupComplete.observe(consoleOutputTPElem,
                                                'TP.sig.DOMReady');

    }.bind(this);

    consoleInputStartupComplete.observe(consoleInputTPElem, 'TP.sig.DOMReady');

    return this;
});

//  ------------------------------------------------------------------------
//  Marker retrieval methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('getCurrentEvalMarker',
function() {

    /**
     * @name getCurrentEvalMarker
     * @synopsis
     * @returns
     * @todo
     */

    var marker;

    if (TP.notValid(marker = this.$get('currentEvalMarker'))) {
        return null;
    }

    if (TP.notValid(marker.find())) {
        marker.clear();
        this.set('currentEvalMarker', null);

        return null;
    }

    return marker;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('getCurrentInputMarker',
function() {

    /**
     * @name getCurrentInputMarker
     * @synopsis
     * @returns
     * @todo
     */

    var marker;

    if (TP.notValid(marker = this.$get('currentInputMarker'))) {
        return null;
    }

    if (TP.notValid(marker.find())) {
        marker.clear();
        this.set('currentInputMarker', null);

        return null;
    }

    return marker;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('getCurrentPromptMarker',
function() {

    /**
     * @name getCurrentPromptMarker
     * @synopsis
     * @returns
     * @todo
     */

    var marker;

    if (TP.notValid(marker = this.$get('currentPromptMarker'))) {
        return null;
    }

    if (TP.notValid(marker.find())) {
        marker.clear();
        this.set('currentPromptMarker', null);

        return null;
    }

    return marker;
});

//  ------------------------------------------------------------------------
//  Handlers for signal from other widgets
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('handleSherpaHUDHiddenChange',
function(aSignal) {

    /**
     * @name handleHiddenChange
     */

    var isHidden;

    isHidden = TP.bc(aSignal.getOrigin().getAttribute('hidden'));

    this.setAttribute('hidden', isHidden);

    return this;
});

//  ------------------------------------------------------------------------
//  Other instance methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('setAttrHidden',
function(beHidden) {

    /**
     * @name setAttrHidden
     * @abstract
     * @param
     * @returns {TP.sherpa.hud} The receiver.
     */

    var consoleInput;

    if (TP.bc(this.getAttribute('hidden')) === beHidden) {
        return this;
    }

    if (TP.isTrue(beHidden)) {
        //  Clear the value
        this.clearInput();

        //  deactivate the input cell
        this.deactivateInputEditor();
    } else {
        consoleInput = this.get('consoleInput');
        consoleInput.focus();

        //  activate the input cell
        this.activateInputEditor();
    }

    return this.callNextMethod();
});

//  ----------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('setupConsoleService',
function() {

    var tsh;

    tsh = TP.core.TSH.getDefaultInstance();

    TP.sherpa.ConsoleService.construct(
        null,
        TP.hc('consoleModel', tsh,
                'consoleView', this));

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('setupLogView',
function() {

    var sherpaFrameBody,
        logviewTPElem;

    sherpaFrameBody = TP.documentGetBody(
                            TP.win('UIROOT.SHERPA_FRAME').document);

    logviewTPElem = TP.wrap(sherpaFrameBody).addContent(
                    TP.sherpa.logview.getResourceMarkup(TP.ietf.Mime.XHTML));

    logviewTPElem.setup();

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('toggleLog',
function() {

    var logviewTPElem;

    logviewTPElem = TP.byOID('SherpaLogView', TP.win('UIROOT.SHERPA_FRAME'));
    logviewTPElem.toggle('hidden');

    return this;
});

//  ------------------------------------------------------------------------
//  View Management Methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('addLoggedValue',
function(dataRecord) {

    /**
     * @name addLoggedValue
     * @synopsis
     * @param
     * @returns {TP.sherpa.console} The receiver.
     */

    /*
    var output,
        cssClass;

    output = dataRecord.at('output');
    cssClass = dataRecord.at('cssClass');

    TP.byOID('SherpaLogView', TP.win('UIROOT.SHERPA_FRAME')).addLogEntry(
            TP.hc('output', output, 'cssClass', cssClass));

    //console.log('Echo logged text: ' + outputText);
    */

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('clearAllContent',
function() {

    /**
     * @name clearAllContent
     * @synopsis Clears the input cell.
     * @returns {TP.sherpa.console} The receiver.
     */

    var marker;

    //  Clear the input and it's marks
    this.get('consoleInput').clearValue();

    this.teardownInputMark();
    this.teardownEvalMark();

    if (TP.isValid(marker = this.get('currentPromptMarker'))) {
        marker.clear();
        this.set('currentPromptMarker', null);
    }

    this.clearStatus();

    //  Clear the output
    this.get('consoleOutput').clearValue();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('toggleMaximized',
function() {

    /**
     * @name toggleMaximized
     * @synopsis
     * @returns {TP.sherpa.console} The receiver.
     */

    var consoleInput,
        editorElem;

    consoleInput = this.get('consoleInput');
    editorElem = TP.byCSS('.CodeMirror',
                            consoleInput.getNativeContentDocument(),
                            true);

    if (this.hasAttribute('maximized')) {
        this.removeAttribute('maximized');
        TP.elementRemoveAttribute(editorElem, 'maximized');
    } else {
        this.setAttribute('maximized', true);
        TP.elementSetAttribute(editorElem, 'maximized', 'true');
    }

    this.focusInput();

    (function() {
        this.focusInput();
        this.scrollOutputToEnd();

    }.bind(this)).afterUnwind();

    return this;
});

//  ------------------------------------------------------------------------
//  Prompt Methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('getPrompt',
function() {

    /**
     * @name getPrompt
     * @synopsis
     * @returns {String}
     * @todo
     */

    return '>';
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('generatePromptMarkAt',
function(range, cssClass, promptText) {

    /**
     * @name generatePromptMarkAt
     * @synopsis
     * @param
     * @param
     * @returns
     */

    var consoleInput,

        doc,
        elem,
        marker;

    consoleInput = this.get('consoleInput');

    doc = consoleInput.getNativeContentDocument();

    elem = TP.documentCreateElement(doc, 'span');
    TP.elementSetClass(elem, cssClass);
    TP.elementSetAttribute(elem, 'id', TP.sys.cfg('sherpa.console_prompt'));

    TP.htmlElementSetContent(elem, promptText);

    marker = consoleInput.$getEditorInstance().markText(
        range.from,
        range.to,
        {
            'atomic': true,
            'readOnly': true,
            'collapsed': true,
            'replacedWith': elem,
            'inclusiveLeft': false,
            'inclusiveRight': false
        }
    );

    //  Wire a reference to the marker back onto our output element
    elem.marker = marker;

    return marker;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('movePromptMarkToCursor',
function() {

    /**
     * @name movePromptMarkToCursor
     * @synopsis
     * @returns
     */

    var marker,

        elem,
        cssClass,
        promptStr,

        consoleInput,
        editor,

        cursorRange,
        markerRange;

    marker = this.get('currentPromptMarker');

    elem = marker.widgetNode.firstChild;
    cssClass = TP.elementGetClass(elem);
    promptStr = elem.innerHTML;

    consoleInput = this.get('consoleInput');

    //  Clear the marker
    markerRange = marker.find();
    marker.clear();

    //  Make sure to remove the space that was used as the text for the marker.
    editor = this.get('consoleInput').$getEditorInstance();
    editor.replaceRange('', markerRange.from, markerRange.to);

    cursorRange = consoleInput.getCursor();

    markerRange = {
                'from': {'line': cursorRange.line, 'ch': cursorRange.ch},
                'to': {'line': cursorRange.line, 'ch': cursorRange.ch + 1}
            };

    consoleInput.insertAtCursor(' ');

    marker = this.generatePromptMarkAt(markerRange, cssClass, promptStr);
    this.set('currentPromptMarker', marker);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('setPrompt',
function(aPrompt, aCSSClass) {

    /**
     * @name setPrompt
     * @synopsis Sets the text prompt used for the input cell.
     * @param {String} aPrompt The prompt to define.
     * @param {String} aCSSClass An optional CSS class name to use for display
     *     of the prompt string.
     * @returns {TP.sherpa.cmdline} The receiver.
     * @todo
     */

    var cssClass,
        promptStr,

        consoleInput,

        doc,
        range,
        marker,
        elem,

        editor,

        cursorRange;

    TP.sys.setcfg('sherpa.console_prompt', 'sherpaPrompt');

    cssClass = TP.ifInvalid(aCSSClass, 'console_prompt');

    promptStr = TP.ifInvalid(aPrompt, this.getType().DEFAULT_PROMPT);

    consoleInput = this.get('consoleInput');

    doc = consoleInput.getNativeContentDocument();

    if (!TP.isElement(
                elem = TP.byId(TP.sys.cfg('sherpa.console_prompt'), doc))) {

        cursorRange = consoleInput.getCursor();

        range = {
                    'from': {'line': cursorRange.line, 'ch': cursorRange.ch},
                    'to': {'line': cursorRange.line, 'ch': cursorRange.ch + 1}
                };

        consoleInput.insertAtCursor(' ');

        marker = this.generatePromptMarkAt(range, cssClass, promptStr);
        this.set('currentPromptMarker', marker);

        editor = this.get('consoleInput').$getEditorInstance();
        editor.setCursor(range.to);
    } else {
        TP.elementSetClass(elem, cssClass);
        TP.htmlElementSetContent(elem, promptStr);
    }

    return this;
});

//  ------------------------------------------------------------------------
//  Status Management Methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('clearStatus',
function() {

    /**
     * @name clearStatus
     * @synopsis Clears any status information such as window.status and/or any
     *     status bar content, resetting it to the default state.
     * @returns {TP.sherpa.ConsoleService} The receiver.
     * @todo
     */

    //  NB: This only works if the user gives us permission - need a different
    //  way
    TP.status('');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('updateStatus',
function(aSignal) {

    /**
     * @name updateStatus
     * @synopsis Updates the status bar with information which is drawn from the
     *     current environment and the signal provided. The signal is typically
     *     a TP.sig.UserIOResponse containing information about the processing
     *     which just occurred.
     * @param {TP.sig.ShellRequest} aSignal The request that the status is being
     *     updated for.
     */

    /*
    var model,
        doc,
        outCell,
        evt,
        arr,
        str,
        canvasWin;

    model = this.getModel();
    doc = this.get('vWin').document;

    //  Make sure that we have a valid signal and that we actually have
    //  cells to update the status of.
    if (TP.isValid(aSignal) && TP.notEmpty(this.get('$cellHash'))) {
        //  fake "reuse" here so we get back the original command cell
        aSignal.atPut('cmdAppend', true);
        outCell = this.getOutputCell(aSignal);

        if (TP.isValid(outCell)) {
            outCell.updateStats(aSignal);
        }
    }

    //  ---
    //  status context ID (execution window's global ID)
    //  ---

    str = '';
    if (TP.isWindow(canvasWin = TP.sys.getUICanvas(true))) {
        str = '' + TP.gid(canvasWin).sliceFrom('.', false, true);

        TP.htmlElementSetContent(TP.byId('status2', this.$get('vWin')),
            str, null, false);
    }

    //  ---
    //  logging level
    //  ---

    str = '' + TP.getLogLevel().getName() + '::' + APP.getLogLevel().getName();
    TP.htmlElementSetContent(TP.byId('status3', this.$get('vWin')),
        str, null, false);

    //  ---
    //  keyboard modifiers pressed
    //  ---

    if (TP.isEvent(evt = aSignal.getEvent())) {

        arr = TP.ac();
        arr.push(aSignal.getCtrlKey() ? 'Ctrl' : null);
        arr.push(aSignal.getAltKey() ? 'Alt' : null);
        arr.push(aSignal.getMetaKey() ? 'Meta' : null);
        arr.push(aSignal.getShiftKey() ? 'Shift' : null);
        arr.compact();

        str = arr.join(':');
        TP.htmlElementSetContent(TP.byId('status1', this.$get('vWin')),
            str, null, false);
    }
    */

    return;
});

//  ------------------------------------------------------------------------
//  Input Management Methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('activateInputEditor',
function() {

    /**
     * @name activateInputEditor
     * @returns {TP.sherpa.console} The receiver.
     * @abstract
     * @todo
     */

    var consoleInput;

    consoleInput = this.get('consoleInput');

    consoleInput.setKeyHandler(TP.core.Keyboard.$$handleKeyEvent);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('adjustInputSize',
function() {

    /**
     * @name adjustInputSize
     * @synopsis Adjust the height of the input cell based on its contents.
     */

    var consoleInput,
        newHeight;

    consoleInput = this.get('consoleInput');

    newHeight = consoleInput.getEditorHeight();
    this.setHeight(newHeight);

    return;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('clearInput',
function() {

    /**
     * @name clearInput
     * @synopsis Clears the input cell.
     * @returns {TP.sherpa.console} The receiver.
     */

    var marker,
        editor,

        range;

    if (TP.isValid(marker = this.get('currentInputMarker'))) {

        editor = this.get('consoleInput').$getEditorInstance();
        range = marker.find();

        editor.setSelection(range.from, range.to);
        editor.replaceSelection('');

        this.teardownInputMark();
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('deactivateInputEditor',
function() {

    /**
     * @name deactivateInputEditor
     * @returns {TP.sherpa.console} The receiver.
     * @abstract
     * @todo
     */

    var consoleInput;

    consoleInput = this.get('consoleInput');

    consoleInput.unsetCurrentKeyHandler();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('eventIsInInput',
function(anEvent) {

    /**
     * @name eventInInput
     */

    return TP.eventGetWindow(anEvent).document ===
            this.get('consoleInput').getNativeContentDocument();
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('focusInput',
function(select) {

    /**
     * @name focusInput
     * @synopsis
     * @param {Boolean} select True to select in addition.
     * @returns {TP.sherpa.console} The receiver.
     */

    //  We wrap this in a try...catch that does nothing because, on startup,
    //  it seems like the textfield isn't focusable on IE and this will
    //  throw an exception. It's not a big deal, except that this means that
    //  the text field will not focus on startup.
    try {
        if (select) {
            this.get('consoleInput').select();
        } else {
            this.get('consoleInput').focus();
        }
    } catch (e) {
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('setInputCursorToEnd',
function() {

    /**
     * @name setInputCursorToEnd
     * @synopsis Moves the cursor to the end.
     * @returns {TP.sherpa.console} The receiver.
     */

    this.get('consoleInput').setCursorToEnd();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('setInputContent',
function(anObject, shouldAppend) {

    /**
     * @name setInputContent
     * @synopsis Sets the value of the input cell, essentially 'pre-filling' the
     *     input area with content.
     * @description If shouldAppend is true, and the input cell already has
     *     content, a '.;\n' is appended to the front of the content.
     * @param {Object} anObject The object defining the input.
     * @param {Boolean} shouldAppend Whether or not to append the value of
     *     anObject to any existing content.
     * @returns {TP.sherpa.console} The receiver.
     * @todo
     */

    var consoleInput,

        val,

        editor,
        marker,

        range,

        start,
        end;

    if (TP.isEmpty(anObject)) {
        this.clearInput();
        return this;
    }

    consoleInput = this.get('consoleInput');
    if (TP.isTrue(shouldAppend)) {
        //if (TP.notEmpty(val = consoleInput.get('value'))) {
        //    val += '.;\n';
        //}
        val = '';

        val = val + TP.str(anObject);
    } else {
        val = TP.str(anObject);
    }

    editor = consoleInput.$getEditorInstance();

    if (TP.isValid(marker = this.get('currentInputMarker'))) {

        range = marker.find();
        start = range.from;

        editor.setSelection(range.from, range.to);
        editor.replaceSelection(val);

        end = consoleInput.getCursor();

        this.teardownInputMark();
    }

    if (TP.notValid(range)) {

        start = consoleInput.getCursor();

        consoleInput.insertAtCursor(val);

        end = consoleInput.getCursor();
    }

    this.set('currentInputMarker',
                this.generateInputMarkAt({anchor: start, head: end}));

    (function() {
        this.focusInput();
        this.setInputCursorToEnd();

    }.bind(this)).afterUnwind();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('teardownInputMark',
function() {

    /**
     * @name teardownInputMark
     */

    if (TP.isValid(this.get('currentInputMarker'))) {
        this.get('currentInputMarker').clear();
        this.set('currentInputMarker', null);
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('generateInputMarkAt',
function(aRange) {

    /**
     * @name generateInputMarkAt
     */

    var marker;

    marker = this.get('consoleInput').$getEditorInstance().markText(
        aRange.anchor,
        aRange.head,
        {
            'className': 'bordered-input',
            'startStyle': 'bordered-input-left',
            'endStyle': 'bordered-input-right',
            'atomic': false,
            'inclusiveLeft': true,
            'inclusiveRight': true
        }
    );

    return marker;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('shouldConcealInput',
function(aFlag) {

    /**
     * @name shouldConcealInput
     * @synopsis Returns false for now.
     * @param {Boolean} aFlag The new value to set.
     * @returns {Boolean}
     */

    return false;
});

//  ------------------------------------------------------------------------
//  Output management methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('getInputStats',
function(aSignal) {

    /**
     * @name getInputStats
     * @synopsis
     * @param {TP.sig.ShellRequest} aSignal The request that the status is being
     *     updated for.
     * @returns {TP.sherpa.console} The receiver.
     */

    var val,
        str;

    //  TODO: Isn't aSignal the same as our signal and, if not, is that an
    //  error?

    //  ---
    //  execution statistics, when available
    //  ---

    //  update the last command execution time
    val = aSignal.get('evaltime');
    str = TP.ifInvalid(val, '0');

    val = aSignal.get('tagtime');
    str += ' | ' + TP.ifInvalid(val, '0');

    val = aSignal.get('exectime');
    str += ' | ' + TP.ifInvalid(val, '0');

    return str;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('getInputTypeInfo',
function(aSignal) {

    /**
     * @name getInputTypeInfo
     * @synopsis
     * @param {TP.sig.ShellRequest} aSignal The request that the status is being
     *     updated for.
     * @returns {TP.sherpa.console} The receiver.
     */

    var val,
        str,
        values,
        len,
        startTN,
        wasSame,
        i;

    //  TODO: Isn't aSignal the same as our signal and, if not, is that an
    //  error?

    //  if no action pending then display current result type/id
    if (TP.canInvoke(aSignal, 'getResult')) {
        val = aSignal.getResult();
    }

    if (aSignal.isFailing() || aSignal.didFail()) {
        return 'undefined';
    }

    if (TP.isValid(val)) {

        str = '' + TP.tname(val);

        if (TP.isCollection(val) && TP.sys.cfg('tdc.type_collections', true)) {
            if (TP.isEmpty(val)) {
                str += '()';
            } else {

                if (TP.canInvoke(val, 'getValues')) {
                    values = val.getValues();
                } else {
                    // Probably a native collection like HTMLCollection etc.
                    values = TP.ac();
                    len = val.length;
                    for (i = 0; i < len; i++) {
                        values.push(val[i]);
                    }
                }

                len = values.getSize();
                startTN = TP.tname(values.at(0));
                wasSame = true;

                for (i = 1; i < len; i++) {
                    if (TP.tname(values.at(i)) !== startTN) {
                        wasSame = false;
                        break;
                    }
                }

                if (TP.isTrue(wasSame)) {
                    str += '(' + startTN + ')';
                } else {
                    str += '(Object)';
                }

                str += ' (' + len + ')';
            }
        }

        if (TP.isEmpty(str) || (str === 'ready')) {
            str = 'Object';
        }
    } else if (TP.isNull(val)) {
        str = 'null';
    } else {
        str = 'undefined';
    }

    return str;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('createAndUpdateOutputMark',
function(uniqueID, dataRecord) {

    /**
     * @name createAndUpdateOutputMark
     * @synopsis
     * @param
     * @param
     * @returns {TP.sherpa.console} The receiver.
     */

    var consoleOutput,

        doc,
        outElem;

    consoleOutput = this.get('consoleOutput');

    doc = consoleOutput.getNativeContentDocument();

    if (!TP.isElement(outElem = doc.getElementById(uniqueID))) {
        this.createOutputMark(uniqueID, dataRecord);
    }

    this.updateOutputMark(uniqueID, dataRecord);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('createOutputMark',
function(uniqueID, dataRecord) {

    /**
     * @name createOutputMark
     * @synopsis
     * @param
     * @param
     * @returns {TP.sherpa.console} The receiver.
     */

    var consoleOutput,

        doc,
        lastLine,

        outElem,

        marker,
        outputRange,

        hid,
        hidStr,

        cmdText,

        cssClass,

        record,

        statsStr,

        resultTypeStr;

    consoleOutput = this.get('consoleOutput');

    doc = consoleOutput.getNativeContentDocument();

    if (!TP.isElement(outElem = doc.getElementById(uniqueID))) {

        //  Grab the last line of the output
        lastLine = consoleOutput.$getEditorInstance().lastLine();

        //  Append a space to the end of it
        consoleOutput.appendToLine(' ', TP.LAST);

        //  Compute a range that goes from position 0 to position 1 of the last
        //  line, encompassing the space.
        outputRange = {
            from: {'line': lastLine, 'ch': 0},
            to: {'line': lastLine, 'ch': 1}
        };

        hid = dataRecord.at('hid');
        hidStr = TP.isEmpty(hid) ? '&#160;&#160;' : '!' + hid;

        cmdText = TP.ifInvalid(dataRecord.at('cmdtext'), '');
        cmdText = cmdText.truncate(TP.sys.cfg('tdc.max_title', 70));

        cssClass = dataRecord.at('cssClass');

        if (TP.isValid(record = dataRecord.at('request'))) {
            statsStr = this.getInputStats(record);
            resultTypeStr = this.getInputTypeInfo(dataRecord.at('request'));
        } else {
            statsStr = '';
            resultTypeStr = '';
        }

        var inputData = TP.hc(
                        'hid', hidStr,
                        'cmdtext', cmdText,
                        'inputclass', cssClass,
                        'empty', '',
                        'stats', '_ | _ | _',
                        'resulttype', '');

        var inputStr = TP.uc('~ide_root/xhtml/sherpa_console_templates.xhtml' +
                            '#xpath1(//*[@name="consoleEntry"])').transform(
                                inputData);

        if (/\{\{/.test(inputStr)) {
            return;
        }

        marker = this.generateOutputMarkAt(
                        outputRange,
                        uniqueID,
                        inputStr);
        outElem = marker.widgetNode.firstChild;

        TP.elementAddClass(outElem, cssClass);
    } else {
        if (TP.isValid(marker = outElem.marker)) {
            outputRange = marker.find();
        }
    }

    //TP.htmlElementSetContent(outElem, '&hellip;');

    if (TP.isValid(outputRange) &&
        outputRange.to.line === consoleOutput.$getEditorInstance().lastLine()) {
        consoleOutput.appendToLine('\n', TP.LAST);
    }

    this.teardownInputMark();

    consoleOutput.refreshEditor();
    //this.adjustInputSize();

    //console.log('Echo input text: ' + recordStr);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('updateOutputMark',
function(uniqueID, dataRecord) {

    /**
     * @name updateOutputMark
     * @synopsis
     * @param
     * @param
     * @returns {TP.sherpa.console} The receiver.
     */

    var consoleOutput,

        doc,
        outElem,

        outputText,
        outputClass;

    consoleOutput = this.get('consoleOutput');

    doc = consoleOutput.getNativeContentDocument();

    if (!TP.isElement(outElem = doc.getElementById(uniqueID))) {

        console.log('Couldn\'t find out cell for: ' + uniqueID);
        return this;
    }

    outputText = dataRecord.at('output');

    outputClass = dataRecord.at('outputclass');

    if (!TP.elementHasClass(outElem, outputClass)) {
        TP.elementAddClass(outElem, outputClass);
    }

    //TP.htmlElementSetContent(outElem, TP.stringAsHTMLString(outputText));
    //outElem.innerHTML += outputText;

    var outputData = TP.hc(
                    'output', outputText);

    var outputStr = TP.uc('~ide_root/xhtml/sherpa_console_templates.xhtml' +
                        '#xpath1(//*[@name="outputEntry"])').transform(
                            outputData);

    var resultsElem = TP.byCSS('.output_results > .output_row', outElem, true);
    resultsElem.innerHTML = outputStr;

    consoleOutput.refreshEditor();
    //this.adjustInputSize();

    //console.log('Echo output text: ' + outputText);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('generateOutputElement',
function(uniqueID) {

    /**
     * @name generateOutputElement
     * @synopsis
     * @param
     * @returns
     */

    var doc,
        elem;

    doc = this.get('consoleOutput').getNativeContentDocument();

    elem = TP.documentCreateElement(doc, 'span');
    TP.elementSetClass(elem, 'output');
    TP.elementSetAttribute(elem, 'id', uniqueID);

    return elem;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('generateOutputMarkAt',
function(range, uniqueID, initialMarkup) {

    /**
     * @name generateOutputMarkAt
     * @synopsis
     * @param
     * @param
     * @param
     * @returns
     */

    var elem,
        marker;

    elem = this.generateOutputElement(uniqueID);

    marker = this.get('consoleOutput').$getEditorInstance().markText(
        range.from,
        range.to,
        {
            'atomic': true,
            'collapsed': true,
            'replacedWith': elem,
            'inclusiveLeft': false,
            'inclusiveRight': false,
            'clearWhenEmpty': false
        }
    );

    //  Wire a reference to the marker back onto our output element
    elem.marker = marker;
    elem.innerHTML = initialMarkup;

    return marker;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('findOutputMarks',
function(from, to) {

    /**
     * @name findOutputMarks
     * @synopsis
     * @param
     * @param
     * @returns
     */

    var editor,

        marks,
        results,

        elem,

        i;

    editor = this.get('consoleOutput').$getEditorInstance();

    marks = editor.findMarks(from, to);
    results = TP.ac();

    for (i = 0; i < marks.length; i++) {
        if (TP.isElement(elem = marks[i].replacedWith) &&
            TP.elementHasClass(elem, 'output')) {
            results.push(marks[i]);
        }
    }

    return results;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('scrollOutputToEnd',
function() {

    /**
     * @name scrollOutputToEnd
     * @synopsis Adjust the height of the input cell based on its contents.
     */

    var editor,
        body;

    editor = this.get('consoleOutput').$getEditorInstance();
    editor.scrollIntoView(null);

    //  When the console is in 'collapsible' mode, this is important to get it
    //  to scroll to the bottom properly.
    body = this.get('consoleOutput').getNativeContentDocument().body;
    body.scrollTop = body.scrollHeight;

    return;
});

//  ------------------------------------------------------------------------
//  Eval marking/value retrieval
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('setupEvalMark',
function() {

    /**
     * @name setupEvalMark
     * @synopsis
     * @returns {TP.sherpa.console} The receiver.
     */

    var currentInputRange,
        newEvalRange;

    //  If the text input is empty, there is no reason to setup anything... exit
    //  here.
    if (TP.isEmpty(this.get('consoleInput').getValue())) {
        return this;
    }

    if (TP.isValid(this.get('currentInputMarker'))) {
        if (TP.isValid(
                currentInputRange = this.get('currentInputMarker').find())) {

            newEvalRange = {'anchor': currentInputRange.from,
                            'head': currentInputRange.to};

            this.set('currentEvalMarker', this.generateEvalMarkAt(newEvalRange));
        }
    }

    if (TP.notValid(this.get('currentEvalMarker'))) {
        newEvalRange = this.computeEvalMarkRange();

        this.set('currentInputMarker',
                    this.generateInputMarkAt({anchor: newEvalRange.anchor,
                                            head: newEvalRange.head}));
        this.set('currentEvalMarker', this.generateEvalMarkAt(newEvalRange));
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('showingEvalMark',
function() {

    /**
     * @name showingEvalMark
     */

    return TP.isValid(this.get('currentEvalMarker'));
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('shiftEvalMark',
function(direction, endPoint) {

    /**
     * @name shiftEvalMark
     * @synopsis
     * @param
     * @param
     * @returns {TP.sherpa.console} The receiver.
     */

    var currentEvalMarker,

        cimRange,

        editor,
        currentLineInfo,
        lastLineInfo;

    if (TP.notValid(currentEvalMarker = this.get('currentEvalMarker'))) {
        return this;
    }

    cimRange = currentEvalMarker.find();

    editor = this.get('consoleInput').$getEditorInstance();

    lastLineInfo = editor.lineInfo(editor.lastLine());

    cimRange.anchor = cimRange.from;
    cimRange.head = cimRange.to;

    if (direction === TP.LEFT) {

        if (endPoint === TP.HEAD) {
            if (cimRange.anchor.line === cimRange.head.line &&
                cimRange.head.ch === cimRange.anchor.ch + 1) {
                    return this;
            }
        } else {

            if (cimRange.anchor.line === 0 &&
                cimRange.anchor.ch === 0) {
                    return this;
            }

            if (cimRange.anchor.line === cimRange.head.line &&
                cimRange.anchor.ch === cimRange.head.ch + 1) {
                    return this;
            }
        }

        if (cimRange[endPoint].ch === 0) {

            //  If the line isn't 0, jump to the previous line
            if (cimRange[endPoint].line !== 0) {
                cimRange[endPoint].line = Math.max(
                                        cimRange[endPoint].line - 1,
                                        0);
                currentLineInfo = editor.lineInfo(
                                        cimRange[endPoint].line);
                cimRange[endPoint].ch = currentLineInfo.text.length - 1;
            }
        } else {
            cimRange[endPoint].ch -= 1;
        }
    }

    if (direction === TP.RIGHT) {

        if (endPoint === TP.HEAD) {
            if (cimRange.head.line === lastLineInfo.line &&
                cimRange.head.ch === lastLineInfo.ch) {
                    return this;
            }

            if (cimRange.anchor.line === cimRange.head.line &&
                cimRange.head.ch === cimRange.anchor.ch - 1) {
                    return this;
            }
        } else {
            if (cimRange.anchor.line === cimRange.head.line &&
                cimRange.anchor.ch === cimRange.head.ch - 1) {
                    return this;
            }
        }

        currentLineInfo = editor.lineInfo(
                                cimRange[endPoint].line);

        if (cimRange[endPoint].ch === currentLineInfo.text.length - 1) {
            //  If the line isn't the last, jump to the next line
            if (cimRange[endPoint].line !== lastLineInfo.line) {
                cimRange[endPoint].line = Math.min(
                                        cimRange[endPoint].line + 1,
                                        lastLineInfo.line);
                cimRange[endPoint].ch = 0;
            } else {
                //  Otherwise, let the very last character be selected
                cimRange[endPoint].ch += 1;
            }
        } else {
            cimRange[endPoint].ch += 1;
        }
    }

    if (direction === TP.UP) {

        if (endPoint === TP.HEAD) {
            if (cimRange.head.line === cimRange.anchor.line) {
                return this;
            }
        }

        if (cimRange[endPoint].line === 0) {
            return this;
        }

        cimRange[endPoint].line -= 1;
    }

    if (direction === TP.DOWN) {

        if (endPoint !== TP.HEAD) {
            if (cimRange.anchor.line === cimRange.head.line) {
                return this;
            }
        }

        if (cimRange[endPoint].line === lastLineInfo.line) {
            return this;
        }

        cimRange[endPoint].line += 1;
    }

    currentEvalMarker.clear();

    this.set('currentEvalMarker', this.generateEvalMarkAt(cimRange));

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('teardownEvalMark',
function() {

    /**
     * @name teardownEvalMark
     * @synopsis
     * @returns {TP.sherpa.console} The receiver.
     */

    if (TP.isValid(this.get('currentEvalMarker'))) {
        this.get('currentEvalMarker').clear();
        this.set('currentEvalMarker', null);
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('getEvalValue',
function() {

    /**
     * @name getEvalValue
     * @synopsis Returns the value currently considered the 'input value'
     * @returns {String} The user's input.
     */

    var inputText,

        marker,

        editor,
        range;

    inputText = null;

    //  Try to set up an eval mark
    if (TP.notValid(this.get('currentEvalMarker'))) {
        this.setupEvalMark();
    }

    //  Only compute the text if you get a valid range
    if (TP.isValid(marker = this.get('currentEvalMarker'))) {
        range = marker.find();
        editor = this.get('consoleInput').$getEditorInstance();
        inputText = editor.getRange(range.from, range.to);
    } else {
        this.teardownEvalMark();
    }

    return inputText;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('computeEvalMarkRangeAnchor',
function() {

    /**
     * @name computeEvalMarkRangeAnchor
     * @synopsis
     * @returns
     */

    var promptMark,

        range,

        editor,

        head,

        matcher,

        searchCursor,
        lineInfo,
        retVal,
        marks;

    if (TP.isValid(promptMark = this.get('currentPromptMarker'))) {
        range = promptMark.find();
        retVal = range.to;
    } else {
        editor = this.get('consoleInput').$getEditorInstance();

        //  Look for the following, in this order (at the beginning of a line)
        //      - The current prompt (preceded by zero-or-more whitespace)
        //      - A newline
        //      - One of the TSH characters
        head = editor.getCursor();

        if (!TP.isRegExp(matcher = this.get('evalMarkAnchorMatcher'))) {
            matcher = TP.rc('^(\\s*' +
                            '\\n' + '|' +
                            TP.regExpEscape(TP.TSH_OPERATOR_CHARS) +
                            ')');
            this.set('evalMarkAnchorMatcher', matcher);
        }

        searchCursor = editor.getSearchCursor(matcher, head);

        if (searchCursor.findPrevious()) {
            //  We want the 'to', since that's the end of the '^\s*>' match
            retVal = searchCursor.to();
        } else {
            //  Couldn't find a starting '>', so we just use the beginning of the
            //  editor
            retVal = {'line': 0, 'ch': 0};
        }

        //  See if there are any output marks between the anchor and head
        marks = this.findOutputMarks(retVal, head);
        if (marks.length > 0) {
            retVal = marks[marks.length - 1].find().to;
        }

        //  If the 'ch' is at the end of the line, increment the line and set the
        //  'ch' to 0
        lineInfo = editor.lineInfo(retVal.line);

        //  If we matched one of the TSH operator characters then it was a TSH
        //  command and we want that character included.
        if (lineInfo.text.contains(TP.TSH_OPERATOR_CHARS)) {
            retVal.ch -= 1;
        }

        if (retVal.ch === lineInfo.text.length) {
            retVal = {'line': Math.min(retVal.line + 1, editor.lastLine()),
                        'ch': 0};
        }
    }

    return retVal;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('computeEvalMarkRangeHead',
function() {

    /**
     * @name computeEvalMarkRangeHead
     * @synopsis
     * @returns
     */

    var editor,

        anchor,
        searchCursor,
        lineInfo,
        retVal;
        //marks;

    editor = this.get('consoleInput').$getEditorInstance();

    anchor = editor.getCursor();
    searchCursor = editor.getSearchCursor(/^(\s*<|\n)/, anchor);

    if (searchCursor.findNext()) {
        //  We want the 'from', since that's the start of the '^\s*<' match
        retVal = searchCursor.from();
    } else {
        //  Couldn't find an ending '<', so we just use the end of the editor
        lineInfo = editor.lineInfo(editor.lastLine());
        retVal = {'line': lineInfo.line, 'ch': lineInfo.text.length};
    }

    /*
    //  See if there are any output marks between the anchor and head
    marks = this.findOutputMarks(anchor, retVal);
    if (marks.length > 0) {
        retVal = marks[0].find().from;
    }

    //  If the 'ch' is at the beginning of the line, decrement the line and set
    //  the 'ch' to end of the line
    if (retVal.ch === 0) {
        lineInfo = editor.lineInfo(retVal.line - 1);
        retVal = {'line': Math.max(retVal.line - 1, 0),
                    'ch': lineInfo.text.length};
    }
    */

    return retVal;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('computeEvalMarkRange',
function() {

    /**
     * @name computeEvalMarkRange
     * @synopsis
     * @returns
     */

    var editor,

        selection,
        range;

    editor = this.get('consoleInput').$getEditorInstance();

    //  If there are real selections, then just use the first one
    selection = editor.getSelection();
    if (selection.length > 0) {
        return editor.listSelections()[0];
    }

    range = {'anchor': this.computeEvalMarkRangeAnchor(),
                'head': this.computeEvalMarkRangeHead()};

    return range;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('generateEvalMarkAt',
function(range) {

    /**
     * @name generateEvalMarkAt
     * @synopsis
     * @returns
     */

    var marker;

    marker = this.get('consoleInput').$getEditorInstance().markText(
        range.anchor,
        range.head,
        {
            'className': 'bordered-eval',
            'startStyle': 'bordered-eval-left',
            'endStyle': 'bordered-eval-right',
            'atomic': true,
            'inclusiveLeft': false,
            'inclusiveRight': false
        }
    );

    return marker;
});

//  ------------------------------------------------------------------------
//  Halo focusing methods
//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('haloCanBlur',
function(aHalo, aSignal) {

    return false;
});

//  ------------------------------------------------------------------------

TP.sherpa.console.Inst.defineMethod('haloCanFocus',
function(aHalo, aSignal) {

    return false;
});

//  ========================================================================
//  end
//  ========================================================================
