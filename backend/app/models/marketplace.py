from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

from app.db.session import Base, GUID


class Provider(Base):
    """
    Phase 50: Marketplace Provider (Interior Contractor, Designer / Architect, Vendor)
    """
    __tablename__ = "providers"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    provider_type = Column(String, nullable=False)  # contractor, designer, vendor
    name = Column(String, nullable=False)
    company_name = Column(String, nullable=True)
    specialties = Column(JSON, nullable=True)
    rating = Column(Float, default=4.8)
    reviews_count = Column(Integer, default=12)
    experience_years = Column(Integer, default=5)
    is_verified = Column(Boolean, default=True)
    location_city = Column(String, default="Bengaluru")
    pricing_model = Column(String, default="per_sqft")  # per_sqft, daily_rate, fixed_package
    base_rate = Column(Float, default=180.0)
    portfolio = Column(JSON, nullable=True)
    availability_status = Column(String, default="available")  # available, busy, booked
    contact_phone = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    profile_image_url = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    listings = relationship("MarketplaceListing", back_populates="provider", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="provider", cascade="all, delete-orphan")
    contracts = relationship("Contract", back_populates="provider", cascade="all, delete-orphan")


class MarketplaceListing(Base):
    """
    Phase 50: Furniture & Material Marketplace Listings
    """
    __tablename__ = "marketplace_listings"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    provider_id = Column(GUID(), ForeignKey("providers.id", ondelete="SET NULL"), nullable=True)
    listing_type = Column(String, nullable=False)  # furniture, material
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)  # sofa, dining, plywood, tiles, marble, veneer, hardware
    brand = Column(String, nullable=True)
    price = Column(Float, default=0.0)
    unit = Column(String, default="per_piece")  # per_piece, per_sqft, per_sheet, per_liter
    min_order_qty = Column(Integer, default=1)
    lead_time_days = Column(Integer, default=5)
    stock_quantity = Column(Integer, default=50)
    specs = Column(JSON, nullable=True)
    sample_available = Column(Boolean, default=True)
    image_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    provider = relationship("Provider", back_populates="listings")


class Quotation(Base):
    """
    Phase 50: Quotation / Bid submitted for Project Work
    """
    __tablename__ = "quotations"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(GUID(), ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    quotation_number = Column(String, nullable=False)
    total_amount = Column(Float, default=0.0)
    breakdown = Column(JSON, nullable=True)
    estimated_duration_days = Column(Integer, default=45)
    payment_terms = Column(String, nullable=True)
    warranty_period_months = Column(Integer, default=12)
    status = Column(String, default="submitted")  # submitted, under_review, accepted, rejected
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    provider = relationship("Provider", back_populates="quotations")
    contracts = relationship("Contract", back_populates="quotation")


class Contract(Base):
    """
    Phase 50: Milestone-Linked Contract between Homeowner and Provider
    """
    __tablename__ = "contracts"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    provider_id = Column(GUID(), ForeignKey("providers.id", ondelete="CASCADE"), nullable=False)
    quotation_id = Column(GUID(), ForeignKey("quotations.id", ondelete="SET NULL"), nullable=True)
    contract_number = Column(String, nullable=False)
    title = Column(String, nullable=False)
    scope_of_work = Column(Text, nullable=True)
    total_contract_value = Column(Float, default=0.0)
    milestone_payment_schedule = Column(JSON, nullable=True)
    client_signature = Column(String, nullable=True)
    client_signed_at = Column(DateTime, nullable=True)
    provider_signature = Column(String, nullable=True)
    provider_signed_at = Column(DateTime, nullable=True)
    start_date = Column(DateTime, nullable=True)
    estimated_completion_date = Column(DateTime, nullable=True)
    status = Column(String, default="draft")  # draft, pending_signatures, active, completed, terminated
    terms_and_conditions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project")
    provider = relationship("Provider", back_populates="contracts")
    quotation = relationship("Quotation", back_populates="contracts")
