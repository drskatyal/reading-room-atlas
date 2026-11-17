# ReadingRoom Atlas

**3D Radiology Anatomy • Zero-PHI PACS Physics • 1-Click PowerScribe Sign-Out**

A radiologist-built interactive workstation and teaching atlas engineered to outperform static reference decks and slow WebGL viewers on hospital PACS/Citrix PCs.

## 5 Live Clinical Modules (Zero "Coming Soon" Gates)

1. **Knee MRI & Biomechanics (`3T MRI`)**
   - 3D femur, tibia, fibula, patella, articular cartilage, ACL, PCL, MCL, LCL, and medial/lateral menisci with dynamic flexion (`0°–85°`) and X-ray translucent bones.
   - Pathology presets: Bucket-Handle Medial Meniscal Tear (*Double PCL* + *Absent Bow-Tie*), Complete ACL Tear (*Pivot-Shift Kissing Contusions*), O'Donoghue Unhappy Triad, Posterior Horn Tear + Parameniscal Cyst, Complete PCL Tear.
   - Synchronized 2D Sagittal / Coronal / Axial viewer across **PD**, **T2-FS**, and **T1** with mouse-wheel slice scrolling and Shift/Right-drag Window/Level (`W/L`).

2. **Carotid & Vertebral Doppler Lab (`US / PW`)**
   - 3D CCA, Carotid Bulb, ICA, ECA (with Superior Thyroid Artery landmark), IJV, Vagus Nerve, Vertebral Artery, and dynamic plaque/stenotic jet.
   - Live animated B-Mode + Color Doppler aliasing mosaic + 60 fps Pulsed-Wave (PW) Spectral Doppler trace (ICA, ECA with **Temporal Tap**, Vertebral pre-steal & subclavian steal) + **Spencer Curve** + **SRU 2003** consensus calculator.

3. **Temporal Bone & IAC (`HRCT + MRI`)**
   - Instant-load (`< 50 ms`) 3D 2.5-turn cochlea, vestibule, 3 orthogonal semicircular canals, ossicular chain (malleus/incus/stapes), CN VII course, and IAC CN VIII bundles.
   - Synchronized **Axial HRCT**, **Coronal HRCT**, **Pöschl Oblique** (SSCD roof defect), **Stenvers Oblique**, and **IAC CISS MRI** (*"7-Up, Coke-Down"*).

4. **Thyroid TI-RADS & Neck US (`US 15MHz`)**
   - 3D thyroid lobes, isthmus, trachea rings, esophagus, **Recurrent Laryngeal Nerves** in the tracheoesophageal groove, parathyroids, and carotid sheath.
   - Live Linear 15 MHz B-Mode + Color Doppler synthesis paired with the **ACR TI-RADS 2017** point matrix and exact FNA / Follow-up size thresholds (`2.5 / 1.5 / 1.0 cm`).

5. **Liver LI-RADS v2018 & Couinaud (`4-Phase CT/MR`)**
   - 3D Couinaud Segments I–VIII bounded by Right/Middle/Left Hepatic Veins (Cantlie line) and Portal Vein bifurcation.
   - 4-Phase Dynamic CT/MRI viewer (Pre-contrast, Arterial, Portal Venous, Delayed/HBP) with Time-Intensity Enhancement Curve and full **ACR LI-RADS v2018** classifier (`LR-1` to `LR-5`, `LR-M`, `LR-TIV`).

## Workstation Productivity & Teaching Features
- **1-Click Sign-Out Sidecar**: Live PowerScribe/Fluency-ready structured Findings, Impression, and Recommendations + ABR Core / FRCR 2B / EDiR Board Pearls.
- **Global Search (`Ctrl+K`)**: Jump instantly to any module, anatomical sign (*Double PCL*, *SSCD*, *7-Up*), or RADS calculator.
- **Conference Presenter Mode (`F`) & Screen Blanking (`B`)**: Distraction-free teaching projection.
- **9:16 Instagram Reel Studio**: Composites synchronized 3D + 2D PACS views with storyboard captions into downloadable `.webm` vertical clips.
- **Obsidian Dark & Parchment Light Themes**.

## Development & Verification

```bash
npm install
npm test        # Vitest clinical calculator & report engine suite
npm run build   # TypeScript check + Vite production bundle
npm run start   # Express production server on $PORT (default 3000) with /health
```

## Deploying to Railway

1. Connect this GitHub repository to your Railway project.
2. Railway automatically uses `railway.json` and `nixpacks.toml` (`npm ci && npm run build`, start `npm run start`, healthcheck `/health`).

## Using Your OpenAI Codex CLI Subscription Locally

If you want to run your OpenAI Codex CLI subscription against this codebase on your own computer:

```bash
git clone https://github.com/<your-username>/reading-room-atlas.git
cd reading-room-atlas
npm install
codex
```
