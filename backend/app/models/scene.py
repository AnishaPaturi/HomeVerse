from sqlalchemy import Column, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from app.db.session import Base, GUID

class Scene(Base):
    __tablename__ = "scenes"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    room_id = Column(GUID(), ForeignKey("rooms.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False, default="Default Scene")
    scene_type = Column(String, default="room")  # room, floor, house, walkthrough
    camera_settings = Column(Text, nullable=True)  # JSON {position: [x,y,z], target: [x,y,z], fov: 60}
    lighting_settings = Column(Text, nullable=True)  # JSON {ambient: 0.7, directional: [x,y,z], intensity: 1.0}
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("Project", back_populates="scenes")
    room = relationship("Room", back_populates="scenes")
    scene_objects = relationship("SceneObject", back_populates="scene", cascade="all, delete-orphan")
