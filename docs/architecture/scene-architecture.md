# Canonical Scene Architecture & Serialization

To enable scalable 3D spatial rendering, HomeVerse enforces a **platform-agnostic scene representation** stored in the database.

## Canonical Scene Graph JSON Schema

```json
{
  "room_id": "r-uuid-101",
  "room_name": "Living Room",
  "width": 5.0,
  "depth": 4.5,
  "height": 3.0,
  "style": "Modern Scandinavian",
  "objects": [
    {
      "id": "obj-sofa-01",
      "model": "sofa_sectional_01.glb",
      "object_type": "sofa",
      "position": [0.0, 0.0, 1.2],
      "rotation": [0.0, 0.0, 0.0],
      "scale": [1.0, 1.0, 1.0],
      "material": "Oatmeal Boucle",
      "cost": 85000.0
    },
    {
      "id": "obj-table-02",
      "model": "walnut_coffee_table.glb",
      "object_type": "coffee_table",
      "position": [0.0, 0.0, 0.0],
      "rotation": [0.0, 0.0, 0.0],
      "scale": [1.0, 1.0, 1.0],
      "material": "Solid Walnut",
      "cost": 24000.0
    }
  ]
}
```

## Platform Ingestion

1. **Frontend Web (React Three Fiber / Three.js)**:
   - Objects map directly to `<primitive object={gltf.scene} position={position} rotation={rotation} scale={scale} />`.
   - Materials override standard PBR textures via custom vertex/fragment uniforms or Three.MeshStandardMaterial.
2. **AI Scene Manipulation**:
   - Commands like *"Make sofa beige"* or *"Move coffee table forward by 0.5m"* modify properties inside the database scene object without rewriting rendering pipelines.
