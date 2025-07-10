"""Order management endpoints."""

from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import JSONResponse
import structlog

from ...orders.models import OrderStatus, OrderType
from ..models.api_models import (
    CreateOrderRequest, OrderResponse, UpdateOrderStatusRequest,
    BatchOrdersRequest, SuccessResponse, ErrorResponse
)
from ..middleware.auth import get_current_user, require_role

router = APIRouter()
logger = structlog.get_logger()


@router.post("/", response_model=OrderResponse)
async def create_order(request: Request, order_data: CreateOrderRequest):
    """Create a new order from Chrome extension."""
    try:
        user = get_current_user(request)
        db = request.app.state.db
        
        # Prepare order data
        order_dict = {
            "restaurant_id": user["restaurant_id"],
            "order_number": order_data.order_number,
            "customer_name": order_data.customer_name,
            "customer_phone": order_data.customer_phone,
            "order_type": order_data.order_type.value,
            "platform": order_data.platform,
            "status": "pending",
            "priority": 0,
            "ordered_at": datetime.utcnow(),
            "total_amount": order_data.total_amount,
            "notes": order_data.notes,
            "metadata": order_data.metadata
        }
        
        # Create order
        order = await db.create_order(order_dict)
        
        # Create order items
        for item_data in order_data.items:
            item_dict = {
                "order_id": order["id"],
                "item_name": item_data.item_name,
                "quantity": item_data.quantity,
                "price": item_data.price,
                "modifiers": item_data.modifiers,
                "special_instructions": item_data.special_instructions,
                "status": "pending"
            }
            
            # Add optional fields
            if item_data.category:
                item_dict["category"] = item_data.category
            if item_data.subcategory:
                item_dict["subcategory"] = item_data.subcategory
            if item_data.protein_type:
                item_dict["protein_type"] = item_data.protein_type
            if item_data.sauce:
                item_dict["sauce"] = item_data.sauce
            if item_data.size:
                item_dict["size"] = item_data.size
            
            await db.create_order_item(item_dict)
        
        # Get complete order with items
        complete_order = await db.get_order(order["id"])
        
        logger.info(
            "Order created",
            order_id=order["id"],
            order_number=order_data.order_number,
            restaurant_id=user["restaurant_id"],
            item_count=len(order_data.items)
        )
        
        # Convert to response model
        return OrderResponse(**complete_order)
        
    except Exception as e:
        logger.error("Failed to create order", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create order")


@router.get("/", response_model=List[OrderResponse])
async def list_orders(
    request: Request,
    status: Optional[OrderStatus] = Query(None),
    order_type: Optional[OrderType] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List orders for the current restaurant."""
    try:
        user = get_current_user(request)
        db = request.app.state.db
        
        # Build filters
        filters = {"restaurant_id": user["restaurant_id"]}
        if status:
            filters["status"] = status.value
        if order_type:
            filters["order_type"] = order_type.value
        
        # Get orders
        orders = await db.get_orders(filters, limit=limit, offset=offset)
        
        # Convert to response models
        return [OrderResponse(**order) for order in orders]
        
    except Exception as e:
        logger.error("Failed to list orders", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to list orders")


@router.get("/active", response_model=List[OrderResponse])
async def get_active_orders(request: Request):
    """Get all active orders for kitchen display."""
    try:
        user = get_current_user(request)
        db = request.app.state.db
        
        # Get active orders
        orders = await db.get_active_orders(user["restaurant_id"])
        
        # Convert to response models
        return [OrderResponse(**order) for order in orders]
        
    except Exception as e:
        logger.error("Failed to get active orders", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get active orders")


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(request: Request, order_id: UUID):
    """Get a specific order."""
    try:
        user = get_current_user(request)
        db = request.app.state.db
        
        # Get order
        order = await db.get_order(str(order_id))
        
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Verify restaurant access
        if order["restaurant_id"] != user["restaurant_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return OrderResponse(**order)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get order", error=str(e), order_id=order_id)
        raise HTTPException(status_code=500, detail="Failed to get order")


@router.patch("/{order_id}/status", response_model=SuccessResponse)
async def update_order_status(
    request: Request,
    order_id: UUID,
    status_data: UpdateOrderStatusRequest
):
    """Update order status."""
    try:
        user = get_current_user(request)
        db = request.app.state.db
        
        # Get order to verify access
        order = await db.get_order(str(order_id))
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        if order["restaurant_id"] != user["restaurant_id"]:
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Update status
        updated = await db.update_order_status(
            str(order_id),
            status_data.status.value
        )
        
        logger.info(
            "Order status updated",
            order_id=order_id,
            new_status=status_data.status.value,
            updated_by=user["user_id"]
        )
        
        return SuccessResponse(
            message=f"Order status updated to {status_data.status.value}",
            data={"order_id": str(order_id), "status": status_data.status.value}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update order status", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to update order status")


@router.post("/batch", response_model=SuccessResponse)
async def create_batch(request: Request, batch_data: BatchOrdersRequest):
    """Create a batch from multiple orders."""
    try:
        user = get_current_user(request)
        db = request.app.state.db
        
        # Verify all orders belong to the restaurant
        for order_id in batch_data.order_ids:
            order = await db.get_order(str(order_id))
            if not order:
                raise HTTPException(
                    status_code=404,
                    detail=f"Order {order_id} not found"
                )
            if order["restaurant_id"] != user["restaurant_id"]:
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied for order {order_id}"
                )
        
        # Create batch
        batch_name = batch_data.batch_name or f"Batch-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
        batch = await db.create_batch(
            user["restaurant_id"],
            {
                "batch_number": batch_name,
                "status": "active",
                "notes": batch_data.notes
            }
        )
        
        # Associate orders with batch
        # Note: This would require adding batch_id to orders table
        # For now, we'll just log it
        
        logger.info(
            "Batch created",
            batch_id=batch["id"],
            order_count=len(batch_data.order_ids),
            restaurant_id=user["restaurant_id"]
        )
        
        return SuccessResponse(
            message=f"Batch created with {len(batch_data.order_ids)} orders",
            data={
                "batch_id": batch["id"],
                "batch_number": batch_name,
                "order_count": len(batch_data.order_ids)
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create batch", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to create batch")