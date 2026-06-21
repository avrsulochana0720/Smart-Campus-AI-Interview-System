from fastapi import WebSocket
from typing import Dict, List
import json

class ConnectionManager:
    def __init__(self):
        # Dictionary mapping a unique user_id to a list of active websocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Keep track of role per user_id, useful for broadcasting to all admins
        self.user_roles: Dict[str, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str, role: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.user_roles[user_id] = role

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                if user_id in self.user_roles:
                    del self.user_roles[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to a specific user"""
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    pass

    async def broadcast_to_admins(self, message: dict):
        """Send message to all connected admins"""
        for user_id, role in list(self.user_roles.items()):
            if role in ["admin", "super_admin"]:
                if user_id in self.active_connections:
                    for connection in self.active_connections[user_id]:
                        try:
                            await connection.send_text(json.dumps(message))
                        except Exception:
                            pass

manager = ConnectionManager()
