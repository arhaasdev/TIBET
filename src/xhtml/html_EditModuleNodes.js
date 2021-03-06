//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ------------------------------------------------------------------------

//  ========================================================================
//  TP.html.del
//  ========================================================================

/**
 * @type {TP.html.del}
 * @summary 'del' tag. Denotes deleted content.
 */

//  ------------------------------------------------------------------------

TP.html.Citation.defineSubtype('del');

TP.html.del.Type.set('uriAttrs', TP.ac('cite'));

//  ========================================================================
//  TP.html.ins
//  ========================================================================

/**
 * @type {TP.html.ins}
 * @summary 'ins' tag. Insertion tag.
 */

//  ------------------------------------------------------------------------

TP.html.Citation.defineSubtype('ins');

TP.html.ins.Type.set('uriAttrs', TP.ac('cite'));

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
