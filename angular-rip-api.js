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

        $injector.get('$http')({
            method: svc.method,
            url: svc.getUrl(replace, params),
            headers: svc.getHeaders(),
            data: data
        })
            .then(function(data) {
                q.resolve(data);
            }, function(data) {
                q.reject(data);
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

        angular.forEach(replace, function(value, key) {
            path = path.replace(new RegExp('(\:' + key + ')($|\/)'), value + '/');
        });

        var par = '';

        angular.forEach(params, function(value, key) {
            par += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(value);
        });

        if(par) {
            path += '?' + par.substr(1);
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