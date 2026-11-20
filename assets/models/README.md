# Hexaka V3 3D Model Drop-in Contract

Letakkan file `.glb` hasil ekspor Blender di folder ini (`assets/models/hexaka-v3.glb`), lalu ubah `glbUrl` pada [model-config.json](model-config.json) menjadi `"./assets/models/hexaka-v3.glb"`.

Selama `glbUrl` bernilai `null`, simulasi otomatis menggunakan model prosedural 18-DOF berdimensi sama tanpa memicu request 404 di browser.

## Konvensi Sumbu & Skala (Blender -> glTF)
- Skala: `1 unit Blender = 1 meter` (`mm SolidWorks * 0.001`).
- Sumbu glTF/Three.js: `+Y` atas, `+Z` arah depan kamera C270, `+X` kiri/kanan.
- Origin robot `(0, 0, 0)` berada di pusat geometris chassis (di antara `Top body plate` dan `Bottom body plate`).

## Hierarki Node Wajib
```text
HexakaRoot
├── BodyChassis
│   ├── Body_Lower
│   ├── Body_Internals
│   │   ├── RPi5
│   │   ├── UBEC_15A
│   │   └── U2D2
│   └── Body_Cover
│       ├── Top_Plate
│       └── Camera_C270
└── Legs
    └── Leg_0 .. Leg_5
        └── Coxa_0 .. Coxa_5
            └── Femur_0 .. Femur_5
                └── Tibia_0 .. Tibia_5
                    └── Foot_0 .. Foot_5
```

- `Leg_0..2` = sisi kanan (Depan, Tengah, Belakang); `Leg_3..5` = sisi kiri (Depan, Tengah, Belakang).
- Origin `Coxa_i`, `Femur_i`, dan `Tibia_i` wajib berada tepat di sumbu putar servo masing-masing, dengan arah segmen memanjang ke sumbu lokal `+X` pada rotasi nol.
- Saat mode **Urai bodi** aktif, `Body_Cover` diangkat ke atas (`+Y`) dan plat penutup dibuat semi-transparan untuk menampilkan `Body_Internals`.
