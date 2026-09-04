from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime

try:
    from app.db.base import Base
except ImportError:
    from backend.app.db.base import Base

class GUID(TypeDecorator):
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        elif dialect.name == 'postgresql':
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return str(uuid.UUID(value))
            else:
                return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value

class Room(Base):
    __tablename__ = "rooms"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    project_id = Column(GUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    room_type = Column(String, nullable=False)  # Living Room, Master Bedroom, Kitchen, etc.
    length = Column(Float, nullable=True)
    width = Column(Float, nullable=True)
    height = Column(Float, nullable=True)
    area = Column(Float, nullable=True)
    status = Column(String, default="planning")
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="rooms")
    images = relationship("RoomImage", back_populates="room", cascade="all, delete-orphan")
    designs = relationship("Design", back_populates="room", cascade="all, delete-orphan")

class RoomImage(Base):
    __tablename__ = "room_images"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    room_id = Column(GUID(), ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)
    image_type = Column(String, default="photo")  # floor_plan, photo, cad, panorama
    created_at = Column(DateTime, default=datetime.utcnow)

    room = relationship("Room", back_populates="images")
