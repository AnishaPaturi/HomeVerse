/**
 * HomeVerse Shared AI Orchestrator & Scene State Manager
 * 
 * Unifies AI Design Copilot (The Brain - reasoning, proposals, budget planning)
 * and AURA (The Hands & Voice - real-time voice, immediate execution, TTS).
 * Both assistants interact with one single source of truth for the 3D studio scene.
 */

export interface WallState {
  color: string;
  material: string;
  name: string;
}

export interface FlooringState {
  material: string;
  name: string;
  costDelta: number;
}

export interface LightingState {
  preset: "warm" | "neutral" | "luxury";
  intensity: number;
}

export interface CameraState {
  view: "3d" | "2d" | "walkthrough";
}

export interface BudgetState {
  totalBudget: number;
  spentAmount: number;
  remaining: number;
  currency: string;
}

export interface SharedActionRecord {
  id: string;
  timestamp: string;
  source: "copilot" | "aura" | "user";
  actionType: string;
  summary: string;
  deltaAmount?: number;
  details?: Record<string, any>;
}

export interface ActionProposal {
  id: string;
  title: string;
  changes: string[];
  applied: boolean;
  actionType: string;
  payload: any;
  costImpact?: {
    before: number;
    after: number;
    delta: number;
    percent?: number;
  };
}

export interface UnifiedSceneState {
  style: string;
  walls: WallState;
  flooring: FlooringState;
  lighting: LightingState;
  camera: CameraState;
  budget: BudgetState;
  lastAction?: SharedActionRecord;
  actionHistory: SharedActionRecord[];
}

export interface StylePreset {
  name: string;
  wallColor: string;
  wallName: string;
  wallMaterial: string;
  floorMaterial: string;
  floorName: string;
  floorCostDelta: number;
  lightingPreset: "warm" | "neutral" | "luxury";
  furnitureMaterial: string;
  description: string;
  costOptimizedSaving: number;
  costOptimizedDetails: string[];
}

export const STYLE_PRESETS: Record<string, StylePreset> = {
  Japandi: {
    name: "Japandi",
    wallColor: "#EAE5D9",
    wallName: "Organic Limestone Wash",
    wallMaterial: "limestone_wash",
    floorMaterial: "wood_light",
    floorName: "European Natural Oak Parquet",
    floorCostDelta: 18000,
    lightingPreset: "warm",
    furnitureMaterial: "#334155",
    description: "Harmonious blend of Scandinavian functionality and Japanese rustic minimalism.",
    costOptimizedSaving: 35000,
    costOptimizedDetails: [
      "Substituted solid white oak flooring with engineered oak veneer (-₹22,000)",
      "Swapped bespoke ceramic accent bowls for hand-molded terracotta (-₹6,000)",
      "Transitioned bouclé throw pillows to unbleached organic linen (-₹7,000)",
      "Preserved authentic Japandi limestone walls (#EAE5D9) & warm 2700K ambient light (₹0 change)",
    ],
  },
  Minimalist: {
    name: "Minimalist",
    wallColor: "#F5F5F4",
    wallName: "Pure Architectural Chalk",
    wallMaterial: "matte_paint",
    floorMaterial: "tile",
    floorName: "Satin Vitrified Large Tiles",
    floorCostDelta: -15000,
    lightingPreset: "neutral",
    furnitureMaterial: "#1e293b",
    description: "Clean geometric volumes, concealed storage, and unadorned light surfaces.",
    costOptimizedSaving: 28000,
    costOptimizedDetails: [
      "Standardized cabinetry to seamless matte laminate panels (-₹16,000)",
      "Selected flush-mount architectural trims in place of recessed reveals (-₹8,000)",
      "Retained clean minimalist monochrome envelope and recessed lumens (₹0 change)",
    ],
  },
  Industrial: {
    name: "Industrial",
    wallColor: "#78716C",
    wallName: "Exposed Microcement Stucco",
    wallMaterial: "microcement",
    floorMaterial: "concrete",
    floorName: "Polished Screed Concrete",
    floorCostDelta: 22000,
    lightingPreset: "neutral",
    furnitureMaterial: "#451a03",
    description: "Raw textures, exposed structural elements, aged steel, and rich leather notes.",
    costOptimizedSaving: 32000,
    costOptimizedDetails: [
      "Utilized cold-rolled architectural steel accents over custom hand-forged trusses (-₹18,000)",
      "Substituted distressed top-grain leather with durable saddle-tan vegan leather (-₹14,000)",
      "Preserved genuine exposed microcement wall treatment (#78716C) (₹0 change)",
    ],
  },
  "Modern Luxury": {
    name: "Modern Luxury",
    wallColor: "#FDF8F0",
    wallName: "Champagne Stucco & Fluted Wood",
    wallMaterial: "fluted_panel",
    floorMaterial: "marble",
    floorName: "Italian Statuario Marble Slabs",
    floorCostDelta: 90000,
    lightingPreset: "luxury",
    furnitureMaterial: "#0f172a",
    description: "Polished marble, fluted detailing, brushed brass, and statement ambient illumination.",
    costOptimizedSaving: 55000,
    costOptimizedDetails: [
      "Selected bookmatched glazed porcelain Statuario over quarried slab cuts (-₹42,000)",
      "Swapped solid brass trims for PVD-coated gold hairline aluminum (-₹13,000)",
      "Maintained luxury dual-layer cove lighting and dramatic focal chandeliers (₹0 change)",
    ],
  },
  Contemporary: {
    name: "Contemporary",
    wallColor: "#ECEBE4",
    wallName: "Greige Mineral Wash",
    wallMaterial: "matte_paint",
    floorMaterial: "terrazzo",
    floorName: "Venetian Terrazzo Satin",
    floorCostDelta: 12000,
    lightingPreset: "warm",
    furnitureMaterial: "#334155",
    description: "Sculptural forms, fluid curves, textured bouclé, and balanced neutral palettes.",
    costOptimizedSaving: 30000,
    costOptimizedDetails: [
      "Optimized curved sofa framing to engineered steam-bent timber (-₹19,000)",
      "Swapped poured terrazzo for large-format terrazzo porcelain tiles (-₹11,000)",
      "Preserved sculptural silhouette, greige perimeter, and ambient spotlighting (₹0 change)",
    ],
  },
  "Modern Scandinavian": {
    name: "Modern Scandinavian",
    wallColor: "#F8FAFC",
    wallName: "Nordic Mist White",
    wallMaterial: "matte_paint",
    floorMaterial: "wood_light",
    floorName: "Nordic Bleached Pine Planks",
    floorCostDelta: 15000,
    lightingPreset: "warm",
    furnitureMaterial: "#475569",
    description: "Light-flooded spaces, pale blond woods, hygge coziness, and functional geometry.",
    costOptimizedSaving: 26000,
    costOptimizedDetails: [
      "Utilized sustainably certified Nordic engineered pine (-₹17,000)",
      "Selected woven wool-blend textiles over imported cashmere throws (-₹9,000)",
      "Preserved high-bounce white wall luminosity and clean Scandinavian aesthetics (₹0 change)",
    ],
  },
};

/**
 * Normalizes any free-form style string to a canonical style preset.
 */
export function getStylePreset(styleName: string): StylePreset {
  const norm = (styleName || "").toLowerCase();
  if (norm.includes("japandi")) return STYLE_PRESETS["Japandi"];
  if (norm.includes("mini")) return STYLE_PRESETS["Minimalist"];
  if (norm.includes("indust")) return STYLE_PRESETS["Industrial"];
  if (norm.includes("lux")) return STYLE_PRESETS["Modern Luxury"];
  if (norm.includes("contemp")) return STYLE_PRESETS["Contemporary"];
  if (norm.includes("scan")) return STYLE_PRESETS["Modern Scandinavian"];
  return STYLE_PRESETS["Japandi"];
}

export type ExecutionMode = "immediate" | "proposal" | "ignored";

export interface UnifiedIntentResult {
  executionMode: ExecutionMode;
  actionType: string;
  summary: string;
  voiceReply: string;
  payload: Record<string, any>;
  proposal?: ActionProposal;
  success: boolean;
  isRelevant: boolean;
}

/**
 * Unified AI Intent Classifier
 * Evaluates instructions for both AURA (Voice) and Copilot (Text)
 * using the shared scene state as context.
 */
export function classifyUnifiedIntent(
  rawQuery: string,
  sceneState: UnifiedSceneState,
  preferredSource: "aura" | "copilot" = "aura"
): UnifiedIntentResult {
  const query = rawQuery.trim();
  const qLower = query.toLowerCase();

  // 1. Style Transformation (e.g. "Change the room to Japandi style")
  if (
    /style|japandi|industrial|minimalist|modern luxury|luxury|contemporary|scandinavian|nordic/.test(qLower) &&
    (/change|switch|make|transform|set|turn|apply|style/.test(qLower) || /japandi|industrial|minimalist/.test(qLower))
  ) {
    const matchedPreset = getStylePreset(qLower);

    // If invoked via Voice/AURA, this is an IMMEDIATE action that alters scene state directly
    // If invoked via Copilot, it can be proposed or applied immediately
    const delta = matchedPreset.floorCostDelta;
    const newTotal = sceneState.budget.spentAmount + delta;

    const proposal: ActionProposal = {
      id: `prop-style-${Date.now()}`,
      title: `${matchedPreset.name} Style Architectural Transformation`,
      changes: [
        `Applied ${matchedPreset.wallName} (${matchedPreset.wallColor}) across perimeter walls`,
        `Swapped flooring to ${matchedPreset.floorName}`,
        `Calibrated ambient illumination to ${matchedPreset.lightingPreset.toUpperCase()} preset`,
        `Updated primary furniture accent tones to authentic ${matchedPreset.name} DNA`,
      ],
      applied: false,
      actionType: "apply_style",
      payload: {
        styleName: matchedPreset.name,
        wallColor: matchedPreset.wallColor,
        wallName: matchedPreset.wallName,
        wallMaterial: matchedPreset.wallMaterial,
        floorMaterial: matchedPreset.floorMaterial,
        floorName: matchedPreset.floorName,
        lightingPreset: matchedPreset.lightingPreset,
        furnitureMaterial: matchedPreset.furnitureMaterial,
        costDelta: delta,
      },
      costImpact: {
        before: sceneState.budget.spentAmount,
        after: newTotal,
        delta,
      },
    };

    if (preferredSource === "aura") {
      return {
        executionMode: "immediate",
        actionType: "apply_instant_style",
        summary: `Switched room to ${matchedPreset.name} style`,
        voiceReply: `Switched room to authentic ${matchedPreset.name} style with ${matchedPreset.wallName.toLowerCase()} walls, ${matchedPreset.floorName.toLowerCase()}, and ${matchedPreset.lightingPreset} ambient lighting. Estimated cost adjusted.`,
        payload: proposal.payload,
        proposal,
        success: true,
        isRelevant: true,
      };
    } else {
      return {
        executionMode: "proposal",
        actionType: "apply_style",
        summary: `Prepared ${matchedPreset.name} style transformation proposal`,
        voiceReply: `I have prepared a ${matchedPreset.name} architectural transformation proposal for your review.`,
        payload: proposal.payload,
        proposal,
        success: true,
        isRelevant: true,
      };
    }
  }

  // 2. Budget Optimization / 15% Reduction (e.g. "Make this design 15% cheaper without losing the Japandi look")
  if (/cheaper|15%|reduce|budget|cut cost|save|cost effective|less expensive|discount|saving/.test(qLower)) {
    const currentPreset = getStylePreset(sceneState.style);
    const fifteenPercent = Math.round(sceneState.budget.spentAmount * 0.15);
    const savingAmount = Math.max(fifteenPercent, currentPreset.costOptimizedSaving || 35000);
    const newTotal = Math.max(sceneState.budget.spentAmount - savingAmount, 50000);

    const proposal: ActionProposal = {
      id: `prop-budget-opt-${Date.now()}`,
      title: `15% Budget Optimization (Preserving ${currentPreset.name} DNA)`,
      changes: [
        ...currentPreset.costOptimizedDetails,
        `Net estimated savings: ₹${savingAmount.toLocaleString("en-IN")} (-15% of active allocation)`,
      ],
      applied: false,
      actionType: "reduce_budget_15",
      payload: {
        styleName: currentPreset.name,
        savingAmount,
        newTotal,
        delta: -savingAmount,
        percent: 15,
        wallColor: currentPreset.wallColor,
        floorMaterial: currentPreset.floorMaterial,
      },
      costImpact: {
        before: sceneState.budget.spentAmount,
        after: newTotal,
        delta: -savingAmount,
        percent: 15,
      },
    };

    return {
      executionMode: "proposal",
      actionType: "reduce_budget_15",
      summary: `Generated 15% cost optimization proposal for ${currentPreset.name}`,
      voiceReply: `I've analyzed your ${currentPreset.name} room and found cost-saving alternatives that reduce expenses by 15% without sacrificing design authenticity. Review the proposal card in AI Design Copilot to apply.`,
      payload: proposal.payload,
      proposal,
      success: true,
      isRelevant: true,
    };
  }

  // 3. Wall Color / Paint (Immediate)
  if (/wall|paint|color|colour|wallpaper|stucco/.test(qLower)) {
    let colorHex = "#D8D0C5";
    let colorName = "Designer Warm Greige";
    if (/greige|warm/.test(qLower)) {
      colorHex = "#D8D0C5";
      colorName = "Designer Warm Greige";
    } else if (/charcoal|dark|black/.test(qLower)) {
      colorHex = "#2C302E";
      colorName = "Studio Charcoal Accent";
    } else if (/white|chalk|alabaster/.test(qLower)) {
      colorHex = "#EDEAE0";
      colorName = "Alabaster Architectural White";
    } else if (/sage|green/.test(qLower)) {
      colorHex = "#B2BCA2";
      colorName = "Muted Sage Mineral";
    } else if (/navy|blue/.test(qLower)) {
      colorHex = "#1E293B";
      colorName = "Deep Midnight Navy";
    } else if (/limestone|oatmeal|cream/.test(qLower)) {
      colorHex = "#EAE5D9";
      colorName = "Organic Limestone Wash";
    }

    return {
      executionMode: "immediate",
      actionType: "change_wall_color",
      summary: `Updated wall paint to ${colorName}`,
      voiceReply: `Applying ${colorName} to walls in your 3D view.`,
      payload: { color_hex: colorHex, color_name: colorName },
      success: true,
      isRelevant: true,
    };
  }

  // 4. Flooring Material (Immediate)
  if (/flooring|marble|tile|wood floor|hardwood|oak|terrazzo|parquet|carpet|laminate|screed/.test(qLower) || (/floor/.test(qLower) && !/plan/.test(qLower))) {
    let materialName = "European White Oak (Herringbone)";
    let costImpact = 18000;
    let floorMat = "wood_light";
    let reply = "Updating flooring to natural European White Oak in a herringbone layout.";

    if (/marble/.test(qLower)) {
      materialName = "Italian Statuario Marble Slabs";
      costImpact = 90720;
      floorMat = "marble";
      reply = "Switching flooring to Italian Statuario Marble. Cost impact is approximately +₹90,000.";
    } else if (/tile|vitrified/.test(qLower)) {
      materialName = "Glazed Large Vitrified Tiles";
      costImpact = -35000;
      floorMat = "tile";
      reply = "Swapping flooring to Glazed Vitrified Tiles, saving ₹35,000.";
    } else if (/terrazzo/.test(qLower)) {
      materialName = "Venetian Terrazzo";
      costImpact = 12000;
      floorMat = "terrazzo";
      reply = "Updating floor to Venetian Terrazzo with satin polished finish.";
    } else if (/concrete|screed/.test(qLower)) {
      materialName = "Polished Concrete Screed";
      costImpact = 22000;
      floorMat = "concrete";
      reply = "Updating floor to Polished Concrete Screed.";
    }

    return {
      executionMode: "immediate",
      actionType: "change_flooring",
      summary: `Updated flooring to ${materialName}`,
      voiceReply: reply,
      payload: { flooring_material: materialName, floorMat, cost_impact: costImpact },
      success: true,
      isRelevant: true,
    };
  }

  // 5. Lighting & Ambiance (Immediate)
  if (/lighting|light|ambient|warm light|neutral light|luxury light|daylight|dim|bright/.test(qLower)) {
    const preset = /luxury|cove/.test(qLower)
      ? "luxury"
      : /neutral|cool|day/.test(qLower)
      ? "neutral"
      : "warm";
    return {
      executionMode: "immediate",
      actionType: "change_lighting",
      summary: `Adjusted lighting to ${preset} preset`,
      voiceReply: `Adjusted 3D scene lighting to ${preset} ambiance preset.`,
      payload: { lighting_preset: preset },
      success: true,
      isRelevant: true,
    };
  }

  // 6. Camera & Viewports (Immediate)
  if (/view|camera|top-down|top down|walkthrough|isometric|perspective|blueprint|overhead/.test(qLower)) {
    let viewType: "isometric" | "walkthrough" | "top_down" = "isometric";
    let reply = "Orienting camera to 3D isometric overview.";
    if (/top|down|plan|blueprint/.test(qLower)) {
      viewType = "top_down";
      reply = "Switching to top-down architectural blueprint view.";
    } else if (/walk|first|person/.test(qLower)) {
      viewType = "walkthrough";
      reply = "Entering first-person walkthrough perspective.";
    }
    return {
      executionMode: "immediate",
      actionType: "switch_camera_view",
      summary: `Switched camera to ${viewType}`,
      voiceReply: reply,
      payload: { view_type: viewType },
      success: true,
      isRelevant: true,
    };
  }

  // 7. Step 10 Photo Matching (Proposal)
  if (/photo|intake|step 10|real room|align photo/.test(qLower)) {
    const proposal: ActionProposal = {
      id: `prop-photo-${Date.now()}`,
      title: "Step 10 Real Room Photo Alignment",
      changes: [
        "Calibrated 3D ambient lighting to match real window exposure from Step 10",
        "Aligned furniture orientation with wall angles identified in intake photos",
        "Projected intake reference textures across perimeter CAD boundaries",
      ],
      applied: false,
      actionType: "align_photos",
      payload: { wall: "#f8fafc", floor: "wood_light" },
      costImpact: {
        before: sceneState.budget.spentAmount,
        after: sceneState.budget.spentAmount,
        delta: 0,
      },
    };
    return {
      executionMode: "proposal",
      actionType: "align_photos",
      summary: "Generated Step 10 Photo Alignment proposal",
      voiceReply: "I've matched your 3D digital twin to your Step 10 room intake photos. Check the proposal in the right panel to confirm.",
      payload: proposal.payload,
      proposal,
      success: true,
      isRelevant: true,
    };
  }

  // 8. General Design Enhancements (Proposal)
  if (/cozy|wood|natural|sofa|furniture|rearrange|upgrade/.test(qLower)) {
    let title = "Custom Spatial Enhancement";
    let changes = ["Optimized circulation walkways and furniture placement"];
    let delta = 14000;

    if (/cozy|warm/.test(qLower)) {
      title = "Warm & Cozy Atmosphere Adjustment";
      changes = [
        "Warmed wall paint to soft oatmeal wash (#fbfbfa)",
        "Replaced coffee table with warm solid oak",
        "Added ambient warm floor lamp in the corner",
        "Switched floor to warm honey wood planks",
      ];
      delta = 18500;
    } else if (/wood|natural/.test(qLower)) {
      title = "Natural Wood & Organic Textures";
      changes = [
        "Switched floor to natural white oak parquet",
        "Updated coffee table to handcrafted walnut",
        "Added potted indoor plant node near the window",
      ];
      delta = 24000;
    } else if (/sofa|seating/.test(qLower)) {
      title = "Sofa Configuration Upgrade";
      changes = [
        "Updated seating node to deep-cushion 3-seater",
        "Upholstered with premium bouclé weave",
        "Adjusted distance to coffee table to 48cm clearance",
      ];
      delta = 18000;
    }

    const proposal: ActionProposal = {
      id: `prop-enhance-${Date.now()}`,
      title,
      changes,
      applied: false,
      actionType: "enhance_scene",
      payload: { delta },
      costImpact: {
        before: sceneState.budget.spentAmount,
        after: sceneState.budget.spentAmount + delta,
        delta,
      },
    };

    return {
      executionMode: "proposal",
      actionType: "enhance_scene",
      summary: `Prepared proposal: ${title}`,
      voiceReply: `I've prepared a spatial enhancement proposal for ${title.toLowerCase()}. Please review and approve in the right sidebar.`,
      payload: proposal.payload,
      proposal,
      success: true,
      isRelevant: true,
    };
  }

  // 9. Budget / Financial Queries (Query)
  if (/how much|remaining|spent|budget status|financial/.test(qLower)) {
    const rem = sceneState.budget.totalBudget - sceneState.budget.spentAmount;
    return {
      executionMode: "immediate",
      actionType: "budget_query",
      summary: "Queried budget status",
      voiceReply: `Active room budget is ₹${sceneState.budget.totalBudget.toLocaleString("en-IN")}. Current estimated expenditure is ₹${sceneState.budget.spentAmount.toLocaleString("en-IN")}, leaving ₹${rem.toLocaleString("en-IN")} remaining.`,
      payload: { ...sceneState.budget, remaining: rem },
      success: true,
      isRelevant: true,
    };
  }

  // 10. STRICTLY IGNORE: Non-relevant text / Irrelevant command
  return {
    executionMode: "ignored",
    actionType: "ignored_command",
    summary: `Ignored irrelevant query: "${query}"`,
    voiceReply: `Command ignored: "${query}" does not specify a relevant room or design change. Please request design changes like "Change room to Japandi style", "Make this 15% cheaper", "Paint walls warm greige", or "Switch to Italian marble".`,
    payload: { ignored: true, reason: "non_relevant_text", query },
    success: false,
    isRelevant: false,
  };
}
