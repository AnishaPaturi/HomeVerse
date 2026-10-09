export interface RoomObject {
  id: string;
  object_type: string;
  position_x: number;
  position_y: number;
  position_z: number;
  rotation: number;
  scale: number;
  material: string;
}

export function getDefaultFurnitureForRoom(
  roomName: string = "Room",
  roomType: string = "bedroom",
  widthM: number = 4.5,
  depthM: number = 5.0,
  designStyle: string = "Japandi"
): RoomObject[] {
  const normType = (roomType || "").toLowerCase();
  const normName = (roomName || "").toLowerCase();

  const isBedroom =
    normType.includes("bed") ||
    normName.includes("bed") ||
    normName.includes("master");
  const isLiving =
    normType.includes("living") ||
    normType.includes("drawing") ||
    normName.includes("living") ||
    normName.includes("drawing");
  const isDining =
    normType.includes("dining") || normName.includes("dining");
  const isKitchen =
    normType.includes("kitchen") || normName.includes("kitchen");
  const isPuja = normType.includes("puja") || normName.includes("puja");
  const isBalcony =
    normType.includes("balcony") ||
    normType.includes("sitout") ||
    normName.includes("balcony") ||
    normName.includes("sitout");

  // Style-specific materials
  const woodMaterial =
    designStyle.toLowerCase() === "minimalist"
      ? "wood_light"
      : designStyle.toLowerCase() === "industrial"
      ? "wood_dark"
      : "wood_light";

  const fabricColor =
    designStyle.toLowerCase() === "boho"
      ? "#d97706"
      : designStyle.toLowerCase() === "japandi"
      ? "#334155"
      : "#1e3a8a";

  const halfW = widthM / 2;
  const halfD = depthM / 2;

  if (isBedroom) {
    return [
      {
        id: "bed-1",
        object_type: "bed",
        position_x: 0,
        position_y: 0,
        position_z: -halfD + 1.3,
        rotation: 0,
        scale: 1,
        material: fabricColor,
      },
      {
        id: "lamp-left",
        object_type: "lamp",
        position_x: -1.3,
        position_y: 0,
        position_z: -halfD + 1.2,
        rotation: 0,
        scale: 0.9,
        material: "#f59e0b",
      },
      {
        id: "lamp-right",
        object_type: "lamp",
        position_x: 1.3,
        position_y: 0,
        position_z: -halfD + 1.2,
        rotation: 0,
        scale: 0.9,
        material: "#f59e0b",
      },
      {
        id: "desk-1",
        object_type: "desk",
        position_x: Math.max(1.2, halfW - 0.9),
        position_y: 0,
        position_z: 0.2,
        rotation: -Math.PI / 2,
        scale: 1,
        material: woodMaterial,
      },
      {
        id: "chair-1",
        object_type: "chair",
        position_x: Math.max(0.6, halfW - 1.5),
        position_y: 0,
        position_z: 0.2,
        rotation: -Math.PI / 2,
        scale: 0.9,
        material: "#1e293b",
      },
      {
        id: "tv-1",
        object_type: "tv",
        position_x: 0,
        position_y: 0,
        position_z: Math.min(2.0, halfD - 0.5),
        rotation: Math.PI,
        scale: 1,
        material: "#0f172a",
      },
      {
        id: "curtains-1",
        object_type: "curtains",
        position_x: -halfW + 0.1,
        position_y: 0,
        position_z: 0,
        rotation: Math.PI / 2,
        scale: 1.2,
        material: "#f8fafc",
      },
    ];
  }

  if (isLiving) {
    return [
      {
        id: "sofa-1",
        object_type: "sofa",
        position_x: 0,
        position_y: 0,
        position_z: -0.9,
        rotation: 0,
        scale: 1.1,
        material: fabricColor,
      },
      {
        id: "coffee-table-1",
        object_type: "coffee_table",
        position_x: 0,
        position_y: 0,
        position_z: 0.4,
        rotation: 0,
        scale: 1,
        material: woodMaterial,
      },
      {
        id: "tv-1",
        object_type: "tv",
        position_x: 0,
        position_y: 0,
        position_z: Math.min(2.2, halfD - 0.5),
        rotation: Math.PI,
        scale: 1.1,
        material: "#0f172a",
      },
      {
        id: "chair-1",
        object_type: "chair",
        position_x: -1.5,
        position_y: 0,
        position_z: 0.3,
        rotation: Math.PI / 3,
        scale: 1,
        material: "#2563eb",
      },
      {
        id: "lamp-1",
        object_type: "lamp",
        position_x: 1.6,
        position_y: 0,
        position_z: -0.9,
        rotation: 0,
        scale: 1,
        material: "#eab308",
      },
      {
        id: "plant-1",
        object_type: "flower_pot",
        position_x: -halfW + 0.6,
        position_y: 0,
        position_z: -halfD + 0.6,
        rotation: 0,
        scale: 1,
        material: "#10b981",
      },
    ];
  }

  if (isDining) {
    return [
      {
        id: "dining-table-1",
        object_type: "dining_table",
        position_x: 0,
        position_y: 0,
        position_z: 0,
        rotation: 0,
        scale: 1.1,
        material: woodMaterial,
      },
      {
        id: "chair-1",
        object_type: "chair",
        position_x: -0.6,
        position_y: 0,
        position_z: -0.8,
        rotation: 0,
        scale: 0.9,
        material: "#1e293b",
      },
      {
        id: "chair-2",
        object_type: "chair",
        position_x: 0.6,
        position_y: 0,
        position_z: -0.8,
        rotation: 0,
        scale: 0.9,
        material: "#1e293b",
      },
      {
        id: "chair-3",
        object_type: "chair",
        position_x: -0.6,
        position_y: 0,
        position_z: 0.8,
        rotation: Math.PI,
        scale: 0.9,
        material: "#1e293b",
      },
      {
        id: "chair-4",
        object_type: "chair",
        position_x: 0.6,
        position_y: 0,
        position_z: 0.8,
        rotation: Math.PI,
        scale: 0.9,
        material: "#1e293b",
      },
      {
        id: "lamp-1",
        object_type: "lamp",
        position_x: 1.5,
        position_y: 0,
        position_z: -1.0,
        rotation: 0,
        scale: 1,
        material: "#eab308",
      },
    ];
  }

  if (isBalcony) {
    return [
      {
        id: "chair-1",
        object_type: "chair",
        position_x: -0.8,
        position_y: 0,
        position_z: 0,
        rotation: Math.PI / 4,
        scale: 0.9,
        material: "#10b981",
      },
      {
        id: "coffee-table-1",
        object_type: "coffee_table",
        position_x: 0,
        position_y: 0,
        position_z: 0,
        rotation: 0,
        scale: 0.8,
        material: woodMaterial,
      },
      {
        id: "chair-2",
        object_type: "chair",
        position_x: 0.8,
        position_y: 0,
        position_z: 0,
        rotation: -Math.PI / 4,
        scale: 0.9,
        material: "#10b981",
      },
      {
        id: "plant-1",
        object_type: "flower_pot",
        position_x: -halfW + 0.5,
        position_y: 0,
        position_z: -halfD + 0.5,
        rotation: 0,
        scale: 1,
        material: "#10b981",
      },
    ];
  }

  // Default multipurpose room setup
  return [
    {
      id: "sofa-1",
      object_type: "sofa",
      position_x: 0,
      position_y: 0,
      position_z: -0.8,
      rotation: 0,
      scale: 1.0,
      material: fabricColor,
    },
    {
      id: "table-1",
      object_type: "coffee_table",
      position_x: 0,
      position_y: 0,
      position_z: 0.3,
      rotation: 0,
      scale: 0.9,
      material: woodMaterial,
    },
    {
      id: "lamp-1",
      object_type: "lamp",
      position_x: 1.4,
      position_y: 0,
      position_z: -0.8,
      rotation: 0,
      scale: 0.9,
      material: "#eab308",
    },
    {
      id: "plant-1",
      object_type: "flower_pot",
      position_x: -halfW + 0.5,
      position_y: 0,
      position_z: -halfD + 0.5,
      rotation: 0,
      scale: 1,
      material: "#10b981",
    },
  ];
}
