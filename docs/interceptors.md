[<< Back to index](index.md)

# Interceptors

RIP Api has an interceptor functionality. Interceptors (or hooks, as some may call it) are simple functions that are called at some point of the API execution.

Interceptors are somewhat inspired by Symfony's Form Events.

Currently there are these types of interceptors:

* `bind` - Called before building a request object and transforming data object to let's say form encoded string. This is useful for adding some extra fields to the data being sent
* `before` - Called after build a request object, but before sending any data to the endpoint
* `success` - Called after endpoint returns a success response. Useful for logging
* `error` - Called after endpoint returns an error response, useful for logging or redirecting to login if user is not authorized
* `after` - Called after endpoint returns any response. This is called in promise's .finally function

The interceptors are added with endpoint method `.interceptor`. The signature is:

    _endpoint.interceptor( type, name, function );
    
The interceptor names are used to override the interceptors should you need to

The hooks are called with these signatures:

    $api('endpoint').interceptor('bind', 'name', function(data, headers, url, endpointObject) {  });
    $api('endpoint').interceptor('before', 'name', function(requestObject, dataObject, endpointObject) {  });
    $api('endpoint').interceptor('success', 'name', function($httpResponse, requestObject, promise, willPromiseResolve, endpointObject) { return true });
    $api('endpoint').interceptor('error', 'name', function($httpResponse, requestObject, promise, willPromiseReject, endpointObject) { return true });
    $api('endpoint').interceptor('after', 'name', function(endpointObject) {  });
    
[RIP Api plugins](plugins.md) usually takes advantage of interceptors.

To read more, check out [API DOC](endpoint.md)