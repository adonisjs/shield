Congratulations! You have configured `@adonisjs/shield` package successfully. Just make sure to add the following middleware inside the `start/kernel.ts` file.

```ts
Server.middleware.register([
  'Adonis/Core/BodyParserMiddleware',
  'Adonis/Addons/ShieldMiddleware',
  '...',
])
```

**The middleware must be right after the `BodyParserMiddleware`.**
