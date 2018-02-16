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
 * @type {TP.sherpa.styleshud}
 */

//  ------------------------------------------------------------------------

TP.sherpa.hudsidebar.defineSubtype('styleshud');

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Type.defineMethod('tagAttachComplete',
function(aRequest) {

    /**
     * @method tagAttachComplete
     * @summary Executes once the tag has been fully processed and its
     *     attachment phases are fully complete.
     * @description Because tibet:data tag content drives binds and we need to
     *     notify even without a full page load, we notify from here once the
     *     attachment is complete (instead of during tagAttachData).
     * @param {TP.sig.Request} aRequest A request containing processing
     *     parameters and other data.
     */

    var elem,
        tpElem,

        westDrawer,
        moveTileFunc;

    //  this makes sure we maintain parent processing
    this.callNextMethod();

    //  Make sure that we have a node to work from.
    if (!TP.isElement(elem = aRequest.at('node'))) {
        return;
    }

    tpElem = TP.wrap(elem);

    //  Grab the west drawer and define a function that, when the drawer
    //  animates back and forth into and out of its collapsed position that, if
    //  a tile is showing, will move the tile to the edge of the drawer.
    westDrawer = TP.byId('west', TP.win('UIROOT'));

    moveTileFunc = function(transitionSignal) {

        var tileTPElem,

            centerElem,
            centerElemPageRect;

        tileTPElem = TP.byId('StyleSummary_Tile', this.getNativeDocument());
        if (TP.isValid(tileTPElem) && tileTPElem.isVisible()) {
            //  Grab the center element and it's page rectangle.
            centerElem = TP.byId('center', this.getNativeWindow());
            centerElemPageRect = centerElem.getPageRect();

            tileTPElem.setPageX(centerElemPageRect.getX());
        }

    }.bind(tpElem);

    moveTileFunc.observe(westDrawer, 'TP.sig.DOMTransitionEnd');

    return;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineAttribute('$currentDNDTarget');
TP.sherpa.styleshud.Inst.defineAttribute('$currentRuleIndex');

TP.sherpa.styleshud.Inst.defineAttribute('highlighted');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineMethod('focusOnTarget',
function(aTPElement) {

    /**
     * @method focusOnTarget
     * @summary Focuses the receiver onto the supplied target.
     * @param {TP.core.UIElementNode} aTPElement The element to focus the
     *     receiver on.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var info,
        node,

        ruleInfo,

        currentRuleIndex,

        tileTPElem,

        centerElem,
        centerElemPageRect,

        currentItemTPElem,

        targetElemPageRect;

    //  If the element is tofu, then we don't show any style for it.
    if (aTPElement.getCanonicalName() === 'tibet:tofu') {
        this.setValue(TP.ac());
        return this;
    }

    info = TP.ac();

    node = TP.canInvoke(aTPElement, 'getNativeNode') ?
                            aTPElement.getNativeNode() :
                            aTPElement;

    if (TP.isElement(node)) {

        //  Note here that we pass true to flush the element's cached ruleset.
        //  This ensures the most accurate results when focusing.
        ruleInfo = TP.elementGetAppliedStyleInfo(node, true);

        //  Finally, we populate the info that will go into the sidebar
        ruleInfo.perform(
            function(aRuleInfo) {

                //  Push the following data into the rule information:

                //  TIBET URI to stylesheet
                //  selectorText
                //  the rule's CSS text
                //  the original CSSRule object
                info.push(
                    TP.ac(
                        TP.uriInTIBETFormat(aRuleInfo.at('sheetLocation')),
                        aRuleInfo.at('originalSelector'),
                        aRuleInfo.at('rule').cssText,
                        aRuleInfo.at('rule')));
            });
    }

    info.reverse();

    //  Unshift an entry for cascaded style.
    info.unshift(TP.ac('[cascaded]', '[cascaded]', '[cascaded]', '[cascaded]'));

    currentRuleIndex = this.get('$currentRuleIndex');
    if (TP.notValid(currentRuleIndex)) {
        currentRuleIndex = 0;
    }

    this.set('$currentRuleIndex', currentRuleIndex);

    //  List expects an array of arrays containing IDs and full names.
    this.setValue(info);

    //  Scroll our list content to its bottom.
    this.get('listcontent').scrollTo(TP.BOTTOM);

    tileTPElem = TP.byId('StyleSummary_Tile', this.getNativeDocument());
    if (TP.isValid(tileTPElem) && tileTPElem.isVisible()) {

        //  Grab the center element and it's page rectangle.
        centerElem = TP.byId('center', this.getNativeWindow());
        centerElemPageRect = centerElem.getPageRect();

        //  Get the currently displayed lozenge given that the peerID should
        //  be the same as it was for the old lozenge.
        currentItemTPElem = TP.byCSSPath(
                                'li[indexInData="' + currentRuleIndex + '"]',
                                this.getNativeNode(),
                                true);

        //  Grab it's page rect.
        targetElemPageRect = currentItemTPElem.getPageRect();

        //  Set the page position of the tile based on the two rectangles X
        //  and Y, respectively.
        tileTPElem.setPagePosition(
            TP.pc(centerElemPageRect.getX(), targetElemPageRect.getY()));
    }

    return this;
});

//  ------------------------------------------------------------------------
//  TP.core.D3Tag Methods
//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineMethod('buildNewContent',
function(enterSelection) {

    /**
     * @method buildNewContent
     * @summary Builds new content onto the receiver by appending or inserting
     *     content into the supplied d3.js 'enter selection'.
     * @param {TP.extern.d3.selection} enterSelection The d3.js enter selection
     *     that new content should be appended to.
     * @returns {TP.extern.d3.selection} The supplied enter selection or a new
     *     selection containing any new content that was added.
     */

    var domContent,

        currentRuleIndex;

    domContent = enterSelection.append('li');

    currentRuleIndex = this.get('$currentRuleIndex');

    domContent.attr(
            'pclass:selected',
            function(d, i) {
                if (d[1] === 'spacer' || d[1] === '[cascaded]') {
                    return;
                }

                if ((i / 2).floor() === currentRuleIndex) {
                    return true;
                }
            }).attr(
            'indexInData',
            function(d, i) {
                if (d[1] !== 'spacer') {
                    return i / 2;
                }
            }).text(
            function(d) {
                if (d[1] !== 'spacer') {
                    return d[1];
                }
            }).attr(
            'class',
            function(d) {
                var val;

                val = 'item';

                if (d[1] === 'spacer') {
                    val += ' spacer';
                } else if (d[1] === '[cascaded]') {
                    val += ' cascaded';
                } else {
                    val += ' selector';
                }

                return val;
            }).each(
            function(d) {
                var hintContent,
                    hintElement;

                TP.elementSetAttribute(
                        this, 'dnd:accept', 'tofu', true);

                if (d[1] !== 'spacer') {
                    hintContent = TP.extern.d3.select(this).append(
                                                            'xctrls:hint');
                    hintContent.html(
                        function() {
                            return '<span xmlns="' + TP.w3.Xmlns.XHTML + '">' +
                                    d[1] +
                                    '</span>';
                        }
                    );

                    hintElement = hintContent.node();

                    TP.xctrls.hint.setupHintOn(
                        this, hintElement, TP.hc('triggerPoint', TP.MOUSE));
                }
            });

    return domContent;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineMethod('computeSelectionData',
function() {

    /**
     * @method computeSelectionData
     * @summary Returns the data that will actually be used for binding into the
     *     d3.js selection.
     * @description The selection data may very well be different than the bound
     *     data that uses TIBET data binding to bind data to this control. This
     *     method allows the receiver to transform it's 'data binding data' into
     *     data appropriate for d3.js selections.
     * @returns {Object} The selection data.
     */

    var data,
        newData,

        len,
        i;

    data = this.get('data');

    newData = TP.ac();

    len = data.getSize();
    for (i = 0; i < len; i++) {

        //  Push in a data row and then a spacer row.
        //  NOTE: We construct the spacer row to take into account the fact, in
        //  the 3rd slot, what the 'condition' (i.e. 'normal', 'target',
        //  'child') is of the data row that it's a spacer for. This is because,
        //  if the data row is being removed for some reason, we want the spacer
        //  row to be removed as well. Otherwise, spurious spacer rows are left
        //  around and, with the 'append' in the buildNewContent method, things
        //  will get out of order in a hurry.
        newData.push(
            data.at(i),
            TP.ac('spacer_' + i, 'spacer', 'spacer_'));
    }

    return newData;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineMethod('updateExistingContent',
function(updateSelection) {

    /**
     * @method updateExistingContent
     * @summary Updates any existing content in the receiver by altering the
     *     content in the supplied d3.js 'update selection'.
     * @param {TP.extern.d3.selection} updateSelection The d3.js update
     *     selection that existing content should be altered in.
     * @returns {TP.extern.d3.selection} The supplied update selection.
     */

    var currentRuleIndex;

    currentRuleIndex = this.get('$currentRuleIndex');

    updateSelection.attr(
            'pclass:selected',
            function(d, i) {
                if (d[1] === 'spacer' || d[1] === '[cascaded]') {
                    return;
                }

                if ((i / 2).floor() === currentRuleIndex) {
                    return true;
                }
            }).attr(
            'indexInData',
            function(d, i) {
                if (d[1] !== 'spacer') {
                    return i / 2;
                }
            }).text(
            function(d) {
                if (d[1] !== 'spacer') {
                    return d[1];
                }
            }).attr(
            'class',
            function(d) {
                var val;

                val = 'item';

                if (d[1] === 'spacer') {
                    val += ' spacer';
                } else if (d[1] === '[cascaded]') {
                    val += ' cascaded';
                } else {
                    val += ' selector';
                }

                return val;
            }).each(
            function() {
                TP.elementSetAttribute(
                    this, 'dnd:accept', 'tofu', true);
            });

    return updateSelection;
});

//  ------------------------------------------------------------------------
//  Handlers
//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('ClosedChange',
function(aSignal) {

    /**
     * @method handleClosedChange
     * @summary Handles notifications of HUD closed change signals.
     * @param {TP.sig.ClosedChange} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.hudsidebar} The receiver.
     */

    var world,
        currentScreenTPWin,

        hudIsClosed;

    world = TP.byId('SherpaWorld', TP.sys.getUIRoot());
    currentScreenTPWin = world.get('selectedScreen').getContentWindow();

    hudIsClosed = TP.bc(aSignal.getOrigin().getAttribute('closed'));

    if (!hudIsClosed) {
        this.observe(world, 'ToggleScreen');
        this.observe(currentScreenTPWin,
                        TP.ac('DocumentLoaded', 'DocumentUnloaded'));

        this.observe(TP.sys.uidoc(), 'TP.sig.MutationStyleChange');

        this.observe(this.get('listcontent'),
                        TP.ac('TP.sig.DOMDNDTargetOver',
                                'TP.sig.DOMDNDTargetOut'));

        this.observe(TP.ANY, 'TP.sig.DOMDNDCompleted');

    } else {
        this.ignore(world, 'ToggleScreen');
        this.ignore(currentScreenTPWin,
                        TP.ac('DocumentLoaded', 'DocumentUnloaded'));

        this.ignore(TP.sys.uidoc(), 'TP.sig.MutationStyleChange');

        this.ignore(this.get('listcontent'),
                        TP.ac('TP.sig.DOMDNDTargetOver',
                                'TP.sig.DOMDNDTargetOut'));

        this.ignore(TP.ANY, 'TP.sig.DOMDNDCompleted');
    }

    return this;
}, {
    origin: 'SherpaHUD'
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('DocumentLoaded',
function(aSignal) {

    /**
     * @method handleDocumentLoaded
     * @summary Handles when the document in the current UI canvas loads.
     * @param {TP.sig.DocumentLoaded} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    this.observe(TP.sys.uidoc(), 'TP.sig.MutationStyleChange');

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('DocumentUnloaded',
function(aSignal) {

    /**
     * @method handleDocumentUnloaded
     * @summary Handles when the document in the current UI canvas unloads.
     * @param {TP.sig.DocumentUnloaded} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    this.ignore(TP.sys.uidoc(), 'TP.sig.MutationStyleChange');

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('DOMDNDTargetOver',
function(aSignal) {

    /**
     * @method handleDOMDNDTargetOver
     * @summary Handles when the drag and drop system enters a possible drop
     *     target.
     * @param {TP.sig.DOMDNDTargetOver} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */


    var dndTargetElem;

    dndTargetElem = aSignal.getDOMTarget();

    TP.elementAddClass(dndTargetElem, 'sherpa-styleshud-droptarget');

    this.set('$currentDNDTarget', dndTargetElem);

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('DOMDNDTargetOut',
function(aSignal) {

    /**
     * @method handleDOMDNDTargetOut
     * @summary Handles when the drag and drop system exits a possible drop
     *     target.
     * @param {TP.sig.DOMDNDTargetOut} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var dndTargetElem;

    dndTargetElem = aSignal.getDOMTarget();

    //  Remove the CSS class placed on the drop target and set the attribute we
    //  use to track the current DND target to null.
    TP.elementRemoveClass(dndTargetElem, 'sherpa-styleshud-droptarget');

    this.set('$currentDNDTarget', null);

    return this;
});

//  ----------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('DOMDNDCompleted',
function(aSignal) {

    /**
     * @method handleDOMDNDCompleted
     * @summary Handles when the drag and drop system completes a dragging
     *     session.
     * @param {TP.sig.DOMDNDCompleted} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var dndTargetElem;

    dndTargetElem = this.get('$currentDNDTarget');

    if (TP.isElement(dndTargetElem)) {

        //  Remove the class placed on the drop target and set the attribute we
        //  use to track the current DND target to null.
        TP.elementRemoveClass(dndTargetElem, 'sherpa-styleshud-droptarget');
        this.set('$currentDNDTarget', null);

        if (TP.elementHasClass(dndTargetElem, 'spacer')) {
            TP.info('Create new rule');
        } else {
            TP.info('Create new property');
        }
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('HaloDidBlur',
function(aSignal) {

    /**
     * @method handleHaloDidBlur
     * @summary Handles notifications of when the halo blurs on an object.
     * @param {TP.sig.HaloDidBlur} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var tile;

    this.callNextMethod();

    //  Hide the tile.
    tile = TP.byId('StyleSummary_Tile', this.getNativeWindow());
    if (TP.isValid(tile)) {
        tile.setAttribute('hidden', true);
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('HaloDidFocus',
function(aSignal) {

    /**
     * @method handleHaloDidFocus
     * @summary Handles notifications of when the halo focuses on an object.
     * @param {TP.sig.HaloDidFocus} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var haloTarget;

    haloTarget = aSignal.at('haloTarget');

    //  Update the target source element before we refresh.
    TP.uc('urn:tibet:styleshud_target_source').setResource(
            haloTarget,
            TP.hc('observeResource', false, 'signalChange', true));

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('InspectStyleSource',
function(aSignal) {

    /**
     * @method handleInspectStyleSource
     * @summary Handles when the user wants to inspect the source of a style
     *     rule.
     * @param {TP.sig.FocusHalo} aSignal The TIBET signal which triggered this
     *     method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var targetElem,

        data,
        indexInData,
        itemData,

        target,
        ruleMatcher,

        tileTPElem;

    //  Grab the target and make sure it's an 'selector' tile.
    targetElem = aSignal.getDOMTarget();
    if (!TP.elementHasClass(targetElem, 'selector')) {
        return this;
    }

    //  Grab our data.
    data = this.get('data');

    //  Get the value of the target's indexInData attribute.
    indexInData = TP.elementGetAttribute(targetElem, 'indexInData', true);

    //  No indexInData? Exit here.
    if (TP.isEmpty(indexInData)) {
        return this;
    }

    //  Convert to a Number and retrieve the entry Array from our data
    indexInData = indexInData.asNumber();
    itemData = data.at(indexInData);

    //  Resolve the stylesheet URI that will be at the first position in the
    //  Array. The resultant URI will be our target to inspect.
    target = TP.bySystemId(itemData.at(0));

    //  Generate a RegExp that will be used to try to find the rule within the
    //  stylesheet using the selector.
    //  ruleMatcher = TP.rc(TP.regExpEscape(itemData.at(1)) + '\\w*{');
    //  TODO: For now, until we sort out issues with the editor searching a
    //  RegExp, we have to use a simple String :-(
    ruleMatcher = itemData.at(1);

    //  Hide the tile to get it out of the way.
    tileTPElem = TP.byId('StyleSummary_Tile', this.getNativeDocument());
    if (TP.isValid(tileTPElem) && tileTPElem.isVisible()) {
        tileTPElem.setAttribute('hidden', true);
    }

    //  Fire the inspector signal on the next repaint (which will ensure the
    //  tile is closed before navigating).
    (function() {
        //  Signal to inspect the object with the rule matcher as 'extra
        //  targeting information' under the 'findContent' key.
        this.signal('InspectObject',
                    TP.hc('targetObject', target,
                            'targetAspect', TP.id(target),
                            'showBusy', true,
                            'extraTargetInfo',
                                TP.hc('findContent', ruleMatcher)));
    }.bind(this)).queueForNextRepaint(this.getNativeWindow());

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('MutationStyleChange',
function(aSignal) {

    /**
     * @method handleMutationStyleChange
     * @summary Handles notifications of node style changes from the overall
     *     canvas that the styleshud is working with.
     * @param {TP.sig.MutationStyleChange} aSignal The TIBET signal which
     *     triggered this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var halo,
        currentTargetTPElem;

    halo = TP.byId('SherpaHalo', this.getNativeDocument());

    currentTargetTPElem = halo.get('currentTargetTPElem');

    if (TP.isValid(currentTargetTPElem)) {
        this.focusOnTarget(currentTargetTPElem);
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('SelectRule',
function(aSignal) {

    /**
     * @method handleSelectRule
     * @summary Handles when the user selects a rule from the rule list.
     * @param {TP.sig.SelectRule} aSignal The TIBET signal which triggered this
     *     method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var targetElem,

        indexInData;

    //  Grab the target and make sure it's an 'selector' tile.
    targetElem = aSignal.getDOMTarget();
    if (!TP.elementHasClass(targetElem, 'selector')) {
        return this;
    }

    //  Get the value of the target's indexInData attribute.
    indexInData = TP.elementGetAttribute(targetElem, 'indexInData', true);

    //  No indexInData? Exit here.
    if (TP.isEmpty(indexInData)) {
        return this;
    }

    //  Convert to a Number and retrieve the entry Array from our data
    indexInData = indexInData.asNumber();

    this.set('$currentRuleIndex', indexInData);

    this.render();

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('ShowRuleText',
function(aSignal) {

    /**
     * @method ShowRuleText
     * @summary Responds to mouse contextmenu notifications by toggling a
     *     class on individual peer elements. The result is that as the user
     *     right clicks over elements in the sidebar the attributes panel is
     *     shown for the corresponding element.
     * @param {TP.sig.ShowRuleText} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var targetElem,

        data,
        indexInData,
        itemData,

        centerElem,
        centerElemPageRect,

        targetTPElem,
        targetElemPageRect,

        halo,
        sourceTPElem,

        newBodyElem,
        newFooterElem,

        tileTPElem,
        newContentTPElem,

        setResourceParams,

        currentBodyElem,
        currentFooterElem,

        modelURI;

    //  Grab the target and make sure it's either a 'selector' or 'cascaded'
    //  tile.
    targetElem = aSignal.getDOMTarget();
    if (!TP.elementHasClass(targetElem, 'selector') &&
        !TP.elementHasClass(targetElem, 'cascaded')) {
        return this;
    }

    //  Grab our data.
    data = this.get('data');

    //  Get the value of the target's indexInData attribute.
    indexInData = TP.elementGetAttribute(targetElem, 'indexInData', true);

    //  No indexInData? Exit here.
    if (TP.isEmpty(indexInData)) {
        return this;
    }

    //  Prevent default *on the trigger signal* (which is the GUI signal - the
    //  contextmenu signal) so that any sort of 'right click' menu doesn't show.
    aSignal.at('trigger').preventDefault();

    //  Convert to a Number and retrieve the entry Array from our data
    indexInData = indexInData.asNumber();
    itemData = data.at(indexInData);

    if (itemData.at(0) === '[cascaded]') {
        TP.byId('SherpaAdjuster', TP.win('UIROOT')).showAdjusterTile();
        return this;
    }

    //  Use the same 'X' coordinate where the 'center' div is located in the
    //  page.
    centerElem = TP.byId('center', this.getNativeWindow());
    centerElemPageRect = centerElem.getPageRect();

    targetTPElem = TP.wrap(targetElem);

    //  Use the 'Y' coordinate where the target element is located in the page.
    targetElemPageRect = targetTPElem.getPageRect();

    halo = TP.byId('SherpaHalo', this.getNativeDocument());
    sourceTPElem = halo.get('currentTargetTPElem');

    newBodyElem = TP.getContentForTool(sourceTPElem, 'StylesHUDTileBody');
    newFooterElem = TP.getContentForTool(sourceTPElem, 'StylesHUDTileFooter');

    //  ---

    tileTPElem = TP.byId('StyleSummary_Tile', this.getNativeWindow());
    if (TP.notValid(tileTPElem)) {

        tileTPElem = TP.bySystemId('Sherpa').makeTile('StyleSummary_Tile');
        tileTPElem.setHeaderText('Rule Properties');

        newContentTPElem = tileTPElem.setContent(newBodyElem);
        newContentTPElem.awaken();

        tileTPElem.get('footer').setContent(newFooterElem);

        setResourceParams =
            TP.hc('observeResource', true, 'signalChange', true);
    } else {
        currentBodyElem = TP.unwrap(
                            tileTPElem.get('body').getFirstChildElement());
        currentFooterElem = TP.unwrap(
                            tileTPElem.get('footer').getFirstChildElement());

        if (TP.name(currentBodyElem) !== TP.name(newBodyElem)) {
            newContentTPElem = tileTPElem.setContent(newBodyElem);
            newContentTPElem.awaken();
        }
        if (TP.name(currentFooterElem) !== TP.name(newFooterElem)) {
            tileTPElem.get('footer').setContent(newFooterElem);
        }

        setResourceParams = TP.hc('signalChange', true);
    }

    //  Grab the current rule source.
    modelURI = TP.uc('urn:tibet:styleshud_rule_source');

    //  Set the model's URI's resource and signal change. This will
    //  cause the properties to update.
    modelURI.setResource(itemData, setResourceParams);

    //  Position the tile
    tileTPElem.setPagePosition(
        TP.pc(centerElemPageRect.getX(), targetElemPageRect.getY()));

    (function() {
        tileTPElem.get('body').
            focusAutofocusedOrFirstFocusableDescendant();
    }).queueForNextRepaint(tileTPElem.getNativeWindow());

    tileTPElem.setAttribute('hidden', false);

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('ToggleHighlight',
function(aSignal) {

    /**
     * @method ToggleHighlight
     * @summary Responds to mouse over/out notifications by toggling a
     *     class on individual peer elements. The result is that as the user
     *     hovers over elements in the sidebar the corresponding element in
     *     the canvas gets a 'sherpa-hud-highlight' class add/removed.
     * @param {TP.sig.ToggleHighlight} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var uiDoc,

        oldHighlightedElems,

        highlightedElems,
        targetDocElem,

        targetElem,
        index,

        selector,

        hudInjectedStyleElement;

    //  Grab the UI canvas's document
    uiDoc = TP.sys.uidoc(true);

    //  Grab the highlighted elements.
    oldHighlightedElems = this.get('highlighted');

    //  If there are highlighted elements, then we need to clear them
    if (TP.notEmpty(oldHighlightedElems)) {

        //  Clear the elements of the highlight class
        oldHighlightedElems.forEach(
            function(anElem) {
                TP.elementRemoveClass(anElem, 'sherpa-hud-highlight');
            });
        this.$set('highlighted', null, false);

        //  Grab the document element and remove the class that indicates that
        //  we're highlighting.
        targetDocElem = uiDoc.documentElement;
        TP.elementRemoveClass(targetDocElem, 'sherpa-hud-highlighting');
    }

    //  Grab the new 'DOM target' element, which will be the lozenge that the
    //  user is highlighting.
    targetElem = aSignal.getDOMTarget();

    //  If that element doesn't have the 'selector' class, then we exit. It may
    //  be a spacer, which we're not interested in.
    if (!TP.elementHasClass(targetElem, 'selector')) {
        return this;
    }

    //  Grab the index in the data from our lozenge.
    index = TP.elementGetAttribute(targetElem, 'indexInData', true);
    if (TP.isEmpty(index)) {
        return this;
    }

    //  The selector will be at the 2nd place in the record at that index in our
    //  data.
    selector = this.get('data').at(index).at(1);
    if (TP.isEmpty(selector)) {
        return this;
    }

    //  Grab the elements from the UI canvas document that match the selector.
    //  Note here that we don't autocollapse or autowrap, so we'll end up with
    //  an Array of native Elements.
    highlightedElems = TP.byCSSPath(selector, uiDoc, false, false);
    if (highlightedElems.equalTo(oldHighlightedElems)) {
        return this;
    }

    if (TP.notEmpty(highlightedElems)) {
        //  Grab the style sheet that the HUD injected into the UI canvas.
        hudInjectedStyleElement = TP.byId('hud_injected_generated',
                                            TP.sys.uidoc(true),
                                            false);

        //  Set the '--sherpa-hud-highlight-color' to a light opacity version of
        //  our full color.
        TP.cssElementSetCustomCSSPropertyValue(
            hudInjectedStyleElement,
            '.sherpa-hud',
            '--sherpa-hud-highlight-color',
            'rgba(145, 169, 192, 0.3)',
            null,
            false);

        //  Add the highlight class to the target elements.
        highlightedElems.forEach(
            function(anElem) {
                TP.elementAddClass(anElem, 'sherpa-hud-highlight');
            });
        this.$set('highlighted', highlightedElems, false);

        //  Grab the document element and add the class that indicates that
        //  we're highlighting.
        targetDocElem = TP.sys.uidoc(true).documentElement;
        TP.elementAddClass(targetDocElem, 'sherpa-hud-highlighting');
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.sherpa.styleshud.Inst.defineHandler('ToggleScreen',
function(aSignal) {

    /**
     * @method handleToggleScreen
     * @summary Handles notifications of screen toggle signals.
     * @param {TP.sig.ToggleScreen} aSignal The TIBET signal which triggered
     *     this method.
     * @returns {TP.sherpa.styleshud} The receiver.
     */

    var world,
        oldScreenTPWin,

        newScreen,
        newScreenTPWin;

    world = TP.byId('SherpaWorld', TP.sys.getUIRoot());

    //  Grab the old screen TP.core.Window and ignore
    //  DocumentLoaded/DocumentUnloaded signals coming from it.
    oldScreenTPWin = world.get('selectedScreen').getContentWindow();
    this.ignore(oldScreenTPWin, TP.ac('DocumentLoaded', 'DocumentUnloaded'));

    //  Grab the new screen TP.core.Window and observe
    //  DocumentLoaded/DocumentUnloaded signals coming from it.
    newScreen = world.get('screens').at(aSignal.at('screenIndex'));

    if (TP.isValid(newScreen)) {
        newScreenTPWin = newScreen.getContentWindow();
        this.observe(newScreenTPWin,
                        TP.ac('DocumentLoaded', 'DocumentUnloaded'));
    }

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
