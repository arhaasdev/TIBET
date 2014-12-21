//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

/*
Supports general purpose object acquisition by ID including support for
registration of objects under a public identifier independent of their
internal OID. This multi-layer registration allows common public names to
be used across frames as individual pages come and go along with their
underlying objects.
*/

//  ------------------------------------------------------------------------
//  OBJECT REGISTRATION
//  ------------------------------------------------------------------------

/*
To avoid certain problems with garbage collection it's often desirable to
store object references in string form rather than as true references. This
is essentially how the DOM works. You have an ID string to some FORM
element and the DOM gives you back that element when you ask. TIBET allows
the same operation to occur for regular objects. Of course, until we get
weak references in JavaScript our version will cause GC issues and will
leak slowly if you don't clean up after yourself. It's provided mainly for
two purposes. First, it helps with certain long-lived objects across frames
and second it's a great way to help with debugging cycles. Be careful with
it though since it can create leaks if you don't clean up after yourself
over time.
*/

//  ------------------------------------------------------------------------

TP.sys.defineMethod('getObjectById',
function(anID, regOnly, nodeContext) {

    /**
     * @name getObjectById
     * @synopsis Returns a reference to the object with the ID provided. The
     *     'id' in this method can be anything from a uri to a typename, from a
     *     generated ID to an "access path". Logic within this routine and the
     *     various URI types is used to do most of the traversal when the ID
     *     appears to be a path.
     * @description This is a core method for TIBET which is used to locate
     *     elements, event handlers, and other objects in a variety of cases.
     *     It's a fairly complex method since it tries to make the lookup
     *     process thorough, but as quick as possible. The search starts with
     *     registrations via registerObject so you can always "override" the
     *     remaining lookup process by simply registering an object to speed up
     *     the lookup. Type names are the next choice since finding a type is a
     *     very common operation (although it's even faster to simply call
     *     TP.sys.getTypeByName()). URI resolution is another component of this
     *     method, if the ID forms a proper URI, however the actual object
     *     location logic in that case is often found in the getResource method
     *     of the specific URI subtype.
     * @param {String} anID The id to look up.
     * @param {Boolean} regOnly Should lookup stop with registered objects?
     * @param {Window|Node} nodeContext An optional window or node specification
     *     to use for resolution when no other reference is found. Default is
     *     the current canvas.
     * @returns {Object} Typically a TIBET object (meaning nodes are wrapped in
     *     TP.core.Node instances etc) to maintain encapsulation for as long as
     *     possible.
     * @todo
     */

    var bits,
        oref,
        idot,
        win,
        inst,
        parts,
        url,
        id,
        winid,
        key,
        index,
        type,
        reg;

    TP.stop('break.gobi');

    //  make sure it's something we can manipulate
    if (TP.isEmpty(anID)) {
        return;
    }

    //  map to local var for IE since we may change the value and IE
    //  doesn't like it when you try to alter a non-null parameter value
    id = TP.str(anID);

    if (TP.isType(inst = TP.sys.getTypeByName(id))) {
        return inst;
    }

    //  If a TIBET URN can be made from the ID and it has a real resource
    //  object, then return that.
    if (TP.regex.TIBET_URN.test(id)) {
        if (TP.isValid(inst = TP.uc(id).getResource())) {
            return inst;
        }
    }

    //  Try to make a TIBET URN from the ID and, if it has a real resource
    //  object, then return that.
    if (TP.regex.TIBET_URN.test(TP.TIBET_URN_PREFIX + id)) {
        if (TP.isValid(inst = TP.uc(TP.TIBET_URN_PREFIX + id).getResource())) {
            return inst;
        }
    }

    //  if we're not told differently don't stop with registered objects
    reg = TP.notValid(regOnly) ? false : regOnly;

    if (TP.regex.VALID_TYPENAME.test(id)) {
        //  check for type names as our second priority. note the flag here
        //  is controlled by whether we're checking registrations only.
        //  what that's implying in this case is that we'll only return the
        //  type if it's already loaded when we're asked to stop with
        //  registration checks only (reg = true means fault = false)
        if (TP.isValid(inst = TP.sys.getTypeByName(id, !reg))) {
            return inst;
        }
    }

    //  Note that we check first to see if an Element has the ID (if a node
    //  context was supplied. If one was supplied, then we don't bother looking
    //  for windows. In fact, if the name we're looking for also matches a
    //  Window slot, and that points to a Window (i.e. 'content' in HTML5
    //  Window objects), that value will be returned and we don't want that..

    //  we'll also consider windows to be "registered" objects by
    //  id/name, but we filter with a regex so we don't waste time here
    if (TP.regex.VALID_WINDOWNAME.test(id)) {
        if (TP.isNode(nodeContext)) {
            inst = TP.nodeGetElementById(nodeContext, id);
        }
        if (TP.notValid(inst) && TP.isWindow(inst = TP.sys.getWindowById(id))) {
            return TP.tpwin(inst);
        }
    }

    //  if we were asked to stop with a registration-only check then stop.
    //  THIS IS CRITICAL, since some operations, particularly URI lookups,
    //  will check registrations before doing more work. If we don't honor
    //  this stop request recursions can occur.
    if (reg) {
        return;
    }

    //  anything that looks like a URI can be processed next since the test
    //  is pretty quick, and doing it now helps avoid confusion with later
    //  tests looking for dot-separated window/object paths
    if ((id.indexOf('~') === 0) ||
            TP.regex.HAS_SCHEME.test(id) ||
            TP.regex.JS_SCHEME.test(id)) {
        //  if we're not looking at a barename we need to check for a
        //  URI-style ID and see if we can locate the data using a URI. note
        //  that this may cause the URI to call back to this routine with
        //  portions of the URI string. also note that we have an explicit
        //  forward slash here to avoid problems with references to
        //  namespace-qualified elements but we have to watch out for
        //  javascript uri entries
        if (TP.isURI(url = TP.uc(id))) {
            //  NOTE that this call means that URIs should be very careful
            //  not to re-invoke getObjectById without at least altering the
            //  actual ID being requested or we'll recurse
            inst = url.getResource(TP.hc('async', false,
                                        'resultType', TP.WRAP));

            if (TP.isNode(inst)) {
                //  try to force types to come in for creation
                if (TP.isType(type = TP.core.Node.getConcreteType(inst))) {
                    return type.construct(inst);
                }
            } else if (TP.isWindow(inst)) {
                return TP.core.Window.construct(inst);
            } else {
                return inst;
            }
        } else {
            //  problem. looks like a URI since there's a colon but no match
            //  on type name (they're registered and would have been found
            //  earlier) and no URI was able to be constructed
            TP.ifWarn() ?
                TP.warn('Unable to construct URI for object reference: ' +
                            id,
                        TP.LOG) : 0;

            return;
        }
    }

    //  also common to look for an ID in a window, so check that by looking
    //  for anything that includes a fragment identifier (#). these are
    //  somewhat common in handlers where a leading # is used to help ensure
    //  proper recognition of the reference as a barename/pointer
    if (TP.regex.ELEMENT_ID.test(id)) {
        //  likely window#id since it didn't look like a URI above
        parts = TP.regex.ELEMENT_ID.match(id);
        inst = TP.sys.getWindowById(parts.at(1));
        if (TP.isWindow(inst)) {
            if (parts.at(2) === 'document') {
                return TP.tpdoc(inst.document);
            } else {
                inst = TP.nodeGetElementById(inst.document, parts[2]);
                if (TP.isNode(inst)) {
                    return TP.tpnode(inst);
                }
            }
        }
    }

    //  if it wasn't a valid URI it may be some form of window reference or
    //  a reference for an element in a particular window
    if (TP.regex.HAS_PERIOD.test(id)) {
        //  sometimes we'll still have a leading # due to object naming
        if (id.indexOf('#') === 0) {
            //  if there were periods in the segment we assume a global ID
            //  and just take off the leading # (which is optional in that
            //  case anyway) and let it fall through to the ID acquisition
            id = id.slice(1);
        }

        //  first question is are we referring to a window and is it cached?
        if (TP.isWindow(win = TP.core.Window.getWindowInfo(id, 'tpWindow'))) {
            return win;
        }

        //  other option is that it might be a window we haven't wrapped yet
        //  so we'll do that check as well
        if (TP.isWindow(win = TP.sys.getWindowById(id))) {
            return TP.core.Window.construct(win);
        }

        //  not a window, but perhaps an element in one...
        idot = id.lastIndexOf('#');

        if (idot > -1) {
            winid = id.slice(0, idot);

            //  if we can't find a window with that ID then we're looking
            //  at an access path which we have to process more iteratively
            if (TP.notValid(win = TP.sys.getWindowById(winid))) {
                bits = id.split('.');
                index = 0;
                inst = TP.byOID(bits.at(index));

                while (TP.isValid(inst) && index < bits.getSize()) {
                    index++;
                    key = bits.at(index);

                    if (TP.canInvoke(inst, 'get')) {
                        inst = inst.get(key);
                    } else {
                        inst = inst[key];
                    }
                }

                if (TP.isValid(inst)) {
                    return inst;
                }
            } else {
                //  window was valid? then just use it and update ID to be a
                //  local ID in that window...
                id = id.slice(idot + 1);
            }
        }
    }

    //  event references will sometimes use # as a prefix for ids in
    //  which case they're referring to an ID in the current document.
    //  these are normally expanded into global IDs by the content
    //  pipeline but when they aren't we have to clean them up
    if (id.indexOf('#') === 0) {
        //  we'll need to trim off the leading # so we can do the lookup
        id = id.slice(1);
    }

    //  if we already were assigned a window reference because of earlier
    //  logic we'll stick with that one, otherwise we default to either the
    //  current canvas
    if (!TP.isWindow(win)) {
        win = TP.unwrap(nodeContext);
        if (!TP.isWindow(win)) {
            if (TP.isNode(nodeContext)) {
                win = TP.nodeGetWindow(nodeContext);
            } else {
                win = TP.ifInvalid(
                        TP.sys.getWindowById(TP.sys.getUICanvasName()),
                        window);
            }
        }
    }

    //  .document and .#document are often used to get document handles so
    //  check for that next to avoid lookup overhead below
    if (id === 'document') {
        return TP.core.Document.construct(win.document);
    }

    //  not the document, perhaps an element in the document
    if (TP.isElement(inst = TP.nodeGetElementById(win.document, id))) {
        if (TP.isType(type = TP.core.Node.getConcreteType(inst))) {
            return type.construct(inst);
        }
    } else {
        //  might be a window slot (even though that's nasty)
        try {
            if (TP.isValid(inst = win[oref])) {
                //  try to maintain wrappers
                if (TP.isWindow(inst)) {
                    return TP.core.Window.construct(inst);
                } else if (TP.isDocument(inst)) {
                    return TP.core.Document.construct(inst);
                }

                return inst;
            }
        } catch (e) {
            TP.ifError() ?
                TP.error(TP.ec(e,
                            'Error accessing window slot at: ' + id + '. '),
                            TP.LOG) : 0;
        }
    }

    return;
});

//  ------------------------------------------------------------------------

TP.sys.defineMethod('hasRegistered',
function(anObj, anID) {

    /**
     * @name hasRegistered
     * @synopsis Checks for the object in the public registry under its ID.
     * @param {Object} anObj The object to check on. When null the test is
     *     simply whether any object is registered under the ID, otherwise the
     *     test is whether that particular object is registered under the ID
     *     provided.
     * @param {String} anID An optional ID to use instead of the object's
     *     internal ID.
     * @returns {Boolean} Whether or not the object was registered.
     * @todo
     */

    if (TP.isEmpty(anID)) {
        return false;
    }

    //  If a TIBET URN can be made from the ID and it has a real resource
    //  object, then return that.
    if (TP.regex.TIBET_URN.test(anID)) {
        if (TP.isValid(TP.uc(anID).getResource())) {
            return true;
        }
    }

    //  Try to make a TIBET URN from the ID and, if it has a real resource
    //  object, then return that.
    if (TP.regex.TIBET_URN.test(TP.TIBET_URN_PREFIX + anID)) {
        if (TP.isValid(TP.uc(TP.TIBET_URN_PREFIX + anID).getResource())) {
            return true;
        }
    }

    return false;
});

//  ------------------------------------------------------------------------

TP.sys.defineMethod('registerObject',
function(anObj, anID, forceRegistration) {

    /**
     * @name registerObject
     * @synopsis Places the object into the public registry under its ID.
     * @param {Object} anObj The object to register.
     * @param {String} anID An optional ID to use instead of the object's
     *     internal ID.
     * @param {Boolean} forceRegistration True to skip type-level checks and
     *     force the object to be registered.
     * @returns {Boolean} Whether or not the object was registered.
     * @todo
     */

    var id,
        obj,
        anObjType;

    if (TP.notValid(anObj)) {
        return false;
    }

    //  If the object is a type, then it can be found by using it's global name,
    //  either literally or via a URI or via the TP.sys.getTypeByName() call
    //  (which is what the TP.sys.getObjectById() call above uses).
    if (TP.isType(anObj)) {
        return false;
    }

    //  A URI can be found directly by using the TP.uc() call and its registry.
    if (TP.isKindOf(anObj, TP.core.URI)) {
        return false;
    }

    //  some object registrations (particularly those with IDs that are set
    //  as parameters here) can be forced regardless of the type's wishes
    if (TP.notTrue(forceRegistration)) {
        if (TP.canInvoke(anObj, 'getType') &&
            TP.isType(anObjType = anObj.getType()) &&
            TP.canInvoke(anObjType, 'shouldRegisterInstances')) {
            if (!anObjType.shouldRegisterInstances()) {
                return false;
            }
        }
    }

    if (!TP.canInvoke(anObj, 'getID')) {
        //  no way to get an ID? then the object itself is the key
        id = TP.ifInvalid(anID, anObj);
    } else {
        id = TP.ifInvalid(anID, anObj.getID());
    }

    //  If the ID is already a URI, then it can already be looked up without
    //  having to register it under a TIBET URN.
    if (TP.isURI(id)) {
        return false;
    }

    if (TP.regex.TIBET_URN.test(id)) {
        TP.ifError() ?
            TP.error('Trying to register object whose ID is already a URN: ' +
                        id,
                        TP.LOG) : 0;

        return false;
    }

    //  Create a TIBET URN to store the object
    TP.uc(TP.TIBET_URN_PREFIX + id).setResource(anObj);

    if (TP.isValid(obj)) {
        id.signal('TP.sig.IdentityChange');
    }

    return true;
});

//  ------------------------------------------------------------------------

TP.definePrimitive('register', TP.sys.registerObject);

//  ------------------------------------------------------------------------

TP.sys.defineMethod('unregisterObject',
function(anObj, anID) {

    /**
     * @name unregisterObject
     * @synopsis Removes public registration for the object provided. This
     *     operation should be called RELIGIOUSLY to avoid memory leaks if
     *     objects are registered.
     * @param {Object} anObj The object to un-register.
     * @param {String} anID An optional ID to use instead of the object's
     *     internal ID.
     * @returns {Boolean} Whether or not the object was unregistered.
     * @todo
     */

    var id,
        urn;

    if (TP.isString(anID)) {
        id = anID;
    } else if (TP.isValid(anObj)) {
        id = anObj.getID();
    }

    if (!TP.isURI(urn = TP.uc(TP.uc(TP.TIBET_URN_PREFIX + id)))) {
        return false;
    }

    urn.clearCaches();
    TP.core.URI.removeInstance(urn);

    //  fail quietly
    return true;
});

//  ------------------------------------------------------------------------

TP.definePrimitive('unregister', TP.sys.unregisterObject);

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
