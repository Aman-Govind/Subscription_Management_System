"""Product and Product Variant CRUD API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.database import get_db
from app.models.product import Product, ProductVariant
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductUpdate,
    ProductVariantCreate,
    ProductVariantResponse,
    ProductVariantUpdate,
)

router = APIRouter(
    prefix="/api/products",
    tags=["Products & Variants"],
)


# ── Product Endpoints ────────────────────────────────────────────────────────

@router.get(
    "",
    response_model=list[ProductResponse],
    status_code=status.HTTP_200_OK,
    summary="List all products",
    description="Fetch product catalog items with optional filtering and search.",
)
def list_products(
    search: str | None = Query(default=None, description="Search term for name or notes"),
    type: str | None = Query(default=None, description="Filter by product type"),
    is_active: bool | None = Query(default=None, description="Filter by active status"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[ProductResponse]:
    """Retrieve catalog products along with their active variants."""
    query = db.query(Product)
    if search:
        search_filter = f"%{search.strip()}%"
        query = query.filter((Product.name.ilike(search_filter)) | (Product.notes.ilike(search_filter)))
    if type:
        query = query.filter(Product.type.ilike(f"%{type.strip()}%"))
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    products = query.order_by(Product.id.desc()).offset(skip).limit(limit).all()
    return [ProductResponse.model_validate(p) for p in products]


@router.post(
    "",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create product",
    description="Add a new product to the catalog, optionally creating initial variants.",
)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin", "staff")),
) -> ProductResponse:
    """Create a new product catalog item (Admin & Staff only)."""
    new_product = Product(
        name=product_in.name.strip(),
        type=product_in.type.strip(),
        sales_price=product_in.sales_price,
        cost_price=product_in.cost_price,
        notes=product_in.notes.strip() if product_in.notes else None,
        is_active=True,
    )
    db.add(new_product)
    db.flush()  # Allocate new_product.id

    # Create nested initial variants if provided
    if product_in.variants:
        for var in product_in.variants:
            variant_record = ProductVariant(
                product_id=new_product.id,
                name=var.name.strip(),
                code=var.code.strip(),
                additional_price=var.additional_price,
                is_active=True,
            )
            db.add(variant_record)

    db.commit()
    db.refresh(new_product)
    return ProductResponse.model_validate(new_product)


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Get product details",
)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Retrieve a single product by ID."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return ProductResponse.model_validate(product)


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    status_code=status.HTTP_200_OK,
    summary="Update product",
)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin", "staff")),
) -> ProductResponse:
    """Update fields on an existing product (Admin & Staff only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )

    if product_update.name is not None:
        product.name = product_update.name.strip()
    if product_update.type is not None:
        product.type = product_update.type.strip()
    if product_update.sales_price is not None:
        product.sales_price = product_update.sales_price
    if product_update.cost_price is not None:
        product.cost_price = product_update.cost_price
    if product_update.notes is not None:
        product.notes = product_update.notes.strip() if product_update.notes else None
    if product_update.is_active is not None:
        product.is_active = product_update.is_active

    db.commit()
    db.refresh(product)
    return ProductResponse.model_validate(product)


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete product",
)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin")),
) -> dict[str, object]:
    """Delete a product and its associated variants (Admin only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )

    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully", "id": product_id}


# ── Product Variant Endpoints ────────────────────────────────────────────────

@router.get(
    "/{product_id}/variants",
    response_model=list[ProductVariantResponse],
    status_code=status.HTTP_200_OK,
    summary="List variants for a product",
)
def list_variants(
    product_id: int,
    db: Session = Depends(get_db),
) -> list[ProductVariantResponse]:
    """Retrieve all variants belonging to a specific product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )

    variants = db.query(ProductVariant).filter(ProductVariant.product_id == product_id).all()
    return [ProductVariantResponse.model_validate(v) for v in variants]


@router.post(
    "/{product_id}/variants",
    response_model=ProductVariantResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a variant to a product",
)
def create_variant(
    product_id: int,
    variant_in: ProductVariantCreate,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin", "staff")),
) -> ProductVariantResponse:
    """Create and attach a new variant to an existing product (Admin & Staff only)."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )

    new_variant = ProductVariant(
        product_id=product_id,
        name=variant_in.name.strip(),
        code=variant_in.code.strip(),
        additional_price=variant_in.additional_price,
        is_active=True,
    )
    db.add(new_variant)
    db.commit()
    db.refresh(new_variant)
    return ProductVariantResponse.model_validate(new_variant)


@router.put(
    "/{product_id}/variants/{variant_id}",
    response_model=ProductVariantResponse,
    status_code=status.HTTP_200_OK,
    summary="Update a variant",
)
def update_variant(
    product_id: int,
    variant_id: int,
    variant_update: ProductVariantUpdate,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin", "staff")),
) -> ProductVariantResponse:
    """Update variant details (Admin & Staff only)."""
    variant = (
        db.query(ProductVariant)
        .filter(ProductVariant.id == variant_id, ProductVariant.product_id == product_id)
        .first()
    )
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variant with ID {variant_id} for Product {product_id} not found.",
        )

    if variant_update.name is not None:
        variant.name = variant_update.name.strip()
    if variant_update.code is not None:
        variant.code = variant_update.code.strip()
    if variant_update.additional_price is not None:
        variant.additional_price = variant_update.additional_price
    if variant_update.is_active is not None:
        variant.is_active = variant_update.is_active

    db.commit()
    db.refresh(variant)
    return ProductVariantResponse.model_validate(variant)


@router.delete(
    "/{product_id}/variants/{variant_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete a variant",
)
def delete_variant(
    product_id: int,
    variant_id: int,
    db: Session = Depends(get_db),
    _current_user: object = Depends(require_role("admin")),
) -> dict[str, object]:
    """Remove a variant from a product (Admin only)."""
    variant = (
        db.query(ProductVariant)
        .filter(ProductVariant.id == variant_id, ProductVariant.product_id == product_id)
        .first()
    )
    if not variant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Variant with ID {variant_id} for Product {product_id} not found.",
        )

    db.delete(variant)
    db.commit()
    return {"message": "Variant deleted successfully", "id": variant_id}

