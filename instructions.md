Congratulations! You have configured `@adonisjs/shield` package successfully. Just make sure to add the following middleware inside the `start/kernel.ts` file.

```ts
Server.middleware.register([
  () => import('@ioc:Adonis/Core/BodyParser'),
  () => import('@ioc:Adonis/Addons/Shield')
  '...',
])
```

**The middleware must be right after the `BodyParser` middleware.**
