# Import all the models, so that Base has them before being
# imported by Alembic or database initialization scripts
from app.db.session import Base
from app.models.user import User
from app.models.project import Project
from app.models.design import Design
from app.models.object import Object
