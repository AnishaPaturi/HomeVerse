"""
Account Purge Service
Permanently wipes all traces of a user account and its associated data from the database.
Guarantees that deleting an account leaves no residual traces and that creating an account
again with the same email/credentials results in a completely empty, fresh state.
"""
from typing import Optional, Dict, Any, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.models.user import User, UserPreference
from app.models.project import Project
from app.models.floor import Floor
from app.models.room import Room, RoomImage
from app.models.floorplan import Floorplan
from app.models.design import Design, DesignItem
from app.models.design_version import DesignVersion
from app.models.scene import Scene
from app.models.scene_object import SceneObject
from app.models.ai_interaction import AIInteraction
from app.models.budget import Budget, BudgetCategory
from app.models.budget_allocation import BudgetAllocation
from app.models.product import ShoppingItem
from app.models.execution import ExecutionTask, Expense
from app.models.object import Object
from app.models.ai_usage import AIUsage
from app.models.analytics_event import AnalyticsEvent
from app.models.notification import Notification
from app.models.marketplace import Provider, MarketplaceListing, Quotation, Contract


class AccountPurgeService:
    @staticmethod
    def purge_user(
        db: Session,
        user: Optional[User] = None,
        email: Optional[str] = None,
        user_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Permanently purges all database records associated with a user:
        1. All projects and their deep hierarchies:
           - Contracts & Quotations
           - Expenses & Execution Tasks
           - Shopping items
           - Notifications
           - AI interactions
           - Scenes & SceneObjects
           - Designs, DesignVersions, DesignItems, Objects
           - Budgets, BudgetCategories, BudgetAllocations
           - Rooms, RoomImages
           - Floorplans & Floors
           - Projects
        2. Direct user-linked records:
           - User Preferences
           - AI Usage records
           - Notifications
           - Analytics Events
           - Provider records, Listings, Bids, Contracts
           - The User record itself
        """
        target_email: Optional[str] = None
        target_id: Optional[UUID] = None

        if user:
            target_id = user.id
            target_email = user.email.strip().lower() if user.email else None
        else:
            if user_id:
                target_id = user_id
                user_record = db.query(User).filter(User.id == user_id).first()
                if user_record and user_record.email:
                    target_email = user_record.email.strip().lower()
            if email and not target_email:
                target_email = email.strip().lower()
                user_record = db.query(User).filter(func.lower(User.email) == target_email).first()
                if user_record:
                    target_id = user_record.id

        if not target_id and not target_email:
            raise ValueError("Either user, email, or user_id must be provided to purge account.")

        # 1. Collect all project IDs owned by target_id
        project_ids: List[Any] = []
        if target_id:
            project_ids = [p[0] for p in db.query(Project.id).filter(Project.user_id == target_id).all()]

        # 2. Deep wipe of all dependent project tables
        if project_ids:
            # Milestone contracts & quotations
            db.query(Contract).filter(Contract.project_id.in_(project_ids)).delete(synchronize_session=False)
            db.query(Quotation).filter(Quotation.project_id.in_(project_ids)).delete(synchronize_session=False)
            db.query(Expense).filter(Expense.project_id.in_(project_ids)).delete(synchronize_session=False)
            db.query(ExecutionTask).filter(ExecutionTask.project_id.in_(project_ids)).delete(synchronize_session=False)
            db.query(ShoppingItem).filter(ShoppingItem.project_id.in_(project_ids)).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.project_id.in_(project_ids)).delete(synchronize_session=False)
            db.query(AIInteraction).filter(AIInteraction.project_id.in_(project_ids)).delete(synchronize_session=False)

            # 3D Scenes and SceneObjects
            scene_ids = [s[0] for s in db.query(Scene.id).filter(Scene.project_id.in_(project_ids)).all()]
            if scene_ids:
                db.query(SceneObject).filter(SceneObject.scene_id.in_(scene_ids)).delete(synchronize_session=False)
                db.query(Scene).filter(Scene.id.in_(scene_ids)).delete(synchronize_session=False)

            # Designs, DesignVersions, DesignItems, 3D Objects
            design_ids = [d[0] for d in db.query(Design.id).filter(Design.project_id.in_(project_ids)).all()]
            if design_ids:
                db.query(DesignItem).filter(DesignItem.design_id.in_(design_ids)).delete(synchronize_session=False)
                db.query(DesignVersion).filter(DesignVersion.design_id.in_(design_ids)).delete(synchronize_session=False)
                db.query(Object).filter(Object.design_id.in_(design_ids)).delete(synchronize_session=False)
                db.query(Design).filter(Design.id.in_(design_ids)).delete(synchronize_session=False)

            # Budgets, Categories, Allocations
            budget_ids = [b[0] for b in db.query(Budget.id).filter(Budget.project_id.in_(project_ids)).all()]
            if budget_ids:
                db.query(BudgetCategory).filter(BudgetCategory.budget_id.in_(budget_ids)).delete(synchronize_session=False)
                db.query(BudgetAllocation).filter(BudgetAllocation.budget_id.in_(budget_ids)).delete(synchronize_session=False)
                db.query(Budget).filter(Budget.id.in_(budget_ids)).delete(synchronize_session=False)

            # Rooms, RoomImages, Room-specific Allocations
            room_ids = [r[0] for r in db.query(Room.id).filter(Room.project_id.in_(project_ids)).all()]
            if room_ids:
                db.query(RoomImage).filter(RoomImage.room_id.in_(room_ids)).delete(synchronize_session=False)
                db.query(BudgetAllocation).filter(BudgetAllocation.room_id.in_(room_ids)).delete(synchronize_session=False)
                db.query(Room).filter(Room.id.in_(room_ids)).delete(synchronize_session=False)

            # Floorplans & Floors
            db.query(Floorplan).filter(Floorplan.project_id.in_(project_ids)).delete(synchronize_session=False)
            db.query(Floor).filter(Floor.project_id.in_(project_ids)).delete(synchronize_session=False)

            # Delete the Project rows
            db.query(Project).filter(Project.id.in_(project_ids)).delete(synchronize_session=False)

        # 3. Direct user-linked records
        if target_id:
            db.query(UserPreference).filter(UserPreference.user_id == target_id).delete(synchronize_session=False)
            db.query(AIUsage).filter(AIUsage.user_id == target_id).delete(synchronize_session=False)
            db.query(Notification).filter(Notification.user_id == target_id).delete(synchronize_session=False)
            db.query(AnalyticsEvent).filter(AnalyticsEvent.user_id == target_id).delete(synchronize_session=False)

        # 4. Analytics events referencing user_id or email in properties
        all_analytics = db.query(AnalyticsEvent).all()
        for ev in all_analytics:
            should_del = False
            if target_id and ev.user_id == target_id:
                should_del = True
            elif ev.properties:
                prop_str = str(ev.properties).lower()
                if target_email and target_email in prop_str:
                    should_del = True
                elif target_id and str(target_id) in prop_str:
                    should_del = True
            if should_del:
                db.delete(ev)

        # 5. Marketplace Provider records and linked listings/quotes/contracts
        prov_conditions = []
        if target_id:
            prov_conditions.append(Provider.user_id == target_id)
        if target_email:
            prov_conditions.append(func.lower(Provider.contact_email) == target_email)
        if prov_conditions:
            matching_providers = db.query(Provider).filter(or_(*prov_conditions)).all()
            for prov in matching_providers:
                db.query(Contract).filter(Contract.provider_id == prov.id).delete(synchronize_session=False)
                db.query(Quotation).filter(Quotation.provider_id == prov.id).delete(synchronize_session=False)
                db.query(MarketplaceListing).filter(MarketplaceListing.provider_id == prov.id).delete(synchronize_session=False)
                db.delete(prov)

        # 6. Delete the User row itself
        user_to_delete = None
        if target_id:
            user_to_delete = db.query(User).filter(User.id == target_id).first()
        if not user_to_delete and target_email:
            user_to_delete = db.query(User).filter(func.lower(User.email) == target_email).first()

        if user_to_delete:
            db.delete(user_to_delete)

        db.commit()

        return {
            "success": True,
            "purged_user_id": str(target_id) if target_id else None,
            "purged_email": target_email,
            "projects_purged": len(project_ids),
        }
