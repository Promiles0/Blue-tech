# Edge Function migration

The frontend calls one deployed function and preserves the existing route contract:

```text
https://<project-ref>.supabase.co/functions/v1/api/<route>
```

The `api` function now implements categories, products, cart, wishlist, notifications, reviews, authentication, profile, and user-order reads. The remaining payment, upload, checkout, and larger admin workflows should be added to this function only after their side effects are mapped.

## Local scaffolding

If separate functions are preferred later, scaffold them with:

```sh
supabase functions new categories
supabase functions new cart
supabase functions new wishlist
supabase functions new notifications
supabase functions new reviews
```

For the current single-router implementation, deploy the existing function:

```sh
supabase link --project-ref cfwqgpomvbqayqeghrft
supabase db push
supabase functions deploy api --no-verify-jwt
```

The service-role key is available to the function through Supabase-managed secrets only. Never put it in `Frontend/.env`.