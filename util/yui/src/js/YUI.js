/**
 * YUI core
 * @module yui
 */

if (typeof YUI === 'undefined' || !YUI) {
    /**
     * The YUI global namespace object.  If YUI is already defined, the
     * existing YUI object will not be overwritten so that defined
     * namespaces are preserved.  
     * @class YUI
     * @static
     */
    var YUI = function(o) {
        var Y = this;
        // Allow var yui = YUI() instead of var yui = new YUI()
        if (window === Y) {
            return new YUI(o).log('creating new instance');
        } else {
            // set up the core environment
            Y._init(o);

            // bind the specified additional modules for this instance
            Y._setup();
        }
    };
}

// The prototype contains the functions that are required to allow the external
// modules to be registered and for the instance to be initialized.
YUI.prototype = {

    /**
     * Initialize this YUI instance
     * @param o config options
     * @private
     */
    _init: function(o) {
        
    // @todo
    // loadcfg {
    //    base
    //    securebase
    //    filter
    //    win
    //    doc
    //    exception/log notification
    // }

        o = o || {};

        // find targeted window and @TODO create facades
        var w = (o.win) ? (o.win.contentWindow) : o.win  || window;
        o.win = w;
        o.doc = w.document;
    
        // add a reference to o for anything that needs it
        // before _setup is called.
        this.config = o;

        this.env = {
            // @todo expand the new module metadata
            mods: {},
            _idx: 0,
            _pre: 'yui-uid',
            _used: {}
        };

        var i = YUI.env._idx++;

        this.env._yidx = i;
        this.env._uidx = 0;

        this.id = this.guid('YUI');

        this.log(i + ') init ');
    },
    
    /**
     * Finishes the instance setup. Attaches whatever modules were defined
     * when the yui modules was registered.
     * @method _setup
     * @private
     */
    _setup: function(o) {
        this.use("yui");
        // make a shallow copy of the config.  This won't fix nested configs
        // so we need to determine if we only allow one level (probably) or
        // if we make clone create references for functions and elements.
        this.config = this.merge(this.config);
        this.publish('yui:load');
    },

    /**
     * Register a module
     * @method add
     * @param name {string} module name
     * @param namespace {string} name space for the module
     * @param fn {Function} entry point into the module that
     * is used to bind module to the YUI instance
     * @param version {string} version string
     * @return {YUI} the YUI instance
     *
     * requires   - features that should be present before loading
     * optional   - optional features that should be present if load optional defined
     * use  - features that should be attached automatically
     * skinnable  -
     * rollup
     * omit - features that should not be loaded if this module is present
     */
    add: function(name, fn, version, details) {

        this.log('Adding a new component' + name);

        // @todo expand this to include version mapping
        
        // @todo allow requires/supersedes

        // @todo may want to restore the build property
        
        // @todo fire moduleAvailable event
        
        var m = {
            name: name, 
            fn: fn,
            version: version,
            details: details || {}
        };

        YUI.env.mods[name] = m;

        return this; // chain support
    },

    /**
     * Bind a module to a YUI instance
     * @param modules* {string} 1-n modules to bind (uses arguments array)
     * @param *callback {function} callback function executed when 
     * the instance has the required functionality.  If included, it
     * must be the last parameter.
     *
     * @TODO 
     * Implement versioning?  loader can load different versions?
     * Should sub-modules/plugins be normal modules, or do
     * we add syntax for specifying these?
     *
     * YUI().use('dragdrop')
     * YUI().use('dragdrop:2.4.0'); // specific version
     * YUI().use('dragdrop:2.4.0-'); // at least this version
     * YUI().use('dragdrop:2.4.0-2.9999.9999'); // version range
     * YUI().use('*'); // use all available modules
     * YUI().use('lang+dump+substitute'); // use lang and some plugins
     * YUI().use('lang+*'); // use lang and all known plugins
     *
     *
     * @return {YUI} the YUI instance
     */
    use: function() {

        var a=arguments, l=a.length, mods=YUI.env.mods, 
            Y = this, used = Y.env._used;

        // YUI().use('*'); // assumes you need everything you've included
        if (a[0] === "*") {
            return Y.use.apply(Y, mods);
        }

        var missing = [], r = [], f = function(name) {

            // only attach a module once
            if (used[name]) {
                return;
            }

            used[name] = true;

            var m = mods[name], j, req, use;

            if (m) {
                req = m.details.requires;
                use = m.details.use;
            } else {
                Y.log('module not found: ' + name);
                missing.push(name);
            }

            // make sure requirements are attached
            if (req) {
                for (j = 0; j < req.length; j = j + 1) {
                    f(req[j]);
                }
            }

            // add this module to full list of things to attach
            // Y.log('using ' + name);
            r.push(name);

            // auto-attach sub-modules
            if (use) {
                for (j = 0; j < use.length; j = j + 1) {
                    f(use[j]);
                }
            }
        };

        for (var i=0; i<l; i=i+1) {
            if ((i === l-1) && typeof a[i] === 'function') {
                // Y.log('found loaded listener');
                Y.on('yui:load', a[i], Y, Y);
            } else {
                f(a[i]);
            }
        }

        // Y.log('all reqs: ' + r);

        var attach = function() {
            for (i=0, l=r.length; i<l; i=i+1) {
                var m = mods[r[i]];
                if (m) {
                    Y.log('attaching ' + r[i]);
                    m.fn(Y);
                }
            }

            if (Y.fire) {
                // Y.log('firing loaded event');
                Y.fire('yui:load', Y);
            } else {
                // Y.log('loaded event not fired.');
            }
        };

        if (false && missing.length) {
            // dynamic load
        } else {
            attach();
        }

        return Y; // chain support var yui = YUI().use('dragdrop');
    },

    /**
     * Returns the namespace specified and creates it if it doesn't exist
     * <pre>
     * YUI.namespace("property.package");
     * YUI.namespace("YUI.property.package");
     * </pre>
     * Either of the above would create YUI.property, then
     * YUI.property.package
     *
     * Be careful when naming packages. Reserved words may work in some browsers
     * and not others. For instance, the following will fail in Safari:
     * <pre>
     * YUI.namespace("really.long.nested.namespace");
     * </pre>
     * This fails because "long" is a future reserved word in ECMAScript
     *
     * @method namespace
     * @static
     * @param  {String*} arguments 1-n namespaces to create 
     * @return {Object}  A reference to the last namespace object created
     */
    namespace: function() {
        var a=arguments, o=null, i, j, d;
        for (i=0; i<a.length; i=i+1) {
            d = a[i].split(".");
            o = this;
            for (j=(d[0] == "YUI") ? 1 : 0; j<d.length; j=j+1) {
                o[d[j]] = o[d[j]] || {};
                o = o[d[j]];
            }
        }
        return o;
    },

    /**
     * Uses YUI.widget.Logger to output a log message, if the widget is
     * available.
     *
     * @method log
     * @static
     * @param  {String}  msg  The message to log.
     * @param  {String}  cat  The log category for the message.  Default
     *                        categories are "info", "warn", "error", time".
     *                        Custom categories can be used as well. (opt)
     * @param  {String}  src  The source of the the message (opt)
     * @return {YUI}      YUI instance
     */
    log: function(msg, cat, src) {

        // @todo take out automatic console logging, but provide
        // a way to enable console logging without the logger
        // component.
        var l = (this.Logger) || ("console" in window) ? console : function(){};
        if(l && l.log) {
            l.log(msg, cat || "", src || "");
        } 

        return this;
    },

    // Centralizing error messaging means we can configure how
    // they are communicated.
    //
    // @todo msg can take a constant key or type can be a constant.
    fail: function(msg, e, eType) {
        this.log(msg, "error");

        // @todo provide a configuration option that determines if YUI 
        // generated errors throws a javascript error.  Some errors
        // should always generate a js error.  If an error type
        // is provided, that error is thrown regardless of the 
        // configuration.
        if (true) {
            e = e || new Error(msg);
        }

        return this;
    },

    // generate an id that is unique among all YUI instances
    guid: function(pre) {
        var e = this.env, p = (pre) || e._pre;
        return p +'-' + e._yidx + '-' + e._uidx++;
    }
};

// Give the YUI global the same properties as an instance.
// This makes it so that the YUI global can be used like the YAHOO
// global was used prior to 3.x.  More importantly, the YUI global
// provides global metadata, so env needs to be configured.
(function() {
    var Y = YUI, p = Y.prototype, i;

    // inheritance utilities are not available yet
    for (i in p) {
        if (true) { // hasOwnProperty not available yet and not needed
            Y[i] = p[i];
        }
    }

    // set up the environment
    Y._init();

})();
