//  ========================================================================
/**
 * @file TP.core.DataObservation_Tests.js
 * @overview
 * @author William J. Edney (wje)
 * @copyright Copyright (C) 1999-2014 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     open source waivers to keep your derivative work source code private.
 */
//  ------------------------------------------------------------------------

TP.core.ComplexTIBETPath.Inst.describe('TP.core.ComplexTIBETPath Inst path change signaling',
function() {

    var modelObj,
        jsonObsFunction,

        pathHash,

        jsonPath1,
        jsonPath2,
        jsonPath3,
        jsonPath4,
        jsonPath5,
        jsonPath6,
        jsonPath7;

    this.before(function() {
        modelObj = TP.json2js('{"foo":["1st","2nd",{"hi":"there"}]}');

        jsonObsFunction =
                function (aSignal) {
                    pathHash = aSignal.at(TP.CHANGE_PATHS);
            };

        jsonObsFunction.observe(modelObj, 'ValueChange');

        //  Set up this path just to observe
        jsonPath1 = TP.apc('foo');
        jsonPath1.executeGet(modelObj);
    });

    this.it('change along a single path', function(test, options) {

        jsonPath2 = TP.apc('foo.3.bar');
        jsonPath2.set('shouldMake', true);

        jsonPath2.executeSet(modelObj, 'goo', true);

        //  The path hash should have the path for jsonPath2
        test.assert.contains(pathHash, jsonPath2.get('srcPath'));

        //  But *not* for jsonPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, jsonPath1.get('srcPath'));
    });

    this.it('change along a branching path', function(test, options) {

        jsonPath3 = TP.apc('foo.3.[bar,moo,too].roo');
        jsonPath3.set('shouldMake', true);

        jsonPath3.executeSet(modelObj, TP.ac(), true);

        //  The path hash should have the path for jsonPath3
        test.assert.contains(pathHash, jsonPath3.get('srcPath'));

        //  And for jsonPath2 (because we had 'shouldMake' turned on and we
        //  replaced the value at 'foo.3.bar' with an Object to hold the 'roo'
        //  value)
        test.assert.contains(pathHash, jsonPath2.get('srcPath'));

        //  But *not* for jsonPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, jsonPath1.get('srcPath'));
    });


    this.it('change of an end aspect of a branching path', function(test, options) {

        jsonPath4 = TP.apc('foo.3.bar.roo');
        jsonPath4.executeGet(modelObj);

        jsonPath5 = TP.apc('foo.3.moo.roo');

        jsonPath5.executeSet(modelObj);

        //  The path hash should have the path for jsonPath5
        test.assert.contains(pathHash, jsonPath5.get('srcPath'));

        //  But *not* for jsonPath4 (it's at a similar level in the chain, but
        //  on a different branch)
        test.refute.contains(pathHash, jsonPath4.get('srcPath'));

        //  The path hash should have the path for jsonPath3
        test.assert.contains(pathHash, jsonPath3.get('srcPath'));

        //  But *not* for jsonPath2 (it's too high up in the chain)
        test.refute.contains(pathHash, jsonPath2.get('srcPath'));

        //  And *not* for jsonPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, jsonPath1.get('srcPath'));
    });

    this.it('change of a parent aspect of a branching path', function(test, options) {

        jsonPath6 = TP.apc('foo.3');

        jsonPath6.executeSet(modelObj, 'fluffy', true);

        //  The path hash should have the path for jsonPath6
        test.assert.contains(pathHash, jsonPath6.get('srcPath'));

        //  And for jsonPath5 (because it's ancestor's structure changed)
        test.assert.contains(pathHash, jsonPath5.get('srcPath'));

        //  And for jsonPath4 (because it's ancestor's structure changed)
        test.assert.contains(pathHash, jsonPath4.get('srcPath'));

        //  And for jsonPath3 (because it's ancestor's structure changed)
        test.assert.contains(pathHash, jsonPath3.get('srcPath'));

        //  And for jsonPath2 (because it's ancestor's structure changed)
        test.assert.contains(pathHash, jsonPath2.get('srcPath'));

        //  But *not* for jsonPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, jsonPath1.get('srcPath'));
    });

    this.it('change of another parent aspect of a branching path', function(test, options) {

        jsonPath7 = TP.apc('foo.2');
        jsonPath7.set('shouldMake', true);

        jsonPath7.executeSet(modelObj, TP.ac(), true);

        //  The path hash should have the path for jsonPath7
        test.assert.contains(pathHash, jsonPath7.get('srcPath'));

        //  But *not* for jsonPath6 (it's at a similar level in the chain, but
        //  on a different branch)
        test.refute.contains(pathHash, jsonPath6.get('srcPath'));

        //  And *not* for jsonPath5 (it's at a similar level in the chain, but
        //  on a different branch)
        test.refute.contains(pathHash, jsonPath5.get('srcPath'));

        //  And *not* for jsonPath4 (it's at a similar level in the chain, but
        //  on a different branch)
        test.refute.contains(pathHash, jsonPath4.get('srcPath'));

        //  And *not* for jsonPath3 (it's at a similar level in the chain, but
        //  on a different branch)
        test.refute.contains(pathHash, jsonPath3.get('srcPath'));

        //  And *not* for jsonPath2 (it's at a similar level in the chain, but
        //  on a different branch)
        test.refute.contains(pathHash, jsonPath2.get('srcPath'));

        //  And *not* for jsonPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, jsonPath1.get('srcPath'));
    });

    this.it('change model to a whole new object', function(test, options) {
        jsonPath1.set('shouldMake', true);

        //  Set everything under 'foo' to a new data structure
        jsonPath1.executeSet(modelObj, TP.json2js('["A","B","C","D"]'), true);

        //  All paths will have changed

        //  The path hash should have the path for jsonPath7
        test.assert.contains(pathHash, jsonPath7.get('srcPath'));

        //  And for jsonPath6
        test.assert.contains(pathHash, jsonPath6.get('srcPath'));

        //  And for jsonPath5
        test.assert.contains(pathHash, jsonPath5.get('srcPath'));

        //  And for jsonPath4
        test.assert.contains(pathHash, jsonPath4.get('srcPath'));

        //  And for jsonPath3
        test.assert.contains(pathHash, jsonPath3.get('srcPath'));

        //  And for jsonPath2
        test.assert.contains(pathHash, jsonPath2.get('srcPath'));

        //  And for jsonPath1
        test.assert.contains(pathHash, jsonPath1.get('srcPath'));
    });

    this.it('change along a single path for the new object', function(test, options) {
        jsonPath6.executeSet(modelObj, 'fluffy', true);

        //  The path has should *not* have the path for jsonPath7 (it's at a
        //  similar level in the chain, but on a different branch)
        test.refute.contains(pathHash, jsonPath7.get('srcPath'));

        //  The path hash should have the path for jsonPath6
        test.assert.contains(pathHash, jsonPath6.get('srcPath'));

        //  And for jsonPath5
        test.assert.contains(pathHash, jsonPath5.get('srcPath'));

        //  And for jsonPath4
        test.assert.contains(pathHash, jsonPath4.get('srcPath'));

        //  And for jsonPath3
        test.assert.contains(pathHash, jsonPath3.get('srcPath'));

        //  And for jsonPath2
        test.assert.contains(pathHash, jsonPath2.get('srcPath'));

        //  And *not* for jsonPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, jsonPath1.get('srcPath'));
    });

    this.after(function() {
        jsonObsFunction.ignore(modelObj, 'ValueChange');
    });
});

TP.core.XPathPath.Inst.describe('TP.core.XPathPath Inst path change signaling',
function() {

    var modelObj,
        xmlObsFunction,

        pathHash,

        xmlPath1,
        xmlPath2,
        xmlPath3,
        xmlPath4,
        xmlPath5,
        xmlPath6;

    this.before(function() {
        modelObj = TP.tpdoc('<emp><lname>Edney</lname><age>47</age></emp>');

        xmlObsFunction =
                function (aSignal) {
                    pathHash = aSignal.at(TP.CHANGE_PATHS);
            };

        xmlObsFunction.observe(modelObj, 'ValueChange');

        //  Set up this path just to observe
        xmlPath1 = TP.apc('/emp');
        xmlPath1.executeGet(modelObj);
    });

    this.it('change along a single path', function(test, options) {

        xmlPath2 = TP.apc('/emp/lname');
        xmlPath2.set('shouldMake', true);

        xmlPath2.executeSet(modelObj, 'Shattuck', true);

        //  The path hash should have the path for xmlPath2
        test.assert.contains(pathHash, xmlPath2.get('srcPath'));

        //  But *not* for xmlPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, xmlPath1.get('srcPath'));
    });

    this.it('change along a branching path', function(test, options) {

        xmlPath3 = TP.apc('/emp/fname');
        xmlPath3.set('shouldMake', true);

        xmlPath3.executeSet(modelObj, 'Scott', true);

        //  The path hash should have the path for xmlPath3
        test.assert.contains(pathHash, xmlPath3.get('srcPath'));

        //  But *not* for xmlPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, xmlPath1.get('srcPath'));

        //  And *not* for xmlPath2 (it's at a similar level in the chain, but on
        //  a different branch)
        test.refute.contains(pathHash, xmlPath2.get('srcPath'));
    });

    this.it('change along another branching path', function(test, options) {

        xmlPath4 = TP.apc('/emp/ssn');
        xmlPath4.set('shouldMake', true);

        xmlPath4.executeSet(modelObj, '555-55-5555', true);

        //  The path hash should have the path for xmlPath4
        test.assert.contains(pathHash, xmlPath4.get('srcPath'));

        //  But *not* for xmlPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, xmlPath1.get('srcPath'));

        //  And *not* for xmlPath2 (it's at a similar level in the chain, but on
        //  a different branch)
        test.refute.contains(pathHash, xmlPath2.get('srcPath'));

        //  And *not* for xmlPath3 (it's at a similar level in the chain, but on
        //  a different branch)
        test.refute.contains(pathHash, xmlPath3.get('srcPath'));
    });

    this.it('change at the top level', function(test, options) {

        xmlPath5 = TP.apc('/emp');
        xmlPath5.set('shouldMake', true);

        xmlPath5.executeSet(modelObj, TP.elem('<lname>Edney</lname>'), true);

        //  The path hash should have the path for xmlPath5
        test.assert.contains(pathHash, xmlPath5.get('srcPath'));

        //  And for xmlPath4 (because it's ancestor's structure changed)
        test.assert.contains(pathHash, xmlPath4.get('srcPath'));

        //  And for xmlPath3 (because it's ancestor's structure changed)
        test.assert.contains(pathHash, xmlPath3.get('srcPath'));

        //  And for xmlPath2 (because it's ancestor's structure changed)
        test.assert.contains(pathHash, xmlPath2.get('srcPath'));

        //  And for xmlPath1 (because it's the same path as xmlPath5)
        test.assert.contains(pathHash, xmlPath1.get('srcPath'));
    });

    this.it('change all of the elements individually', function(test, options) {

        //  Set up this path just to observe
        xmlPath6 = TP.apc('//*');
        xmlPath6.executeGet(modelObj);

        xmlPath3.executeSet(modelObj, 'Scott', true);

        //  The path hash should have the path for xmlPath3
        test.assert.contains(pathHash, xmlPath3.get('srcPath'));

        //  The path hash should have the path for xmlPath6 (it's for all
        //  elements)
        test.assert.contains(pathHash, xmlPath6.get('srcPath'));

        //  But *not* for xmlPath1 (it's too high up in the chain)
        test.refute.contains(pathHash, xmlPath1.get('srcPath'));

        //  And *not* for xmlPath2 (it's at a similar level in the chain, but on
        //  a different branch)
        test.refute.contains(pathHash, xmlPath2.get('srcPath'));

        //  And *not* for xmlPath4 (it's at a similar level in the chain, but on
        //  a different branch)
        test.refute.contains(pathHash, xmlPath4.get('srcPath'));

        //  And *not* for xmlPath5 (it's too high up in the chain)
        test.refute.contains(pathHash, xmlPath5.get('srcPath'));
    });

    this.after(function() {
        xmlObsFunction.ignore(modelObj, 'ValueChange');
    });
});

//  ========================================================================
//  Run those babies!
//  ------------------------------------------------------------------------

/*
TP.core.ComplexTIBETPath.Inst.runTestSuites();
TP.core.XPathPath.Inst.runTestSuites();
*/

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
