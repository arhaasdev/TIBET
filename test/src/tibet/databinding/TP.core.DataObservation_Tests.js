//  ========================================================================
/**
 * @copyright Copyright (C) 1999 Technical Pursuit Inc. (TPI) All Rights
 *     Reserved. Patents Pending, Technical Pursuit Inc. Licensed under the
 *     OSI-approved Reciprocal Public License (RPL) Version 1.5. See the RPL
 *     for your rights and responsibilities. Contact TPI to purchase optional
 *     privacy waivers if you must keep your TIBET-based source code private.
 */
//  ========================================================================

TP.core.ComplexTIBETPath.Inst.describe('TP.core.ComplexTIBETPath Inst path change signaling',
function() {

    var modelObj,
        jsonValueObsFunction,
        jsonStructureObsFunction,

        valuePathResults,
        structurePathResults,

        jsonPath1,
        jsonPath2,
        jsonPath3,
        jsonPath4,
        jsonPath5,
        jsonPath6,
        jsonPath7;

    this.before(function() {
        modelObj = TP.json2js('{"foo":["1st","2nd",{"hi":"there"}]}');

        valuePathResults = TP.ac();
        structurePathResults = TP.ac();

        jsonValueObsFunction =
                function (aSignal) {
                    valuePathResults.push(aSignal.at('aspect'));
            };

        jsonValueObsFunction.observe(modelObj, 'ValueChange');

        jsonStructureObsFunction =
                function (aSignal) {
                    structurePathResults.push(aSignal.at('aspect'));
            };

        jsonStructureObsFunction.observe(modelObj, 'StructureChange');

        //  Set up this path just to observe
        jsonPath1 = TP.apc('foo');
        jsonPath1.executeGet(modelObj);
    });

    this.it('change along a single path', function(test, options) {

        jsonPath2 = TP.apc('foo.3.bar');
        jsonPath2.set('shouldMake', true);

        jsonPath2.executeSet(modelObj, 'goo', true);

        //  The value path results should have the path for jsonPath2
        this.assert.contains(valuePathResults, jsonPath2.get('srcPath'));

        //  The structure path results should have the path for jsonPath2
        this.assert.contains(structurePathResults, jsonPath2.get('srcPath'));

        //  But *not* for jsonPath1 for either set of results (it's too high up
        //  in the chain)
        this.refute.contains(valuePathResults, jsonPath1.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change along a branching path', function(test, options) {

        jsonPath3 = TP.apc('foo.3.[bar,moo,too].roo');
        jsonPath3.set('shouldMake', true);

        jsonPath3.executeSet(modelObj, TP.ac(), true);

        //  The value path results should have the path for jsonPath3
        this.assert.contains(valuePathResults, jsonPath3.get('srcPath'));

        //  The structure path results should have the path for jsonPath3
        this.assert.contains(structurePathResults, jsonPath3.get('srcPath'));

        //  And the value path results for jsonPath2 (because and we replaced the
        //  value at 'foo.3.bar' with an Object to hold the 'roo' value)
        this.assert.contains(valuePathResults, jsonPath2.get('srcPath'));

        //  But not the structure path results for jsonPath2 (we created no new
        //  structure there).
        this.refute.contains(structurePathResults, jsonPath2.get('srcPath'));

        //  And *not* for jsonPath1 for either set of results (it's too high up
        //  in the chain)
        this.refute.contains(valuePathResults, jsonPath1.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change of an end aspect of a branching path', function(test, options) {

        jsonPath4 = TP.apc('foo.3.bar.roo');
        jsonPath4.executeGet(modelObj);

        jsonPath5 = TP.apc('foo.3.moo.roo');

        jsonPath5.executeSet(modelObj, 42, true);

        //  The value path results should have the path for jsonPath5
        this.assert.contains(valuePathResults, jsonPath5.get('srcPath'));

        //  And the structure path results should have the path for jsonPath5
        this.assert.contains(structurePathResults, jsonPath5.get('srcPath'));

        //  And *not* for jsonPath4 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, jsonPath4.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath4.get('srcPath'));

        //  The value path results should have the path for jsonPath3
        this.assert.contains(valuePathResults, jsonPath3.get('srcPath'));

        //  And the structure path results should have the path for jsonPath3
        this.assert.contains(structurePathResults, jsonPath3.get('srcPath'));

        //  And *not* for jsonPath2 for either set of results (it's too high up
        //  in the chain)
        this.refute.contains(valuePathResults, jsonPath2.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath2.get('srcPath'));

        //  And *not* for jsonPath1 for either set of results (it's too high up
        //  in the chain)
        this.refute.contains(valuePathResults, jsonPath1.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change of a parent aspect of a branching path', function(test, options) {

        jsonPath6 = TP.apc('foo.3');

        jsonPath6.executeSet(modelObj, 'fluffy', true);

        //  The value path results should have the path for jsonPath6
        this.assert.contains(valuePathResults, jsonPath6.get('srcPath'));

        //  And the structure path results should have the path for jsonPath6 as
        //  well (structure was changed).
        this.assert.contains(structurePathResults, jsonPath6.get('srcPath'));

        //  And for jsonPath5 (because it's ancestor's structure changed)
        this.assert.contains(valuePathResults, jsonPath5.get('srcPath'));

        //  And the structure path results should have the path for jsonPath5 as
        //  well (structure was changed).
        this.assert.contains(structurePathResults, jsonPath5.get('srcPath'));

        //  And for jsonPath4 (because it's ancestor's structure changed)
        this.assert.contains(valuePathResults, jsonPath4.get('srcPath'));

        //  And the structure path results should have the path for jsonPath4 as
        //  well (structure was changed).
        this.assert.contains(structurePathResults, jsonPath4.get('srcPath'));

        //  And for jsonPath3 (because it's ancestor's structure changed)
        this.assert.contains(valuePathResults, jsonPath3.get('srcPath'));

        //  And the structure path results should have the path for jsonPath3 as
        //  well (structure was changed).
        this.assert.contains(structurePathResults, jsonPath3.get('srcPath'));

        //  And for jsonPath2 (because it's ancestor's structure changed)
        this.assert.contains(valuePathResults, jsonPath2.get('srcPath'));

        //  And the structure path results should have the path for jsonPath2 as
        //  well (structure was changed).
        this.assert.contains(structurePathResults, jsonPath2.get('srcPath'));

        //  And *not* for jsonPath1 for either set of results (it's too high up
        //  in the chain)
        this.refute.contains(valuePathResults, jsonPath1.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change of another parent aspect of a branching path', function(test, options) {

        jsonPath7 = TP.apc('foo.2');
        jsonPath7.set('shouldMake', true);

        jsonPath7.executeSet(modelObj, TP.ac(), true);

        //  The value path results should have the path for jsonPath7
        this.assert.contains(valuePathResults, jsonPath7.get('srcPath'));

        //  And the structure path results should have the path for jsonPath7
        this.assert.contains(structurePathResults, jsonPath7.get('srcPath'));

        //  But *not* for jsonPath6 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, jsonPath6.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath6.get('srcPath'));

        //  And *not* for jsonPath5 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, jsonPath5.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath5.get('srcPath'));

        //  And *not* for jsonPath4 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, jsonPath4.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath4.get('srcPath'));

        //  And *not* for jsonPath3 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, jsonPath3.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath3.get('srcPath'));

        //  And *not* for jsonPath2 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, jsonPath2.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath2.get('srcPath'));

        //  And *not* for jsonPath1 for either set of results (it's too high up
        //  in the chain)
        this.refute.contains(valuePathResults, jsonPath1.get('srcPath'));
        this.refute.contains(structurePathResults, jsonPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change model to a whole new object', function(test, options) {
        jsonPath1.set('shouldMake', true);

        //  Set everything under 'foo' to a new data structure
        jsonPath1.executeSet(modelObj, TP.json2js('["A","B","C","D"]'), true);

        //  All paths will have changed

        //  Both results should have the path for jsonPath7
        this.assert.contains(valuePathResults, jsonPath7.get('srcPath'));
        this.assert.contains(structurePathResults, jsonPath7.get('srcPath'));

        //  And for jsonPath6
        this.assert.contains(valuePathResults, jsonPath6.get('srcPath'));
        this.assert.contains(structurePathResults, jsonPath6.get('srcPath'));

        //  And for jsonPath5
        this.assert.contains(valuePathResults, jsonPath5.get('srcPath'));
        this.assert.contains(structurePathResults, jsonPath5.get('srcPath'));

        //  And for jsonPath4
        this.assert.contains(valuePathResults, jsonPath4.get('srcPath'));
        this.assert.contains(structurePathResults, jsonPath4.get('srcPath'));

        //  And for jsonPath3
        this.assert.contains(valuePathResults, jsonPath3.get('srcPath'));
        this.assert.contains(structurePathResults, jsonPath3.get('srcPath'));

        //  And for jsonPath2
        this.assert.contains(valuePathResults, jsonPath2.get('srcPath'));
        this.assert.contains(structurePathResults, jsonPath2.get('srcPath'));

        //  And for jsonPath1
        this.assert.contains(valuePathResults, jsonPath1.get('srcPath'));
        this.assert.contains(structurePathResults, jsonPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change along a single path for the new object', function(test, options) {
        jsonPath6.executeSet(modelObj, 'fluffy', true);

        //  The path has should *not* have the path for jsonPath7 (it's at a
        //  similar level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, jsonPath7.get('srcPath'));

        //  The value path results should have the path for jsonPath6
        this.assert.contains(valuePathResults, jsonPath6.get('srcPath'));

        //  But not for the structural path result
        this.refute.contains(structurePathResults, jsonPath6.get('srcPath'));

        //  And for jsonPath5
        this.assert.contains(valuePathResults, jsonPath5.get('srcPath'));

        //  But not for the structural path result
        this.refute.contains(structurePathResults, jsonPath5.get('srcPath'));

        //  And for jsonPath4
        this.assert.contains(valuePathResults, jsonPath4.get('srcPath'));

        //  But not for the structural path result
        this.refute.contains(structurePathResults, jsonPath4.get('srcPath'));

        //  And for jsonPath3
        this.assert.contains(valuePathResults, jsonPath3.get('srcPath'));

        //  But not for the structural path result
        this.refute.contains(structurePathResults, jsonPath3.get('srcPath'));

        //  And for jsonPath2
        this.assert.contains(valuePathResults, jsonPath2.get('srcPath'));

        //  But not for the structural path result
        this.refute.contains(structurePathResults, jsonPath2.get('srcPath'));

        //  And *not* for jsonPath1 (it's too high up in the chain)
        this.refute.contains(valuePathResults, jsonPath1.get('srcPath'));

        //  But not for the structural path result
        this.refute.contains(structurePathResults, jsonPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.after(function() {
        jsonValueObsFunction.ignore(modelObj, 'ValueChange');
    });
});

//  ------------------------------------------------------------------------

TP.core.XPathPath.Inst.describe('TP.core.XPathPath Inst path change signaling',
function() {

    var modelObj,
        xmlValueObsFunction,
        xmlStructureObsFunction,

        valuePathResults,
        structurePathResults,

        xmlPath1,
        xmlPath2,
        xmlPath3,
        xmlPath4,
        xmlPath1,
        xmlPath5;

    this.before(function() {
        modelObj = TP.tpdoc('<emp><lname>Edney</lname><age>47</age></emp>');

        valuePathResults = TP.ac();
        structurePathResults = TP.ac();

        xmlValueObsFunction =
                function (aSignal) {
                    valuePathResults.push(aSignal.at('aspect'));
            };

        xmlValueObsFunction.observe(modelObj, 'ValueChange');

        xmlStructureObsFunction =
                function (aSignal) {
                    structurePathResults.push(aSignal.at('aspect'));
            };

        xmlStructureObsFunction.observe(modelObj, 'StructureChange');

        //  Set up this path just to observe
        xmlPath1 = TP.apc('/emp');
        xmlPath1.executeGet(modelObj);
    });

    this.it('change along a single path', function(test, options) {

        xmlPath2 = TP.apc('/emp/lname');
        xmlPath2.set('shouldMake', true);

        xmlPath2.executeSet(modelObj, 'Shattuck', true);

        //  The value path should have the path for xmlPath2
        this.assert.contains(valuePathResults, xmlPath2.get('srcPath'));

        //  But not the structure path results for xmlPath2 (we created no new
        //  structure there).
        this.refute.contains(structurePathResults, xmlPath2.get('srcPath'));

        //  And *not* for xmlPath1 for either set of results (it's too high up
        //  in the chain)
        this.refute.contains(valuePathResults, xmlPath1.get('srcPath'));
        this.refute.contains(structurePathResults, xmlPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change along a branching path', function(test, options) {

        xmlPath3 = TP.apc('/emp/fname');
        xmlPath3.set('shouldMake', true);

        xmlPath3.executeSet(modelObj, 'Scott', true);

        //  The value path should have the path for xmlPath3
        this.assert.contains(valuePathResults, xmlPath3.get('srcPath'));

        //  And the structure path results for xmlPath3 (we created new
        //  structure there).
        this.assert.contains(structurePathResults, xmlPath3.get('srcPath'));

        //  But *not* for xmlPath2 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, xmlPath2.get('srcPath'));
        this.refute.contains(structurePathResults, xmlPath2.get('srcPath'));

        //  And *not* for xmlPath1 for either set of results (it's too high up
        //  in the chain)
        this.refute.contains(valuePathResults, xmlPath1.get('srcPath'));
        this.refute.contains(structurePathResults, xmlPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change along another branching path', function(test, options) {

        xmlPath4 = TP.apc('/emp/ssn');
        xmlPath4.set('shouldMake', true);

        xmlPath4.executeSet(modelObj, '555-55-5555', true);

        //  The value path should have the path for xmlPath4
        this.assert.contains(valuePathResults, xmlPath4.get('srcPath'));

        //  And the structure path results for xmlPath4 (we created new
        //  structure there).
        this.assert.contains(structurePathResults, xmlPath4.get('srcPath'));

        //  But *not* for xmlPath3 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, xmlPath3.get('srcPath'));
        this.refute.contains(structurePathResults, xmlPath3.get('srcPath'));

        //  And *not* for xmlPath2 (it's at a similar level in the chain, but on
        //  a different branch)
        this.refute.contains(valuePathResults, xmlPath2.get('srcPath'));
        this.refute.contains(structurePathResults, xmlPath2.get('srcPath'));

        //  And *not* for xmlPath1 (it's too high up in the chain)
        this.refute.contains(valuePathResults, xmlPath1.get('srcPath'));
        this.refute.contains(structurePathResults, xmlPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change at the top level', function(test, options) {

        xmlPath1.set('shouldMake', true);

        //  Set everything under '/emp' to a new data structure
        xmlPath1.executeSet(modelObj, TP.elem('<lname>Edney</lname>'), true);

        //  All paths will have changed

        //  Both results should have the path for xmlPath4
        this.assert.contains(valuePathResults, xmlPath4.get('srcPath'));
        this.assert.contains(structurePathResults, xmlPath4.get('srcPath'));

        //  And for xmlPath3 (because it's ancestor's structure changed)
        this.assert.contains(valuePathResults, xmlPath3.get('srcPath'));
        this.assert.contains(structurePathResults, xmlPath3.get('srcPath'));

        //  And for xmlPath2 (because it's ancestor's structure changed)
        this.assert.contains(valuePathResults, xmlPath2.get('srcPath'));
        this.assert.contains(structurePathResults, xmlPath2.get('srcPath'));

        //  And for xmlPath1 (because it's the same path as xmlPath1)
        this.assert.contains(valuePathResults, xmlPath1.get('srcPath'));
        this.assert.contains(structurePathResults, xmlPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.it('change all of the elements individually', function(test, options) {

        //  Set up this path just to observe
        xmlPath5 = TP.apc('//*');
        xmlPath5.executeGet(modelObj);

        //  But set using xmlPath3
        xmlPath3.executeSet(modelObj, 'Scott', true);

        //  Both results should have the path for xmlPath5 (it's for all
        //  elements)
        this.assert.contains(valuePathResults, xmlPath5.get('srcPath'));
        this.assert.contains(structurePathResults, xmlPath5.get('srcPath'));

        //  But *not* for xmlPath4 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, xmlPath4.get('srcPath'));
        this.refute.contains(structurePathResults, xmlPath4.get('srcPath'));

        //  Both results should have the path for xmlPath3 (we created new
        //  structure there).
        this.assert.contains(valuePathResults, xmlPath3.get('srcPath'));
        this.assert.contains(structurePathResults, xmlPath3.get('srcPath'));

        //  But *not* for xmlPath2 for either set of results (it's at a similar
        //  level in the chain, but on a different branch)
        this.refute.contains(valuePathResults, xmlPath2.get('srcPath'));
        this.refute.contains(structurePathResults, xmlPath2.get('srcPath'));

        //  And *not* for xmlPath1 for either set of results (it's too high up
        //  in the chain)
        this.refute.contains(valuePathResults, xmlPath1.get('srcPath'));
        this.refute.contains(structurePathResults, xmlPath1.get('srcPath'));

        valuePathResults.empty();
        structurePathResults.empty();
    });

    this.after(function() {
        xmlValueObsFunction.ignore(modelObj, 'ValueChange');
    });
});

//  ------------------------------------------------------------------------

TP.lang.Object.Type.describe('object-level binding',
function() {

    this.it('change notification - concrete reference', function(test, options) {

        var modelObj,
            observerObj,

            handlerFunc;

        modelObj = TP.lang.Object.construct();
        modelObj.defineAttribute('salary');

        observerObj = TP.lang.Object.construct();
        observerObj.defineAttribute('salary');

        TP.observe(
            modelObj,
            'SalaryChange',
            handlerFunc = function (aSignal) {

                var newValue;

                test.assert.isIdenticalTo(aSignal.getTarget(), modelObj);
                test.assert.isEqualTo(aSignal.getAspect(), 'salary');
                test.assert.isEqualTo(aSignal.getAction(), TP.UPDATE);

                newValue = aSignal.getValue();
                test.assert.isEqualTo(newValue, 42);

                observerObj.set('salary', newValue);
            });

        modelObj.set('salary', 42);

        this.assert.isEqualTo(
                    modelObj.get('salary'),
                    observerObj.get('salary'));

        TP.ignore(modelObj, 'SalaryChange', handlerFunc);
    });

    this.it('change notification - virtual reference', function(test, options) {

        var modelObj,
            observerObj,

            handlerFunc;

        modelObj = TP.lang.Object.construct();
        modelObj.defineAttribute('salary');

        //  This sets the ID of the object and registers it with an accompanying
        //  'urn:tibet' URN (which will allow the 'observe()' call to turn change
        //  handling on for it).
        modelObj.setID('CurrentEmployee');
        TP.sys.registerObject(modelObj);

        observerObj = TP.lang.Object.construct();
        observerObj.defineAttribute('salary');

        TP.observe(
            'CurrentEmployee',
            'SalaryChange',
            handlerFunc = function (aSignal) {

                var newValue;

                test.assert.isIdenticalTo(aSignal.getTarget(), modelObj);
                test.assert.isEqualTo(aSignal.getAspect(), 'salary');
                test.assert.isEqualTo(aSignal.getAction(), TP.UPDATE);

                newValue = aSignal.getValue();
                test.assert.isEqualTo(newValue, 42);

                observerObj.set('salary', newValue);
            });

        modelObj.set('salary', 42);

        this.assert.isEqualTo(
                    modelObj.get('salary'),
                    observerObj.get('salary'));

        TP.ignore('CurrentEmployee', 'SalaryChange', handlerFunc);
    });

    this.it('using defineBinding() - concrete reference', function(test, options) {

        var modelObj,
            observerObj;

        modelObj = TP.lang.Object.construct();
        modelObj.defineAttribute('salary');

        observerObj = TP.lang.Object.construct();
        observerObj.defineAttribute('salary');

        observerObj.defineBinding('salary', modelObj);

        //  Set the value of 'salary' on the model object. The binding should
        //  cause the value of 'salary' on the observer to update
        modelObj.set('salary', 42);

        this.assert.isEqualTo(
                    modelObj.get('salary'),
                    observerObj.get('salary'));

        //  Destroy the binding
        observerObj.destroyBinding('salary', modelObj);

        modelObj.set('salary', 45);

        //  Because there is now no binding between these two, observerObj
        //  should still have the value of 42 set above.
        this.assert.isEqualTo(
                    42,
                    observerObj.get('salary'));
    });

    this.it('using defineBinding() - virtual reference', function(test, options) {

        var modelObj,
            observerObj;

        modelObj = TP.lang.Object.construct();
        modelObj.defineAttribute('salary');

        observerObj = TP.lang.Object.construct();
        observerObj.defineAttribute('salary');

        //  This sets the ID of the object and registers it with an accompanying
        //  'urn:tibet' URN (which will allow the 'defineBinding()' call to turn
        //  change handling on for it).
        modelObj.setID('CurrentEmployee');
        TP.sys.registerObject(modelObj);

        observerObj.defineBinding('salary', 'CurrentEmployee');

        //  Set the value of 'salary' on the model object. The binding should
        //  cause the value of 'salary' on the observer to update
        modelObj.set('salary', 42);

        this.assert.isEqualTo(
                    modelObj.get('salary'),
                    observerObj.get('salary'));

        //  Destroy the binding
        observerObj.destroyBinding('salary', 'CurrentEmployee');

        modelObj.set('salary', 45);

        //  Because there is now no binding between these two, observerObj
        //  should still have the value of 42 set above.
        this.assert.isEqualTo(
                    42,
                    observerObj.get('salary'));
    });
});

//  ========================================================================
//  Run those babies!
//  ------------------------------------------------------------------------

/*
TP.core.ComplexTIBETPath.Inst.runTestSuites();
TP.core.XPathPath.Inst.runTestSuites();
TP.lang.Object.Type.runTestSuites();
*/

//  ------------------------------------------------------------------------
//  end
//  ========================================================================
