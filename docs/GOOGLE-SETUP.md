# Getting Blue-Tech onto Google, Facebook, Instagram and WhatsApp

Everything technical is already built: a sitemap, pre-built pages with product data for Google
and link previews, and live product feeds. These steps connect your accounts. Each takes 5–15
minutes.

## 1. Google Search Console (be found on Google)

1. Go to <https://search.google.com/search-console> and sign in with the Google account you want
   to own the site.
2. **Add property → URL prefix** → `https://blue-tech.onrender.com/`.
3. Choose **HTML tag**. Copy only the code inside `content="…"`.
4. Render dashboard → the **blue-tech** site → **Environment** → add
   `VITE_GOOGLE_SITE_VERIFICATION` = that code → **Save, rebuild and deploy**.
5. When the deploy finishes, press **Verify** in Search Console.
6. **Sitemaps** → enter `sitemap.xml` → **Submit**.

Within a few days Search Console shows which searches bring people to the shop, and flags any
page Google can't read.

## 2. Google Merchant Center (free product listings)

1. Go to <https://merchants.google.com>, create the account (business: Blue-Tech, Kigali).
2. Check that **Rwanda** is available as a selling country. Free listings and Shopping ads are
   not offered in every country; if Rwanda isn't, keep the account ready for when it is.
3. **Products → Add products → Add from a file → Enter a link to your file** → paste the
   Google feed link from **Admin → Settings → Product feeds** → schedule: **daily**.

## 3. Meta Commerce Manager (Facebook, Instagram and WhatsApp catalogue)

1. Go to <https://business.facebook.com/commerce> with the Facebook account that manages the
   Blue-Tech page.
2. **Catalogue → Data sources → Add items → Data feed → Use a URL** → paste the Meta feed link from
   **Admin → Settings → Product feeds** → **daily**.
3. To show the catalogue in WhatsApp Business: WhatsApp Business app → **Settings → Business tools
   → Catalogue** → connect the same catalogue.
4. Optional: add your **Meta Pixel ID** and **Google Analytics ID** in **Admin → Settings →
   Analytics** to see which ads bring buyers (visitors are asked for consent first).

## 4. Keep the pre-built pages fresh (2 minutes)

Product pages for Google and WhatsApp previews are built at each deploy. To refresh them every night:

1. Render dashboard → **blue-tech** → **Settings → Deploy Hook** → copy the URL.
2. Save it as a Supabase secret:
   ```bash
   npx supabase secrets set RENDER_DEPLOY_HOOK="https://api.render.com/deploy/srv-…?key=…"
   ```
   The shop then rebuilds itself once a night.

## 5. The biggest single step: your own domain

`blue-tech.onrender.com` works, but a domain such as **blue-tech.rw** (from a Rwandan registrar,
via RICTA) or **bluetech.rw** helps Google rank you, makes links trustworthy in WhatsApp, and
keeps your address if you ever change hosting.

When you have one:
1. Render → **Settings → Custom Domains** → add it and follow the DNS steps.
2. Set `VITE_SITE_URL=https://your-domain` on Render (sitemap, pre-built pages and links use it).
3. Add the new domain to `ALLOWED_ORIGINS` in the Supabase secrets.
4. In Search Console, add the new domain as a property, then use **Change of address**.
