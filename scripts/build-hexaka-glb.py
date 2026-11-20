"""Build rigged, instanced hexaka-v3.glb from SolidWorks STL assets."""

from pathlib import Path
import math
import numpy as np
import trimesh

ROOT = Path(__file__).resolve().parents[1]
CAD_BASE = Path(r"C:\Users\User\Documents\A WASAKA\2026\BEST\Mechanical\robot 2026\robot dengan komponen\robot dengan komponen")
CAD_23 = CAD_BASE / "23"
COMPLETE_STL = Path(r"C:\Users\User\Downloads\desain awal 2026 dengan komponen(1).stl")
OUT_GLB = ROOT / "assets" / "models" / "hexaka-v3.glb"

# Chassis geometric center in STL coordinates (mm)
CX, CY, CZ = 723.3, 923.6, 1371.4

# Verified spatial leg mapping (leg_id, pondasi, coxa_n, tengah_n, femur_files, akhir_n, base_yaw_deg)
LEG_SPECS = [
    (0, "23 - pondasi kaki-6.STL", 2, 5, ["23 - femur New-8.STL", "23 - femur New-9.STL"], 4, -135.0),
    (1, "23 - pondasi kaki-2.STL", 1, 6, ["23 - femur New-10.STL", "23 - femur New-11.STL"], 5, 180.0),
    (2, "23 - pondasi kaki-4.STL", 3, 4, ["23 - femur New-12.STL", "23 - femur New-13.STL"], 6, 135.0),
    (3, "23 - pondasi kaki-5.STL", 5, 1, ["23 - femur New-6.STL", "23 - femur New-7.STL"], 3, -45.0),
    (4, "23 - pondasi kaki-1.STL", 6, 3, ["23 - femur New-2.STL", "23 - femur New-3.STL"], 2, 0.0),
    (5, "23 - pondasi kaki-3.STL", 7, 2, ["23 - Copy of femur New^23-4.STL", "23 - femur New-1.STL"], 1, 45.0),
]


def stl_to_web_mesh(path):
    """Load an STL file, convert to centered Web space (+Y up, +Z front, meters), and weld vertices."""
    mesh = trimesh.load(str(path), force="mesh", process=True)
    verts = mesh.vertices.copy()
    verts[:, 0] = -(verts[:, 0] - CX) * 0.001
    verts[:, 1] = (verts[:, 1] - CY) * 0.001
    verts[:, 2] = -(verts[:, 2] - CZ) * 0.001
    mesh.vertices = verts
    mesh.fix_normals()
    return mesh


def complete_part_to_web_mesh(part):
    """Convert a loose mesh split from complete STL (already in meters) to centered Web space."""
    mesh = part.copy()
    verts = mesh.vertices.copy()
    verts[:, 0] = -(verts[:, 0] - CX * 0.001)
    verts[:, 1] = verts[:, 1] - CY * 0.001
    verts[:, 2] = -(verts[:, 2] - CZ * 0.001)
    mesh.vertices = verts
    mesh.fix_normals()
    return mesh


def make_pbr_material(name, rgba, metallic=0.25, roughness=0.52):
    r, g, b, a = [c / 255.0 for c in rgba]
    return trimesh.visual.material.PBRMaterial(
        name=name,
        baseColorFactor=[r, g, b, a],
        metallicFactor=metallic,
        roughnessFactor=roughness
    )


def apply_material(mesh, mat):
    mesh.visual = trimesh.visual.TextureVisuals(material=mat)
    return mesh


def rot_y(rad):
    c, s = math.cos(rad), math.sin(rad)
    m = np.eye(4)
    m[0, 0], m[0, 2] = c, s
    m[2, 0], m[2, 2] = -s, c
    return m


def rot_z(rad):
    c, s = math.cos(rad), math.sin(rad)
    m = np.eye(4)
    m[0, 0], m[0, 1] = c, -s
    m[1, 0], m[1, 1] = s, c
    return m


def trans(x, y, z):
    m = np.eye(4)
    m[0, 3], m[1, 3], m[2, 3] = x, y, z
    return m


def main():
    mat_chassis = make_pbr_material("ChassisSlate", (38, 35, 30, 255), metallic=0.28, roughness=0.55)
    mat_cover = make_pbr_material("CoverSlate", (50, 46, 39, 255), metallic=0.25, roughness=0.48)
    mat_servo = make_pbr_material("ServoCharcoal", (34, 32, 29, 255), metallic=0.22, roughness=0.48)
    mat_bracket = make_pbr_material("BracketTitanium", (92, 84, 70, 255), metallic=0.40, roughness=0.46)
    mat_amber = make_pbr_material("HornAmber", (226, 169, 43, 255), metallic=0.45, roughness=0.35)
    mat_pcb = make_pbr_material("RPiPCB", (34, 130, 86, 255), metallic=0.15, roughness=0.45)
    mat_metal = make_pbr_material("MetalSilver", (168, 176, 186, 255), metallic=0.72, roughness=0.32)
    mat_ubec = make_pbr_material("UbecBlue", (45, 102, 158, 255), metallic=0.20, roughness=0.45)

    scene = trimesh.Scene()
    scene.graph.update(frame_to="HexakaRoot", frame_from="world", matrix=np.eye(4))
    scene.graph.update(frame_to="BodyChassis", frame_from="HexakaRoot", matrix=np.eye(4))
    scene.graph.update(frame_to="Body_Lower", frame_from="BodyChassis", matrix=np.eye(4))
    scene.graph.update(frame_to="Body_Internals", frame_from="BodyChassis", matrix=np.eye(4))
    scene.graph.update(frame_to="Body_Cover", frame_from="BodyChassis", matrix=np.eye(4))
    scene.graph.update(frame_to="Legs", frame_from="BodyChassis", matrix=np.eye(4))

    # 1. Body_Lower: Bottom plate + standoffs
    bottom_plate = apply_material(stl_to_web_mesh(CAD_23 / "23 - Bottom body plate-1.STL"), mat_chassis)
    scene.add_geometry(bottom_plate, node_name="Bottom_Plate", geom_name="Bottom_Plate", parent_node_name="Body_Lower")

    # 2. Body_Cover: Top plate + Logitech C270 + Tutup Robot
    top_plate = apply_material(stl_to_web_mesh(CAD_23 / "23 - Top body plate-1.STL"), mat_cover)
    scene.add_geometry(top_plate, node_name="Top_Plate", geom_name="Top_Plate", parent_node_name="Body_Cover")

    c270_body = apply_material(stl_to_web_mesh(CAD_23 / "23 - Logitech c270 Assembly-1 Logitech c270-1.STL"), mat_servo)
    c270_mount = apply_material(trimesh.util.concatenate([
        stl_to_web_mesh(CAD_23 / "23 - Logitech c270 Assembly-1 Logitech c270b-1.STL"),
        stl_to_web_mesh(CAD_23 / "23 - Logitech c270 Assembly-1 Logitech c270c-1.STL"),
        stl_to_web_mesh(CAD_23 / "23 - Logitech c270 Assembly-1 Pin camera Mtg Plastic Logi c270-1.STL"),
    ]), mat_bracket)
    scene.add_geometry(c270_body, node_name="Camera_C270_Body", geom_name="Camera_C270_Body", parent_node_name="Body_Cover")
    scene.add_geometry(c270_mount, node_name="Camera_C270_Mount", geom_name="Camera_C270_Mount", parent_node_name="Body_Cover")

    # 3. Extract Tutup Robot, RPi 5, and UBEC from complete STL (process=True merges duplicate vertices for fast split)
    print("Extracting Tutup Robot, RPi 5, and UBEC from complete STL...", flush=True)
    full = trimesh.load(str(COMPLETE_STL), force="mesh", process=True)
    loose = full.split(only_watertight=False)

    tutup_parts = []
    rpi_pcb_parts = []
    rpi_metal_parts = []
    ubec_parts = []

    for part in loose:
        c = part.centroid
        b = part.bounds
        ext = b[1] - b[0]
        nf = len(part.faces)

        if 0.60 <= c[0] <= 0.84 and 1.22 <= c[2] <= 1.52 and c[1] > 0.960 and nf > 500:
            tutup_parts.append(part)
            continue

        if 0.67 <= c[0] <= 0.77 and 0.905 <= c[1] <= 0.935 and 1.295 <= c[2] <= 1.362:
            if nf == 2514 or (ext[0] > 0.04 and ext[2] > 0.04):
                rpi_pcb_parts.append(part)
            elif max(ext) >= 0.010 and nf <= 6000:
                rpi_metal_parts.append(part)
            continue

        if 0.69 <= c[0] <= 0.75 and 0.907 <= c[1] <= 0.925 and 1.362 <= c[2] <= 1.410 and nf >= 200:
            ubec_parts.append(part)

    if tutup_parts:
        tutup = apply_material(complete_part_to_web_mesh(trimesh.util.concatenate(tutup_parts)), mat_cover)
        scene.add_geometry(tutup, node_name="Tutup_Robot", geom_name="Tutup_Robot", parent_node_name="Body_Cover")

    if rpi_pcb_parts or rpi_metal_parts:
        scene.graph.update(frame_to="RPi5", frame_from="Body_Internals", matrix=np.eye(4))
        if rpi_pcb_parts:
            pcb = apply_material(complete_part_to_web_mesh(trimesh.util.concatenate(rpi_pcb_parts)), mat_pcb)
            scene.add_geometry(pcb, node_name="RPi5_PCB", geom_name="RPi5_PCB", parent_node_name="RPi5")
        if rpi_metal_parts:
            ports = apply_material(complete_part_to_web_mesh(trimesh.util.concatenate(rpi_metal_parts)), mat_metal)
            scene.add_geometry(ports, node_name="RPi5_Metal", geom_name="RPi5_Metal", parent_node_name="RPi5")

    if ubec_parts:
        ubec = apply_material(complete_part_to_web_mesh(trimesh.util.concatenate(ubec_parts)), mat_ubec)
        scene.add_geometry(ubec, node_name="UBEC_15A", geom_name="UBEC_15A", parent_node_name="Body_Internals")

    u2d2_parts = [
        stl_to_web_mesh(CAD_23 / "23 - gam-1 Robotis U2D2.STEP-1 U2D2 casing.STEP-1.STL"),
        stl_to_web_mesh(CAD_23 / "23 - gam-1 Robotis U2D2.STEP-1 PCB_U2D2.STEP-1.STL"),
    ]
    u2d2 = apply_material(trimesh.util.concatenate(u2d2_parts), mat_chassis)
    scene.add_geometry(u2d2, node_name="U2D2", geom_name="U2D2", parent_node_name="Body_Internals")

    # Amber chassis standoffs are intentionally omitted: they read as stray
    # gold pillars between the plates in the web simulation.

    # 4. Build shared canonical leg meshes from Leg_4 (Mid-Left, yaw=0) and instance across all 6 legs!
    _, pond4, cn4, tn4, femur4, an4, yaw4 = LEG_SPECS[4]
    coxa4_b11 = stl_to_web_mesh(CAD_23 / f"23 - coxa_1-{cn4} Assembly.stp-1 B11.stp-1.STL")
    c4_center = (coxa4_b11.bounds[0] + coxa4_b11.bounds[1]) * 0.5
    f4_a = stl_to_web_mesh(CAD_23 / femur4[0])
    f4_b = stl_to_web_mesh(CAD_23 / femur4[1])
    f4_mid = ((f4_a.bounds[0] + f4_a.bounds[1]) * 0.5 + (f4_b.bounds[0] + f4_b.bounds[1]) * 0.5) * 0.5
    femur4_y = float(f4_mid[1])
    L_coxa = math.hypot(f4_mid[0] - c4_center[0], f4_mid[2] - c4_center[2]) - 0.020
    L_femur = 0.040
    tibia4_mesh = stl_to_web_mesh(CAD_23 / f"23 - akhir kaki-{an4} akhir kaki.stp-1 tibia.stp-1.STL")
    L_tibia = abs(femur4_y - float(tibia4_mesh.bounds[0][1]))

    world_leg4 = trans(float(c4_center[0]), femur4_y, float(c4_center[2])) @ rot_y(math.radians(yaw4))
    inv_coxa4 = np.linalg.inv(world_leg4)
    inv_femur4 = np.linalg.inv(world_leg4 @ trans(L_coxa, 0.0, 0.0))
    inv_tibia4 = rot_z(math.pi / 2) @ np.linalg.inv(world_leg4 @ trans(L_coxa + L_femur, 0.0, 0.0))

    # Canonical chassis servo (positioned relative to Leg_i yaw frame at chassis level)
    shared_body_servo = apply_material(stl_to_web_mesh(CAD_23 / f"23 - coxa_1-{cn4} Assembly.stp-1 ax-12.stp-1.STL"), mat_servo)
    shared_body_servo.apply_transform(inv_coxa4)
    shared_body_horn = apply_material(coxa4_b11.copy(), mat_amber)
    shared_body_horn.apply_transform(inv_coxa4)

    shared_coxa_bracket = apply_material(trimesh.util.concatenate([
        stl_to_web_mesh(CAD_23 / pond4),
        stl_to_web_mesh(CAD_23 / f"23 - tengah kaki-{tn4} tengah kaki.stp-1 bracket 1.stp-1.STL"),
        stl_to_web_mesh(CAD_23 / f"23 - tengah kaki-{tn4} tengah kaki.stp-1 bracket 1.stp-2.STL"),
    ]), mat_bracket)
    shared_coxa_bracket.apply_transform(inv_coxa4)

    shared_coxa_servo = apply_material(stl_to_web_mesh(CAD_23 / f"23 - tengah kaki-{tn4} tengah kaki.stp-1 Assembly_1.stp-1 ax-12_1.stp-1.STL"), mat_servo)
    shared_coxa_servo.apply_transform(inv_coxa4)

    shared_coxa_horn = apply_material(stl_to_web_mesh(CAD_23 / f"23 - tengah kaki-{tn4} tengah kaki.stp-1 Assembly_1.stp-1 B11_1.stp-1.STL"), mat_amber)
    shared_coxa_horn.apply_transform(inv_coxa4)

    shared_femur_plates = apply_material(trimesh.util.concatenate([f4_a, f4_b]), mat_bracket)
    shared_femur_plates.apply_transform(inv_femur4)

    shared_femur_horn = apply_material(stl_to_web_mesh(CAD_23 / f"23 - akhir kaki-{an4} akhir kaki.stp-1 Assembly.stp-1 B11.stp-1.STL"), mat_amber)
    shared_femur_horn.apply_transform(inv_femur4)

    shared_tibia_servo = apply_material(stl_to_web_mesh(CAD_23 / f"23 - akhir kaki-{an4} akhir kaki.stp-1 Assembly.stp-1 ax-12.stp-1.STL"), mat_servo)
    shared_tibia_servo.apply_transform(inv_tibia4)

    shared_tibia_foot = apply_material(tibia4_mesh, mat_bracket)
    shared_tibia_foot.apply_transform(inv_tibia4)

    for lid, _, cn, _, femur_files, _, yaw_deg in LEG_SPECS:
        b11 = stl_to_web_mesh(CAD_23 / f"23 - coxa_1-{cn} Assembly.stp-1 B11.stp-1.STL")
        c_center = (b11.bounds[0] + b11.bounds[1]) * 0.5
        fa = stl_to_web_mesh(CAD_23 / femur_files[0])
        fb = stl_to_web_mesh(CAD_23 / femur_files[1])
        fm = ((fa.bounds[0] + fa.bounds[1]) * 0.5 + (fb.bounds[0] + fb.bounds[1]) * 0.5) * 0.5
        fy = float(fm[1])

        yaw_rad = math.radians(yaw_deg)
        leg_mat = trans(float(c_center[0]), fy, float(c_center[2])) @ rot_y(yaw_rad)

        # Fixed chassis servo on Body_Lower aligned to this leg's mount
        scene.add_geometry(shared_body_servo, node_name=f"BodyCoxaServo_{lid}", geom_name="Shared_BodyCoxaServo", parent_node_name="Body_Lower", transform=leg_mat)
        scene.add_geometry(shared_body_horn, node_name=f"BodyCoxaHorn_{lid}", geom_name="Shared_BodyCoxaHorn", parent_node_name="Body_Lower", transform=leg_mat)

        leg_name = f"Leg_{lid}"
        coxa_name = f"Coxa_{lid}"
        femur_name = f"Femur_{lid}"
        tibia_name = f"Tibia_{lid}"
        foot_name = f"Foot_{lid}"

        scene.graph.update(frame_to=leg_name, frame_from="Legs", matrix=leg_mat)
        scene.graph.update(frame_to=coxa_name, frame_from=leg_name, matrix=np.eye(4))
        scene.graph.update(frame_to=femur_name, frame_from=coxa_name, matrix=trans(L_coxa, 0.0, 0.0))
        scene.graph.update(frame_to=tibia_name, frame_from=femur_name, matrix=trans(L_femur, 0.0, 0.0))
        scene.graph.update(frame_to=foot_name, frame_from=tibia_name, matrix=trans(L_tibia, 0.0, 0.0))

        scene.add_geometry(shared_coxa_bracket, node_name=f"{coxa_name}_bracket", geom_name="Shared_CoxaBracket", parent_node_name=coxa_name)
        scene.add_geometry(shared_coxa_servo, node_name=f"{coxa_name}_servo", geom_name="Shared_CoxaServo", parent_node_name=coxa_name)
        scene.add_geometry(shared_coxa_horn, node_name=f"{coxa_name}_horn", geom_name="Shared_CoxaHorn", parent_node_name=coxa_name)
        scene.add_geometry(shared_femur_plates, node_name=f"{femur_name}_plates", geom_name="Shared_FemurPlates", parent_node_name=femur_name)
        scene.add_geometry(shared_femur_horn, node_name=f"{femur_name}_horn", geom_name="Shared_FemurHorn", parent_node_name=femur_name)
        scene.add_geometry(shared_tibia_servo, node_name=f"{tibia_name}_servo", geom_name="Shared_TibiaServo", parent_node_name=tibia_name)
        scene.add_geometry(shared_tibia_foot, node_name=f"{tibia_name}_foot", geom_name="Shared_TibiaFoot", parent_node_name=tibia_name)

        print(f"Instanced Leg_{lid}: Lc={L_coxa*1000:.1f}mm Lf={L_femur*1000:.1f}mm Lt={L_tibia*1000:.1f}mm yaw={yaw_deg:.0f}deg", flush=True)

    OUT_GLB.parent.mkdir(parents=True, exist_ok=True)
    glb_bytes = scene.export(file_type="glb")
    OUT_GLB.write_bytes(glb_bytes)
    print(f"Wrote {OUT_GLB} ({len(glb_bytes) / 1024:.1f} KB / {len(glb_bytes) / (1024*1024):.2f} MB)", flush=True)


if __name__ == "__main__":
    main()
