[<< Back to index](index.md)

# Endpoint methods

In this case `$api` and `$apiProvider` are synonymous as they return same classes of root node.
Whenever `_endpoint` is mentioned, take note that this is not an injected service, but a node selected by finding it in deep children of root node.

## Usage (runtime)

### $api( what ) OR \_endpoint.find( what )

*String* **what** - what endpoint to find. Will search the immediate children unless stacked by period separated names

**returns** - *\_endpoint*

Will search for a child of the node.

For example

    var ep = $api('deep.deeper.deepest');
    
Will be same as

    var deep = $api('deep');
    var deeper = deep.find('deeper');
    var ep = deeper.find('deepest');
    
### \_endpoint( \[replace\], \[body\], \[params\] )

*Object* **replace** - Will replace colon defined (for example `:id`) variables in url
*Object* **body** - Will be send as HTTP body
*Object* **params** - Will be attached to url as GET params

**returns** - *Promise* same as $http service

Does the actual XHR call.

Example:
    
    $scope.loading = true;
    
    // Lets find 'user.put' endpoint and call it
    $api('user.put')({ id: $state.params.id }, $scope.user, { limit: 0 })
        // Promise is returned
        .then(function(data) {
            alert('success ' + data.data);
        }, function(error) {
            alert('error ' + data.data);
        })
        .finally(function() {
            $scope.loading = false;
        });
        
Let's assume that `$state.params.id = 5` and configured path is `users/:id` with root url being as always `http://api.test.com`.

`$scope.user` will be an object `{ username: 'hello', password: 'world' }`

Our request may look like this (depending on configuration of course):

    PUT http://api.test.com/users/5?limit=0
    
    Content-Type: application/json
    
    {"username":"hello","password":"world"}
    
### \_endpoint.top()

**returns** - *\_endpoint* Root node

Returns topmost (root) node, so you can access root url and all that stuff

### \_endpoint.header( name )

*String* **name** - Name of header to return

**returns** - *String* header value

This only returns only current endpoint headers. It does not cascade to parent headers.

### \_endpoint.getHeaders()

**returns** - *Object* key value pairs of all headers that will be used in a call.

This returns all headers that will be used in a call. This includes headers set on parent nodes.

### \_endpoint.getPath()

**returns** - *String* A full path including the root url

This returns a full path that is built all the way from the root node to the current endpoint.

This does not replace colon variables (:id)

Example:

    var path = $api('users.put').getPath();
    // path will be http://api.test.com/users/:id
    
### \_endpoint.getUrl( \[replaceables\], \[params\] )

*Object* **replaceables** - Object to replace colon variables with
*Object* **params** - Get params to attach to url

This returns a full path that is build all the way from the root node to the current endpoint.

Example:

    var path = $api('users.put').getUrl({ id: 5 }, { limit: 0 });
    // path will be http://api.test.com/users/5?limit=0
    
## Configuration usage ($apiProvider)

Note that these methods can still be used during runtime
    
### \_endpoint.endpoint( method, \[name\], \[path\] )

*String* **method** - A HTTP method endpoint will use (GET, POST, etc.)
*String* **name** - A method name that will be used in the search. Will be attached to parent names. If not provided, a lowercase method will be used.
*String* **path** - A path that endpoint will resolve to. Will be attached to parent paths. If not provided (or undefined) `/:id` will be attached to PUT, PATCH and DELETE endpoints and empty path will be used for any other cases. If explicitly set to null, empty path will be used.

**returns** - *\_endpoint* a newly created and attached endpoint

This is a lower level method to create an attach an endpoint to another endpoint (node).

It is allowed to chain and stack endpoints

Example:

    $apiProvider.endpoint('GET', 'user', '/users/:id').end();
    
Can be found by `$api('user')`. Will resolve to `http://api.test.com/users/:id`

    $apiProvider.endpoint('GET').end();
    
Can be found by `$api('get')`. Will resolve to `http://api.test.com/get`

    $apiProvider
        .get('user', '/users')
            .endpoint('PUT').end()
        .end()
    ;
    
Can be found by `$api('user.put')`. Will resolve to `http://api.test.com/users/:id`

    $apiProvider.endpoint('PUT', 'name').end();
    
Can be found by `$api('name')`. Will resolve to `http://api.test.com/:id`

    $apiProvider.endpoint('PUT', 'name', null).end();
    
Can be found by `$api('name')`. Will resolve to `http://api.test.com`

### \_endpoint.get( \[name\], \[path\] )
### \_endpoint.post( \[name\], \[path\] )
### \_endpoint.put( \[name\], \[path\] )
### \_endpoint.patch( \[name\], \[path\] )
### \_endpoint.delete( \[name\], \[path\] )

All of these are just syntactical sugar on top of .endpoint()

### \_endpoint.crud( name, \[path\], \[replaceable\] )

*String* **name** - name of base endpoint
*String* **path** - path of base endpoint. If not provided defaults to name
*String* **replaceable** - colon variable to use for PUT and DELETE. If not provided defaults to :id

A convenience method to create GET, GET, POST, PUT, DELETE endpoints

Example:

    $apiProvider.crud('user', '/users', ':usr').end();
    
    // This is same as above
    $apiProvider
        .get('user', '/users')
            .get('get', '/:usr').end()
            .post('post', null).end()
            .put('put', '/:usr').end()
            .delete('delete', '/:usr').end()
        .end()
    .end();

### \_endpoint.end()

**returns** - *\_endpoint* Parent of current endpoint. Used for chaining

### \_endpoint.setStrict( \[value\] )

*Boolean* **value** - If not provided defaults to true

Sets endpoint to strict (See [Architecture](architecture.md))

### \_endpoint.field( key, value )

*String* **key**
*String* **value**

Add a key value pair to endpoint fields

### \_endpoint.addFields( object )

*Object* **object** - Key: value pair object

Calls .field() for each key

### \_endpoint.setPath( path )

*String* **path** - path to set

Sets path to endpoint

### \_endpoint.header( header, value )

*String* **header**
*String* **value**

Adds a header with value to current endpoint

### \_endpoint.addHeaders( object )

*Object* **object** - key: value pairs

Adds more than one header to current endpoint. Calls header() for each key

## Take a look at the source

I strongly encourage you to look at the source file to see how these methods work.
