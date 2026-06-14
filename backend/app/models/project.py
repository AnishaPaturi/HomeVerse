from sqlalchemy import Column, String, DateTime, ForeignKey, UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    room_type = Column(String, nullable=False)
    thumbnail = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="projects")
    designs = relationship("Design", back_populates="project", cascade="all, delete-orphan")
