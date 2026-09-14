from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models
from ..schemas import GalleryImageOut

router = APIRouter()


@router.get("/", response_model=list[GalleryImageOut])
def list_gallery(db: Session = Depends(get_db)):
    return (
        db.query(models.GalleryImage)
        .order_by(models.GalleryImage.display_order, models.GalleryImage.created_at)
        .all()
    )
