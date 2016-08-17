/**
 * @license RIP Ecosystem
 * (c) 2016 Rytis Tekorius. https://github.com/Tekorius
 * License: MIT
 */

/**
 * 
 * @param method
 * @param name
 * @param path
 * @returns {svc}
 * @constructor
 */
function RipApiEndpoint(method, name, path) {

    // ====== Private methods =====
    var buildUrlEncoded = function(params) {
        var par = '';

        angular.forEach(params, function(value, key) {
            par += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(value);
        });

        return par.substr(1);
    };

    // ===== Endpoint call =====
    var svc = function(replace, body, params) {
        /*console.log(replace);
        console.log(body);
        console.log(params);*/

        // If this is a root node, this will default to search
        if(svc.parent == null) {
            return svc.find(replace);
        }

        // else we will try to call the service
        var $injector = svc.top().$injector;
        var q = $injector.get('$q').defer();

        var data;

        // TODO: body transformers

        // If endpoint is strict, only map field values
        if(svc.strict) {
            data = {};

            angular.forEach(svc.fields, function(value, key) {
                data[key] = body[key];
            });
        }
        else {
            data = body;
        }

        var headers = svc.getHeaders();
        var url = svc.getUrl(replace, params);

        // Intercept before building a request object
        var itc = svc.getInterceptors('bind');
        angular.forEach(itc, function(fn, key) {
            fn(data, headers, url, svc);
        });

        // Drop undefined fields
        angular.forEach(data, function(value, key) {
            if(typeof value === 'undefined') { delete data[key] }
        });

        // If this is not a json, then encode the form
        var contentType = null;
        angular.forEach(headers, function(value, key) {
            if(key.toLowerCase() == 'content-type') { contentType = value; }
        });

        var dataobj = data;
        if(contentType && contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
            data = buildUrlEncoded(data);
        }

        // Build a request object
        var request = {
            method: svc.method,
            url: url,
            headers: headers,
            data: data
        };

        // Intercept before request
        itc = svc.getInterceptors('before');
        angular.forEach(itc, function(fn, key) {
            fn(request, dataobj, svc);
        });

        $injector.get('$http')(request)

            // Success response
            .then(function(data) {

                // Intercept something after success
                var ret = true;
                itc = svc.getInterceptors('success');
                angular.forEach(itc, function(fn, key) {
                    var r = fn(data, request, q, ret, svc);
                    if(!r) { ret = false } // This stops resolving the promise
                });

                // Return only if interceptor allows
                if(ret) { q.resolve(data) }

            // Error response
            }, function(data) {

                // Intercept something after error
                var ret = true;
                itc = svc.getInterceptors('error');
                angular.forEach(itc, function(fn, key) {
                    var r = fn(data, request, q, ret, svc);
                    if(!r) { ret = false } // This stops resolving the promise
                });

                // Return only if interceptor allows
                if(ret) { q.reject(data) }
            })

            // Finally
            .finally(function() {

                // Intercept after
                itc = svc.getInterceptors('after');
                angular.forEach(itc, function(fn, key) {
                    fn(svc);
                });
            });

        return q.promise;
    };

    // ====== Fields ======
    /** Method to call */
    svc.method = method || 'GET';

    /** Name of the endpoint. If not provided, makes method a name */
    svc.names = name || svc.method.toLowerCase();

    // If path is provided, all good, use it
    if(path) { svc.path = path }

    // If path is not provided, try to resolve path by method
    else if(path === null) {
        switch(svc.method) {
            case 'PUT':
            case 'DELETE':
            case 'PATCH':
                // Attach a replaceable to path that matches the name of the endpoint
                svc.path = '/:id';
                break;
            default:

                // Don't attach anything to path if the method is GET or else
                svc.path = '';
        }
    }

    else {
        svc.path = '/' + svc.names;
    }

    /** Headers of this endpoint */
    svc.headers = {};

    /** Defines fields in the endpoint body */
    svc.fields = {};

    /** Defines transformers for body fields */
    svc.transformers = {
        request: [],
        response: []
    };

    /** Defines interceptors (hooks) */
    svc.interceptors = {
        bind: {},
        before: {},
        success: {},
        error: {},
        after: {}
    };

    /** Custom params user may want to pass */
    svc.params = {};

    /** Parent of this node */
    svc.parent = null;

    /** Children of this node */
    svc.children = [];

    /** Should we drop values that are not defined in fields? */
    svc.strict = false;

    // ====== Methods ======
    /**
     * Create a child endpoint
     *
     * @param method
     * @param name
     * @param path
     */
    svc.endpoint = function(method, name, path) {
        var ep = new RipApiEndpoint(method, name, path);
        ep.parent = svc;

        svc.children.push(ep);

        // return endpoint for chaining and configuration
        return ep;
    };

    /**
     * Return a parent for chaining purposes
     */
    svc.end = function() {
        return svc.parent;
    };

    // ===== Convenience methods =====
    svc.get = function (name, path) {
        return svc.endpoint('GET', name, path);
    };

    svc.post = function (name, path) {
        return svc.endpoint('POST', name, path);
    };

    svc.put = function (name, path) {
        return svc.endpoint('PUT', name, path);
    };

    svc.patch = function (name, path) {
        return svc.endpoint('PATCH', name, path);
    };

    svc.delete = function (name, path) {
        return svc.endpoint('DELETE', name, path);
    };

    svc.crud = function(name, path, replaceable) {
        if(!path) {
            path = '/' + name;
        }
        if(replaceable) {
            replaceable = '/' + replaceable;
        }
        else {
            replaceable = null;
        }

        return svc.get(name, path)
                    .post(null, replaceable).end()
                    .put(null, replaceable).end()
                    .delete(null, replaceable).end()
                    .get(null, replaceable || '/:id')
        ;
    };

    // ===== Modifiers =====
    // Header
    svc.header = function(header, value) {

        // set
        if(typeof value !== 'undefined') {
            svc.headers[header] = value;
            return svc;
        }

        // get
        else {
            return svc.headers[header];
        }

    };

    svc.addHeaders = function (object) {
        angular.forEach(object, function(value, key) {
            svc.header(key, value);
        });

        return svc;
    };

    svc.getHeaders = function() {
        var headers = svc.headers;

        return angular.extend({}, svc.parent ? svc.parent.getHeaders() : {}, headers);
    };

    // Param
    svc.param = function(key, value) {
        // set
        if(typeof value !== 'undefined') {
            svc.params[key] = value;
            return svc;
        }

        // get
        else {
            return svc.params[key];
        }
    };

    svc.addParams = function(object) {
        angular.forEach(object, function(value, key) {
            svc.param(key, value);
        });

        return svc;
    };

    svc.getParams = function() {
        var params = svc.params;

        return angular.extend({}, svc.parent ? svc.parent.getParams() : {}, params);
    };
    
    svc.getParam = function(name) {
        var param = svc.params[name];
        
        if(typeof param === 'undefined' && svc.parent) {
            return svc.parent.getParam(name);
        }
        
        return param;
    };

    // Path
    svc.setPath = function(path) {
        svc.path = path;

        return svc;
    };

    svc.getPath = function() {
        return (svc.parent ? svc.parent.getPath() : '') + svc.path;
    };

    svc.getUrl = function(replace, params) {
        var path = svc.getPath();

        // Replace colon variables
        angular.forEach(replace, function(value, key) {
            path = path.replace(new RegExp('(\:' + key + ')($|\/)'), value + '/');
        });
        
        // Add get params
        var par = buildUrlEncoded(params);

        if(par) {
            path += '?' + par;
        }

        return path;
    };

    // Fields
    svc.field = function(key, value) {

        // set
        if(typeof value !== 'undefined') {
            svc.fields[key] = value;
            return svc;
        }

        // get
        else {
            return svc.fields[key];
        }
    };

    svc.addFields = function(object) {
        angular.forEach(object, function(value, key) {
            svc.field(key, value);
        });

        return svc;
    };

    // Interceptors
    svc.interceptor = function(type, name, fn) {

        switch (type) {
            case 'bind':
            case 'before':
            case 'success':
            case 'error':
            case 'after':
                break;
            default:
                throw 'Interceptor type must be one of these: bind, before, success, error, after';
        }
        // set
        if(typeof fn !== 'undefined') {
            svc.interceptors[type][name] = fn;
            return svc;
        }

        // get
        else {
            return svc.interceptors[type][name];
        }

    };

    svc.getInterceptors = function(type) {
        var interceptors = svc.interceptors[type];

        return angular.extend({}, svc.parent ? svc.parent.getInterceptors(type) : {}, interceptors);
    };

    // Strict
    svc.setStrict = function(value) {
        if(typeof value === 'undefined') {
            value = true;
        }

        svc.strict = value;

        return svc;
    };

    // TODO: detach / attach nodes

    // ===== Traverse methods =====
    svc.top = function() {

        if(svc.parent != null) {
            return svc.parent.top();
        }

        return svc;
    };

    /**
     * Find an enpoint with a name. Can be period separated for recursion
     * @param name
     */
    svc.find = function(name) {
        var split = name.split('.', 1);
        var search = split[0];
        var remainder = name.substr(search.length + 1); // Chop off the search part and leave more period separated values
        var found = null;

        angular.forEach(svc.children, function(value) {
            if(value.names == search) {
                found = value;
                return true;
            }
        });

        // If something is found and we're stacking deeper, then do it
        if(found && remainder) {
            return found.find(remainder);
        }

        return found;
    };

    return svc;
}

function RipApi(root) {

    var pool = {};

    /**
     * Gets an endpoint object from pool
     *
     * @param endpoint
     */
    var svc = function(endpoint) {
        //
    };

    return root;
}

angular.module('rip.api', [])

.provider('$api',
    function RipApiProvider() {
        
        // Create a root node
        var root = new RipApiEndpoint('GET', 'root', '');

        root.rootUrl = function(url) {
            if(typeof url !== 'undefined') {
                root.setPath(url);
            }
            else {
                return root.getPath();
            }
        };

        // TODO: environments

        root.$get = [
            '$injector',
            function RipApiFactory($injector) {

                root.$injector = $injector;

                return root;
                //return new RipApi(root);
            }
        ];

        return root;

    })

;