"""
Product images API endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
from pathlib import Path
from PIL import Image
import io

from app.database import get_db
from app.models import Product, ProductImage, User
from app.schemas.product_image import ProductImageCreate, ProductImageUpdate, ProductImageResponse
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/product-images", tags=["product-images"])

# Web-friendly image settings
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
UPLOAD_DIR = Path("uploads/product_images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
TILES_DIR = UPLOAD_DIR / "tiles_110_110"
TILES_DIR.mkdir(parents=True, exist_ok=True)


def is_web_friendly_image(file: UploadFile) -> tuple:
    """
    Validate that the uploaded file is a web-friendly image.
    Returns (is_valid, error_message)
    """
    # Check file extension
    file_ext = Path(file.filename).suffix.lower() if file.filename else ''
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    return True, None


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe filesystem usage."""
    # Remove or replace invalid characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        filename = filename.replace(char, '_')
    # Remove leading/trailing spaces and dots
    filename = filename.strip(' .')
    return filename


async def save_uploaded_image(file: UploadFile, product_id: int, product_code: str = None, db: Session = None) -> tuple:
    """
    Save uploaded image file and return (image_url, image_path).
    Also creates a 110x110 thumbnail preserving aspect ratio.
    If an image already exists for this product, it will be replaced.
    image_url is a URL-accessible path, image_path is the local file path.
    """
    # Delete existing images for this product (only one image per product)
    if db:
        existing_images = db.query(ProductImage).filter(ProductImage.product_id == product_id).all()
        for existing_image in existing_images:
            # Delete original file
            if existing_image.image_path and os.path.exists(existing_image.image_path):
                try:
                    os.remove(existing_image.image_path)
                except Exception as e:
                    print(f"Failed to delete existing image file: {e}")
            
            # Delete thumbnail file
            if existing_image.image_url:
                filename = Path(existing_image.image_url).name
                thumbnail_path = TILES_DIR / filename
                if thumbnail_path.exists():
                    try:
                        os.remove(thumbnail_path)
                    except Exception as e:
                        print(f"Failed to delete existing thumbnail file: {e}")
            
            # Delete database record
            db.delete(existing_image)
        db.commit()
    
    # Generate filename using product code or fallback to product_id
    file_ext = Path(file.filename).suffix.lower() if file.filename else '.jpg'
    
    if product_code:
        # Sanitize product code for filename
        safe_code = sanitize_filename(product_code)
        filename = f"{safe_code}{file_ext}"
    else:
        # Fallback to product_id if no code
        filename = f"{product_id}{file_ext}"
    
    file_path = UPLOAD_DIR / filename
    
    # Read file content
    contents = await file.read()
    
    # Validate file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    # Validate and optimize image
    try:
        img = Image.open(io.BytesIO(contents))
        # Convert to RGB if necessary (for JPEG compatibility)
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = rgb_img
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Save optimized original image
        img.save(file_path, 'JPEG', quality=85, optimize=True)
        
        # Create 110x110 thumbnail preserving aspect ratio
        # Create a copy for thumbnail to avoid modifying the original
        thumbnail_img = img.copy()
        thumbnail_size = (110, 110)
        thumbnail_img.thumbnail(thumbnail_size, Image.Resampling.LANCZOS)
        
        # Create a square thumbnail with white background
        thumbnail = Image.new('RGB', thumbnail_size, (255, 255, 255))
        # Calculate position to center the image
        x_offset = (thumbnail_size[0] - thumbnail_img.size[0]) // 2
        y_offset = (thumbnail_size[1] - thumbnail_img.size[1]) // 2
        thumbnail.paste(thumbnail_img, (x_offset, y_offset))
        
        # Save thumbnail
        thumbnail_filename = filename  # Same name, different folder
        thumbnail_path = TILES_DIR / thumbnail_filename
        thumbnail.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid image file: {str(e)}"
        )
    
    # Return URL path (relative to static files) and local path
    image_url = f"/uploads/product_images/{filename}"
    image_path = str(file_path)
    
    return image_url, image_path


@router.post("", response_model=ProductImageResponse, status_code=status.HTTP_201_CREATED)
async def create_product_image(
    product_id: int = Form(...),
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    display_order: int = Form(0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and create a product image.
    Validates that the image is web-friendly (JPG, PNG, WEBP, max 5MB).
    """
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    # Check if user has access to this product's store (if applicable)
    # For now, we'll allow all authenticated users
    
    # Validate image
    is_valid, error_msg = is_web_friendly_image(file)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Get product code for filename
    product_code = product.code if product.code else None
    
    # Save image (this also creates the thumbnail)
    image_url, image_path = await save_uploaded_image(file, product_id, product_code, db)
    
    # If this is set as primary, unset other primary images
    if is_primary:
        db.query(ProductImage).filter(
            ProductImage.product_id == product_id,
            ProductImage.is_primary == True
        ).update({"is_primary": False})
    
    # Create product image record
    product_image = ProductImage(
        product_id=product_id,
        image_url=image_url,
        image_path=image_path,
        is_primary=is_primary,
        display_order=display_order,
    )
    
    db.add(product_image)
    db.commit()
    db.refresh(product_image)
    
    # Notify WebSocket clients about product image update (triggers product sync)
    try:
        from app.services.notification_service import notify_entity_update
        notify_entity_update(
            entity_type="products",
            entity_id=product_id,
            change_type="update",  # Image update is treated as product update
            store_id=None  # Products are global, broadcast to all
        )
    except Exception as e:
        # Don't fail the create if notification fails
        import logging
        logging.getLogger(__name__).warning(f"Failed to send product image update notification: {e}")
    
    return product_image


@router.get("", response_model=List[ProductImageResponse])
async def list_product_images(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all images for a product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found"
        )
    
    images = db.query(ProductImage).filter(
        ProductImage.product_id == product_id
    ).order_by(ProductImage.display_order, ProductImage.created_at).all()
    
    return images


@router.get("/{image_id}", response_model=ProductImageResponse)
async def get_product_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific product image by ID.
    """
    image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product image with ID {image_id} not found"
        )
    
    return image


@router.put("/{image_id}", response_model=ProductImageResponse)
async def update_product_image(
    image_id: int,
    is_primary: Optional[bool] = Form(None),
    display_order: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a product image (set primary, change display order).
    """
    image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product image with ID {image_id} not found"
        )
    
    # If setting as primary, unset other primary images for this product
    if is_primary is not None and is_primary:
        db.query(ProductImage).filter(
            ProductImage.product_id == image.product_id,
            ProductImage.id != image_id,
            ProductImage.is_primary == True
        ).update({"is_primary": False})
        image.is_primary = True
    
    if display_order is not None:
        image.display_order = display_order
    
    db.commit()
    db.refresh(image)
    
    # Notify WebSocket clients about product image update (triggers product sync)
    try:
        from app.services.notification_service import notify_entity_update
        notify_entity_update(
            entity_type="products",
            entity_id=image.product_id,
            change_type="update",  # Image update is treated as product update
            store_id=None  # Products are global, broadcast to all
        )
    except Exception as e:
        # Don't fail the update if notification fails
        import logging
        logging.getLogger(__name__).warning(f"Failed to send product image update notification: {e}")
    
    return image


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_image(
    image_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a product image.
    """
    image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
    if not image:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product image with ID {image_id} not found"
        )
    
    # Delete file if it exists (original and thumbnail)
    if image.image_path and os.path.exists(image.image_path):
        try:
            os.remove(image.image_path)
        except Exception as e:
            print(f"Failed to delete image file: {e}")
    
    # Delete thumbnail if it exists
    if image.image_url:
        # Extract filename from image_url
        filename = Path(image.image_url).name
        thumbnail_path = TILES_DIR / filename
        if thumbnail_path.exists():
            try:
                os.remove(thumbnail_path)
            except Exception as e:
                print(f"Failed to delete thumbnail file: {e}")
    
    product_id = image.product_id  # Save before deletion
    
    db.delete(image)
    db.commit()
    
    # Notify WebSocket clients about product image deletion (triggers product sync)
    try:
        from app.services.notification_service import notify_entity_update
        notify_entity_update(
            entity_type="products",
            entity_id=product_id,
            change_type="update",  # Image deletion is treated as product update
            store_id=None  # Products are global, broadcast to all
        )
    except Exception as e:
        # Don't fail the delete if notification fails
        import logging
        logging.getLogger(__name__).warning(f"Failed to send product image delete notification: {e}")
    
    return None

