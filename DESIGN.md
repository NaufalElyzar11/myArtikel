# DESIGN.md: Naufal Elyzar Engineering Portfolio

## 1. Identity & Domain
- **Subject:** Naufal Elyzar, S1 Teknologi Informasi, Fakultas Teknik, Universitas Lambung Mangkurat (Banjarbaru, Kalimantan Selatan).
- **Positioning:** Multi-Disciplinary Hardware & Software Builder:
  1. **Robotics, Embedded & Assistive Tech Engineer** (ROS2, Inverse Kinematics, Computer Vision, Custom PCB & 3D-Printed Enclosures)
  2. **Web, Cloud & Mobile App Developer** (Laravel 12, CodeIgniter 4, Express.js, React/TypeScript, Flutter, Firebase/Firestore, Docker)
  3. **Co-Founder & Lead Technologist at CetakIn** (`https://cetak-in.my.id/`, Digital Manufacturing, Custom 3D Printing, Interactive 2D Clicker Configurator, Robotics Component Hub, and Multi-Unit Cloud ERP)
  4. **Robotics & IoT Educator / Technical Mentor** (Workshop Speaker, Extracurricular Robotics Instructor, and National Competition Team Mentor)

## 2. Visual Direction & Personality
- **Aesthetic Archetype:** *Industrial Field Log & Editorial Telemetry*.
- **Mood:** Warm dark slate canvas (`#12110C`) paired with high-visibility amber (`#E2A92B`) and bone-white ink (`#F2EFE6`), inspired by mechatronics workbench instruments, CAD blueprints, and field research dossiers.
- **Anti-Slop Commitments:**
  - Zero fabricated metrics, stock photos, or fictional testimonials (`R-17`, `R-18`, `R-36`).
  - Zero em dashes in prose, UI labels, or simulator logs (`R-02`).
  - Zero decorative OS emojis on buttons or controls; all status and color indicators use crisp CSS geometry or inline SVG (`R-04`).
  - Zero infinite pulsing status dots or pill badges parked above `h1` (`R-09`, `R-13`, `R-19`).
  - Minimum `44px x 44px` tap targets on all interactive controls across mobile and desktop (`R-03`).

## 3. Liveliness Dials (`R-37`)
- **`ENERGY: 6` (Grounded Editorial + Technical Cutout):** Structured asymmetric grid with an out-of-bounds layered portrait composition and interactive hardware/software laboratories.
- **`RHYTHM: 6` (Varied Section Pacing):** Alternates between the asymmetric editorial Hero/About dossier, Flagship Hardware Case Studies, Full-Stack Web/Mobile & Venture Showcase, Interactive Telemetry Simulator Lab, Educator Track Record, and Verified Certificate Vault.
- **`MOTION: 4` (State-Driven & Functional):** Motion is strictly tied to user input (hexapod gait servo kinematics, color sensor classification, filter transitions, and lightbox inspection). All animations respect `prefers-reduced-motion: reduce`.

## 4. Color Palette & Verified WCAG Contrast (`R-25`)
Verified using `contrast-check.py`:
- `--paper` (`#12110C`): Primary background canvas.
- `--paper-elev` (`#1A1812`): Secondary section surface.
- `--paper-card` (`#201D15`): Elevated card and simulator enclosure surface.
- `--ink` (`#F2EFE6`): Primary text (`16.44:1` on `--paper`, `14.63:1` on `--paper-card`, AAA).
- `--ink-muted` (`#B5AE9E`): Secondary body copy (`8.56:1` on `--paper`, `7.62:1` on `--paper-card`, AAA).
- `--ink-faint` (`#8C8575`): Metadata, timestamps, and technical captions (`4.87:1` on `--paper`, `4.34:1` on `--paper-elev`, passing AA).
- `--accent` (`#E2A92B`): Industrial Amber for active states, primary CTAs, and CAD callouts (`8.95:1` on `--paper`, `7.97:1` on `--paper-card`, AAA).
- `--signal-ok` (`#2ECC71`), `--signal-warn` (`#F39C12`), `--signal-danger` (`#E74C3C`): Functional telemetry indicators.

## 5. Typography & Hierarchy (`R-11`, `R-23`)
- **Display (`--font-display`):** `'Syne', sans-serif` (700, 800) with tight tracking (`-0.03em`) and `text-wrap: balance` on headlines.
- **Body (`--font-sans`):** `'Plus Jakarta Sans', sans-serif` (400, 500, 600, 700) with comfortable reading measure (`60ch` to `70ch`) and `text-wrap: pretty`.
- **Technical / Monospace (`--font-mono`):** `'JetBrains Mono', monospace` with `font-variant-numeric: tabular-nums` for live sensor telemetry, credential IDs, and coordinate labels.

## 6. Portrait Placement Concept ("Out-of-Bounds CAD Blueprint Cutout")
Instead of pasting a flat rectangular photo into a box, the About/Hero portrait uses a **3-Layer Editorial Cutout Composition**:
1. **Back Layer (CAD Coordinate Grid & Chamfered Frame):** An angled polygon frame with technical crosshairs, location telemetry (`03°27'S 114°50'E // BANJARBARU`), and amber corner brackets.
2. **Middle Layer (Subject Cutout / Framed Figure):** The subject breaks out of the top/side frame boundary (`overflow: visible` on the upper silhouette with drop-shadow depth and subtle rim-light gradient), supported by a pose/photo switcher (Formal ULM Almamater vs. Field/Studio Pose).
3. **Front Layer (Floating Role Callout Chips):** Anchored technical badges around the portrait highlighting the 4 core identities (*Robotics & IoT*, *Web & Mobile Dev*, *Co-Founder @ CetakIn*, *Technical Educator*).

### Guide for Replacing with Your New Personal Photo Later
- **Recommended Pose:** Medium shot (waist-up or chest-up), body angled 15 to 30 degrees toward the text column, looking toward the camera or holding a hardware prototype / controller / laptop.
- **File Format:** Transparent PNG (`800 x 1000 px` or `900 x 1125 px`, `.webp` or `.png` with background removed via remove.bg / Photoshop).
- **Drop-in Path:** Save as `assets/images/profile/portrait-cutout.png` (or update the `src` on `#aboutPortraitImg` in `index.html`). The `.portrait-stage--cutout` CSS class automatically scales the subject so the head and shoulders rise above the chamfered CAD frame.

## 7. Purpose-Gate Documentation (`R-06`, `R-07`, `R-31`)
- **Interactive Engineering Simulators (`#lab` and `projects/*/index.html`):** Monospace readouts in the simulators represent real-time mathematical outputs of each project's control algorithm (3-DOF leg angle kinematics for HEXAKA, load-cell honey weight + BME280 alerts for Mangrovepreneurs, TCS3200 RGB distance classification for TekSif). They are interactive educational instruments, not decorative fake code.
