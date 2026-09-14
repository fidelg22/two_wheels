from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from .. import models
from ..schemas import CategoryOut, BrandOut

router = APIRouter()


@router.get("/", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).order_by(models.Category.name).all()


@router.get("/brands", response_model=list[BrandOut])
def list_brands(db: Session = Depends(get_db), category: Optional[str] = Query(None)):
    q = db.query(models.Brand)
    if category:
        q = (
            q.join(models.Product, models.Product.brand_id == models.Brand.id)
            .join(models.Category, models.Product.category_id == models.Category.id)
            .filter(
                models.Category.slug == category,
                models.Product.active == True,
                models.Product.stock > 0,
            )
            .distinct()
        )
    return q.order_by(models.Brand.name).all()
