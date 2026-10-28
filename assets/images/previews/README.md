# Actual application captures

Captured on 28 October 2026. These JPEGs are browser screenshots of applications rendered from their original source. They are not generated mockups or reconstructed HTML interfaces.

| Project | Original presentation source | Capture environment |
| --- | --- | --- |
| CetakIn | Public HTML, CSS, JavaScript, and project assets | Local static copy; production catalog/order integrations disabled |
| Si-Cuti / PKL Kominfo | `C:\laragon\www\PKL-Kominfo` Blade templates, compiled assets, and controllers | Isolated Laravel copy with synthetic employees and leave records in SQLite |
| Banua-Tour | `C:\laragon\www\uas-web-ii` CodeIgniter views, assets, and controllers | Isolated copy with synthetic catalog, accounts, and booking data in SQLite |
| MyAnimeRent | `F:\Projects\myAnimeRent\myanimerent` Flutter screens and widgets | Original presentation files; Firebase replaced by local in-memory services for capture |
| E-Ponic | Source checkout of `NaufalElyzar11/e-ponic` | Original Flutter presentation files; local in-memory database/auth and no-op alarm services |
| Vortex Cloud | Download of `raihan2030/proyek-cloud-computing`, commit `3479c98` | Original Blade views and source-built CSS/JS; SQLite and in-memory storage usage fixtures; no AWS calls |

Names, identifiers, prices, dates, stock, and operational figures in demo databases are examples, not production records. Images embedded by the original apps come from their existing project assets. Text inside screenshots remains in the app's original language; portfolio descriptions and accessible captions support ID/EN.

Vortex Cloud's locked Laravel 13 / Symfony 8 dependency set requires PHP 8.4 or newer. The capture machine has PHP 8.3, so the isolated capture runtime used compatible installed Laravel 12 dependencies and a configuration-constant compatibility alias. The original Blade views, controllers, routes, CSS, and JavaScript were retained; only a local fixture sign-in route and storage data adapter were added for capture. The original frontend build completed successfully.

`manifest.json` records each screenshot's dimensions, capture route, caption, and SHA-256 hash. Do not edit screenshots to suggest features or results that the application does not show. Replace an image by rerunning the original app and capturing it again; update its metadata and hash afterward.

Local capture runtimes, fixture databases, SDK output, and downloaded source archives are excluded from Git under `scratch/actual-previews/`. They are not needed by the deployed portfolio, which serves only the captured image assets and static detail pages.
