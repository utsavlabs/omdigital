# Vercel Serverless Functions

This directory (`api/`) is the designated location for future backend serverless functions. 
Currently, the `omdigital` portfolio is fully static and does not require active server-side code (inquiries are handled natively via WhatsApp).

If future backend logic is needed (e.g., handling webhooks, sending emails, processing payments), you can drop serverless functions here. 

For example, creating `api/hello.js` will automatically deploy as an endpoint at `/api/hello` on Vercel.

**Note:** Ensure any secrets required by these functions are stored securely in Vercel Environment Variables and not hardcoded.
