import json
from pathlib import Path

ROOT = Path(r"f:\Projects\Web Pribadi")

# 1. Update translations.js
trans_file = ROOT / "assets" / "js" / "translations.js"
trans_text = trans_file.read_text(encoding="utf-8")

prefix = "window.siteTranslations = "
suffix = ";"
idx_start = trans_text.index(prefix) + len(prefix)
idx_end = trans_text.rindex(suffix)

json_str = trans_text[idx_start:idx_end].strip()
data = json.loads(json_str)

# Update entries
data["home.certs.fAll"] = {
    "id": "Semua (17)",
    "en": "All (17)"
}
data["home.certs.fAi"] = {
    "id": "AI, Robotika & Software (7)",
    "en": "AI, Robotics & Software (7)"
}
data["home.certs.fLead"] = {
    "id": "Kepemimpinan & Pengabdian (4)",
    "en": "Leadership & Community (4)"
}
data["home.edu.1.org"] = {
    "id": "Penyelenggara: HMTI Fakultas Teknik ULM · No: 281/UN8.1.31.7/SP/2026",
    "en": "Organizer: Information Technology Student Association (HMTI) FT ULM · Ref: 281/UN8.1.31.7/SP/2026"
}
data["home.cert.hmtiIot.title"] = {
    "id": "Narasumber Workshop IoT: \"Zero to Smart Device\"",
    "en": "Keynote Speaker: IoT Workshop \"Zero to Smart Device\""
}
data["home.cert.hmtiIot.desc"] = {
    "id": "Sertifikat penghargaan sebagai Narasumber dalam Workshop Internet of Things yang diselenggarakan oleh Himpunan Mahasiswa Teknologi Informasi, Fakultas Teknik Universitas Lambung Mangkurat. No: 281/UN8.1.31.7/SP/2026.",
    "en": "Certificate of honor as Speaker in the Internet of Things Workshop organized by the Information Technology Student Association (HMTI), Faculty of Engineering, Lambung Mangkurat University. Ref: 281/UN8.1.31.7/SP/2026."
}

new_json_str = json.dumps(data, indent=2, ensure_ascii=False)
new_trans_text = f"window.siteTranslations = {new_json_str};\n"
trans_file.write_text(new_trans_text, encoding="utf-8")
print(f"Updated translations.js: now {len(data)} entries")

# 2. Update index.html
html_file = ROOT / "index.html"
html_text = html_file.read_text(encoding="utf-8")

# Replace educator card 1
old_edu_card = """          <article class="edu-card reveal">
            <div class="edu-card__media">
              <div class="edu-placeholder">
                <span class="edu-placeholder__code">DOC_SLOT // IOT_2026</span>
                <strong data-i18n="home.edu.1.badge">Narasumber Workshop IoT</strong>
                <span class="edu-placeholder__note" data-i18n="home.edu.photoPending">Slot Dokumentasi Foto (Menyusul)</span>
              </div>
            </div>
            <div class="edu-card__body">
              <div class="edu-card__meta">
                <span class="edu-card__date" data-i18n="home.edu.1.date">Agustus 2026</span>
                <span class="edu-card__tag" data-i18n="home.edu.1.role">Narasumber Utama</span>
              </div>
              <h3 class="edu-card__title" data-i18n="home.edu.1.title">Workshop Internet of Things: "Zero to Smart Device"</h3>
              <p class="edu-card__desc" data-i18n="home.edu.1.desc">
                Membawakan materi dan praktik langsung pembuatan perangkat pintar dari nol: mulai dari pengenalan arsitektur IoT, pembacaan sensor pada mikrokontroler ESP32, hingga pengiriman telemetri real-time ke antarmuka pemantauan.
              </p>
            </div>
          </article>"""

new_edu_card = """          <article class="edu-card reveal">
            <div class="edu-card__media">
              <a href="./assets/images/certificates/cert-hmti-iot-workshop-2026.webp" target="_blank" rel="noreferrer" class="edu-card__media-link" aria-label="Lihat Sertifikat Narasumber Workshop IoT HMTI FT ULM 2026">
                <img src="./assets/images/certificates/cert-hmti-iot-workshop-2026.webp" alt="Sertifikat Narasumber Workshop Internet of Things Zero to Smart Device HMTI FT ULM Naufal Elyzar" width="1200" height="810" loading="lazy" decoding="async" class="edu-card__img" />
              </a>
            </div>
            <div class="edu-card__body">
              <div class="edu-card__meta">
                <span class="edu-card__date" data-i18n="home.edu.1.date">Agustus 2026</span>
                <span class="edu-card__tag" data-i18n="home.edu.1.role">Narasumber Utama</span>
              </div>
              <h3 class="edu-card__title" data-i18n="home.edu.1.title">Workshop Internet of Things: "Zero to Smart Device"</h3>
              <p class="edu-card__org" data-i18n="home.edu.1.org">Penyelenggara: HMTI Fakultas Teknik ULM · No: 281/UN8.1.31.7/SP/2026</p>
              <p class="edu-card__desc" data-i18n="home.edu.1.desc">
                Membawakan materi dan praktik langsung pembuatan perangkat pintar dari nol: mulai dari pengenalan arsitektur IoT, pembacaan sensor pada mikrokontroler ESP32, hingga pengiriman telemetri real-time ke antarmuka pemantauan.
              </p>
            </div>
          </article>"""

# Replace in html
# Normalize CRLF/LF for matching
html_text = html_text.replace(old_edu_card.replace("\r\n", "\n"), new_edu_card)
html_text = html_text.replace(old_edu_card, new_edu_card)

# Update cert filter counts
html_text = html_text.replace(
    '<button type="button" class="cert-filter" data-cert-filter="all" aria-pressed="true" data-i18n="home.certs.fAll">Semua (16)</button>',
    '<button type="button" class="cert-filter" data-cert-filter="all" aria-pressed="true" data-i18n="home.certs.fAll">Semua (17)</button>'
)
html_text = html_text.replace(
    '<button type="button" class="cert-filter" data-cert-filter="ai" aria-pressed="false" data-i18n="home.certs.fAi">AI, Robotika &amp; Software (6)</button>',
    '<button type="button" class="cert-filter" data-cert-filter="ai" aria-pressed="false" data-i18n="home.certs.fAi">AI, Robotika &amp; Software (7)</button>'
)
html_text = html_text.replace(
    '<button type="button" class="cert-filter" data-cert-filter="lead" aria-pressed="false" data-i18n="home.certs.fLead">Kepemimpinan &amp; Pengabdian (3)</button>',
    '<button type="button" class="cert-filter" data-cert-filter="lead" aria-pressed="false" data-i18n="home.certs.fLead">Kepemimpinan &amp; Pengabdian (4)</button>'
)

# Insert new cert card right after cert-best-2026
best_card_end = """              <div class="cert-card__actions">
                <a class="btn btn--ghost btn--sm" href="./assets/images/certificates/cert-best-2026.webp" target="_blank" rel="noreferrer" data-i18n="home.cert.viewImg">Lihat Sertifikat ↗</a>
              </div>
            </div>
          </article>"""

new_cert_card = """

          <article class="cert-card cert-card--visual" data-cert-category="ai lead">
            <div class="cert-card__img">
              <img src="./assets/images/certificates/cert-hmti-iot-workshop-2026.webp" alt="Sertifikat Narasumber Workshop Internet of Things HMTI FT ULM Naufal Elyzar" width="1200" height="810" loading="lazy" decoding="async" />
            </div>
            <div class="cert-card__body">
              <div class="cert-card__meta">
                <span class="cert-card__issuer">HMTI FT ULM</span>
                <span class="cert-card__date">Agustus 2026</span>
              </div>
              <h3 class="cert-card__title" data-i18n="home.cert.hmtiIot.title">Narasumber Workshop IoT: "Zero to Smart Device"</h3>
              <p class="cert-card__desc" data-i18n="home.cert.hmtiIot.desc">
                Sertifikat penghargaan sebagai Narasumber dalam Workshop Internet of Things yang diselenggarakan oleh Himpunan Mahasiswa Teknologi Informasi, Fakultas Teknik Universitas Lambung Mangkurat. No: 281/UN8.1.31.7/SP/2026.
              </p>
              <div class="cert-card__actions">
                <a class="btn btn--ghost btn--sm" href="./assets/images/certificates/cert-hmti-iot-workshop-2026.webp" target="_blank" rel="noreferrer" data-i18n="home.cert.viewImg">Lihat Sertifikat ↗</a>
              </div>
            </div>
          </article>"""

if "cert-hmti-iot-workshop-2026.webp" not in html_text:
    # insert after best card
    pos = html_text.find(best_card_end)
    if pos != -1:
        insert_at = pos + len(best_card_end)
        html_text = html_text[:insert_at] + new_cert_card + html_text[insert_at:]
        print("Inserted new cert card successfully.")
    else:
        print("WARNING: best_card_end not found!")

html_file.write_text(html_text, encoding="utf-8")
print("Updated index.html successfully.")
