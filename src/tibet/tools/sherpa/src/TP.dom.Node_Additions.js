//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

//  ========================================================================
//  TP.dom.Node Additions
//  ========================================================================

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.dom.Node.Inst.defineMethod('haloCanBlur',
function(aHalo) {

    /**
     * @method haloCanBlur
     * @summary Returns whether or not the halo can blur (i.e. no longer focus
     *     on) the receiver.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting whether or not
     *     it can blur the receiver.
     * @returns {Boolean} Whether or not the halo can blur the receiver.
     */

    //  We return false here because, at this level, the halo should be neither
    //  focusing or blurring.
    return false;
});

//  ------------------------------------------------------------------------

TP.dom.Node.Inst.defineMethod('haloCanDelete',
function(aHalo) {

    /**
     * @method haloCanDelete
     * @summary Returns whether or not the halo can delete the receiver from its
     *     DOM tree.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting whether or not
     *     it can delete the receiver.
     * @returns {Boolean} Whether or not the halo can delete the receiver.
     */

    //  We return false here because, at this level, the halo should not be
    //  deleting.
    return false;
});

//  ------------------------------------------------------------------------

TP.dom.Node.Inst.defineMethod('haloCanEmpty',
function(aHalo) {

    /**
     * @method haloCanEmpty
     * @summary Returns whether or not the halo can empty the receiver from its
     *     DOM tree.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting whether or not
     *     it can empty the receiver.
     * @returns {Boolean} Whether or not the halo can empty the receiver.
     */

    //  We return false here because, at this level, the halo should not be
    //  emptying.
    return false;
});

//  ------------------------------------------------------------------------

TP.dom.Node.Inst.defineMethod('haloCanFocus',
function(aHalo) {

    /**
     * @method haloCanFocus
     * @summary Returns whether or not the halo can focus on the receiver.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting whether or not
     *     it can focus the receiver.
     * @returns {Boolean} Whether or not the halo can focus the receiver.
     */

    //  We return false here because, at this level, the halo should be neither
    //  focusing or blurring.
    return false;
});

//  ------------------------------------------------------------------------

TP.dom.Node.Inst.defineMethod('hudCanDrop',
function(aHUD, droppingTPElem) {

    /**
     * @method hudCanDrop
     * @summary Returns whether or not the hud should allow the supplied element
     *     to be dropped into the receiver.
     * @param {TP.sherpa.hud} aHUD The hud that is requesting whether or not
     *     it can drop the supplied element into the receiver.
     * @param {TP.sherpa.hud} droppingTPElem The element that is being dropped.
     * @returns {Boolean} Whether or not the hud can drop the supplied target
     *     into the receiver.
     */

    //  We return false here because, at this level, the hud should not be
    //  allowing dropping into anything.
    return false;
});

//  ------------------------------------------------------------------------

TP.dom.Node.Inst.defineMethod('sherpaGetWorldScreen',
function() {

    /**
     * @method sherpaGetWorldScreen
     * @summary Returns the 'world screen' element that the receiver is
     *     currently hosted in.
     * @returns {TP.dom.ElementNode} The 'world screen' element containing the
     *     receiver.
     */

    var elemScreenTPElem;

    elemScreenTPElem = TP.wrap(this.getNativeWindow().frameElement.parentNode);

    return elemScreenTPElem;
});

//  ========================================================================
//  TP.dom.ElementNode Additions
//  ========================================================================

TP.dom.ElementNode.addTraits(TP.sherpa.ToolAPI);

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('canConnectTo',
function(destTPElement) {

    /**
     * @method canConnectTo
     * @summary Returns whether the receiver will allow connection to the
     *     supplied destination element.
     * @param {TP.dom.ElementNode} destTPElement The destination element.
     * @returns {Boolean} Whether or not the receiver will allow connection.
     */

    var vendValue,
        vendValues,

        acceptValue,
        acceptValues;

    //  Get the vending value for comparison to what the target will accept.
    //  Note that there can be multiple vending values.
    vendValue = this.getAttribute('sherpa:connectorvend');
    vendValues = vendValue.split(' ');
    if (TP.isEmpty(vendValues)) {
        return false;
    }

    //  Get the accepting value to compare against the vending value. Note that
    //  there can be multiple accepting values.
    acceptValue = destTPElement.getAttribute('sherpa:connectoraccept');
    acceptValues = acceptValue.split(' ');
    if (TP.isEmpty(acceptValues)) {
        return false;
    }

    return acceptValues.containsAny(vendValues);
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('canConnectFrom',
function(srcTPElement) {

    /**
     * @method canConnectFrom
     * @summary Returns whether the receiver will allow connection from the
     *     supplied source element.
     * @param {TP.dom.ElementNode} srcTPElement The source element.
     * @returns {Boolean} Whether or not the receiver will allow connection.
     */

    var acceptValue,
        acceptValues,

        vendValue,
        vendValues;

    //  Get the accepting value for comparison to what the target will accept.
    //  Note that there can be multiple accepting values.
    acceptValue = this.getAttribute('sherpa:connectoraccept');
    acceptValues = acceptValue.split(' ');
    if (TP.isEmpty(acceptValues)) {
        return false;
    }

    //  Get the vending value to compare against the accepting value. Note that
    //  there can be multiple vending values.
    vendValue = srcTPElement.getAttribute('sherpa:connectorvend');
    vendValues = vendValue.split(' ');
    if (TP.isEmpty(vendValues)) {
        return false;
    }

    return vendValues.containsAny(acceptValues);
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('connectorSessionDidStart',
function() {

    /**
     * @method connectorSessionDidStart
     * @summary Informs the receiver that any connector session it is going to
     *     be a part of has started.
     * @returns {TP.dom.ElementNode} The receiver.
     */

    var elem;

    elem = this.getNativeNode();

    //  Any element can be a 'signal source' - add the attribute value here.
    TP.elementAddAttributeValue(
            elem, 'sherpa:connectorvend', 'signalsource', true);

    return this;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('connectorSessionDidStop',
function() {

    /**
     * @method connectorSessionDidStop
     * @summary Informs the receiver that any connector session it was currently
     *     a part of has stopped.
     * @returns {TP.dom.ElementNode} The receiver.
     */

    var elem;

    elem = this.getNativeNode();

    //  Any element can be a 'signal source' - remove the attribute value here.
    TP.elementRemoveAttributeValue(
            elem, 'sherpa:connectorvend', 'signalsource', true);

    return this;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getConnectorDestination',
function(aConnector) {

    /**
     * @method getConnectorDestination
     * @summary Returns an element to be used as a connector destination. Note
     *     that, at this level, the receiver returns itself as a valid connector
     *     destination (if it has the correct attribute).
     * @param {TP.sherpa.connector} aConnector The connector that is requesting
     *     the destination to drag to.
     * @returns {TP.dom.ElementNode} The element to use as the connector
     *     destination.
     */

    if (this.hasAttribute('sherpa:connectoraccept')) {
        return this;
    }

    //  If the receiver's document is the UI canvas, then it could always be a
    //  connector destination.
    if (this.getDocument() === TP.sys.uidoc()) {
        return this;
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getConnectorSource',
function(aConnector) {

    /**
     * @method getConnectorSource
     * @summary Returns an element to be used as a connector source. Note that,
     *     at this level, the receiver returns itself as a valid connector
     *     source (if it has the correct attribute).
     * @param {TP.sherpa.connector} aConnector The connector that is requesting
     *     the source to drag from.
     * @returns {TP.dom.ElementNode} The element to use as the connector source.
     */

    if (this.hasAttribute('sherpa:connectorvend')) {
        return this;
    }

    //  If the receiver's document is the UI canvas, then it could always be a
    //  connector source.
    if (this.getDocument() === TP.sys.uidoc()) {
        return this;
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForInspector',
function(options) {

    /**
     * @method getContentForInspector
     * @summary Returns the source's content that will be hosted in an inspector
     *     bay.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the content. This will have the following keys, amongst
     *     others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     *          'bindLoc':          The URI location where the data for the
     *                              content can be found.
     * @returns {Element} The Element that will be used as the content for the
     *     bay.
     */

    var targetAspect,

        dataURI;

    targetAspect = options.at('targetAspect');

    if (targetAspect === 'Node Instance Data' ||
        targetAspect === 'Node Local Data') {
        dataURI = TP.uc(options.at('bindLoc'));

        return TP.elem(
                '<xctrls:list bind:in="{data: ' + dataURI.asString() + '}" filter="true"/>');
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getDataForInspector',
function(options) {

    /**
     * @method getDataForInspector
     * @summary Returns the source's data that will be supplied to the content
     *     hosted in an inspector bay. In most cases, this data will be bound to
     *     the content using TIBET data binding. Therefore, when this data
     *     changes, the content will be refreshed to reflect that.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the data. This will have the following keys, amongst others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     *          'bindLoc':          The URI location where the data for the
     *                              content can be found.
     * @returns {Object} The data that will be supplied to the content hosted in
     *     a bay.
     */

    var targetAspect,

        data;

    targetAspect = options.at('targetAspect');

    if (targetAspect === this.getID()) {
        data = TP.ac(TP.ac('Node Type', 'Node Type'),
                        TP.ac('Node Instance Data', 'Node Instance Data'),
                        TP.ac('Node Local Data', 'Node Local Data'));
    } else if (targetAspect === 'Node Instance Data') {
        data = TP.ac();
        this.getKeys().sort().perform(
                    function(aKey) {
                        if (!TP.owns(this, aKey)) {
                            data.add(TP.ac(aKey, aKey));
                        }
                    }.bind(this));
    } else if (targetAspect === 'Node Local Data') {
        data = TP.ac();
        this.getKeys().sort().perform(
                    function(aKey) {
                        if (TP.owns(this, aKey)) {
                            data.add(TP.ac(aKey, aKey));
                        }
                    }.bind(this));
    } else {
        data = this.get(targetAspect);
        if (data === undefined) {
            data = 'undefined';
        } else if (data === null) {
            data = 'null';
        }
    }

    return data;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getEntryAt',
function(aSourceName) {

    /**
     * @method getEntryAt
     * @summary Returns the 'entry' in the receiver for the supplied source
     *     name. This will be the singular name used to register the entry.
     * @param {String} aSourceName The name of the entry to retrieve.
     * @returns {Object} The entry object registered under the supplied source
     *     name in the receiver.
     */

    var source;

    if (aSourceName === 'Node Type') {
        source = this.getType();
    } else {
        /* eslint-disable consistent-this */
        source = this;
        /* eslint-enable consistent-this */
    }

    return source;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getHaloParent',
function(aHalo) {

    /**
     * @method getHaloParent
     * @summary Returns the next 'haloable' ancestor element of the receiver.
     *     Not all ancestors in the receiver's ancestor chain are 'haloable'.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting the rectangle
     *     to use to display itself.
     * @returns {TP.dom.ElementNode} The next haloable ancestor of the
     *     receiver.
     */

    var parentElem;

    if (TP.isElement(parentElem = this.getNativeNode().parentNode)) {
        return TP.wrap(parentElem);
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getHaloRect',
function(aHalo) {

    /**
     * @method getHaloRect
     * @summary Returns the rectangle that the halo can use to display itself
     *     when it has the receiver selected. At this level, this method returns
     *     an empty TP.gui.Rect.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting the rectangle
     *     to use to display itself.
     * @returns {TP.gui.Rect} The rectangle that the halo will use to display
     *     itself.
     */

    return TP.rtc(0, 0, 0, 0);
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getNearestHaloFocusable',
function(aHalo) {

    /**
     * @method getNearestHaloFocusable
     * @summary Returns the next focusable (by the halo ) ancestor element of
     *     the receiver. Not all ancestors in the receiver's ancestor chain are
     *     'focusable' by the halo. Only ones that respond true to haloCanFocus
     *     are.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting the nearest
     *     halo-focusable ancestor.
     * @returns {TP.dom.ElementNode} The next halo-focusable ancestor of the
     *     receiver.
     */

    var canFocus,
        focusableTPElem;

    /* eslint-disable consistent-this */
    focusableTPElem = this;
    /* eslint-enable consistent-this */

    while (TP.isValid(focusableTPElem = focusableTPElem.getHaloParent(aHalo))) {

        canFocus = focusableTPElem.haloCanFocus(aHalo);

        if (canFocus) {
            return focusableTPElem;
        }
    }

    //  Couldn't find one to focus on? Return null.
    if (!canFocus) {
        return null;
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getNearestHaloGenerator',
function(aHalo) {

    /**
     * @method getNearestHaloGenerator
     * @summary Returns the next 'generator' ancestor element of the receiver.
     * @description This method returns the next parent up the ancestor chain
     *     that is a 'tag generator'. A generator is an Element that is usually
     *     a compiled or templated tag that is responsible for generating
     *     content.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting the nearest
     *     generator ancestor.
     * @returns {TP.dom.ElementNode} The next generator ancestor of the
     *     receiver.
     */

    var generatorTPElem;

    /* eslint-disable consistent-this */
    generatorTPElem = this;
    /* eslint-enable consistent-this */

    if (TP.isKindOf(generatorTPElem, TP.tag.CustomTag)) {
        return generatorTPElem;
    }

    //  Keep iterating up the *haloable* ancestors of the receiver, looking for
    //  one that is a TP.tag.CustomTag (the parent type of compiled and
    //  templated tag types). Return the first one found.
    while (TP.isValid(generatorTPElem = generatorTPElem.getHaloParent(aHalo))) {

        if (TP.isKindOf(generatorTPElem, TP.tag.CustomTag)) {
            return generatorTPElem;
        }
    }

    return null;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getNextHaloChild',
function(aHalo, aSignal) {

    /**
     * @method getNextHaloChild
     * @summary Returns the next 'haloable' child element of the receiver.
     * @description This method uses the target of the supplied signal to
     *     compute a possible haloable child. If that child is not haloable, it
     *     then traverses its ancestor chain until it comes to the receiver,
     *     looking for a haloable Element. If it doesn't find one and comes to
     *     the receiver, it exits and returns null.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting the next
     *     halo-focusable child.
     * @param {TP.sig.Signal} aSignal The signal that initiated the search for a
     *     haloable child.
     * @returns {TP.dom.ElementNode} The next haloable child between the
     *     receiver and the target of the supplied signal.
     */

    var evtTarget,
        existingTarget,
        theElem,
        lastElem;

    evtTarget = aSignal.getTarget();

    existingTarget = aHalo.get('currentTargetTPElem').getNativeNode();

    lastElem = evtTarget;
    theElem = evtTarget.parentNode;

    while (theElem !== existingTarget) {
        if (TP.isDocument(theElem)) {
            lastElem = null;
            break;
        }

        lastElem = theElem;
        theElem = theElem.parentNode;
    }

    //  We went to the top of the DOM hierarchy without finding the event
    //  target. We may be at the 'bottom' of the DOM hierarchy.
    if (TP.notValid(lastElem)) {
        return null;
    }

    return TP.wrap(lastElem);
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getPathPartsForInspector',
function(options) {

    /**
     * @method getPathPartsForInspector
     * @summary Returns the source's path parts that the inspector should be
     *     navigated to when it has neither a current resolver to resolve to or
     *     a path that's been supplied by the caller.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the path parts. This will have the following keys, amongst
     *     others:
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     * @returns {String[]} The path parts that will navigate the inspector to
     *     the receiver.
     */

    return TP.ac('_HALO_');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getUIEditorType',
function() {

    /**
     * @method getUIEditorType
     * @summary Returns the UIEditor subtype used to edit any UI elements.
     * @returns {null}
     */

    return null;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForAdjusterTileBody',
function() {

    /**
     * @method getContentForAdjusterTileBody
     * @summary
     * @returns {}
     */

    return TP.xhtmlnode('<div class="editor_wrapper"/>');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForAdjusterTileFooter',
function() {

    /**
     * @method getContentForAdjusterTileBody
     * @summary
     * @returns {}
     */

    return TP.xhtmlnode('<div class="info"/>');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('haloCanBlur',
function(aHalo) {

    /**
     * @method haloCanBlur
     * @summary Returns whether or not the halo can blur (i.e. no longer focus
     *     on) the receiver.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting whether or not
     *     it can blur the receiver.
     * @returns {Boolean} Whether or not the halo can blur the receiver.
     */

    //  We can always blur
    return true;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('haloCanDelete',
function(aHalo) {

    /**
     * @method haloCanDelete
     * @summary Returns whether or not the halo can delete the receiver from its
     *     DOM tree.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting whether or not
     *     it can delete the receiver.
     * @returns {Boolean} Whether or not the halo can delete the receiver.
     */

    var currentTargetTPElem,

        ourName,
        appTagName;

    currentTargetTPElem = aHalo.get('currentTargetTPElem');

    ourName = currentTargetTPElem.getCanonicalName();

    //  NB: We pass false here to skip returning any Sherpa tag since we're
    //  running in a Sherpa-enabled environment.
    appTagName = TP.tibet.root.computeAppTagTypeName(false);

    //  If our (canonical) name is the same as the app tag name, then we don't
    //  allow it to be deleted.
    if (ourName === appTagName) {

        TP.bySystemId('SherpaConsoleService').notify(
            'It is not possible to delete the root application tag.');

        return false;
    }

    return true;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('haloCanEmpty',
function(aHalo) {

    /**
     * @method haloCanEmpty
     * @summary Returns whether or not the halo can empty the receiver from its
     *     DOM tree.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting whether or not
     *     it can empty the receiver.
     * @returns {Boolean} Whether or not the halo can empty the receiver.
     */

    return true;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('haloCanFocus',
function(aHalo) {

    /**
     * @method haloCanFocus
     * @summary Returns whether or not the halo can focus on the receiver.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting whether or not
     *     it can focus the receiver.
     * @returns {Boolean} Whether or not the halo can focus the receiver.
     */

    var ancestors,

        len,
        i;

    //  We cannot focus on elements that are Sherpa elements themselves.
    if (this.getNSURI() === TP.w3.Xmlns.SHERPA) {
        return false;
    }

    //  We cannot focus on elements that are under a 'sherpa:tofu' element
    ancestors = this.getAncestors();

    len = ancestors.getSize();
    for (i = 0; i < len; i++) {
        if (ancestors.at(i).getCanonicalName() === 'sherpa:tofu') {
            return false;
        }
    }

    return true;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('hudCanDrop',
function(aHUD, targetTPElem) {

    /**
     * @method hudCanDrop
     * @summary Returns whether or not the hud should allow the supplied element
     *     to be dropped into the receiver.
     * @param {TP.sherpa.hud} aHUD The hud that is requesting whether or not
     *     it can drop the supplied element into the receiver.
     * @param {TP.sherpa.hud} droppingTPElem The element that is being dropped.
     * @returns {Boolean} Whether or not the hud can drop the supplied target
     *     into the receiver.
     */

    return true;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('resolveAspectForInspector',
function(anAspect, options) {

    /**
     * @method resolveAspectForInspector
     * @summary Returns the object that is produced when resolving the aspect
     *     against the receiver.
     * @param {String} anAspect The aspect to resolve against the receiver to
     *     produce the return value.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the configuration data. This will have the following keys,
     *     amongst others:
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     * @returns {Object} The object produced when resolving the aspect against
     *     the receiver.
     */

    var source;

    if (anAspect === 'Node Type') {
        return this.getType();
    }

    if (anAspect === 'Node Instance Data' || anAspect === 'Node Local Data') {
        return this;
    }

    source = TP.sherpa.SingleEntryInspectorSource.construct();
    source.setPrimaryEntry(this.get(anAspect));

    return source;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('sherpaDidInsertBreadcrumb',
function(insertionPointElement, insertionPosition) {

    /**
     * @method sherpaDidInsertBreadcrumb
     * @summary Responds to the fact that the Sherpa initiated a DOM insertion
     *     by dropping a 'breadcrumb' element somewhere in a DOM visualization.
     * @param {Element} insertionPointElement The element that provides the
     *     insertion point to the insertion operation. This, in combination with
     *     the insertion position, will provide the place in the DOM to insert
     *     the new DOM node.
     * @param {String} insertionPosition The insertion position, relative to
     *     the insertion point element, that the new node should be inserted at.
     *     This could be TP.BEFORE_BEGIN, TP.AFTER_BEGIN, TP.BEFORE_END,
     *     TP.AFTER_END.
     * @returns {TP.dom.ElementNode} The receiver.
     */

    return this;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('sherpaDidInsertTofu',
function(insertionPointElement, insertionPosition) {

    /**
     * @method sherpaDidInsertTofu
     * @summary Responds to the fact that the Sherpa initiated a DOM insertion
     *     by dropping a 'tofu' element somewhere in a DOM visualization.
     * @param {Element} insertionPointElement The element that provides the
     *     insertion point to the insertion operation. This, in combination with
     *     the insertion position, will provide the place in the DOM to insert
     *     the new DOM node.
     * @param {String} insertionPosition The insertion position, relative to
     *     the insertion point element, that the new node should be inserted at.
     *     This could be TP.BEFORE_BEGIN, TP.AFTER_BEGIN, TP.BEFORE_END,
     *     TP.AFTER_END.
     * @returns {TP.dom.ElementNode} The receiver.
     */

    return this;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('sherpaShouldAlterStyle',
function() {

    /**
     * @method sherpaShouldAlterStyle
     * @summary Returns whether or not the Sherpa should alter the style for
     *     this type when updating the source document that the visual document
     *     is displaying. Typically, the Sherpa will alter application
     *     styles, but not TIBET core styles, such as those for XControls.
     * @returns {Boolean} Whether or not the Sherpa should alter the receiver's
     *     style.
     */

    return false;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('sherpaShouldAlterTemplate',
function() {

    /**
     * @method sherpaShouldAlterTemplate
     * @summary Returns whether or not the Sherpa should alter the template for
     *     this type when updating the source document that the visual document
     *     is displaying. Typically, the Sherpa will alter application
     *     templates, but not TIBET core templates, such as those for XControls.
     * @description This method, normally associated with a template tag, is
     *     backstopped here (returning false) to avoid having to test for this
     *     method's presence on altered elements when updating source documents
     *     in the Sherpa.
     * @returns {Boolean} Whether or not the Sherpa should alter the receiver's
     *     template.
     */

    return false;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForDomHUDLabel',
function() {

    /**
     * @method getContentForDomHUDLabel
     * @summary Returns the label that the Sherpa's 'domhud' panel will use when
     *     displaying it's representation for this node.
     * @returns {String} The label to use in the 'domhud' panel.
     */

    return this.getFullName();
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForBindsHUDTileBody',
function() {

    /**
     * @method getContentForBindsHUDTileBody
     * @summary Returns the content that the Sherpa's 'bindshud' panel will use
     *     as the 'tile body' when displaying it's 'tile' panel for this node.
     * @returns {Element} The Element that will be used as the content for the
     *     'body' of the bindshud tile panel.
     */

    return TP.xhtmlnode('<span class="cm-s-elegant">' +
                            'Fetching data...' +
                            '</span>');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForDomHUDTileBody',
function() {

    /**
     * @method getContentForDomHUDTileBody
     * @summary Returns the content that the Sherpa's 'domhud' panel will use
     *     as the 'tile body' when displaying it's 'tile' panel for this node.
     * @returns {Element} The Element that will be used as the content for the
     *     'body' of the domhud tile panel.
     */

    return TP.elem('<sherpa:domhud_genericElementContent/>');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForDomHUDTileFooter',
function() {

    /**
     * @method getContentForDomHUDTileFooter
     * @summary Returns the content that the Sherpa's 'domhud' panel will use
     *     as the 'tile footer' when displaying it's 'tile' panel for this node.
     * @returns {Element} The Element that will be used as the content for the
     *     'footer' of the domhud tile panel.
     */

    return TP.xhtmlnode('<button class="inserter" on:click="{signal: InsertItem, origin: \'DOMAttributes_Repeat\', payload: {source: \'urn:tibet:dom_attr_data_blank\', copy: true}}"></button>');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForStylesHUDTileBody',
function() {

    /**
     * @method getContentForStylesHUDTileBody
     * @summary Returns the content that the Sherpa's 'styleshud' panel will use
     *     as the 'tile body' when displaying it's 'tile' panel for this node.
     * @returns {Element} The Element that will be used as the content for the
     *     'body' of the styleshud tile panel.
     */

    return TP.elem('<sherpa:styleshud_ruleContent/>');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForStylesHUDTileFooter',
function() {

    /**
     * @method getContentForStylesHUDTileFooter
     * @summary Returns the content that the Sherpa's 'styleshud' panel will use
     *     as the 'tile footer' when displaying it's 'tile' panel for this node.
     * @returns {Element} The Element that will be used as the content for the
     *     'footer' of the styleshud tile panel.
     */

    return TP.xhtmlnode('<button class="inserter" on:click="{signal: InsertItem, origin: \'styleshud_rw_properties\', payload: {source: \'urn:tibet:style_prop_data_blank\', copy: true}}"></button>');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForRespondersHUDTileBody',
function(params) {

    /**
     * @method getContentForRespondersHUDTileBody
     * @summary Returns the content that the Sherpa's 'respondershud' panel will
     *     use as the 'tile body' when displaying it's 'tile' panel for this
     *     node.
     * @returns {Element} The Element that will be used as the content for the
     *     'body' of the respondershud tile panel.
     */

    var dataURI;

    dataURI = params.at('dataURI');

    return TP.elem('<xctrls:list id="ResponderMethodList"' +
                        ' bind:in="{data: ' + dataURI.asString() + '}"' +
                        ' on:UISelect="InspectResponderMethod"' +
                        ' tibet:ctrl="RespondersHUD"' +
                        ' filter="true"/>');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('getContentForRespondersHUDTileFooter',
function() {

    /**
     * @method getContentForRespondersHUDTileFooter
     * @summary Returns the content that the Sherpa's 'respondershud' panel will
     *     use as the 'tile footer' when displaying it's 'tile' panel for this
     *     node.
     * @returns {Element} The Element that will be used as the content for the
     *     'footer' of the respondershud tile panel.
     */

    return TP.xhtmlnode('<button class="inserter" on:click="{signal: AddSignalHandler, origin: \'RespondersHUD\'}"/>');
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('sherpaDidCopyNodeInto',
function(insertionPointElement, insertionPosition) {

    /**
     * @method sherpaDidCopyNodeInto
     * @summary Responds to the fact that the Sherpa initiated a DOM reparenting
     *     operation (with cloning) by dropping a 'tofu' element that was
     *     generated by the halo somewhere in a DOM visualization.
     * @param {Element} insertionPointElement The element that provides the
     *     insertion point to the reparent operation of the cloned node. This,
     *     in combination with the insertion position, will provide the place in
     *     the DOM to reparent the DOM node.
     * @param {String} insertionPosition The insertion position, relative to
     *     the insertion point element, that the cloned node should be
     *     reparented at. This could be TP.BEFORE_BEGIN, TP.AFTER_BEGIN,
     *     TP.BEFORE_END, TP.AFTER_END.
     * @returns {TP.dom.ElementNode} The receiver.
     */

    var haloTPElem,
        haloTargetTPElem,

        newTPElem;

    //  The target element that we're moving is the halo's current target.
    haloTPElem = TP.byId('SherpaHalo', TP.sys.getUIRoot());
    haloTargetTPElem = haloTPElem.get('currentTargetTPElem');

    //  Clone the halo target element and remove the 'id' attribute (can't have
    //  more than 1 element in a document with the same id).
    newTPElem = haloTargetTPElem.clone();
    newTPElem.removeAttribute('id');

    //  NB: We queue this for the next time that the browser wants to repaint
    //  because all of those lovely microtasks that got queued to get us here
    //  (as the caller of this was tearing itself down - removing attributes and
    //  other nodes, etc.) we want to be flushed *before* we set the
    //  'shouldProcessDOMMutations' flag to be true.
    (function() {
        var newInsertedTPElem;

        //  Tell the main Sherpa object that it should go ahead and process DOM
        //  mutations to the source DOM.
        TP.bySystemId('Sherpa').set('shouldProcessDOMMutations', true);

        //  Move the target element. The deadening/awakening will be handled by
        //  the Mutation Observer machinery.
        newInsertedTPElem = TP.wrap(insertionPointElement).insertContent(
                                newTPElem,
                                insertionPosition);
        //  Focus the halo on our new element, passing true to actually show the
        //  halo if it's hidden.
        if (newInsertedTPElem.haloCanFocus(haloTPElem)) {
            haloTPElem.focusOn(newInsertedTPElem, true);
        }

    }).queueForNextRepaint(this.getNativeWindow());

    return this;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('sherpaDidCopyTDCOutputNodeInto',
function(insertionPointElement, insertionPosition, tdcRequest) {

    /**
     * @method sherpaDidCopyTDCOutputNodeInto
     * @summary Responds to the fact that the TDC initiated a DOM cloning
     *     operation of TDC output by dropping a 'tofu' element that was
     *     generated by a particularTDC output cell.
     * @param {Element} insertionPointElement The element that provides the
     *     insertion point to the reparent operation of the cloned node. This,
     *     in combination with the insertion position, will provide the place in
     *     the DOM to reparent the DOM node.
     * @param {String} insertionPosition The insertion position, relative to
     *     the insertion point element, that the cloned node should be
     *     reparented at. This could be TP.BEFORE_BEGIN, TP.AFTER_BEGIN,
     *     TP.BEFORE_END, TP.AFTER_END.
     * @returns {TP.dom.ElementNode} The receiver.
     */

    var cmdNode,
        newElem,

        newScriptElem,

        haloTPElem;

    cmdNode = tdcRequest.at('cmdNode');

    //  Clone the cmdNode element and remove the 'id' attribute (can't have
    //  more than 1 element in a document with the same id).
    newElem = TP.nodeCloneNode(cmdNode);
    TP.elementRemoveAttribute(newElem, 'id', true);

    //  Create a 'tsh:script' wrapper (unless we are already in one)
    if (this.getCanonicalName() !== 'tsh:script') {
        newScriptElem = TP.elem('<tsh:script/>');
        TP.nodeAppendChild(newScriptElem, newElem, false);
    } else {
        newScriptElem = newElem;
    }

    haloTPElem = TP.byId('SherpaHalo', TP.sys.getUIRoot());

    //  NB: We queue this for the next time that the browser wants to repaint
    //  because all of those lovely microtasks that got queued to get us here
    //  (as the caller of this was tearing itself down - removing attributes and
    //  other nodes, etc.) we want to be flushed *before* we set the
    //  'shouldProcessDOMMutations' flag to be true.
    (function() {

        var newScriptTPElem;

        //  Tell the main Sherpa object that it should go ahead and process DOM
        //  mutations to the source DOM.
        TP.bySystemId('Sherpa').set('shouldProcessDOMMutations', true);

        //  Insert the content and capture the return element.
        newScriptTPElem = TP.wrap(insertionPointElement).insertContent(
                                        newScriptElem, insertionPosition);

        //  Focus the halo on our new element, passing true to actually show the
        //  halo if it's hidden.
        if (newScriptTPElem.haloCanFocus(haloTPElem)) {
            haloTPElem.focusOn(newScriptTPElem, true);
        }

    }).queueForNextRepaint(this.getNativeWindow());

    return this;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('sherpaDidReparentNode',
function(insertionPointElement, insertionPosition) {

    /**
     * @method sherpaDidReparentNode
     * @summary Responds to the fact that the Sherpa initiated a DOM reparenting
     *     operation by dropping a 'tofu' element that was generated by the halo
     *     somewhere in a DOM visualization.
     * @param {Element} insertionPointElement The element that provides the
     *     insertion point to the reparenting operation. This, in combination
     *     with the insertion position, will provide the place in the DOM to
     *     reparent the DOM node.
     * @param {String} insertionPosition The insertion position, relative to
     *     the insertion point element, that the node should be reparented at.
     *     This could be TP.BEFORE_BEGIN, TP.AFTER_BEGIN, TP.BEFORE_END,
     *     TP.AFTER_END.
     * @returns {TP.dom.ElementNode} The receiver.
     */

    var haloTPElem,
        haloTargetTPElem,

        newInsertedTPElem;

    //  The target element that we're moving is the halo's current target.
    haloTPElem = TP.byId('SherpaHalo', TP.sys.getUIRoot());
    haloTargetTPElem = haloTPElem.get('currentTargetTPElem');

    //  NB: We queue this for the next time that the browser wants to repaint
    //  because all of those lovely microtasks that got queued to get us here
    //  (as the caller of this was tearing itself down - removing attributes and
    //  other nodes, etc.) we want to be flushed *before* we set the
    //  'shouldProcessDOMMutations' flag to be true.
    (function() {
        //  Tell the main Sherpa object that it should go ahead and process DOM
        //  mutations to the source DOM.
        TP.bySystemId('Sherpa').set('shouldProcessDOMMutations', true);

        //  Move the target element. The deadening/awakening will be handled by
        //  the Mutation Observer machinery.
        newInsertedTPElem = TP.wrap(insertionPointElement).insertContent(
                                haloTargetTPElem,
                                insertionPosition);

        //  Focus the halo on our new element, passing true to actually show the
        //  halo if it's hidden.
        if (newInsertedTPElem.haloCanFocus(haloTPElem)) {
            haloTPElem.focusOn(newInsertedTPElem, true);
        }

    }).queueForNextRepaint(this.getNativeWindow());

    return this;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('sherpaGetTextContent',
function() {

    /**
     * @method sherpaGetTextContent
     * @summary Returns the text content that the Sherpa will use when
     *     manipulating the receiver's 'text content'. Note that the Sherpa
     *     currently only manipulates a single Text node that exists as a leaf
     *     of an Element. If there is mixed Element and Text node content, then
     *     that is ignored and this method returns the empty String.
     * @returns {String} The text content that the Sherpa will use to manage the
     *     receiver's 'text content'.
     */

    var str;

    if (TP.isEmpty(this.getChildNodes())) {
        str = '';
    } else if (TP.notEmpty(this.getDescendantElements())) {
        str = '';
    } else {
        str = this.getTextContent();
    }

    return str;
});

//  ------------------------------------------------------------------------

TP.dom.ElementNode.Inst.defineMethod('sherpaSetTextContent',
function(aContent) {

    /**
     * @method sherpaSetTextContent
     * @summary Sets the text content of the receiver as the Sherpa would do it.
     *     Note that since the Sherpa currently does not handle more than a
     *     single Text node as a leaf under an Element node, if the receiver has
     *     descendant elements, this method will do nothing.
     * @param {String} aContent The content to set the receiver's text content
     *     to.
     * @returns {TP.dom.ElementNode} The receiver.
     */

    if (TP.notEmpty(this.getDescendantElements())) {
        return this;
    } else {
        this.setTextContent(aContent);
    }

    return this;
});

//  ========================================================================
//  TP.tag.CustomTag Additions
//  ========================================================================

//  ------------------------------------------------------------------------
//  Inspector API
//  ------------------------------------------------------------------------

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.tag.CustomTag.Inst.defineMethod('getConfigForInspector',
function(options) {

    /**
     * @method getConfigForInspector
     * @summary Returns the source's configuration data to configure the bay
     *     that the source's content will be hosted in.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the configuration data. This will have the following keys,
     *     amongst others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     * @returns {TP.core.Hash} Configuration data used by the inspector for bay
     *     configuration. This could have the following keys, amongst others:
     *          TP.ATTR + '_contenttype':   The tag name of the content being
     *                                      put into the bay
     *          TP.ATTR + '_class':         Any additional CSS classes to put
     *                                      onto the bay inspector item itself
     *                                      to adjust to the content being
     *                                      placed in it.
     */

    options.atPut(TP.ATTR + '_contenttype', 'xctrls:list');

    return options;
});

//  ------------------------------------------------------------------------

TP.tag.CustomTag.Inst.defineMethod('getContentForInspector',
function(options) {

    /**
     * @method getContentForInspector
     * @summary Returns the source's content that will be hosted in an inspector
     *     bay.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the content. This will have the following keys, amongst
     *     others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     *          'bindLoc':          The URI location where the data for the
     *                              content can be found.
     * @returns {Element} The Element that will be used as the content for the
     *     bay.
     */

    var dataURI;

    if (options.at('targetAspect') === this.getID()) {
        dataURI = TP.uc(options.at('bindLoc'));

        return TP.elem(
                '<xctrls:list bind:in="{data: ' + dataURI.asString() + '}" filter="true"/>');
    }

    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.tag.CustomTag.Inst.defineMethod('getDataForInspector',
function(options) {

    /**
     * @method getDataForInspector
     * @summary Returns the source's data that will be supplied to the content
     *     hosted in an inspector bay. In most cases, this data will be bound to
     *     the content using TIBET data binding. Therefore, when this data
     *     changes, the content will be refreshed to reflect that.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the data. This will have the following keys, amongst others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     *          'bindLoc':          The URI location where the data for the
     *                              content can be found.
     * @returns {Object} The data that will be supplied to the content hosted in
     *     a bay.
     */

    var stdSlots,
        customTagSlots,

        data;

    if (options.at('targetAspect') === this.getID()) {
        stdSlots = this.callNextMethod();
        customTagSlots = TP.ac(
                            TP.ac('Structure', 'Structure'),
                            TP.ac('Style', 'Style'));

        data = stdSlots.concat(customTagSlots);
    } else {
        data = this.callNextMethod();
    }

    return data;
});

//  ========================================================================
//  TP.tag.TemplatedTag Additions
//  ========================================================================

//  ------------------------------------------------------------------------
//  Inspector API
//  ------------------------------------------------------------------------

//  ------------------------------------------------------------------------
//  Type Methods
//  ------------------------------------------------------------------------

TP.tag.TemplatedTag.Type.defineMethod('getDataForInspector',
function(options) {

    /**
     * @method getDataForInspector
     * @summary Returns the source's data that will be supplied to the content
     *     hosted in an inspector bay. In most cases, this data will be bound to
     *     the content using TIBET data binding. Therefore, when this data
     *     changes, the content will be refreshed to reflect that.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the data. This will have the following keys, amongst others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     *          'bindLoc':          The URI location where the data for the
     *                              content can be found.
     * @returns {Object} The data that will be supplied to the content hosted in
     *     a bay.
     */

    var items;

    items = this.callNextMethod();

    items.push(
        TP.ac('Structure', 'Structure'),
        TP.ac('Style', 'Style'));

    return items;
});

//  ------------------------------------------------------------------------

TP.tag.TemplatedTag.Type.defineMethod('getEntryAt',
function(aSourceName) {

    /**
     * @method getEntryAt
     * @summary Returns the 'entry' in the receiver for the supplied source
     *     name. This will be the singular name used to register the entry.
     * @param {String} aSourceName The name of the entry to retrieve.
     * @returns {Object} The entry object registered under the supplied source
     *     name in the receiver.
     */

    var source;

    switch (aSourceName) {

        case 'Structure':
            //  NB: We're returning the TP.uri.URI instance itself here.
            source = this.getResourceURI('template', TP.ietf.mime.XHTML);

            break;

        case 'Style':
            //  NB: We're returning the TP.uri.URI instance itself here.
            source = this.getResourceURI('style', TP.ietf.mime.XHTML);

            break;

        default:
            source = this.callNextMethod();
            break;
    }

    return source;
});

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.tag.TemplatedTag.Inst.defineMethod('resolveAspectForInspector',
function(anAspect, options) {

    /**
     * @method resolveAspectForInspector
     * @summary Returns the object that is produced when resolving the aspect
     *     against the receiver.
     * @param {String} anAspect The aspect to resolve against the receiver to
     *     produce the return value.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the configuration data. This will have the following keys,
     *     amongst others:
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     * @returns {Object} The object produced when resolving the aspect against
     *     the receiver.
     */

    var thisType;

    thisType = this.getType();

    switch (anAspect) {

        case 'Structure':
            //  NB: We're returning the TP.uri.URI instance itself here.
            return thisType.getResourceURI('template', TP.ietf.mime.XHTML);

        case 'Style':
            //  NB: We're returning the TP.uri.URI instance itself here.
            return thisType.getResourceURI('style', TP.ietf.mime.CSS);

        default:
            return this.callNextMethod();
    }
});

//  ------------------------------------------------------------------------
//  Context Menu API
//  ------------------------------------------------------------------------

TP.tag.TemplatedTag.Inst.defineMethod('getContentForContextMenu',
function(options) {

    /**
     * @method getContentForContextMenu
     * @summary Returns the source's content that will be hosted in a Sherpa
     *     context menu.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the content. This will have the following keys, amongst
     *     others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     * @returns {Element} The Element that will be used as the content for the
     *     context menu.
     */

    return TP.elem('<sherpa:templatedTagContextMenuContent/>');
});

//  ------------------------------------------------------------------------

TP.tag.TemplatedTag.Inst.defineMethod('sherpaShouldAlterStyle',
function() {

    /**
     * @method sherpaShouldAlterStyle
     * @summary Returns whether or not the Sherpa should alter the style for
     *     this type when updating the source document that the visual document
     *     is displaying. Typically, the Sherpa will alter application
     *     styles, but not TIBET core styles, such as those for XControls.
     * @returns {Boolean} Whether or not the Sherpa should alter the receiver's
     *     style.
     */

    var nsRoot;

    //  We only alter styles that are *not* under the lib ('TP') root.
    nsRoot = this.getType().getNamespaceRoot();
    if (nsRoot === 'TP') {
        return false;
    }

    return true;
});

//  ------------------------------------------------------------------------

TP.tag.TemplatedTag.Inst.defineMethod('sherpaShouldAlterTemplate',
function() {

    /**
     * @method sherpaShouldAlterTemplate
     * @summary Returns whether or not the Sherpa should alter the template for
     *     this type when updating the source document that the visual document
     *     is displaying. Typically, the Sherpa will alter application
     *     templates, but not TIBET core templates, such as those for XControls.
     * @returns {Boolean} Whether or not the Sherpa should alter the receiver's
     *     template.
     */

    var nsRoot;

    //  We only alter templates that are *not* under the lib ('TP') root.
    nsRoot = this.getType().getNamespaceRoot();
    if (nsRoot === 'TP') {
        return false;
    }

    return true;
});

//  ========================================================================
//  TP.tag.CompiledTag Additions
//  ========================================================================

//  ------------------------------------------------------------------------
//  Inspector API
//  ------------------------------------------------------------------------

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.tag.CompiledTag.Inst.defineMethod('resolveAspectForInspector',
function(anAspect, options) {

    /**
     * @method resolveAspectForInspector
     * @summary Returns the object that is produced when resolving the aspect
     *     against the receiver.
     * @param {String} anAspect The aspect to resolve against the receiver to
     *     produce the return value.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the configuration data. This will have the following keys,
     *     amongst others:
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     * @returns {Object} The object produced when resolving the aspect against
     *     the receiver.
     */

    var thisType;

    thisType = this.getType();

    switch (anAspect) {

        case 'Structure':

            //  See if the tag has a type-local tagCompile method. If so, return
            //  it.
            if (TP.owns(thisType, 'tagCompile')) {
                return thisType.tagCompile;
            }

            //  See if the tag has a type tagCompile method. If so, return it.
            if (TP.owns(thisType.Type, 'tagCompile')) {
                return thisType.Type.tagCompile;
            }

            return null;

        case 'Style':

            return thisType.getResourceURI('template', TP.ietf.mime.CSS);

        default:
            return this.callNextMethod();
    }
});

//  ------------------------------------------------------------------------
//  Context Menu API
//  ------------------------------------------------------------------------

TP.tag.CompiledTag.Inst.defineMethod('getContentForContextMenu',
function(options) {

    /**
     * @method getContentForContextMenu
     * @summary Returns the source's content that will be hosted in a Sherpa
     *     context menu.
     * @param {TP.core.Hash} options A hash of data available to this source to
     *     generate the content. This will have the following keys, amongst
     *     others:
     *          'targetObject':     The object being queried using the
     *                              targetAspect to produce the object being
     *                              displayed.
     *          'targetAspect':     The property of the target object currently
     *                              being displayed.
     *          'pathParts':        The Array of parts that make up the
     *                              currently selected path.
     * @returns {Element} The Element that will be used as the content for the
     *     context menu.
     */

    return TP.elem('<sherpa:compiledTagContextMenuContent/>');
});

//  ========================================================================
//  TP.dom.UIElementNode Additions
//  ========================================================================

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.dom.UIElementNode.Inst.defineMethod('getHaloRect',
function(aHalo) {

    /**
     * @method getHaloRect
     * @summary Returns the rectangle that the halo can use to display itself
     *     when it has the receiver selected.
     * @param {TP.sherpa.Halo} aHalo The halo that is requesting the rectangle
     *     to use to display itself.
     * @returns {TP.gui.Rect} The rectangle that the halo will use to display
     *     itself.
     */

    return this.getGlobalRect();
});

//  ------------------------------------------------------------------------

TP.dom.UIElementNode.Inst.defineMethod('getUIEditorType',
function() {

    /**
     * @method getUIEditorType
     * @summary Returns the UIEditor subtype used to edit any UI elements.
     * @returns {TP.meta.dom.UIElementNodeEditor}
     */

    return TP.dom.UIElementNodeEditor;
});

//  ------------------------------------------------------------------------

TP.dom.UIElementNode.Inst.defineMethod('sherpaDidInsertBreadcrumb',
function(insertionPointElement, insertionPosition) {

    /**
     * @method sherpaDidInsertBreadcrumb
     * @summary Responds to the fact that the Sherpa initiated a DOM insertion
     *     by dropping a 'breadcrumb' element somewhere in a DOM visualization.
     * @param {Element} insertionPointElement The element that provides the
     *     insertion point to the insertion operation. This, in combination with
     *     the insertion position, will provide the place in the DOM to insert
     *     the new DOM node.
     * @param {String} insertionPosition The insertion position, relative to
     *     the insertion point element, that the new node should be inserted at.
     *     This could be TP.BEFORE_BEGIN, TP.AFTER_BEGIN, TP.BEFORE_END,
     *     TP.AFTER_END.
     * @returns {TP.dom.UIElementNode} The receiver.
     */

    var inspector,
        contentType,

        assistantContentTPElem,
        dialogPromise;

    inspector = TP.byId('SherpaInspector', TP.sys.getUIRoot());

    contentType = inspector.getCurrentPropertyValueForTool(
                                'contentType',
                                'canvas');

    switch (contentType) {

        case 'uri/CouchDB/document':

            //  Grab the TP.sherpa.insertionAssistant type's template.
            assistantContentTPElem =
                TP.sherpa.couchDocumentURIInsertionAssistant.getResourceElement(
                                'template',
                                TP.ietf.mime.XHTML);

            //  Open a dialog with the insertion assistant's content.
            dialogPromise = TP.dialog(
                TP.hc(
                    'dialogID', 'CouchDocumentURIAssistantDialog',
                    'isModal', true,
                    'title', 'Insert Property Sheet',
                    'templateContent', assistantContentTPElem));

            //  After the dialog is showing, set the assistant parameters on the
            //  content object from those defined in the original signal's
            //  payload.
            dialogPromise.then(
                function(aDialogTPElem) {

                    var contentTPElem,
                        insertedURI;

                    contentTPElem = aDialogTPElem.get('bodyGroup').
                                                getFirstChildElement();

                    insertedURI = inspector.getCurrentPropertyValueForTool(
                                                'data',
                                                'inspector');

                    //  Pass along the insertion position and the peer element
                    //  as the insertion point to the dialog info.
                    contentTPElem.set('data',
                        TP.hc(
                            'insertionPosition', insertionPosition,
                            'insertionPoint', insertionPointElement,
                            'uri', insertedURI,
                            'insertionID',
                                'couch_doc' + TP.genID().replace('$', '_')));
                });

            break;

        case 'uri/CouchDB/view':

            //  Grab the TP.sherpa.insertionAssistant type's template.
            assistantContentTPElem =
                TP.sherpa.couchViewURIInsertionAssistant.getResourceElement(
                                'template',
                                TP.ietf.mime.XHTML);

            //  Open a dialog with the insertion assistant's content.
            dialogPromise = TP.dialog(
                TP.hc(
                    'dialogID', 'CouchViewURIAssistantDialog',
                    'isModal', true,
                    'title', 'Insert Data Table',
                    'templateContent', assistantContentTPElem));

            //  After the dialog is showing, set the assistant parameters on the
            //  content object from those defined in the original signal's
            //  payload.
            dialogPromise.then(
                function(aDialogTPElem) {

                    var contentTPElem,
                        insertedURI;

                    contentTPElem = aDialogTPElem.get('bodyGroup').
                                                getFirstChildElement();

                    insertedURI = inspector.getCurrentPropertyValueForTool(
                                                'data',
                                                'inspector');

                    //  Pass along the insertion position and the peer element
                    //  as the insertion point to the dialog info.
                    contentTPElem.set('data',
                        TP.hc(
                            'insertionPosition', insertionPosition,
                            'insertionPoint', insertionPointElement,
                            'uri', insertedURI,
                            'insertionID',
                                'couch_view' + TP.genID().replace('$', '_')));
                });

            break;

        default:
            break;
    }

    return this;
});

//  ------------------------------------------------------------------------

TP.dom.UIElementNode.Inst.defineMethod('sherpaDidInsertTofu',
function(insertionPointElement, insertionPosition) {

    /**
     * @method sherpaDidInsertTofu
     * @summary Responds to the fact that the Sherpa initiated a DOM insertion
     *     by dropping a 'tofu' element somewhere in a DOM visualization.
     * @param {Element} insertionPointElement The element that provides the
     *     insertion point to the insertion operation. This, in combination with
     *     the insertion position, will provide the place in the DOM to insert
     *     the new DOM node.
     * @param {String} insertionPosition The insertion position, relative to
     *     the insertion point element, that the new node should be inserted at.
     *     This could be TP.BEFORE_BEGIN, TP.AFTER_BEGIN, TP.BEFORE_END,
     *     TP.AFTER_END.
     * @returns {TP.dom.UIElementNode} The receiver.
     */

    var assistantContentTPElem,
        dialogPromise;

    //  Grab the TP.sherpa.insertionAssistant type's template.
    assistantContentTPElem =
        TP.sherpa.tofuInsertionAssistant.getResourceElement(
                        'template',
                        TP.ietf.mime.XHTML);

    //  Open a dialog with the insertion assistant's content.
    dialogPromise = TP.dialog(
        TP.hc(
            'dialogID', 'TofuAssistantDialog',
            'isModal', true,
            'title', 'Insert New Tag',
            'templateContent', assistantContentTPElem));

    //  After the dialog is showing, set the assistant parameters on the content
    //  object from those defined in the original signal's payload.
    dialogPromise.then(
        function(aDialogTPElem) {

            var contentTPElem;

            contentTPElem = aDialogTPElem.get('bodyGroup').
                                        getFirstChildElement();

            //  Pass along the insertion position and the peer element as the
            //  insertion point to the dialog info.
            contentTPElem.set('data',
                TP.hc(
                    'insertionPosition', insertionPosition,
                    'insertionPoint', insertionPointElement));
        });

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
