[<< Back to index](index.md)

# Architecture

## Basics

Basically the whole API is nothing more than a tree of object. Each endpoint is a tree node.

The root node has more methods than its children and is treated a bit differently.

When endpoint() method (or any of the convenience methods like post() or get() ) are called on a node, it will instantiate a new RipApiEndpoint class, set its parent to the node the method was called on and return the new node for chaining purposes.

Usually you will call end() method after adding a new endpoint (node). end() method simply returns node's parent.

This allows you to easily chain and stack endpoints.

Each endpoint can be called as a function. This will return a promise which will be resolved by $http.

## Headers

Each endpoint can have a set of headers attached to it. This is called by calling header() or addHeaders() methods.

When calling an endpoint, it will pickup all the parent headers. So lets say if you have this configuration:

    $apiProvider
        .get('deep').header('Custom-Header', 'Custom').header('Other-Header', 'Other')
            .get('deeper').header('More-Header', 'More')
                .get('deepest').header('Custom-Header', 'Deepest').header('Last-Header', 'Last').end()
            .end()
        .end()
    ;
    
The endpoint 'deepest' will have the following headers:

    Custom-Header: Deepest
    Other-Header: Other
    More-Header: More
    Last-Header: Last
    
As you may have noticed the 'deepest' endpoint overrides Custom-Header defined in 'deep' endpoint. Other headers are picked up

## Fields and strict endpoints

Each endpoint can have fields defined. By default the body of the request sends everything you throw at it. This may not always be desired.

If you want request body to include only defined fields, set your endpoint to be strict

    $apiProvider
        .post('user')
            .addFields({
                username: 'text',
                password: 'text'
            })
            .setStrict()
        .end()
        
Now if you call this endpoint with many parameters, it will send only username and password fields

    // Will only send send username and password as this is configured as strict
    $api('user')(null, {
        field1: 'bla bla',
        username: 'usr',
        other: true,
        something: false,
        password 'pass',
        foo: 'bar'
    });
    
Though I do discourage this approach as it will limit refactoring speeds
