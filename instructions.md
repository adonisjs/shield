## Register provider

Like any other provider, you need to register the shield provider inside `start/app.js` file.

```js
const providers = [
  '@adonisjs/shield/providers/ShieldProvider'
]
```

## Register middleware

Next step is to register the middleware inside `start/kernel.js` file.

**Note**: Make sure to register the middleware after the `Adonis/Middleware/Session`. 

```js
const globalMiddleware = [
  'Adonis/Middleware/Session', // after this
  'Adonis/Middleware/Shield'
]
```

## Dependencies

This module has dependencies on `@adonisjs/session` and the core `ViewProvider`. Hard exceptions will be thrown if either one is missing.


## Config

The configuration is saved inside `config/shield.js` file. Tweak it accordingly.
