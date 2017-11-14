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
 * @type {TP.core.Matcher}
 */

//  ------------------------------------------------------------------------

TP.lang.Object.defineSubtype('core.Matcher');

TP.core.Matcher.isAbstract(true);

//  ------------------------------------------------------------------------
//  Type Constants
//  ------------------------------------------------------------------------

TP.core.Matcher.Type.defineConstant('MATCH_RESULT_SORT',
function(itemA, itemB) {

    var itemAEntry,
        itemBEntry,

        aLower,
        bLower;

    if (itemA.score === itemB.score) {

        //  Method matcher returns Arrays - pluck out the method
        //  name

        if (TP.isArray(itemAEntry = itemA.string)) {
            itemAEntry = itemAEntry.at(2);
        }

        if (TP.isArray(itemBEntry = itemB.string)) {
            itemBEntry = itemBEntry.at(2);
        }

        aLower = itemAEntry.toLowerCase();
        bLower = itemBEntry.toLowerCase();

        if (aLower < bLower) {
            return -1;
        } else if (aLower > bLower) {
            return 1;
        }

        return 0;
    }

    return itemB.score - itemA.score;
});

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineAttribute('input');
TP.core.Matcher.Inst.defineAttribute('$matcherName');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('init',
function(matcherName) {

    /**
     * @method init
     * @summary Initialize the instance.
     * @param {String} matcherName The name of this matcher that will be
     *     associated with the search results produced by it
     * @returns {TP.core.Matcher} The receiver.
     */

    this.callNextMethod();

    this.set('$matcherName', matcherName);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('getDataSet',
function() {

    /**
     * @method getDataSet
     * @summary Returns the data set that this matcher is operating on.
     * @returns {Object} The data set.
     */

    return TP.override();
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     */

    return TP.override();
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('generateMatchSet',
function(rawData, searchTerm, keys) {

    /**
     * @method generateMatchSet
     * @summary Generates a match set against the raw data using the supplied
     *     search term.
     * @param {Object[]} rawData The raw data to use to generate the match set.
     *     This should be an Array of text-searchable objects, such as a String
     *     or a JavaScript structure where the optional 3rd parameter is a list
     *     of keys of that structure to be searched.
     * @param {String} searchTerm The search term to be used to search the raw
     *     data.
     * @param {String[]} [keys] If the rawData is not an Array of Strings, but
     *     an Array of JavaScript structures, these keys will be used to extract
     *     the data from that structure to search.
     * @returns {Object[]} An Array of match result POJOS.
     */

    var matches,
        options,

        fuse;

    /* eslint-disable no-undef */

    options = {
        caseSensitive: true,
        includeMatches: true,
        includeScore: true,
        threshold: 0.6,
        location: 0,
        distance: 32,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: keys
    };

    fuse = new TP.extern.Fuse(rawData, options);
    matches = fuse.search(searchTerm);

    /* eslint-enable no-undef */

    return matches;
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('prepareForMatching',
function() {

    /**
     * @method prepareForMatching
     */

    return this;
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('prepareForResultProcessing',
function() {

    /**
     * @method prepareForResultProcessing
     */

    return this;
});

//  ------------------------------------------------------------------------

TP.core.Matcher.Inst.defineMethod('postProcessResult',
function() {

    /**
     * @method postProcessResult
     */

    return this;
});

//  ========================================================================
//  TP.core.ListMatcher
//  ========================================================================

TP.core.Matcher.defineSubtype('ListMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.ListMatcher.Inst.defineAttribute('$dataSet');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.ListMatcher.Inst.defineMethod('init',
function(matcherName, dataSet) {

    /**
     * @method init
     * @summary Initialize the instance.
     * @param {String} matcherName
     * @param {Object} dataSet
     * @returns {TP.core.ListMatcher} The receiver.
     */

    this.callNextMethod();

    this.set('$dataSet', dataSet);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.ListMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     */

    var dataSet,
        matcherName,
        searchTerm,

        matches;

    dataSet = this.get('$dataSet');
    matcherName = this.get('$matcherName');
    searchTerm = TP.ifInvalid(this.get('input'), '');

    if (TP.isEmpty(searchTerm)) {
        matches = TP.ac();
        dataSet.forEach(
                function(anItem) {
                    matches.push(
                        {
                            matcherName: matcherName,
                            string: anItem,
                        }
                    );
                });
    } else {
        matches = this.generateMatchSet(dataSet, searchTerm);
        matches.forEach(
                function(aMatch) {
                    aMatch.matcherName = matcherName;
                });
    }

    return matches;
});

//  ------------------------------------------------------------------------

TP.core.ListMatcher.Inst.defineMethod('setDataSet',
function(dataSet) {

    this.set('$dataSet', dataSet);

    return this;
});

//  ========================================================================
//  TP.core.CustomTypeMatcher
//  ========================================================================

TP.core.Matcher.defineSubtype('CustomTypeMatcher');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.CustomTypeMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     */

    var dataSet,
        matcherName,
        searchTerm,

        matches;

    dataSet = TP.sys.getMetadata('types').getKeys();
    matcherName = this.get('$matcherName');
    searchTerm = TP.ifInvalid(this.get('input'), '');

    matches = this.generateMatchSet(dataSet, searchTerm);
    matches.forEach(
            function(aMatch) {
                aMatch.matcherName = matcherName;
            });

    return matches;
});

//  ========================================================================
//  TP.core.KeyedSourceMatcher
//  ========================================================================

TP.core.Matcher.defineSubtype('KeyedSourceMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineAttribute('$dataSet');

TP.core.KeyedSourceMatcher.Inst.defineAttribute('keySource');
TP.core.KeyedSourceMatcher.Inst.defineAttribute('keySourceName');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineMethod('init',
function(matcherName, keySource) {

    /**
     * @method init
     * @summary Initialize the instance.
     * @param {String} matcherName
     * @param {Object} keySource
     * @returns {TP.core.KeyedSourceMatcher} The receiver.
     */

    this.callNextMethod();

    this.set('keySource', keySource);
    this.set('keySourceName', TP.name(keySource));

    return this;
});

//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     */

    var dataSet,
        matcherName,
        searchTerm,

        matches,

        keySourceName;

    dataSet = this.get('$dataSet');
    matcherName = this.get('$matcherName');
    searchTerm = TP.ifInvalid(this.get('input'), '');

    keySourceName = this.get('keySourceName');

    if (TP.isEmpty(searchTerm)) {
        matches = TP.ac();
        dataSet.forEach(
                function(aKey) {
                    matches.push(
                        {
                            matcherName: matcherName,
                            string: aKey,
                            prefix: keySourceName + '.'
                        }
                    );
                });
    } else {
        matches = this.generateMatchSet(dataSet, searchTerm);
        matches.forEach(
                function(aMatch) {
                    aMatch.matcherName = matcherName;
                    aMatch.prefix = keySourceName + '.';
                });
    }

    return matches;
});

//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineMethod('prepareForMatching',
function() {

    /**
     * @method prepareForMatch
     */

    var keySource,
        dataSet,

        wantsProtoChain;

    keySource = this.get('keySource');

    if (TP.isNativeType(keySource)) {
        dataSet = TP.interface(keySource.prototype, TP.SLOT_FILTERS.attributes);
    } else {
        if (TP.canInvoke(keySource, 'getType')) {
            if (TP.isNativeType(keySource.getType())) {
                wantsProtoChain = true;
            } else {
                wantsProtoChain = false;
            }
        } else {
            //  All TIBET objects respond to 'getType', so if it can't, it's a
            //  native object that we definitely want all prototype properties
            //  of.
            wantsProtoChain = true;
        }

        dataSet = TP.keys(this.get('keySource'), true, wantsProtoChain);
    }

    dataSet.sort();

    this.set('$dataSet', dataSet);

    return this;
});

//  ------------------------------------------------------------------------

TP.core.KeyedSourceMatcher.Inst.defineMethod('setDataSet',
function(dataSet) {

    this.set('$dataSet', dataSet);

    return this;
});

//  ========================================================================
//  TP.core.URIMatcher
//  ========================================================================

TP.core.Matcher.defineSubtype('URIMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.URIMatcher.Inst.defineAttribute('keySource');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.URIMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     */

    var dataSet,
        matcherName,
        searchTerm,

        matches;

    dataSet = TP.core.URI.Type.get('instances').getKeys();
    matcherName = this.get('$matcherName');
    searchTerm = TP.ifInvalid(this.get('input'), '');

    matches = this.generateMatchSet(dataSet, searchTerm);
    matches.forEach(
            function(aMatch) {
                aMatch.matcherName = matcherName;
            });

    return matches;
});

//  ========================================================================
//  TP.core.MethodMatcher
//  ========================================================================

TP.core.Matcher.defineSubtype('MethodMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.MethodMatcher.Inst.defineAttribute('$dataSet');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.MethodMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     */

    var dataSet,
        matcherName,
        searchTerm,

        matches;

    dataSet = this.get('$dataSet');
    matcherName = this.get('$matcherName');
    searchTerm = TP.ifInvalid(this.get('input'), '');

    matches = this.generateMatchSet(dataSet, searchTerm);

    matches.forEach(
            function(aMatch) {
                aMatch.matcherName = matcherName;
                aMatch.suffix = ' (' + aMatch.string.at(0) + ')';
            });

    return matches;
});

//  ------------------------------------------------------------------------

TP.core.MethodMatcher.Inst.defineMethod('prepareForMatching',
function() {

    /**
     * @method prepareForMatch
     */

    var keys,
        dataSet;

    keys = TP.sys.getMetadata('methods').getKeys();

    dataSet = TP.ac();

    keys.forEach(
            function(aKey) {
                //  This pushes method data in as: [owner, track, name]
                dataSet.push(aKey.split('_'));
            });

    this.set('$dataSet', dataSet);

    return this;
});

//  ========================================================================
//  TP.core.NamespaceMatcher
//  ========================================================================

TP.core.Matcher.defineSubtype('NamespaceMatcher');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.NamespaceMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     */

    return TP.ac();
});

//  ========================================================================
//  TP.core.TSHHistoryMatcher
//  ========================================================================

TP.core.Matcher.defineSubtype('TSHHistoryMatcher');

//  ------------------------------------------------------------------------
//  Instance Attributes
//  ------------------------------------------------------------------------

TP.core.TSHHistoryMatcher.Inst.defineAttribute('$dataSet');

//  ------------------------------------------------------------------------
//  Instance Methods
//  ------------------------------------------------------------------------

TP.core.TSHHistoryMatcher.Inst.defineMethod('match',
function() {

    /**
     * @method match
     */

    var dataSet,
        matcherName,
        searchTerm,

        matches;

    dataSet = this.get('$dataSet');
    matcherName = this.get('$matcherName');
    searchTerm = TP.ifInvalid(this.get('input'), '');

    matches = this.generateMatchSet(
                        dataSet,
                        searchTerm);

    matches.forEach(
            function(aMatch) {
                aMatch.matcherName = matcherName;
            });

    return matches;
});

//  ------------------------------------------------------------------------

TP.core.TSHHistoryMatcher.Inst.defineMethod('prepareForMatching',
function() {

    /**
     * @method prepareForMatch
     */

    var dataSet;

    dataSet = TP.bySystemId('TSH').getHistory().collect(
                function(item) {
                    return item.at('cmd');
                });

    this.set('$dataSet', dataSet);

    return this;
});

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
