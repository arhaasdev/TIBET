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
 * @type {TP.xctrls.splitbar}
 * @summary Manages splitbar XControls.
 */

//  ------------------------------------------------------------------------

TP.core.UIElementNode.defineSubtype('xctrls:splitbar');

TP.xctrls.splitbar.addTraits(TP.xctrls.Element, TP.core.TemplatedNode);

//  ------------------------------------------------------------------------
//  Type Attributes
//  ------------------------------------------------------------------------

TP.xctrls.splitbar.Type.defineAttribute('opaqueSignalNames',
        TP.ac('TP.sig.DOMDragMove'));

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.xctrls.splitbar.Inst.defineMethod('getDisplayValue',
function() {

    /**
     * @method getDisplayValue
     * @summary Gets the display, or visual, value of the receiver's node. This
     *     is the value the HTML, or other UI tag, is actually displaying to the
     *     user at the moment.
     * @returns {Object} The visual value of the receiver's UI node.
     */

    var offsetParentSize,

        barPosition,

        percentage;

    //  TODO: Right now we assume a vertical orientation.

    offsetParentSize = this.getOffsetParent().getHeight();
    barPosition = this.getOffsetPoint().getY();

    percentage = barPosition / offsetParentSize;

    return percentage;
});

//  ------------------------------------------------------------------------

TP.xctrls.splitbar.Inst.defineMethod('handleDOMDragMove',
function(aSignal) {

    /**
     * @method handleDOMDragMove
     * @summary This method is invoked as the splitbar is dragged. It notifies
     *     any observers that the splitbar's value has changed.
     * @param {TP.sig.DOMDragMove} aSignal The signal that caused this handler
     *     to trip.
     */

    if (this.shouldSignalChange()) {
        this.changed('value', TP.UPDATE);
    }

    return;
});

//  ------------------------------------------------------------------------

TP.xctrls.splitbar.Inst.defineMethod('setDisplayValue',
function(aValue) {

    /**
     * @method setDisplayValue
     * @summary Sets the display, or visual, value of the receiver's node. The
     *     value provided to this method is typically already formatted using
     *     the receiver's display formatters (if any). You don't normally call
     *     this method directly, instead call setValue() and it will ensure
     *     proper display formatting.
     * @param {Object} aValue The value to set.
     * @returns {TP.xctrls.splitbar} The receiver.
     */

    var barElem,

        offsetParentSize,
        newPosition;

    if (!TP.isNumber(newPosition = aValue.asNumber())) {
        //  TODO: Throw an exception
        return;
    }

    //  TODO: Right now we assume a vertical orientation.

    barElem = this.getNativeNode();

    offsetParentSize = this.getOffsetParent().getHeight();
    newPosition = newPosition * offsetParentSize;

    TP.elementGetStyleObj(barElem).top = newPosition + 'px';

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
