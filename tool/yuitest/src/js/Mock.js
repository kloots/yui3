YUI.add("mock", function(Y){

    var L = Y.lang;

    /**
     * Creates a new mock object.
     * @param {Object} template The object to mock.
     */
    Y.Mock = function(template){
    
        //use blank object is nothing is passed in
        template = template || {};
        
        var mock = null;
        
        //try to create mock that keeps prototype chain intact
        try {
            mock = Y.object(template);
        } catch (ex) {
            mock = {};
            Y.log("Couldn't create mock with prototype.", "warn", "Mock");
        }
        
        //create new versions of the methods so that they don't actually do anything
        Y.object.each(template, function(name){
            if (L.isFunction(template[name])){
                mock[name] = function(){
                    Y.Assert.fail("Method " + name + "() was called but was not expected to be.");
                };
            }
        });
        
        //return it
        return mock;    
    };
    
    
    
    Y.Mock.expect = function(mock /*:Object*/, expectation /*:Object*/){

        //make sure there's a place to store the expectations
        if (!mock.__expectations) {
            mock.__expectations = {};
        }

        //method expectation
        if (expectation.method){
            var name = expectation.method,
                args = expectation.arguments || [],
                result = expectation.returns,
                callCount = L.isNumber(expectation.callCount) ? 1 : 0,
                error = expectation.error;
                
            //save expectations
            mock.__expectations[name] = expectation;
            expectation.callCount = callCount;
            expectation.actualCallCount = 0;
                
            //process arguments
            Y.array.each(args, function(arg, i, array){
                array[i] = function(value){
                    Y.Assert.areSame(arg, value, "Argument " + i + " of " + name + " is incorrect."); 
                };                
            });
        
            //if the method is expected to be called
            if (callCount > 0){
                mock[name] = function(){   
                    expectation.actualCallCount++;
                    Y.Assert.areEqual(args.length, arguments.length, "Method " + name + "() passed incorrect number of arguments.");
                    for (var i=0, len=args.length; i < len; i++){
                        args[i](arguments[i]);
                    }                
                    if (error){
                        throw error;
                    }
                    return result;
                };
            } else {
            
                //method should fail if called when not expected
                mock[name] = function(){
                    Y.Assert.fail("Method " + name + "() should not have been called.");
                };
            }
        } else if (expectation.property){
            //save expectations
            mock.__expectations[name] = expectation;
        }
    };

    Y.Mock.verify = function(mock /*:Object*/){    
        Y.object.each(mock.__expectations, function(expectation){
            if (expectation.method) {
                Y.Assert.areEqual(expectation.callCount, expectation.actualCallCount, "Method " + expectation.method + "() wasn't called the expected number of times.");
            } else if (expectation.property){
                Y.Assert.areEqual(expectation.value, mock[expectation.property], "Property " + expectation.property + " wasn't set to the correct value."); 
            }
        });    
    };

}, "3.0.0");
