# ReadingRoom Atlas

Synchronized 3T MRI Knee Teaching, Patient Demonstration & 3D Pathology Workstation designed for radiology residents, MSK fellows, and patient education.

## Clean Multi-Mode Architecture

- **Anatomy (`/anatomy`)**: Detailed collapsible 6-system anatomical tree (`16` segmented 3D structures + `17` sub-landmarks) that highlights and pins each structure in **3D** while jumping the **3T qDESS MRI** to its optimal diagnostic plane, vector callout, and toggleable MRI color segmentation map (`Off` / `16 Tissues` / `Subregions`).
- **3D Full Screen (`/3d` or `Full 3D` button)**: Distraction-free, full-viewport 3D showcase with native fullscreen support (`Monitor Full`), collapsible preset selector (`Healthy Knee` + all `8` 3D pathologies), interactive motion sliders (`Knee Bend 0°–90°`, `Patella Slip 0%–100%`), and switchable `Patient`, `Clinical`, or `Pure 3D` (no text) caption modes.
- **Pathologies (`/pathology`)**: Clean dual 3D + RAS-annotated MRI workstation covering all `8` high-yield pathologies (*Meniscal Tear Shapes*, *Bucket-Handle (Double PCL)*, *Posterior Root + Extrusion*, *ACL + Pivot-Shift*, *PCL Tear (Sag)*, *MCL & Unhappy Triad*, *Patella Dislocation & MPFL*, and *Chondral & OA Map*) with `1–2–3` focus steps and dismissible single-bar clinical notes.
- **How to Report MRI (`/report-guide`)**: Dedicated, full-page scrollable structured reporting manual featuring a sticky 7-section table of contents, orthogonal plane matrix, schematic SVG diagrams, Normal vs. Pathology comparison cards, 1-click Copy dictation snippets, complete structured report template, and direct **`View in 3D + MRI`** deep links.
- **Case Quiz (`/quiz`)**: 8 interactive pinpoint and board-style clinical vignette cases across the 3D knee and 3T MRI.

## Data & Attribution

- **Stanford OpenMSK**: In-vivo 3.0T qDESS MRI, chondral thickness maps, subregional labels, and BScore (`Goyal et al., Osteoarthritis and Cartilage Open, 2026`).
- **NIH / Cleveland Clinic Open Knee(s)**: Soft-tissue ligament/tendon morphology (`R01GM104139`, CC-BY 4.0).

## Local Development

```bash
npm ci
npm run lint
npm test
npm run build
node server.mjs
```
