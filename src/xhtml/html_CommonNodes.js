//  ========================================================================
/*
NAME:   html_CommonNodes.js
AUTH:   Scott Shattuck (ss)
NOTE:   Copyright (C) 1999-2009 Technical Pursuit Inc., All Rights
        Reserved. Patent Pending, Technical Pursuit Inc.

        Unless explicitly acquired and licensed under the Technical
        Pursuit License ("TPL") Version 1.5, the contents of this file
        are subject to the Reciprocal Public License ("RPL") Version 1.5
        and You may not copy or use this file in either source code or
        executable form, except in compliance with the terms and
        conditions of the RPL.

        You may obtain a copy of both the TPL and RPL (the "Licenses")
        from Technical Pursuit Inc. at http://www.technicalpursuit.com.

        All software distributed under the Licenses is provided strictly
        on an "AS IS" basis, WITHOUT WARRANTY OF ANY KIND, EITHER
        EXPRESS OR IMPLIED, AND TECHNICAL PURSUIT INC. HEREBY DISCLAIMS
        ALL SUCH WARRANTIES, INCLUDING WITHOUT LIMITATION, ANY
        WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE,
        QUIET ENJOYMENT, OR NON-INFRINGEMENT. See Licenses for specific
        language governing rights and limitations under the Licenses.

*/
//  ------------------------------------------------------------------------

/**
 * @description The following types aren't strict XHTML "entities" as defined in
 *     the XTHML DTD but they form a useful framework for attribute inheritance.
 *     TIBET's XHTML node types inherit from appropriate points in this
 *     hierarchy. To improve reuse where necessary, multiple inheritance is used
 *     to further reduce code size.
 * @subject XHTML common node supertypes
 * @todo
 */

//  ========================================================================
//  XHTML "base" types
//  ========================================================================

//  can't construct concrete instances of any of these types

TP.core.UIElementNode.defineSubtype('html:CoreAttrs');

//  A subtype of TP.core.UIElement that has 4 common attributes:
//  id, class, style, title
TP.html.CoreAttrs.addTraitsFrom(TP.html.Element);
TP.html.CoreAttrs.isAbstract(true);

TP.html.CoreAttrs.Type.resolveTraits(
        TP.ac('tagCompile', 'canConnectFrom', 'canConnectTo',
                'isValidConnectorDest', 'isValidConnectorSource'),
        TP.html.Element);

TP.html.CoreAttrs.Inst.resolveTraits(
        TP.ac('getDisplayValue', 'setDisplayValue'),
        TP.html.Element);

TP.core.UIElementNode.defineSubtype('html:Attrs');
TP.html.Attrs.addTraitsFrom(TP.html.Element);
TP.html.Attrs.isAbstract(true);

TP.html.Attrs.Type.resolveTraits(
        TP.ac('tagCompile', 'canConnectFrom', 'canConnectTo',
                'isValidConnectorDest', 'isValidConnectorSource'),
        TP.html.Element);

TP.html.Attrs.Inst.resolveTraits(
        TP.ac('getDisplayValue', 'setDisplayValue'),
        TP.html.Element);

TP.html.Attrs.defineSubtype('Aligned');
TP.html.Aligned.isAbstract(true);

TP.html.Attrs.defineSubtype('Focused');
TP.html.Focused.isAbstract(true);

TP.html.Attrs.defineSubtype('Citation');
TP.html.Citation.isAbstract(true);

TP.html.Attrs.defineSubtype('List');
TP.html.List.isAbstract(true);

//  ------------------------------------------------------------------------

TP.html.List.Type.defineMethod('generateMarkup',
function(anObject, attrStr, itemFormat, shouldAutoWrap,
formatArgs, theRequest        ) {

    /**
     * @name generateMarkup
     * @synopsis Generates markup for the supplied Object using the other
     *     parameters supplied.
     * @param {Object} anObject The Object of content to wrap in markup.
     * @param {String} attrStr The String containing either the literal
     *     attribute markup or a 'template invocation' that can be used inside
     *     of a template.
     * @param {String} itemFormat The name of an 'item format', either a tag
     *     name (which defaults to the 'item tag name' of this type) or some
     *     other format type which can be applied to this type.
     * @param {Boolean} shouldAutoWrap Whether or not the markup generation
     *     machinery should 'autowrap' items of the supplied object (each item
     *     in an Array or each key/value pair in an Object).
     * @param {TP.lang.Hash} formatArgs The 'formatting arguments' used by this
     *     machinery to generate item markup.
     * @param {TP.sig.Request|TP.lang.Hash} theRequest An optional object
     *     containing parameters.
     * @returns {String} The markup generated by taking the supplied Object and
     *     iterating over its items.
     * @todo
     */

    var tagName,
        template,
        str;

    //  If the object is an Array, then just skip to the bottom of the
    //  method.
    if (TP.isArray(anObject)) {

    } else if (TP.isTrue(shouldAutoWrap) && TP.isTrue(theRequest.at('repeat'))) {
        //  Otherwise, if we're autowrapping and repeating, the object that
        //  will be handed to the iteration mechanism will be [key,value]
        //  pairs, so we can use that fact to generate item tags around each
        //  one.

        tagName = this.getTagName();

        //  Build a template by joining the tag name with an invocation
        //  of the itemFormat for both the key and the value.
        template = TP.join('<', tagName, attrStr, '>',
                            '{{0%%', itemFormat, '}}',
                            '{{1%%', itemFormat, '}}',
                            '</', tagName, '>');

        //  Perform the transformation.
        str = template.transform(anObject, theRequest);

        return str;
    }

    //  It was either an Array or we weren't autowrapping and repeating. In
    //  that case, just call up the supertype chain and return the value.
    return this.callNextMethod();
});

//  ------------------------------------------------------------------------

TP.html.List.Type.defineMethod('getItemTagName',
function() {

    /**
     * @name getItemTagName
     * @synopsis Returns the 'default item tag name' for use it the
     *     fromArray()/fromObject() methods.
     * @returns {String} The ID of the observer.
     * @todo
     */

    return 'html:li';
});

//  ------------------------------------------------------------------------

TP.html.List.Type.defineMethod('shouldAutoWrapItems',
function(anObject, formatArgs) {

    /**
     * @name shouldAutoWrapItems
     * @synopsis Whether or not our fromArray() / fromObject() methods
     *     'auto-wrap items'. See those methods for more information.
     * @param {Object} anObject The Object of content to wrap in markup.
     * @param {TP.lang.Hash} formatArgs An optional object containing
     *     parameters.
     * @returns {Boolean} Whether or not we automatically wrap items.
     * @todo
     */

    if (TP.isBoolean(formatArgs.at('autowrap'))) {
        return formatArgs.at('autowrap');
    }

    //  An TP.html.List's default is to *not* wrap each item of an Array in
    //  its own tags (maybe each one goes in an 'html:li').
    if (TP.isArray(anObject)) {
        return false;
    }

    return true;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
