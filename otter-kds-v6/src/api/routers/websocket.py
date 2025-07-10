"""WebSocket endpoints for real-time updates."""

import json
import os
import asyncio
from typing import Dict, Set
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import HTMLResponse
import jwt
import structlog

from ..models.api_models import WebSocketMessage, SubscribeRequest

router = APIRouter()
logger = structlog.get_logger()

# Active WebSocket connections by restaurant
connections: Dict[str, Set[WebSocket]] = {}


class ConnectionManager:
    """Manage WebSocket connections."""
    
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, restaurant_id: str):
        """Accept and track a new connection."""
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = set()
        self.active_connections[restaurant_id].add(websocket)
        logger.info("WebSocket connected", restaurant_id=restaurant_id)
    
    def disconnect(self, websocket: WebSocket, restaurant_id: str):
        """Remove a connection."""
        if restaurant_id in self.active_connections:
            self.active_connections[restaurant_id].discard(websocket)
            if not self.active_connections[restaurant_id]:
                del self.active_connections[restaurant_id]
        logger.info("WebSocket disconnected", restaurant_id=restaurant_id)
    
    async def send_to_restaurant(self, restaurant_id: str, message: dict):
        """Send message to all connections for a restaurant."""
        if restaurant_id in self.active_connections:
            # Create WebSocket message
            ws_message = WebSocketMessage(
                type=message.get("type", "unknown"),
                action=message.get("action", "update"),
                data=message,
                timestamp=datetime.utcnow()
            )
            
            # Send to all connections
            disconnected = []
            for connection in self.active_connections[restaurant_id]:
                try:
                    await connection.send_json(ws_message.dict())
                except Exception as e:
                    logger.error("Failed to send message", error=str(e))
                    disconnected.append(connection)
            
            # Clean up disconnected connections
            for connection in disconnected:
                self.active_connections[restaurant_id].discard(connection)
    
    async def broadcast_order_update(self, order: dict):
        """Broadcast order update to relevant restaurant."""
        restaurant_id = order.get("restaurant_id")
        if restaurant_id:
            await self.send_to_restaurant(
                restaurant_id,
                {
                    "type": "order_update",
                    "action": "update",
                    "order": order
                }
            )


# Global connection manager
manager = ConnectionManager()


@router.websocket("/orders")
async def websocket_orders(
    websocket: WebSocket,
    token: str = Query(..., description="JWT token for authentication")
):
    """WebSocket endpoint for real-time order updates."""
    restaurant_id = None
    
    try:
        # Validate JWT token
        jwt_secret = os.getenv("JWT_SECRET", "your-secret-key")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        restaurant_id = payload.get("restaurant_id")
        user_id = payload.get("user_id")
        
        if not restaurant_id:
            await websocket.close(code=4001, reason="Invalid token")
            return
        
        # Connect
        await manager.connect(websocket, restaurant_id)
        
        # Send initial connection success message
        await websocket.send_json({
            "type": "connection",
            "action": "connected",
            "data": {
                "restaurant_id": restaurant_id,
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
        
        # Set up Supabase real-time subscription
        db = websocket.app.state.db
        subscription_id = await db.subscribe_to_orders(
            restaurant_id,
            lambda event: asyncio.create_task(
                manager.broadcast_order_update(event["new"])
            )
        )
        
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message.get("type") == "ping":
                await websocket.send_json({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                })
            elif message.get("type") == "subscribe":
                # Handle subscription changes
                logger.info(
                    "WebSocket subscription update",
                    restaurant_id=restaurant_id,
                    message=message
                )
            
    except WebSocketDisconnect:
        if restaurant_id:
            manager.disconnect(websocket, restaurant_id)
            if 'subscription_id' in locals():
                db.unsubscribe(subscription_id)
    except jwt.ExpiredSignatureError:
        await websocket.close(code=4001, reason="Token expired")
    except jwt.InvalidTokenError:
        await websocket.close(code=4001, reason="Invalid token")
    except Exception as e:
        logger.error("WebSocket error", error=str(e))
        await websocket.close(code=4000, reason="Internal error")
        if restaurant_id:
            manager.disconnect(websocket, restaurant_id)


@router.websocket("/kitchen/{station}")
async def websocket_kitchen_station(
    websocket: WebSocket,
    station: str,
    token: str = Query(..., description="JWT token for authentication")
):
    """WebSocket endpoint for station-specific updates."""
    restaurant_id = None
    
    try:
        # Validate JWT token
        import os
        jwt_secret = os.getenv("JWT_SECRET", "your-secret-key")
        payload = jwt.decode(token, jwt_secret, algorithms=["HS256"])
        restaurant_id = payload.get("restaurant_id")
        
        if not restaurant_id:
            await websocket.close(code=4001, reason="Invalid token")
            return
        
        # Connect with station context
        connection_id = f"{restaurant_id}:{station}"
        await manager.connect(websocket, connection_id)
        
        # Send connection success
        await websocket.send_json({
            "type": "connection",
            "action": "connected",
            "data": {
                "restaurant_id": restaurant_id,
                "station": station,
                "timestamp": datetime.utcnow().isoformat()
            }
        })
        
        # Keep connection alive
        while True:
            data = await websocket.receive_text()
            # Echo back for now
            await websocket.send_text(f"Station {station}: {data}")
            
    except WebSocketDisconnect:
        if restaurant_id:
            manager.disconnect(websocket, f"{restaurant_id}:{station}")
    except Exception as e:
        logger.error("WebSocket station error", error=str(e), station=station)
        await websocket.close(code=4000, reason="Internal error")


# Demo WebSocket client page
@router.get("/demo")
async def websocket_demo():
    """Demo page for testing WebSocket connections."""
    return HTMLResponse("""
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Demo - Otter KDS</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .connected { background-color: #d4edda; color: #155724; }
        .disconnected { background-color: #f8d7da; color: #721c24; }
        .messages { border: 1px solid #ddd; height: 300px; overflow-y: auto; padding: 10px; margin: 20px 0; }
        .message { margin: 5px 0; padding: 5px; background-color: #f0f0f0; border-radius: 3px; }
        button { padding: 10px 20px; margin: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Otter KDS WebSocket Demo</h1>
        <div id="status" class="status disconnected">Disconnected</div>
        
        <div>
            <input type="text" id="token" placeholder="JWT Token" style="width: 400px; padding: 5px;">
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
        </div>
        
        <div class="messages" id="messages"></div>
        
        <div>
            <button onclick="sendPing()">Send Ping</button>
            <button onclick="clearMessages()">Clear Messages</button>
        </div>
    </div>

    <script>
        let ws = null;
        const statusEl = document.getElementById('status');
        const messagesEl = document.getElementById('messages');
        const tokenEl = document.getElementById('token');

        function updateStatus(connected) {
            if (connected) {
                statusEl.textContent = 'Connected';
                statusEl.className = 'status connected';
            } else {
                statusEl.textContent = 'Disconnected';
                statusEl.className = 'status disconnected';
            }
        }

        function addMessage(message) {
            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            messageEl.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
            messagesEl.appendChild(messageEl);
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function connect() {
            const token = tokenEl.value;
            if (!token) {
                alert('Please enter a JWT token');
                return;
            }

            if (ws) {
                ws.close();
            }

            const wsUrl = `ws://localhost:8000/ws/orders?token=${encodeURIComponent(token)}`;
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                updateStatus(true);
                addMessage('Connected to WebSocket');
            };

            ws.onmessage = (event) => {
                addMessage('Received: ' + event.data);
            };

            ws.onclose = () => {
                updateStatus(false);
                addMessage('Disconnected from WebSocket');
            };

            ws.onerror = (error) => {
                addMessage('Error: ' + error.message);
            };
        }

        function disconnect() {
            if (ws) {
                ws.close();
            }
        }

        function sendPing() {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
                addMessage('Sent: ping');
            } else {
                alert('Not connected');
            }
        }

        function clearMessages() {
            messagesEl.innerHTML = '';
        }
    </script>
</body>
</html>
    """)