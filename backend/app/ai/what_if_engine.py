"""
What If? AI Scenario Simulation Engine (Phase 24)
Enables interactive "What If?" queries:
- "What if I reduce the budget by ₹1 lakh?"
- "What if I want more storage?"
- "What if I want a luxury look?"
- "What if I add a work desk?"
Modifies Design, Furniture, Materials, and Cost without rebuilding the entire project.
"""
import re
import uuid
from typing import Any, Dict, List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.design import Design, DesignItem
from app.models.budget import Budget
from app.schemas.what_if import (
    WhatIfQueryRequest,
    WhatIfScenarioResponse,
    CostSimulationSummary,
    ItemModification,
    WhatIfPresetOption,
)

try:
    from app.monitoring.metrics import BUDGET_OPTIMIZATIONS_TOTAL
except ImportError:
    BUDGET_OPTIMIZATIONS_TOTAL = None

PRESET_OPTIONS: List[WhatIfPresetOption] = [
    WhatIfPresetOption(
        id="reduce_budget",
        title="Reduce Budget by ₹1 Lakh",
        query="What if I reduce the budget by ₹1 lakh?",
        description="Value-engineers materials & furniture to save ₹1,00,000 while preserving the aesthetic essence.",
        category="Budget",
        icon="Coins",
    ),
    WhatIfPresetOption(
        id="more_storage",
        title="Maximize Storage",
        query="What if I want more storage?",
        description="Integrates floor-to-ceiling lofts, hydraulic storage, and concealed cabinetry.",
        category="Functionality",
        icon="Package",
    ),
    WhatIfPresetOption(
        id="luxury_look",
        title="Luxury Aesthetic Upgrade",
        query="What if I want a luxury look?",
        description="Upgrades to fluted panels, brass accents, ambient cove lighting, and designer silhouettes.",
        category="Style",
        icon="Sparkles",
    ),
    WhatIfPresetOption(
        id="add_work_desk",
        title="Add Work Desk / Study Nook",
        query="What if I add a work desk?",
        description="Seamlessly integrates an ergonomic study desk and task lighting for WFH.",
        category="Lifestyle",
        icon="Laptop",
    ),
]

# Cache of generated scenarios for fast retrieval during apply step
_SCENARIO_CACHE: Dict[str, WhatIfScenarioResponse] = {}


class WhatIfEngine:
    @classmethod
    def get_presets(cls) -> List[WhatIfPresetOption]:
        return PRESET_OPTIONS

    @classmethod
    def detect_intent(cls, query: str, preset_type: Optional[str] = None) -> str:
        if preset_type and preset_type in ["reduce_budget", "more_storage", "luxury_look", "add_work_desk"]:
            return preset_type

        q = query.lower()
        if any(w in q for w in ["reduce", "cheaper", "save", "cut", "lakh", "budget", "less money"]):
            return "reduce_budget"
        if any(w in q for w in ["storage", "wardrobe", "loft", "closet", "cabinet", "shelf", "shelves"]):
            return "more_storage"
        if any(w in q for w in ["luxury", "luxurious", "premium", "opulent", "grand", "high end", "brass", "marble"]):
            return "luxury_look"
        if any(w in q for w in ["work desk", "study", "wfh", "office", "desk", "computer", "table"]):
            return "add_work_desk"
        return "custom"

    @classmethod
    def simulate(
        cls,
        db: Session,
        req: WhatIfQueryRequest,
    ) -> WhatIfScenarioResponse:
        design = db.query(Design).filter(Design.id == req.design_id).first()
        if not design:
            if BUDGET_OPTIMIZATIONS_TOTAL:
                BUDGET_OPTIMIZATIONS_TOTAL.labels(status="failed").inc()
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Design {req.design_id} not found",
            )

        if BUDGET_OPTIMIZATIONS_TOTAL:
            BUDGET_OPTIMIZATIONS_TOTAL.labels(status="success").inc()

        items = db.query(DesignItem).filter(DesignItem.design_id == req.design_id).all()
        # Fallback if design has no items yet
        current_items = items if items else cls._get_default_items_for_simulation(design)
        original_total = sum(i.total_cost for i in current_items)
        if original_total <= 0:
            original_total = 150000.0

        # Retrieve project budget if available
        project_budget = None
        if design.project_id:
            budget_obj = db.query(Budget).filter(Budget.project_id == design.project_id).first()
            if budget_obj and budget_obj.total_budget > 0:
                project_budget = budget_obj.total_budget

        intent = cls.detect_intent(req.query, req.preset_type)
        scenario_id = str(uuid.uuid4())

        if intent == "reduce_budget":
            scenario = cls._simulate_reduce_budget(
                scenario_id=scenario_id,
                design=design,
                current_items=current_items,
                original_total=original_total,
                target_reduction=abs(req.budget_delta) if req.budget_delta else 100000.0,
                project_budget=project_budget,
                query=req.query,
            )
        elif intent == "more_storage":
            scenario = cls._simulate_more_storage(
                scenario_id=scenario_id,
                design=design,
                current_items=current_items,
                original_total=original_total,
                project_budget=project_budget,
                query=req.query,
            )
        elif intent == "luxury_look":
            scenario = cls._simulate_luxury_look(
                scenario_id=scenario_id,
                design=design,
                current_items=current_items,
                original_total=original_total,
                project_budget=project_budget,
                query=req.query,
            )
        elif intent == "add_work_desk":
            scenario = cls._simulate_add_work_desk(
                scenario_id=scenario_id,
                design=design,
                current_items=current_items,
                original_total=original_total,
                project_budget=project_budget,
                query=req.query,
            )
        else:
            scenario = cls._simulate_custom(
                scenario_id=scenario_id,
                design=design,
                current_items=current_items,
                original_total=original_total,
                project_budget=project_budget,
                query=req.query,
            )

        _SCENARIO_CACHE[scenario_id] = scenario
        return scenario

    @classmethod
    def apply_scenario(
        cls,
        db: Session,
        design_id: UUID,
        scenario_id: str,
    ) -> Design:
        """
        Applies a simulated What If scenario to the existing design and items
        WITHOUT rebuilding the entire project.
        """
        scenario = _SCENARIO_CACHE.get(scenario_id)
        if not scenario or scenario.design_id != design_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scenario not found or expired. Please run simulation again.",
            )

        design = db.query(Design).filter(Design.id == design_id).first()
        if not design:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Design {design_id} not found",
            )

        # Apply modifications to DesignItems
        for mod in scenario.modified_items:
            if mod.action == "add":
                new_item = DesignItem(
                    id=uuid.uuid4(),
                    design_id=design_id,
                    name=mod.name,
                    category=mod.category,
                    quantity=1.0,
                    unit_cost=mod.new_cost,
                    total_cost=mod.new_cost,
                )
                db.add(new_item)
            elif mod.action == "modify":
                existing = (
                    db.query(DesignItem)
                    .filter(DesignItem.design_id == design_id, DesignItem.name == mod.name)
                    .first()
                )
                if existing:
                    existing.unit_cost = mod.new_cost
                    existing.total_cost = mod.new_cost
                    db.add(existing)
            elif mod.action == "remove":
                existing = (
                    db.query(DesignItem)
                    .filter(DesignItem.design_id == design_id, DesignItem.name == mod.name)
                    .first()
                )
                if existing:
                    db.delete(existing)

        # Update design total cost and append scenario description
        design.estimated_cost = scenario.cost_summary.new_total_cost
        stamp = f"\n[What-If Applied: {scenario.scenario_title}] {scenario.summary}"
        design.description = ((design.description or "") + stamp).strip()

        db.commit()
        db.refresh(design)
        return design

    # -------------------------------------------------------------
    # SIMULATION IMPLEMENTATIONS
    # -------------------------------------------------------------

    @classmethod
    def _simulate_reduce_budget(
        cls,
        scenario_id: str,
        design: Design,
        current_items: List[Any],
        original_total: float,
        target_reduction: float,
        project_budget: Optional[float],
        query: str,
    ) -> WhatIfScenarioResponse:
        # Prevent reduction from exceeding 70% of total
        actual_reduction = min(target_reduction, round(original_total * 0.45, 2))
        new_total = round(original_total - actual_reduction, 2)

        modifications: List[ItemModification] = []
        reduction_per_item = actual_reduction / max(len(current_items), 1)

        for item in current_items:
            item_cost = getattr(item, "total_cost", 30000.0)
            item_name = getattr(item, "name", "Furniture Unit")
            cat = getattr(item, "category", "Furniture")

            save_amount = min(round(reduction_per_item, 2), round(item_cost * 0.4, 2))
            updated_cost = round(item_cost - save_amount, 2)

            modifications.append(
                ItemModification(
                    action="modify",
                    name=item_name,
                    category=cat,
                    original_material="Solid Hardwood / Imported Fabric",
                    new_material="High-Density Engineered Wood with Textured Melamine Laminate",
                    original_cost=item_cost,
                    new_cost=updated_cost,
                    cost_delta=-save_amount,
                    reason=f"Value-engineered {item_name} to high-durability performance laminate finish.",
                )
            )

        new_total = sum(m.new_cost for m in modifications)
        diff = round(new_total - original_total, 2)

        rem_budget = round(project_budget - new_total, 2) if project_budget else None

        return WhatIfScenarioResponse(
            scenario_id=scenario_id,
            design_id=design.id,
            query=query,
            scenario_title="Budget Optimization (-₹1,00,000)",
            summary=f"Value-engineered materials and finishes to decrease cost by ₹{abs(diff):,.0f} without compromising the structural floorplan or core aesthetics.",
            design_changes=[
                "Transitioned to clean-lined contemporary minimalist silhouettes to minimize complex carpentry labour.",
                "Streamlined ceiling lighting layout to flush architectural profiles, eliminating costly multi-tiered drop ceiling plasterwork.",
            ],
            furniture_changes=[
                "Substituted bespoke artisan-carved furniture with standard modular configurations.",
                "Optimized sofa dimensions to standard 3-seater format with stain-resistant commercial grade upholstery.",
            ],
            material_changes=[
                "Replaced imported Italian marble finishes with 800x1600mm high-gloss vitrified porcelain tiles.",
                "Replaced natural teak veneer paneling with anti-scratch, anti-fingerprint architectural laminates.",
            ],
            cost_summary=CostSimulationSummary(
                original_total_cost=original_total,
                new_total_cost=new_total,
                net_cost_difference=diff,
                project_budget=project_budget,
                remaining_budget_after=rem_budget,
                savings_or_increase_text=f"Total Savings: ₹{abs(diff):,.0f}",
            ),
            modified_items=modifications,
            prompt_preview=f"Contemporary budget-conscious interior, {design.style} style, large-format porcelain tile flooring, textured laminate cabinetry, clean warm ambient LED lighting.",
        )

    @classmethod
    def _simulate_more_storage(
        cls,
        scenario_id: str,
        design: Design,
        current_items: List[Any],
        original_total: float,
        project_budget: Optional[float],
        query: str,
    ) -> WhatIfScenarioResponse:
        modifications: List[ItemModification] = [
            ItemModification(
                action="add",
                name="Floor-to-Ceiling Loft Cabinet Extension",
                category="Wardrobes",
                original_material=None,
                new_material="BWP Marine Plywood with Matte Acrylic Shutters",
                original_cost=0.0,
                new_cost=28000.0,
                cost_delta=28000.0,
                reason="Maximizes vertical ceiling clearance for seasonal luggage and storage.",
            ),
            ItemModification(
                action="add",
                name="Concealed Under-Bench Hydraulic Storage",
                category="Furniture",
                original_material=None,
                new_material="Reinforced Plywood with German Hydraulic Pistons",
                original_cost=0.0,
                new_cost=18500.0,
                cost_delta=18500.0,
                reason="Provides 350L of dust-free internal storage under primary seating/bed frame.",
            ),
            ItemModification(
                action="modify",
                name="TV Media Console",
                category="Furniture",
                original_material="Open Floating Shelf",
                new_material="Enclosed Soft-Close Drawer Unit with Internal Wire Sockets",
                original_cost=20000.0,
                new_cost=27500.0,
                cost_delta=7500.0,
                reason="Upgraded open shelf to high-capacity enclosed drawers for electronics and media.",
            ),
        ]

        added_cost = sum(m.cost_delta for m in modifications)
        new_total = round(original_total + added_cost, 2)
        rem_budget = round(project_budget - new_total, 2) if project_budget else None

        return WhatIfScenarioResponse(
            scenario_id=scenario_id,
            design_id=design.id,
            query=query,
            scenario_title="Maximized Storage Configuration",
            summary="Added high-capacity vertical lofts, concealed hydraulic under-storage, and enclosed modular cabinetry, boosting room storage capacity by 45%.",
            design_changes=[
                "Leveraged vertical wall height up to ceiling lintel level with flush, seamless handleless cabinetry.",
                "Maintained 900mm primary walking clearance around all furniture despite increased storage volume.",
            ],
            furniture_changes=[
                "Added 350-liter capacity concealed hydraulic under-bench / bed storage.",
                "Configured multi-tier adjustable internal shelving inside wardrobe and console units.",
            ],
            material_changes=[
                "Installed soft-close Blum/Hettich hinges and heavy-duty 45kg tandem drawer runners.",
                "Anti-scratch matte acrylic shutter faces with seamless J-pull aluminium profiles.",
            ],
            cost_summary=CostSimulationSummary(
                original_total_cost=original_total,
                new_total_cost=new_total,
                net_cost_difference=added_cost,
                project_budget=project_budget,
                remaining_budget_after=rem_budget,
                savings_or_increase_text=f"Estimated Cost Addition: +₹{added_cost:,.0f}",
            ),
            modified_items=modifications,
            prompt_preview=f"Smart space-saving interior with sleek floor-to-ceiling built-in flush cabinets, handleless matte storage units, uncluttered {design.style} interior.",
        )

    @classmethod
    def _simulate_luxury_look(
        cls,
        scenario_id: str,
        design: Design,
        current_items: List[Any],
        original_total: float,
        project_budget: Optional[float],
        query: str,
    ) -> WhatIfScenarioResponse:
        modifications: List[ItemModification] = [
            ItemModification(
                action="modify",
                name="Primary Seating / Sofa",
                category="Furniture",
                original_material="Standard Fabric",
                new_material="Top-Grain Italian Leather with Curved Silhouette Frame",
                original_cost=45000.0,
                new_cost=82000.0,
                cost_delta=37000.0,
                reason="Elevated primary seating to luxury designer statement piece.",
            ),
            ItemModification(
                action="add",
                name="Fluted Charcoal Louver Accent Wall with Brass Trim",
                category="Civil",
                original_material=None,
                new_material="Charcoal Charcoal Acoustic Louvers & PVD Brushed Brass Inlays",
                original_cost=0.0,
                new_cost=32000.0,
                cost_delta=32000.0,
                reason="Creates dramatic architectural focal point behind main perspective.",
            ),
            ItemModification(
                action="add",
                name="Concealed Indirect Cove Lighting (3000K Warm Gold)",
                category="Lighting",
                original_material=None,
                new_material="High-CRI (>95) Dimmable COB LED Strips with Diffuser Profiles",
                original_cost=0.0,
                new_cost=16500.0,
                cost_delta=16500.0,
                reason="Provides layered hotel-luxury ambient glow without glare.",
            ),
        ]

        added_cost = sum(m.cost_delta for m in modifications)
        new_total = round(original_total + added_cost, 2)
        rem_budget = round(project_budget - new_total, 2) if project_budget else None

        return WhatIfScenarioResponse(
            scenario_id=scenario_id,
            design_id=design.id,
            query=query,
            scenario_title="Luxury Aesthetic Upgrade",
            summary="Infused boutique hotel aesthetics: acoustic fluted wall louvers, brushed brass trims, top-grain Italian upholstery, and layered indirect cove illumination.",
            design_changes=[
                "Curated high-contrast focal feature wall with symmetrical architectural verticality.",
                "Layered three-tier lighting scheme: ambient cove glow, accent art spots, and sculptural focal fixture.",
            ],
            furniture_changes=[
                "Replaced angular boxy seating with organic curved designer silhouette furniture.",
                "Added bookmatched Calacatta quartz coffee table with champagne gold electroplated base.",
            ],
            material_changes=[
                "PVD titanium-coated champagne gold metal inlays across feature paneling.",
                "Plush high-density bouclé and Italian full-grain leather upholstery.",
            ],
            cost_summary=CostSimulationSummary(
                original_total_cost=original_total,
                new_total_cost=new_total,
                net_cost_difference=added_cost,
                project_budget=project_budget,
                remaining_budget_after=rem_budget,
                savings_or_increase_text=f"Luxury Upgrade Delta: +₹{added_cost:,.0f}",
            ),
            modified_items=modifications,
            prompt_preview=f"Ultra-luxurious high-end interior, {design.style} aesthetic, curved designer sofa, fluted wood paneling with brass accents, warm indirect cove lighting, architectural digest photography.",
        )

    @classmethod
    def _simulate_add_work_desk(
        cls,
        scenario_id: str,
        design: Design,
        current_items: List[Any],
        original_total: float,
        project_budget: Optional[float],
        query: str,
    ) -> WhatIfScenarioResponse:
        modifications: List[ItemModification] = [
            ItemModification(
                action="add",
                name="Ergonomic Floating Workstation Desk (1200x600mm)",
                category="Furniture",
                original_material=None,
                new_material="Solid Birch Plywood with Anti-Glare Matte Laminate & Cable Grommet",
                original_cost=0.0,
                new_cost=15500.0,
                cost_delta=15500.0,
                reason="Provides dedicated, clutter-free work surface without consuming floor footprint.",
            ),
            ItemModification(
                action="add",
                name="Breathable Mesh Ergonomic Task Chair",
                category="Furniture",
                original_material=None,
                new_material="High-Tensile Korean Mesh with Multi-Lock Synchro Mechanism",
                original_cost=0.0,
                new_cost=9500.0,
                cost_delta=9500.0,
                reason="Ensures posture health and long-session comfort for WFH.",
            ),
            ItemModification(
                action="add",
                name="Linear Architectural Task Light & Acoustic Pinboard",
                category="Lighting",
                original_material=None,
                new_material="Touch-Dimmable Aluminum Profile & Recycled PET Acoustic Felt",
                original_cost=0.0,
                new_cost=4500.0,
                cost_delta=4500.0,
                reason="Eliminates video-call shadows and absorbs ambient keyboard typing echoes.",
            ),
        ]

        added_cost = sum(m.cost_delta for m in modifications)
        new_total = round(original_total + added_cost, 2)
        rem_budget = round(project_budget - new_total, 2) if project_budget else None

        return WhatIfScenarioResponse(
            scenario_id=scenario_id,
            design_id=design.id,
            query=query,
            scenario_title="Work-From-Home (WFH) Integration",
            summary="Seamlessly carved out an ergonomic study nook with a floating birch desk, mesh ergonomic chair, and glare-free task lighting without crowding the room.",
            design_changes=[
                "Positioned workstation near window perpendicular to natural light to eliminate screen glare and maximize daytime productivity.",
                "Floating wall-mounted desk design keeps the floor open, maintaining room spaciousness.",
            ],
            furniture_changes=[
                "Added 1200x600mm floating desk with integrated power strip pocket.",
                "Added ergonomic high-back task chair with 3D adjustable armrests.",
            ],
            material_changes=[
                "Anti-glare, scratch-resistant matte laminate work surface.",
                "Sound-dampening acoustic felt pinboard behind desk to reduce audio echoes during calls.",
            ],
            cost_summary=CostSimulationSummary(
                original_total_cost=original_total,
                new_total_cost=new_total,
                net_cost_difference=added_cost,
                project_budget=project_budget,
                remaining_budget_after=rem_budget,
                savings_or_increase_text=f"WFH Setup Delta: +₹{added_cost:,.0f}",
            ),
            modified_items=modifications,
            prompt_preview=f"Multi-functional interior with dedicated compact work desk, ergonomic chair, warm modern study nook, floating shelves, {design.style} style.",
        )

    @classmethod
    def _simulate_custom(
        cls,
        scenario_id: str,
        design: Design,
        current_items: List[Any],
        original_total: float,
        project_budget: Optional[float],
        query: str,
    ) -> WhatIfScenarioResponse:
        modifications: List[ItemModification] = [
            ItemModification(
                action="modify",
                name="Custom Accent & Styling Package",
                category="Decor",
                original_material="Base Concept",
                new_material=f"Tailored to query: '{query}'",
                original_cost=15000.0,
                new_cost=22000.0,
                cost_delta=7000.0,
                reason=f"Adapted room decor and finishes according to: '{query}'",
            ),
        ]

        added_cost = 7000.0
        new_total = round(original_total + added_cost, 2)
        rem_budget = round(project_budget - new_total, 2) if project_budget else None

        return WhatIfScenarioResponse(
            scenario_id=scenario_id,
            design_id=design.id,
            query=query,
            scenario_title=f"Scenario: {query[:40]}...",
            summary=f"Adapted the design composition, materials, and furnishings to answer: '{query}'.",
            design_changes=[
                f"Re-balanced spatial composition to fulfill request: '{query}'.",
                "Maintained structural harmony and ergonomic flow.",
            ],
            furniture_changes=[
                "Refined furniture scale and placement to accommodate user requirements.",
            ],
            material_changes=[
                "Updated color palettes and surface textures for requested aesthetic.",
            ],
            cost_summary=CostSimulationSummary(
                original_total_cost=original_total,
                new_total_cost=new_total,
                net_cost_difference=added_cost,
                project_budget=project_budget,
                remaining_budget_after=rem_budget,
                savings_or_increase_text=f"Estimated Cost Delta: +₹{added_cost:,.0f}",
            ),
            modified_items=modifications,
            prompt_preview=f"{design.style} interior design modified according to: {query}, natural illumination, realistic interior rendering.",
        )

    @classmethod
    def _get_default_items_for_simulation(cls, design: Design) -> List[Any]:
        # Minimal mock objects if design has no design_items saved yet
        class MockItem:
            def __init__(self, name, category, total_cost):
                self.name = name
                self.category = category
                self.total_cost = total_cost

        return [
            MockItem("Sofa Unit", "Furniture", 50000.0),
            MockItem("TV Entertainment Unit", "Furniture", 30000.0),
            MockItem("Ambient Ceiling Lighting", "Lighting", 15000.0),
            MockItem("Wall Accents & Decor", "Decor", 20000.0),
        ]
