import re
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from ..database import get_db
from .. import models
from ..schemas import ProductListResponse, ProductPublic

MEASURE_SORT_RE = re.compile(r"^(\d+\.?\d*)")


def _measure_sort_key(p: "models.Product") -> float:
    src = p.measure or p.name or ""
    m = MEASURE_SORT_RE.match(src)
    return float(m.group(1)) if m else 9999.0


def _catalog_sort_key(p: "models.Product"):
    return (
        (p.brand.name or "").lower(),
        (p.model_name or "").lower(),
        _measure_sort_key(p),
    )

router = APIRouter()

# Incluye "llantas" para productos importados antes del remapeo de categorías
TIRE_SLUGS = frozenset({
    "llantas",
    "ciudad", "sport-touring", "super-sport",
    "doble-proposito", "pista", "cross", "road-sport",
})

# Mapea slug de segmento → prefijo del campo application (misma tabla que admin.py)
SEGMENT_TO_PREFIX = {
    "ciudad-carretera": "CIUDAD-CARRETERA",
    "ciudad-sport": "CIUDAD-SPORT",
    "sport-touring":   "sport",
    "super-sport":     "super sport",
    "doble-proposito": "dual",
    "pista":           "track",
    "cross":           "cross",
    "road-sport":      "road sport",
}


@router.get("/", response_model=ProductListResponse)
def list_products(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    application: Optional[str] = Query(None),
    measure: Optional[str] = Query(None),
    model: Optional[str] = Query(None),
    segment: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    is_promo: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(24, ge=1, le=100),
):
    q = (
        db.query(models.Product)
        .options(joinedload(models.Product.category), joinedload(models.Product.brand))
        .filter(models.Product.active == True, models.Product.stock > 0)
    )

    if category:
        q = q.join(models.Category, models.Product.category_id == models.Category.id)
        if category == "llantas":
            q = q.filter(models.Category.slug.in_(TIRE_SLUGS))
        else:
            q = q.filter(models.Category.slug == category)
    if segment:
        prefix = SEGMENT_TO_PREFIX.get(segment)
        if prefix:
            q = q.filter(models.Product.application.ilike(f"{prefix}%"))
    if brand:
        q = q.join(models.Brand).filter(models.Brand.slug == brand)
    if application:
        q = q.filter(models.Product.application.ilike(f"%{application}%"))
    if measure:
        q = q.filter(models.Product.measure.ilike(f"%{measure}%"))
    if model:
        q = q.filter(models.Product.model_name == model)
    if min_price is not None:
        q = q.filter(models.Product.price_pvp >= min_price)
    if max_price is not None:
        q = q.filter(models.Product.price_pvp <= max_price)
    if is_promo is not None:
        q = q.filter(models.Product.is_promo == is_promo)
    if search:
        if not brand:
            q = q.outerjoin(models.Brand, models.Product.brand_id == models.Brand.id)
        for term in search.strip().split():
            q = q.filter(
                or_(
                    models.Product.name.ilike(f"%{term}%"),
                    models.Product.measure.ilike(f"%{term}%"),
                    models.Product.sku.ilike(f"%{term}%"),
                    models.Product.application.ilike(f"%{term}%"),
                    models.Brand.name.ilike(f"%{term}%"),
                )
            )

    all_items = sorted(q.all(), key=_catalog_sort_key)
    total = len(all_items)
    start = (page - 1) * per_page
    items = all_items[start : start + per_page]
    pages = (total + per_page - 1) // per_page

    return ProductListResponse(items=items, total=total, page=page, per_page=per_page, pages=pages)


@router.get("/measures", response_model=list[str])
def list_measures(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
):
    q = (
        db.query(models.Product.measure)
        .filter(
            models.Product.active == True,
            models.Product.stock > 0,
            models.Product.measure.isnot(None),
            models.Product.measure != "",
        )
    )
    if category:
        q = q.join(models.Category, models.Product.category_id == models.Category.id)
        if category == "llantas":
            q = q.filter(models.Category.slug.in_(TIRE_SLUGS))
        else:
            q = q.filter(models.Category.slug == category)
    if brand:
        q = q.join(models.Brand, models.Product.brand_id == models.Brand.id).filter(
            models.Brand.slug == brand
        )
    rows = q.distinct().order_by(models.Product.measure).all()
    seen = set()
    result = []
    for (m,) in rows:
        clean = m.strip()
        if clean and clean not in seen:
            seen.add(clean)
            result.append(clean)
    return result


@router.get("/models", response_model=list[str])
def list_models(
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
):
    q = (
        db.query(models.Product.model_name)
        .filter(
            models.Product.active == True,
            models.Product.stock > 0,
            models.Product.model_name.isnot(None),
            models.Product.model_name != "",
        )
    )
    if category:
        q = q.join(models.Category, models.Product.category_id == models.Category.id)
        if category == "llantas":
            q = q.filter(models.Category.slug.in_(TIRE_SLUGS))
        else:
            q = q.filter(models.Category.slug == category)
    if brand:
        q = q.join(models.Brand, models.Product.brand_id == models.Brand.id).filter(
            models.Brand.slug == brand
        )
    rows = q.distinct().order_by(models.Product.model_name).all()
    seen = set()
    result = []
    for (m,) in rows:
        clean = m.strip()
        if clean and clean not in seen:
            seen.add(clean)
            result.append(clean)
    return result


@router.get("/promos", response_model=list[ProductPublic])
def list_promos(db: Session = Depends(get_db)):
    return (
        db.query(models.Product)
        .options(joinedload(models.Product.category), joinedload(models.Product.brand))
        .filter(models.Product.active == True, models.Product.stock > 0, models.Product.is_promo == True)
        .limit(12)
        .all()
    )


@router.get("/{product_id}", response_model=ProductPublic)
def get_product(product_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException, status
    product = (
        db.query(models.Product)
        .options(joinedload(models.Product.category), joinedload(models.Product.brand))
        .filter(
            models.Product.id == product_id,
            models.Product.active == True,
        )
        .first()
    )
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Producto no encontrado")
    return product
