# Restocq website rebuild

Modern, mobile-first rebuild of [restocq.com](https://restocq.com) as a fast static site.
No framework, no build dependencies beyond Python 3 for the (optional) page assembler.
Deploys anywhere that serves static files: Vercel, Netlify, GitHub Pages, SiteGround.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home: photo-collage hero, supplier marquee, bento feature grid with built-in UI mockups, results band, mixed-orientation video wall, testimonial spotlight + marquee, press tiles, community photo mosaic, latest insights, CTA |
| `how-it-works.html` | Features, 3-step getting started, case study teaser, press logos |
| `pricing.html` | Plus / Premium with monthly / annual toggle, inclusions, FAQ |
| `testimonials.html` | Videos, all 6 testimonials, case study stats |
| `case-study-my-dental-team.html` | Full My Dental Team case study ($132K saved) |
| `our-story.html` | Founders, mission, values |
| `rewards.html` | The Restocq Collective, all 13 partners (anchors used by footer links) |
| `insights.html` | All 30 blog posts (currently linking to the live WordPress posts, see "Before go-live") |
| `contact.html` | Contact cards + enquiry form |
| `thank-you.html`, `privacy-policy.html`, `terms-of-use.html`, `404.html` | Supporting pages |

## Structure

```
assets/css/styles.css      design system (brand orange #FE915B from the logo, navy #0F1F3D)
assets/js/main.js          floating navbar (sliding indicator, Platform mega-menu), full-screen mobile menu, reveal animations, click-to-play Vimeo facades, pricing toggle, forms, offer popup
assets/img/                logo, favicons (remote images land here after localising, see below)
src/partials/              head.html, header.html, footer.html + blocks/ (features, testimonials, videos, press, cta, suppliers)
src/pages/*.html           page bodies with a JSON front-matter comment (title, description)
tools/build.py             assembles src/ into the root HTML files + sitemap.xml
tools/localise-assets.py   downloads the restocq.com images into assets/img and rewrites paths
```

To change the header or footer, edit `src/partials/*.html` and run `python3 tools/build.py`.
The built HTML in the root is what gets deployed.

## Design notes

- Brand palette and type are taken from the live site's Elementor kit: orange `#FF9859`, purple `#4A0094`, plum `#261141`, lilac `#EEEDFE`, peach `#FFE0CC`; DM Sans for headings, Heebo for body.
- Most of the client's imagery is transparent cut-outs (hero figure, team photo, laptop graphics), so those render without card backgrounds. Event photos are used across the home page (hero collage, results band, testimonial spotlight, mosaic, CTA, mega-menu card).
- Videos: Vimeo 1118995180 is 16:9, 931781557 and 1100499032 are 9:16. The video wall lays them out accordingly and loads the player only on click (poster images come from Vimeo's CDN).
- The feature grid's small UI mockups are plain HTML/CSS with illustrative numbers. Swap them for real product screenshots in `src/partials/blocks/features.html` if preferred.

## Before go-live (checklist)

1. **Localise the images.** The site currently hotlinks images from the live WordPress uploads folder so it works immediately. Run `python3 tools/localise-assets.py` then `python3 tools/build.py` from any machine that can reach restocq.com. This copies every image into `assets/img/` and rewrites the paths. Do this before the old host is switched off.
2. **Paste the legal text.** `privacy-policy.html` and `terms-of-use.html` contain a yellow notice where the current Privacy Policy and Terms of Use need to be pasted in from the live site (legal copy was deliberately not paraphrased). The live Terms list `support@restocqold.gyaclients.com` as the support address; correct that to `support@restocq.com`.
3. **Wire up the forms.** In `assets/js/main.js` set `FORM_ENDPOINT` to a Formspree / HubSpot Forms / SMTP2GO endpoint. Until then, the contact and newsletter forms fall back to opening a pre-filled email to support@restocq.com.
4. **Blog posts.** `insights.html` lists all 30 posts but links to the existing `restocq.com/YYYY/MM/DD/slug/` URLs. Either keep WordPress serving the posts (e.g. under a `blog.` subdomain) or export them and add static post pages. Keep the old URLs or add 301 redirects to protect SEO.
5. **Offer popup.** The footer includes the current `discount-pricing-popup.jpg` promo, shown once per session after 9 seconds. Change `POPUP_DELAY_MS` in `main.js`, or remove the `.popup` block from `src/partials/footer.html` when the promo ends.
6. **Check the founder photos.** `about1.png` is mapped to Dr Stephan Kantharajah and `about2.png` to Dr Namita Gupta (the order they appear on the current site). Swap the two `src` values in `src/pages/our-story.html` if they are the wrong way round.
7. **Redirects.** Old WordPress URLs map as: `/how-restocq-works/` → `how-it-works.html`, `/our-story/` → `our-story.html`, `/contact-us/` → `contact.html`, `/built-for-dental-teams-like-yours/` → `case-study-my-dental-team.html`, partner pages (`/ripe-global/` etc.) → `rewards.html#ripe-global`. `vercel.json` already contains these; replicate in `.htaccess` for SiteGround.
8. **Analytics.** Add the GA4 / HubSpot tracking snippet to `src/partials/head.html` and rebuild.

## Content amendments made during the rebuild

- Pricing page: the live site had a third, unlabelled set of prices ($89 / $165) with buttons linking to `#`. Only the Monthly ($95 / $195) and Annual ($85 / $175) sets are shown. The "Most popular" flag on Premium and the FAQ are new.
- Contact page phone link was a `mailto:` on the live site; now a proper `tel:` link.
- All copy uses Australian English and consistent capitalisation (e.g. "Dr Namita Gupta" without the full stop).
- Getting-started steps had titles only; short descriptions were added.
- The 9 feature blocks linked to `#` on the live site; they are now plain cards.
- The "Benefits" feature is titled "Member benefits" for clarity.

## Deploy

**Vercel / Netlify:** import the repo, no build command, output directory `/`. Clean URLs and redirects are in `vercel.json`.

**SiteGround (or any Apache host):** upload everything except `src/` and `tools/` to `public_html`. Add rewrite rules to `.htaccess` for clean URLs if wanted.

**GitHub Pages:** push to `main`, enable Pages from the root. `.nojekyll` is included.

## Local preview

```
python3 -m http.server 8080
```
then open http://localhost:8080
