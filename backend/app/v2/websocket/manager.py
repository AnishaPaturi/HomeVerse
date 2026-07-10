from fastapi import WebSocket
from typing import Dict, List, Set, Any
import json

class CollaborationManager:
    def __init__(self):
        # Maps design_id/project_id to list of active WebSockets
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Stores design history states for Figma-like undo/redo
        self.version_history: Dict[str, List[Dict[str, Any]]] = {}

    async def connect(self, websocket: WebSocket, design_id: str):
        await websocket.accept()
        if design_id not in self.active_connections:
            self.active_connections[design_id] = set()
        self.active_connections[design_id].add(websocket)
        print(f"WS Collaboration: Client connected to session {design_id}")

    def disconnect(self, websocket: WebSocket, design_id: str):
        if design_id in self.active_connections:
            self.active_connections[design_id].remove(websocket)
            if not self.active_connections[design_id]:
                del self.active_connections[design_id]
        print(f"WS Collaboration: Client disconnected from session {design_id}")

    async def broadcast_scene_update(self, design_id: str, sender: WebSocket, payload: Dict[str, Any]):
        """
        Broadcasts scene graph mutations (position shifts, material swaps) 
        to all other connected users in the design session.
        """
        if design_id not in self.active_connections:
            return
            
        message = json.dumps({
            "type": "scene_mutation",
            "sender": str(id(sender)),
            "payload": payload
        })
        
        # Save to history for undo/redo version control
        if design_id not in self.version_history:
            self.version_history[design_id] = []
        self.version_history[design_id].append(payload)
        # Limit history size to 50 states
        if len(self.version_history[design_id]) > 50:
            self.version_history[design_id].pop(0)

        for connection in self.active_connections[design_id]:
            if connection != sender:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    print(f"WS Collaboration Warning: Failed to send message: {e}")

    def get_version_history(self, design_id: str) -> List[Dict[str, Any]]:
        return self.version_history.get(design_id, [])

collaboration_manager = CollaborationManager()
