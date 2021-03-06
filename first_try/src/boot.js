( function() {
"use strict";

var instance = window.WebClient = {};
// from: http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
var isIE = /*@cc_on!@*/false || !!document.documentMode;
var isEdge = !isIE && !!window.StyleMedia;

var baseUrl = location.pathname.replace(/\/[^/]+$/, '/');
var baseUrlRe = new RegExp( '^' + location.protocol + '//' + location.host + baseUrl );

var appendDiv = function( innerHTML ) {
    var div = document.body.appendChild( document.createElement( 'div' ) )
    innerHTML && ( div.innerHTML = innerHTML );
    return div;
}
var moduleLoader = function moduleLoader() {
    if ( arguments.length && arguments[ 0 ].target && arguments[ 0 ].target.src ) {
        var script = arguments[ 0 ].target;
        
        script.removeEventListener( 'load', moduleLoader.loadEventListener );
        script.removeEventListener( 'error', moduleLoader.errorEventListener );
        appendDiv( '[SUCCESS] Load module: ' + script.src.replace( baseUrlRe, '' ) );
    }
    if ( !this.length ) {
        bootloader.next();
        return;
    }
    var module = this.shift();
    var script = document.createElement( 'script')
    script.async = false;
    script.src = 'src/' + module + '.js';
    script.addEventListener( 'load', moduleLoader.loadEventListener = moduleLoader.bind( this ) );
    script.addEventListener( 'error', moduleLoader.errorEventListener = function(event) {
        appendDiv( '[FAIL] Load module: ' + script.src.replace( baseUrlRe, '' ) );
        bootloader.failed();
    } );
    document.head.appendChild( script );
};

var startApplication = function startApplication() {
    window.removeEventListener( 'load', startApplication.loadEventListener );
    appendDiv( '[SUCCESS] Load document' );
    var application = new instance.application.Application();
    application.run();
}

var bootloader = new ( function Bootloader() {
    this.run = function run( steps ) {
        (this.next = function next() {
            ( steps.length ? steps.shift() : this[this.isFailed ? 'failed' : 'succeeded' ].bind( this ) )();
        })();
    };
    this.cleanUp = function cleanUp() {
        delete moduleLoader.loadEventListener;
        delete moduleLoader.errorEventListener;
        window.removeEventListener( 'error', bootloader.errorEventHandler );
        bootloader = undefined;
    };
    this.succeeded = function succeeded() {
        this.cleanUp();
        appendDiv( '[SUCCESS] Boot sequence' );
        window.addEventListener( 'load', startApplication.loadEventListener = startApplication );
    };
    this.failed = function failed() {
        this.cleanUp();
        appendDiv( '[FAIL] Boot sequence' );
    };
});

bootloader.run([
    function() {
        window.addEventListener( 'error', bootloader.errorEventHandler = function( event ) {
            var err, msg;
            
            err = event.error;
            msg = [
                '[FAIL] Unhandled Exception @ ' +
                err.fileName.replace( baseUrlRe, '' ) +
                ':' + err.lineNumber + ':' + err.columnNumber,
                err.message,
                ].concat( err.stack.split( /\n/ ) );
            appendDiv( msg.join( '<br>\n' ) );
            bootloader.isFailed = true;
        });
        bootloader.next();
    },
    function() {
        if ( isIE && !isEdge ) {
            bootloader.next();
        } else {
            moduleLoader.call( [ 'es6module', 'earth', 'animals', 'plants' ] );
        }
    },
    function() {
        moduleLoader.call( [ 'es5module', 'earth5', 'animals5', 'plants5' ] );
    },
    function() {
        if ( isIE && !isEdge ) {
            bootloader.next();
        } else {
            moduleLoader.call( [ 'mix' ] );
        }
    },
    function() {
        moduleLoader.call( [ 'app' ] );
    },
]);

})();