PROJECT NAME
============

AI Interior Design & Budget Planning Platform

PROJECT VISION
==============

Build a production-grade web application that allows users to:

1. Create a home/apartment project.
2. Upload floor plans and room photographs.
3. Define their interior budget.
4. Define lifestyle and design preferences.
5. Discover their preferred interior style.
6. Generate AI-assisted room designs.
7. Visualize rooms using generated images / 3D representations.
8. Modify furniture, materials, colours and layouts.
9. Automatically calculate estimated costs.
10. Optimize designs to stay within budget.
11. Find alternative products/materials.
12. Create a shopping list.
13. Track interior execution.
14. Track project budget and expenses.
15. Track project completion.
16. Maintain a final digital record of the completed home.

CORE PRODUCT IDEA
=================

"Design your entire home without losing control of your budget."

The AI should not simply generate pretty images.

It should understand:

- Space
- Room dimensions
- User lifestyle
- Design preferences
- Budget
- Furniture
- Materials
- Constraints

and produce realistic, explainable and budget-aware recommendations.


==================================================
PHASE 0 — DEVELOPMENT ENVIRONMENT
==================================================

Install:

- Git
- GitHub account
- Node.js 22+
- Python 3.12+
- Docker Desktop
- PostgreSQL (optional locally because Docker will provide it)
- Redis (optional locally because Docker will provide it)
- VS Code
- AWS CLI
- Terraform

Verify:

git --version
node --version
npm --version
python --version
docker --version
terraform --version
aws --version


==================================================
PHASE 1 — CREATE GITHUB REPOSITORY
==================================================

Create repository:

ai-interior-designer

Repository visibility:

Private initially.

Main branch:

main

Development branch:

develop


Branch strategy:

main
  |
  +---- develop
          |
          +---- feature/authentication
          +---- feature/project-management
          +---- feature/ai-design
          +---- feature/budget-engine
          +---- feature/shopping
          +---- feature/3d-view
          +---- fix/...


Branch naming convention:

feature/<name>
fix/<name>
refactor/<name>
docs/<name>
chore/<name>


Pull Request rule:

feature branch
      ↓
develop
      ↓
testing
      ↓
main
      ↓
production


==================================================
PHASE 2 — CREATE PROJECT STRUCTURE
==================================================

Create:

ai-interior-designer/

├── README.md
├── LICENSE
├── .gitignore
├── .env.example
├── docker-compose.yml
├── Makefile
│
├── frontend/
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── eslint.config.mjs
│   │
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   │
│   │   ├── login/
│   │   ├── register/
│   │   │
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   ├── projects/
│   │   │   └── settings/
│   │   │
│   │   ├── project/
│   │   │   └── [projectId]/
│   │   │       ├── page.tsx
│   │   │       ├── rooms/
│   │   │       ├── budget/
│   │   │       ├── designs/
│   │   │       ├── shopping/
│   │   │       └── execution/
│   │   │
│   │   └── onboarding/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── dashboard/
│   │   ├── rooms/
│   │   ├── designs/
│   │   ├── budget/
│   │   ├── shopping/
│   │   └── execution/
│   │
│   ├── lib/
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   └── constants.ts
│   │
│   ├── hooks/
│   ├── types/
│   └── tests/
│
├── backend/
│   ├── pyproject.toml
│   │
│   ├── app/
│   │   ├── main.py
│   │   │
│   │   ├── api/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── projects.py
│   │   │   ├── rooms.py
│   │   │   ├── designs.py
│   │   │   ├── budget.py
│   │   │   ├── shopping.py
│   │   │   ├── execution.py
│   │   │   └── uploads.py
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── logging.py
│   │   │
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── room.py
│   │   │   ├── design.py
│   │   │   ├── budget.py
│   │   │   ├── product.py
│   │   │   └── execution.py
│   │   │
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── auth_service.py
│   │   │   ├── project_service.py
│   │   │   ├── room_service.py
│   │   │   ├── design_service.py
│   │   │   ├── budget_service.py
│   │   │   ├── shopping_service.py
│   │   │   └── execution_service.py
│   │   │
│   │   ├── ai/
│   │   │   ├── orchestrator.py
│   │   │   ├── prompts/
│   │   │   ├── image_generation.py
│   │   │   ├── vision.py
│   │   │   ├── style_analyzer.py
│   │   │   └── design_optimizer.py
│   │   │
│   │   ├── workers/
│   │   │   ├── celery_app.py
│   │   │   └── tasks.py
│   │   │
│   │   └── utils/
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── api/
│
├── database/
│   ├── migrations/
│   └── seed/
│
├── ai/
│   ├── notebooks/
│   ├── datasets/
│   ├── experiments/
│   └── models/
│
├── infrastructure/
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── provider.tf
│   │   ├── networking.tf
│   │   ├── database.tf
│   │   ├── storage.tf
│   │   └── compute.tf
│   │
│   └── docker/
│       ├── frontend.Dockerfile
│       ├── backend.Dockerfile
│       └── nginx.conf
│
├── nginx/
│   └── nginx.conf
│
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/
│
├── scripts/
│   ├── setup.sh
│   ├── migrate.sh
│   └── seed.sh
│
└── .github/
    └── workflows/
        ├── frontend-ci.yml
        ├── backend-ci.yml
        ├── docker.yml
        ├── security.yml
        └── deploy.yml


==================================================
PHASE 3 — INITIALIZE FRONTEND
==================================================

Inside project:

npx create-next-app@latest frontend

Select:

TypeScript
ESLint
Tailwind CSS
App Router
src directory: optional
Turbopack: yes


Install:

npm install axios
npm install zustand
npm install react-hook-form
npm install zod
npm install lucide-react
npm install recharts
npm install @tanstack/react-query


Frontend responsibilities:

- Authentication UI
- Onboarding
- Dashboard
- Room management
- Design visualization
- Budget interface
- Shopping interface
- Execution tracker
- API communication
- Responsive UI


==================================================
PHASE 4 — INITIALIZE BACKEND
==================================================

Create Python environment:

cd backend

python -m venv .venv

Activate environment.

Install:

fastapi
uvicorn
sqlalchemy
alembic
psycopg
pydantic
pydantic-settings
python-jose
passlib
bcrypt
python-multipart
redis
celery
boto3
httpx
pytest
pytest-asyncio
ruff
black


Use pyproject.toml.

Backend entry point:

backend/app/main.py


Initial API:

GET /

GET /health


Expected:

{
    "status": "ok"
}


==================================================
PHASE 5 — DATABASE DESIGN
==================================================

Use PostgreSQL.

Core tables:

users

id
email
password_hash
name
created_at
updated_at


projects

id
user_id
name
property_type
bhk
area_sqft
budget
currency
created_at
updated_at


rooms

id
project_id
name
room_type
length
width
height
area
status


room_images

id
room_id
image_url
image_type
created_at


user_preferences

id
user_id
style
colour_preferences
material_preferences
lifestyle_preferences


designs

id
room_id
name
description
style
estimated_cost
image_url
status
created_at


design_items

id
design_id
name
category
quantity
unit_cost
total_cost
product_id


budgets

id
project_id
total_budget
allocated_budget
spent_amount
remaining_amount


budget_categories

id
budget_id
category
allocated
estimated
actual


products

id
name
category
brand
price
image_url
product_url


shopping_items

id
project_id
product_id
quantity
status


execution_tasks

id
project_id
name
description
status
start_date
end_date
estimated_cost
actual_cost


expenses

id
project_id
category
description
amount
date
receipt_url


==================================================
PHASE 6 — AUTHENTICATION
==================================================

Implement:

POST /auth/register

POST /auth/login

POST /auth/refresh

POST /auth/logout

GET /users/me


Use:

JWT access token
JWT refresh token


Passwords must NEVER be stored directly.

Store:

password_hash


Frontend:

Login
Register
Forgot password
Profile


Later:

Google OAuth
Apple OAuth


==================================================
PHASE 7 — PROJECT CREATION
==================================================

Create:

POST /projects

GET /projects

GET /projects/{project_id}

PUT /projects/{project_id}

DELETE /projects/{project_id}


Project creation flow:

Step 1:

Property type

Step 2:

BHK

Step 3:

Area

Step 4:

Floor plan

Step 5:

Budget

Step 6:

Lifestyle

Step 7:

Design preferences


Example:

{
    "name": "My New Home",
    "property_type": "apartment",
    "bhk": 2,
    "area_sqft": 1120,
    "budget": 800000
}


==================================================
PHASE 8 — FLOOR PLAN / IMAGE UPLOAD
==================================================

Allow:

PNG
JPG
JPEG
PDF


Create:

POST /uploads

Store files in object storage.

Do NOT store large images directly inside PostgreSQL.

Store:

object URL
metadata


Pipeline:

User Upload
     ↓
Object Storage
     ↓
Backend
     ↓
AI Vision
     ↓
Room Detection
     ↓
Dimensions
     ↓
Structured Layout
     ↓
Database


==================================================
PHASE 9 — ROOM MANAGEMENT
==================================================

API:

POST /projects/{id}/rooms

GET /projects/{id}/rooms

GET /rooms/{id}

PUT /rooms/{id}

DELETE /rooms/{id}


Each room stores:

Room type
Dimensions
Images
Purpose
Furniture requirements
Design status


Room types:

Living Room
Master Bedroom
Bedroom
Kitchen
Dining Room
Bathroom
Balcony
Study
Pooja Room
Utility


==================================================
PHASE 10 — DESIGN PREFERENCE ENGINE
==================================================

Create preference questionnaire.

Ask:

Lifestyle
Family size
Pets
Children
Work from home
Entertainment
Storage requirements
Maintenance preference


Style discovery:

Show reference images.

User:

LIKE
DISLIKE
SKIP


Backend calculates:

style profile


Example:

{
    "primary_style": "warm_contemporary",
    "secondary_style": "minimal",
    "wood_preference": "high",
    "colour_preference": [
        "beige",
        "cream",
        "brown"
    ]
}


==================================================
PHASE 11 — AI DESIGN ENGINE
==================================================

Architecture:

Frontend
    ↓
FastAPI
    ↓
Design Orchestrator
    ↓
 ┌───────────────┐
 │ Space Analysis│
 └───────┬───────┘
         ↓
 ┌───────────────┐
 │ User Profile  │
 └───────┬───────┘
         ↓
 ┌───────────────┐
 │ Budget Engine  │
 └───────┬───────┘
         ↓
 ┌───────────────┐
 │ AI Generator   │
 └───────┬───────┘
         ↓
 Design Candidates


AI modules:

1. Vision Analysis
2. Style Analysis
3. Design Planning
4. Prompt Generation
5. Image Generation
6. Budget Estimation
7. Design Optimization


==================================================
PHASE 12 — DESIGN GENERATION API
==================================================

POST:

/rooms/{room_id}/designs/generate


Request:

{
    "style": "warm_contemporary",
    "budget": 150000,
    "requirements": [
        "storage",
        "tv",
        "reading_corner"
    ]
}


Response:

{
    "design_id": "...",
    "status": "processing"
}


Generation should be asynchronous.

Do NOT keep HTTP request open for long AI generation tasks.


Flow:

API
 ↓
Redis Queue
 ↓
Celery Worker
 ↓
AI Provider
 ↓
Object Storage
 ↓
Database
 ↓
Frontend notification


==================================================
PHASE 13 — THREE DESIGN CONCEPTS
==================================================

Generate:

Design A
Design B
Design C


Example:

A — Warm Minimal

₹1,45,000


B — Contemporary Luxury

₹2,10,000


C — Budget Smart

₹1,05,000


Each design contains:

Image
Description
Estimated cost
Furniture
Materials
Lighting
Colour palette
Pros
Cons


==================================================
PHASE 14 — BUDGET ENGINE
==================================================

Budget must be a first-class system.

Input:

Total budget


Example:

₹8,00,000


Allocate:

Kitchen
Wardrobes
Furniture
Civil
Electrical
Lighting
Paint
Curtains
Decor
Contingency


Calculate:

allocated
estimated
actual
remaining


Formula:

remaining_budget =
total_budget - estimated_total


==================================================
PHASE 15 — DESIGN COST CALCULATION
==================================================

Every design item must have:

name
category
quantity
unit_cost
total_cost


Formula:

total_cost =
quantity × unit_cost


Design:

Sofa
₹50,000

TV unit
₹30,000

Lighting
₹10,000

Decor
₹15,000

Total:

₹1,05,000


==================================================
PHASE 16 — BUDGET OPTIMIZER
==================================================

User:

"Make this design ₹50,000 cheaper."


Backend:

Current:

₹8,50,000

Target:

₹8,00,000


Optimization engine identifies:

Optional furniture
Premium materials
Decor
Lighting
Custom work


Then generates:

Alternative configuration


Example:

Premium Sofa
₹85,000

→

Standard Sofa
₹52,000


Savings:

₹33,000


Repeat until:

estimated_cost <= budget


Important:

Never compromise:

Safety
Room dimensions
Required furniture
Accessibility


==================================================
PHASE 17 — PRODUCT CATALOG
==================================================

Create product database.

Categories:

Sofa
Bed
Table
Chair
Lighting
Curtains
Rugs
Decor
Storage
Wardrobes
Kitchen
Bathroom


Product:

id
name
brand
category
price
dimensions
image
URL
rating
availability


Create:

GET /products

GET /products/{id}

GET /products?category=sofa

GET /products?max_price=50000


==================================================
PHASE 18 — PRODUCT ALTERNATIVES
==================================================

Endpoint:

GET /products/{id}/alternatives


Filters:

Price
Style
Colour
Material
Size


Example:

Current:

₹85,000


Alternatives:

₹52,000
₹60,000
₹72,000


==================================================
PHASE 19 — SHOPPING LIST
==================================================

Create:

GET /projects/{id}/shopping

POST /projects/{id}/shopping

PUT /shopping/{id}

DELETE /shopping/{id}


Statuses:

Wishlist
Selected
Ordered
Delivered
Installed


Calculate:

Total shopping cost


==================================================
PHASE 20 — EXECUTION TRACKER
==================================================

Create project timeline.

Example:

Planning
Measurement
Civil
Electrical
Painting
Kitchen
Wardrobes
Furniture
Lighting
Final setup


Each task:

Pending
In Progress
Completed
Blocked


Progress:

completed_tasks / total_tasks


==================================================
PHASE 21 — EXPENSE TRACKER
==================================================

User records:

₹45,000 Sofa
₹1,20,000 Kitchen
₹80,000 Wardrobe


Dashboard:

Budget:

₹8,00,000

Estimated:

₹7,70,000

Actual:

₹5,20,000

Remaining:

₹2,80,000


Allow receipt upload.

Store receipt in object storage.


==================================================
PHASE 22 — FRONTEND DASHBOARD
==================================================

Dashboard should display:

-------------------------------------
MY HOME
-------------------------------------

2 BHK
1,120 sq ft

Budget

₹8,00,000

Estimated

₹7,72,000

Spent

₹5,21,000

Remaining

₹2,79,000


DESIGN PROGRESS

████████░░ 80%


ROOMS

Living Room       ✓
Kitchen           ✓
Master Bedroom   ✓
Bedroom 2        60%
Bathroom         -
Balcony          -


PROJECT PROGRESS

███████░░░ 70%


NEXT DECISION

Choose your bedroom lighting

[ OPTION A ]

[ OPTION B ]

[ OPTION C ]


==================================================
PHASE 23 — DESIGN VIEWER
==================================================

Room design page:

Large image

Below:

Style
Estimated Cost
Budget Status


Tabs:

Overview
Furniture
Materials
Lighting
Colours
Products


Actions:

Save
Regenerate
Edit
Find alternatives
Optimize budget


==================================================
PHASE 24 — "WHAT IF?" MODE
==================================================

User can ask:

"What if I reduce the budget by ₹1 lakh?"


"What if I want more storage?"


"What if I want a luxury look?"


"What if I add a work desk?"


AI should modify:

Design
Furniture
Materials
Cost


without rebuilding the entire project.


==================================================
PHASE 25 — API DOCUMENTATION
==================================================

FastAPI automatically provides:

/docs

/redoc


Document:

Authentication
Projects
Rooms
Designs
Budget
Products
Shopping
Execution


Every endpoint must include:

Request schema
Response schema
Error responses
Authentication requirement


==================================================
PHASE 26 — TESTING STRATEGY
==================================================

BACKEND UNIT TESTS

Test:

Budget calculations
Authentication
Project creation
Room creation
Cost calculation
Budget optimizer


Example:

test_budget_calculation.py


INTEGRATION TESTS

Test:

API
Database
Redis
Storage


FRONTEND TESTS

Test:

Login
Dashboard
Project creation
Room creation
Budget update


E2E TESTS

Use Playwright.

Critical flow:

Register
 ↓
Create project
 ↓
Set budget
 ↓
Add room
 ↓
Generate design
 ↓
Select design
 ↓
View budget
 ↓
Add product
 ↓
Complete task


==================================================
PHASE 27 — CODE QUALITY
==================================================

Python:

Ruff
Black
Pytest


TypeScript:

ESLint
Prettier
TypeScript compiler


Before PR:

Backend:

ruff check .
black --check .
pytest


Frontend:

npm run lint
npm run type-check
npm test


==================================================
PHASE 28 — DOCKER
==================================================

Services:

frontend
backend
postgres
redis
nginx


Docker Compose:

frontend
backend
postgres
redis
nginx


Local architecture:

Browser
   ↓
Nginx
   ↓
Frontend
   ↓
Backend
   ↓
PostgreSQL

Backend
   ↓
Redis
   ↓
Celery Worker
   ↓
AI Services


==================================================
PHASE 29 — ENVIRONMENT VARIABLES
==================================================

Create:

.env.example


Variables:

DATABASE_URL=

REDIS_URL=

JWT_SECRET=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

AI_API_KEY=

NEXT_PUBLIC_API_URL=


NEVER commit:

.env

Secrets must never enter Git.


==================================================
PHASE 30 — GITHUB ACTIONS CI
==================================================

Create:

.github/workflows/backend-ci.yml

Pipeline:

Push
 ↓
Checkout
 ↓
Python setup
 ↓
Install dependencies
 ↓
Ruff
 ↓
Black
 ↓
Pytest
 ↓
Build


Frontend:

.github/workflows/frontend-ci.yml


Pipeline:

Push
 ↓
Checkout
 ↓
Node setup
 ↓
npm install
 ↓
Lint
 ↓
Type check
 ↓
Tests
 ↓
Build


==================================================
PHASE 31 — SECURITY CI
==================================================

Create:

security.yml


Run:

Dependency vulnerability scan
Secret scanning
Container scanning
Static analysis


Tools can include:

GitHub Dependabot
CodeQL
Trivy
pip-audit


Pipeline should fail for critical security issues.


==================================================
PHASE 32 — DOCKER CI
==================================================

After tests pass:

Build:

frontend Docker image
backend Docker image


Tag:

commit SHA

Example:

backend:a83f912


Push to:

AWS ECR


Do not deploy code that has failed CI.


==================================================
PHASE 33 — AWS ARCHITECTURE
==================================================

Recommended production architecture:

                         INTERNET
                            |
                            ↓
                       CloudFront
                            |
                            ↓
                      Application
                         Load
                       Balancer
                            |
                 ┌──────────┴──────────┐
                 ↓                     ↓
              Frontend              Backend
              Container             Container
                 |                     |
                 |              ┌──────┴──────┐
                 |              ↓             ↓
                 |           PostgreSQL      Redis
                 |
                 ↓
              S3 Bucket


AI processing:

Backend
   ↓
SQS / Redis
   ↓
Worker
   ↓
AI API
   ↓
S3


Recommended AWS services:

EC2 or ECS
RDS PostgreSQL
ElastiCache Redis
S3
CloudFront
Application Load Balancer
ECR
Route 53
CloudWatch
Secrets Manager


For a student project, ECS/Fargate is a good target architecture.


==================================================
PHASE 34 — TERRAFORM
==================================================

Infrastructure must be Infrastructure-as-Code.

Create:

infrastructure/terraform/


Files:

provider.tf
variables.tf
main.tf
networking.tf
database.tf
storage.tf
compute.tf
outputs.tf


Terraform manages:

VPC
Subnets
Security Groups
RDS
S3
ECR
ECS
Load Balancer
CloudFront
IAM


Never manually create production infrastructure if Terraform is intended to manage it.


==================================================
PHASE 35 — ENVIRONMENTS
==================================================

Create:

Development
Staging
Production


Development:

Local Docker


Staging:

AWS


Production:

AWS


Flow:

feature
   ↓
PR
   ↓
CI
   ↓
develop
   ↓
Staging
   ↓
Testing
   ↓
PR
   ↓
main
   ↓
Production


==================================================
PHASE 36 — CD PIPELINE
==================================================

.github/workflows/deploy.yml


Pipeline:

GitHub
   ↓
Checkout
   ↓
Run tests
   ↓
Security scan
   ↓
Build Docker
   ↓
Push image to ECR
   ↓
Terraform plan
   ↓
Deploy staging
   ↓
Smoke tests
   ↓
Approval
   ↓
Production deployment


Production deployment should require approval initially.


==================================================
PHASE 37 — DATABASE MIGRATIONS
==================================================

Use Alembic.

Developer:

Modify model

↓

Create migration

↓

Review migration

↓

CI tests migration

↓

Deploy migration

↓

Deploy application


Never manually edit production tables.


==================================================
PHASE 38 — MONITORING
==================================================

Implement:

Application logs
Error logs
Request latency
Database metrics
CPU
Memory
Queue length
AI generation failures


Metrics:

API requests
API errors
Average response time
AI generation time
AI failures
Budget optimization requests
Active projects


Use:

Prometheus
Grafana
CloudWatch


==================================================
PHASE 39 — HEALTH CHECKS
==================================================

Backend:

GET /health


Database health:

GET /health/db


Redis health:

GET /health/redis


Application health:

GET /health/full


Example:

{
    "api": "healthy",
    "database": "healthy",
    "redis": "healthy"
}


==================================================
PHASE 40 — LOGGING
==================================================

Use structured logging.

Example:

{
    "timestamp": "...",
    "level": "INFO",
    "service": "backend",
    "request_id": "...",
    "user_id": "...",
    "endpoint": "/projects",
    "status": 200
}


Never log:

Passwords
JWT tokens
API keys
Payment information


==================================================
PHASE 41 — ERROR HANDLING
==================================================

Create standardized API errors.

Example:

{
    "error": {
        "code": "BUDGET_EXCEEDED",
        "message": "Design exceeds the configured budget.",
        "request_id": "..."
    }
}


Frontend should display human-friendly messages.


==================================================
PHASE 42 — RATE LIMITING
==================================================

Protect:

Login
Registration
AI generation
Image upload
API endpoints


AI generation especially needs rate limits because it can become expensive.


Example:

Free user:

5 generations/day


Premium:

50 generations/day


==================================================
PHASE 43 — SECURITY
==================================================

Implement:

HTTPS
JWT
Password hashing
CORS
CSRF protection where applicable
Rate limiting
Input validation
File type validation
File size limits
SQL injection protection
XSS protection
Secure headers
Secrets management


Uploaded images must be validated.

Do not blindly trust:

filename
MIME type
extension


==================================================
PHASE 44 — AI COST CONTROL
==================================================

This is extremely important.

AI generation can become expensive.

Track:

user_id
generation_id
model
input tokens
output tokens
image generation count
estimated cost


Create:

ai_usage


Fields:

id
user_id
operation
model
cost
created_at


Set limits.


==================================================
PHASE 45 — PRODUCT ANALYTICS
==================================================

Track events:

user_registered
project_created
room_created
style_selected
design_generated
design_selected
budget_optimized
product_added
shopping_item_ordered
execution_started
project_completed


This tells you:

Where users drop off
Which features are useful
Which rooms are popular
Average budget
Average number of generations


==================================================
PHASE 46 — FINAL USER FLOW
==================================================

USER

↓

Landing Page

↓

Create Account

↓

Create Home

↓

Enter:

2 BHK
1120 sq ft
₹8L budget

↓

Upload floor plan

↓

AI detects rooms

↓

Lifestyle questionnaire

↓

Style discovery

↓

AI creates style profile

↓

Living room

↓

Generate 3 designs

↓

Compare

↓

Select Design B

↓

Budget:

₹8.4L

↓

"Make it fit ₹8L"

↓

AI optimizes

↓

₹7.96L

↓

Approve

↓

Shopping list

↓

Execution plan

↓

Track expenses

↓

Track progress

↓

Complete Home

↓

Digital Home Book


==================================================
PHASE 47 — MVP
==================================================

DO NOT build everything initially.

MVP FEATURES:

1. Authentication
2. Project creation
3. Budget
4. Room creation
5. Image upload
6. Style questionnaire
7. AI design generation
8. Three design concepts
9. Budget estimation
10. Budget optimizer
11. Dashboard


MVP should be fully functional before adding advanced features.


==================================================
PHASE 48 — VERSION 2
==================================================

Add:

Product catalogue
Shopping list
Product alternatives
Expense tracker
Execution tracker
Notifications
Advanced AI chat


==================================================
PHASE 49 — VERSION 3
==================================================

Add:

3D visualization
AR furniture placement
Interactive floor plan
Real-time room editing
Voice assistant
Advanced material visualization


==================================================
PHASE 50 — VERSION 4
==================================================

Add:

Interior contractors
Designer marketplace
Vendor marketplace
Furniture marketplace
Material marketplace
Quotation comparison
Contract management


==================================================
PHASE 51 — FUTURE AI ARCHITECTURE
==================================================

Eventually:

                 USER
                   |
                   ↓
             AI ASSISTANT
                   |
          ┌────────┼────────┐
          ↓        ↓        ↓
       Vision   Planning   Budget
          |        |        |
          └────────┼────────┘
                   ↓
             Design Agent
                   |
        ┌──────────┼──────────┐
        ↓          ↓          ↓
    Furniture   Materials   Lighting
        |
        ↓
    Product Agent
        |
        ↓
  Shopping Recommendations
        |
        ↓
   Execution Agent


This creates an actual AI interior design system rather than a simple image generator.


==================================================
PHASE 52 — CI/CD FINAL ARCHITECTURE
==================================================


DEVELOPER

    ↓

git checkout -b feature/design-engine

    ↓

Write code

    ↓

Local tests

    ↓

git push

    ↓

GitHub Pull Request

    ↓

┌─────────────────────────────┐
│           CI                │
├─────────────────────────────┤
│ Backend tests               │
│ Frontend tests              │
│ Lint                        │
│ Type checking               │
│ Security scan               │
│ Dependency scan             │
│ Docker build                │
└──────────────┬──────────────┘
               ↓
           PASS / FAIL
               |
              PASS
               ↓
          Code Review
               ↓
            MERGE
               ↓
           DEVELOP
               ↓
       Deploy STAGING
               ↓
        Integration Tests
               ↓
        Smoke Tests
               ↓
          Approval
               ↓
             MAIN
               ↓
       Build Production
               ↓
          Push ECR
               ↓
       Deploy Production
               ↓
        Health Checks
               ↓
          MONITORING


==================================================
PHASE 53 — DEFINITION OF DONE
==================================================

A feature is NOT complete merely because the code works.

A feature is complete when:

[ ] Backend implemented
[ ] Frontend implemented
[ ] Database migration created
[ ] API documented
[ ] Unit tests written
[ ] Integration tests written
[ ] Error handling implemented
[ ] Logging implemented
[ ] Security reviewed
[ ] Docker build works
[ ] CI passes
[ ] Staging deployment works
[ ] Smoke test passes
[ ] Production deployment works
[ ] Monitoring exists
[ ] Documentation updated


==================================================
PHASE 54 — PROJECT DEVELOPMENT ORDER
==================================================

FOLLOW THIS ORDER.

DO NOT JUMP AROUND.

WEEK 1

[ ] GitHub repository
[ ] Folder structure
[ ] Next.js setup
[ ] FastAPI setup
[ ] Docker
[ ] PostgreSQL
[ ] Redis
[ ] Basic CI


WEEK 2

[ ] Database models
[ ] Alembic
[ ] Authentication
[ ] User APIs
[ ] Login/Register UI


WEEK 3

[ ] Project creation
[ ] Project dashboard
[ ] Room management
[ ] Image uploads


WEEK 4

[ ] Lifestyle questionnaire
[ ] Style discovery
[ ] Style profile


WEEK 5

[ ] AI architecture
[ ] Vision analysis
[ ] Design planning
[ ] Prompt system


WEEK 6

[ ] AI image generation
[ ] Async generation
[ ] Celery
[ ] Design storage


WEEK 7

[ ] Design comparison
[ ] Design selection
[ ] Design details
[ ] Furniture extraction


WEEK 8

[ ] Budget engine
[ ] Cost calculation
[ ] Budget dashboard
[ ] Budget warnings


WEEK 9

[ ] Budget optimizer
[ ] "Make it cheaper"
[ ] Alternative materials
[ ] Alternative furniture


WEEK 10

[ ] Product catalogue
[ ] Shopping list
[ ] Product alternatives


WEEK 11

[ ] Execution tracker
[ ] Expense tracker
[ ] Project timeline


WEEK 12

[ ] E2E testing
[ ] Security
[ ] Monitoring
[ ] Logging


WEEK 13

[ ] Terraform
[ ] AWS infrastructure
[ ] ECR
[ ] ECS
[ ] RDS
[ ] S3


WEEK 14

[ ] Staging deployment
[ ] Production deployment
[ ] CI/CD


WEEK 15

[ ] Performance optimization
[ ] UI polish
[ ] Error handling
[ ] Documentation


WEEK 16

[ ] Final testing
[ ] Security audit
[ ] Production launch
[ ] Demo


==================================================
PHASE 55 — FINAL TECH STACK
==================================================

FRONTEND

Next.js
TypeScript
Tailwind CSS
React Query
Zustand


BACKEND

Python
FastAPI
SQLAlchemy
Alembic


DATABASE

PostgreSQL


ASYNC

Redis
Celery


AI

LLM
Vision model
Image generation model


STORAGE

Amazon S3


CONTAINERS

Docker
Docker Compose


CI/CD

GitHub Actions


CLOUD

AWS


INFRASTRUCTURE

Terraform


MONITORING

Prometheus
Grafana
CloudWatch


SECURITY

CodeQL
Dependabot
Trivy
pip-audit


TESTING

Pytest
Jest/Vitest
Playwright


REVERSE PROXY

Nginx


==================================================
FINAL ARCHITECTURE
==================================================


                         ┌──────────────┐
                         │    USER      │
                         └──────┬───────┘
                                │
                                ↓
                         ┌──────────────┐
                         │ CloudFront   │
                         └──────┬───────┘
                                │
                                ↓
                         ┌──────────────┐
                         │ LoadBalancer │
                         └──────┬───────┘
                                │
                ┌───────────────┴───────────────┐
                ↓                               ↓
        ┌──────────────┐                ┌──────────────┐
        │   Next.js    │                │   FastAPI    │
        │   Frontend   │                │   Backend    │
        └──────────────┘                └──────┬───────┘
                                               │
                         ┌─────────────────────┼───────────────────┐
                         ↓                     ↓                   ↓
                  ┌─────────────┐      ┌─────────────┐     ┌─────────────┐
                  │ PostgreSQL  │      │    Redis    │     │     S3      │
                  └─────────────┘      └──────┬──────┘     └─────────────┘
                                              │
                                              ↓
                                       ┌─────────────┐
                                       │   Celery    │
                                       │   Workers   │
                                       └──────┬──────┘
                                              │
                                              ↓
                                       ┌─────────────┐
                                       │  AI Layer   │
                                       └─────────────┘


==================================================
END GOAL
==================================================

The finished application should allow a user to go from:

EMPTY APARTMENT

        ↓

UPLOAD FLOOR PLAN

        ↓

SET ₹8L BUDGET

        ↓

DEFINE LIFESTYLE

        ↓

DISCOVER DESIGN STYLE

        ↓

AI UNDERSTANDS SPACE

        ↓

GENERATE 3 DESIGNS

        ↓

COMPARE DESIGNS

        ↓

CHOOSE ONE

        ↓

CALCULATE COST

        ↓

OPTIMIZE TO ₹8L

        ↓

SELECT PRODUCTS

        ↓

CREATE SHOPPING LIST

        ↓

CREATE EXECUTION PLAN

        ↓

TRACK EXPENSES

        ↓

TRACK PROGRESS

        ↓

COMPLETE HOME


The final product is not an "AI image generator".

It is an:

AI-POWERED HOME DESIGN,
BUDGETING AND EXECUTION PLATFORM.
