# ReadingRoom Atlas — Knee 3T MRI & Meniscal / Cruciate Biomechanics

Interactive MSK radiology reading workstation pairing a **16-structure PBR 3D segmented right-knee atlas** (with procedural cortical/collagen micro-textures, Fresnel rim X-Ray mode, AO post-processing, and quantitative cartilage thickness mapping) with a **live in-vivo 3.0T sagittal 3D qDESS MRI viewer** powered by NiiVue.

## Open Scientific Data & Attribution
- **Stanford OpenMSK In-Vivo 3T Knee Bundle** (`openmsk.com`): Real living human Right Knee 3.0T 3D qDESS MRI (`512 × 512 × 96` at `0.3125 × 0.3125 × 1.0 mm`), multi-label articular segmentation, subchondral bone/cartilage meshes, per-vertex quantitative chondral thickness (`mm`), and osteoarthritis `BScore` (`-0.203`).  
  Citation: Goyal A, Belibi F, Sahani V, Pedersen R, Vainberg Y, Williams A, Chu C, Haddock B, Gold GE, Chaudhari AS, Kogan F, Gatti AA. *OpenMSK: A modular open-source framework for comprehensive analysis of imaging biomarkers in knee osteoarthritis.* Osteoarthritis and Cartilage Open. 2026;8(4):100886. `doi:10.1016/j.ocarto.2026.100886`.
- **NIH / Cleveland Clinic Open Knee(s)** (`R01GM104139`, CC-BY 4.0): Soft-tissue ligament & extensor tendon morphology (`ACL`, `PCL`, `MCL`, `LCL`, `PatellarTendon`, `QuadricepsTendon`, `Fibula`) mirrored to right-knee laterality and non-rigidly registered onto the OpenMSK joint anatomy via compartment-anchored similarity + 3D Thin-Plate-Spline deformation.

## Features
- **Synchronized 3D ↔ MRI Crosshair**: Selecting a 3D anatomical structure centers the sagittal/coronal/axial 3T MRI slice onto its exact RAS millimeter centroid; scrubbing MRI slices can also drive live 3D cross-section clipping (`MRI Cut` / `S` key).
- **Real Quantitative Chondral Biomarkers**: Toggle `Thickness (mm)` (`T` key) to inspect per-vertex cartilage thickness (`0.0–3.8 mm`) on femoral, tibial, and patellar articular surfaces, or switch the MRI overlay to `OA Subregions`.
- **Physiological & Pathological Knee Kinematics**: Interactive `0°–90°` flexion slider simulating Right-knee terminal screw-home rotation (`~11.5°`), patellar tracking, Lachman anterior drawer (`acl-rupture`, `unhappy-triad`), posterior tibial sag (`pcl-dashboard`), and medial radial meniscal extrusion (`posterior-root`).
- **Clinical PACS Workflow**: Darkroom / Monograph workstation themes, instant PACS Window/Level presets (`Standard`, `Meniscus / ACL`, `Chondral`, `Trabecular`), unretouched clean grayscale film default with optional segmentation overlays (`O` key), and PowerScribe-ready structured dictation drawer (`R` key).
