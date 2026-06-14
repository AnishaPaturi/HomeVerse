from sqlalchemy import Column, String, Boolean, ForeignKey, UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.session import Base

class Design(Base):
    __tablename__ = "designs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    style = Column(String, nullable=False)
    image_url = Column(String, nullable=False)
    selected = Column(Boolean, default=False)

    project = relationship("Project", back_populates="designs")
    objects = relationship("Object", back_populates="design", cascade="all, delete-orphan")
