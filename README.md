[Documentation](docs/index.md) | [API DOC](docs/endpoint.md) | [Plugins](docs/plugins.md)

# AngularJS RIP API

This module is intended to speed up the process of integrating different APIs to your Angular application.

Pull requests with optimizations and bugfixes are always welcome.

## Getting started

### Installation

You should use Bower to install this module

    bower install --save angular-rip-api
    
After the module is downloaded include the following JavaScript to your application

`./bower_components/angular-rip-api/angular-rip-api.js`

### Configuration

The module is provided as `rip.api`;
It includes `$apiProvider` for your configuration needs

    angular.module('yourApp', ['rip.api'])
    
    .config(function($apiProvider) {
        
        // Set up root url of your API
        $apiProvider.rootUrl('http://api.test.com');
        
        // Set a custom header
        $apiProvider.header('Custom-Header', 'Value');
        
        // Or multiple headers
        $apiProvider.setHeaders({
            'Another-Header': 'Val',
            'More-Header': 'Mor'
        });
        
        // Set up endpoints of your Api
        $apiProvider
        
            // You can set simple single endpoints if you want.
            // The call the method name with signature ( name, path )
            .get('index', '/index').end()
            .post('register', '/register').end()
            
            // All methods are nestable and chainable
            .get('user', '/:users')
                .get('single', '/:id').end()
                .post('create', null).end()
                .put('edit', '/:id').end()
                .delete('remove', '/:id').end()
            .end() // end 'user'
            
            // Theres also a convenience method to create CRUDS
            // The signature is (name, path, replaceable)
            .crud('participant', '/participants', ':ptcp').end()
            
            // You can make this as deep as you want, also while overriding headers
            .get('deep', '/deep/:dp').header('Custom-Header', 'DEEP')
                .get('deeper', '/deeper/:dpr').header('Custom-Header', 'DEEPER')
                    .deepest('deepest', '/deepest/:dpst').end().header('Custom-Header', 'DEEPEST')
                .end() // end 'deeper'
            .end() // end 'deep'
        ;
    })
    
### Using the $api

Api service is injected as `$api`

    angular.module('yourApp')
    
    .controller('YourController',
        function YourController( $api, $scope ) {
            
            var body = {
                name: 'Hello',
                surname: 'World'
            };
            
            // Get the endpoint object. This was defined in config. 'create' was nested under 'user'
            var ep = $api('user.create');
            
            // Now you can simply call your endpoint. This will return a promise. Same as $http.
            // Second argument is request body
            ep(null, body)
                .then(function(data) {
                    alert(data.data);
                }, function(error) {
                    alert('Error: ' + error);
                });
                
            // It is much simpler to connect the above two. The first argument is replace.
            // The url will resolve to http://api.test.com/users/:id
            // Then the :id will be replaced by the value provided in the first argument object
            $api('user.edit')({ id: 5 }, body)
                .then(function(data) {
                    alert('Edited');
                });
                
            // There's also a third argument which is GET parameters
            // The path will resolve to http://api.test.com/users?limit=0
            $api('user')(null, null, { limit: 0 })
                .then(function(data) {
                    $scope.userList = data.data;
                });
                
            // This also works with deep stacks
            // The path will resolve to http://api.test.com/deep/1/deeper/cool/deepest/5
            $api('deep.deeper.deepest')({ dp: 1, dpr: 'cool', dpst: 5 });
            
        });

## TODO

* Multiple environments (changing root node path non destructively)
* Attach / detach nodes
* Data transformers
* Events
* Hooks / interceptors
* OAuth integration
* Deferrable POST, PUT, PATCH in case of no internet connection (for example on mobile) (requested by business client)