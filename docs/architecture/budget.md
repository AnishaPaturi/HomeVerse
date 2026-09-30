# Budget Architecture & Value Engineering

## 1. Overview
The HomeVerse budget subsystem ensures that all designs, material finishes, and spatial configurations operate within realistic financial parameters established at the outset of house creation.

```mermaid
flowchart TD
    TotalBudget[Total House Budget ₹ INR] --> HouseCreation[House Creation Wizard]
    HouseCreation --> AllocationEngine[Auto Allocation Engine]
    
    AllocationEngine --> Floor1[Floor 1 Envelope]
    AllocationEngine --> Floor2[Floor 2 Envelope]
    
    Floor1 --> LR[Living Room: 35%]
    Floor1 --> Kit[Kitchen: 25%]
    Floor1 --> MBR[Master Bed: 20%]
    Floor2 --> BR2[Bedroom 2: 12%]
    Floor2 --> Office[Home Office: 8%]
    
    LR --> RealTimeCost[Real-Time Furniture & Material Pricing]
    RealTimeCost --> DeltaCheck{Cost Delta Check}
    DeltaCheck --> |Under / Equal| Approve[Auto-Approve 3D Scene]
    DeltaCheck --> |Exceeded| ValueEngineering[Suggest Cheaper Alternatives]
```

## 2. Flexibility Constraints
- **Strict**: Budget cannot exceed target by even 1%. Recommendations favor cost-effective catalog alternatives (e.g. IKEA, Urban Ladder).
- **Moderate**: Up to 10% variance permitted if design longevity or material durability increases substantially.
- **Flexible**: Priority is maximum aesthetic and bespoke craftsmanship; alerts are informational rather than blocking.

## 3. Database Schema
- **Budget**:
  - `total_budget`: Numeric(12, 2)
  - `currency`: String(3) [Default: "INR"]
  - `flexibility`: String(20) ["strict" | "moderate" | "flexible"]
  - `spent_amount`: Numeric(12, 2)
  - `estimated_amount`: Numeric(12, 2)
  - `remaining_amount`: Numeric(12, 2)
- **BudgetAllocation**:
  - `budget_id`: UUID
  - `floor_id`: UUID (optional)
  - `room_id`: UUID (optional)
  - `category`: String(50) (e.g., "Furniture & Seating", "Civil & Flooring")
  - `allocated_amount`: Numeric(12, 2)
  - `actual_amount`: Numeric(12, 2)
