from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import Optional
from ..database import get_db
from .. import models
from ..auth import get_current_admin
from ..schemas import (
    ProductAdmin, ProductCreate, ProductUpdate,
    CategoryOut, CategoryCreate, CategoryUpdate,
    BrandOut, BrandCreate, BrandUpdate,
    GalleryImageOut, GalleryImageCreate,
    ProductListResponse, ProductAdminListResponse,
)
from ..cloudinary_service import upload_image
import re
import zipfile
import xml.etree.ElementTree as ET
import io

router = APIRouter()

NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

# ── Stats ───────────────────────────────────────────────────────────────────

@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    total   = db.query(models.Product).count()
    active  = db.query(models.Product).filter(models.Product.active == True, models.Product.stock > 0).count()
    no_stock= db.query(models.Product).filter(models.Product.stock == 0).count()
    promo   = db.query(models.Product).filter(models.Product.is_promo == True).count()
    return {"total": total, "active": active, "no_stock": no_stock, "promo": promo}


# ── Products ────────────────────────────────────────────────────────────────

@router.get("/models", response_model=list[str])
def admin_list_models(
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
    brand_id: Optional[int] = None,
):
    q = db.query(models.Product.model_name).filter(
        models.Product.model_name.isnot(None), models.Product.model_name != ""
    )
    if brand_id:
        q = q.filter(models.Product.brand_id == brand_id)
    rows = q.distinct().order_by(models.Product.model_name).all()
    return [r[0] for r in rows]


@router.get("/products", response_model=ProductAdminListResponse)
def admin_list_products(
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
    search: Optional[str] = None,
    category: Optional[str] = None,
    brand: Optional[str] = None,
    visibility: Optional[str] = None,
    page: int = 1,
    per_page: int = 50,
):
    q = db.query(models.Product).options(
        joinedload(models.Product.category), joinedload(models.Product.brand)
    )
    if search:
        q = q.filter(
            or_(
                models.Product.name.ilike(f"%{search}%"),
                models.Product.sku.ilike(f"%{search}%"),
                models.Product.measure.ilike(f"%{search}%"),
            )
        )
    if category:
        q = q.join(models.Category).filter(models.Category.slug == category)
    if brand:
        q = q.join(models.Brand).filter(models.Brand.slug == brand)
    if visibility == "visible":
        q = q.filter(models.Product.active == True, models.Product.stock > 0)
    elif visibility == "hidden":
        q = q.filter(or_(models.Product.active == False, models.Product.stock == 0))

    total = q.count()
    items = q.order_by(models.Product.brand_id, models.Product.name).offset((page - 1) * per_page).limit(per_page).all()
    pages = (total + per_page - 1) // per_page
    return ProductAdminListResponse(items=items, total=total, page=page, per_page=per_page, pages=pages)


@router.post("/products", response_model=ProductAdmin, status_code=status.HTTP_201_CREATED)
def create_product(
    body: ProductCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    product = models.Product(**body.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return _load_product(db, product.id)


@router.put("/products/{product_id}", response_model=ProductAdmin)
def update_product(
    product_id: int,
    body: ProductUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    product = _get_or_404(db, product_id)
    for field, value in body.model_dump().items():
        setattr(product, field, value)
    db.commit()
    return _load_product(db, product_id)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    product = _get_or_404(db, product_id)
    db.delete(product)
    db.commit()


# ── Categories & Brands ─────────────────────────────────────────────────────

@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    body: CategoryCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    cat = models.Category(**body.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return cat


@router.put("/categories/{cat_id}", response_model=CategoryOut)
def update_category(
    cat_id: int,
    body: CategoryUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    cat = db.query(models.Category).get(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    for k, v in body.model_dump().items():
        setattr(cat, k, v)
    db.commit()
    db.refresh(cat)
    return cat


@router.delete("/categories/{cat_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    cat_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    cat = db.query(models.Category).get(cat_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(cat)
    db.commit()


@router.post("/brands", response_model=BrandOut, status_code=status.HTTP_201_CREATED)
def create_brand(
    body: BrandCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    brand = models.Brand(**body.model_dump())
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


@router.put("/brands/{brand_id}", response_model=BrandOut)
def update_brand(
    brand_id: int,
    body: BrandUpdate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    brand = db.query(models.Brand).get(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    for k, v in body.model_dump().items():
        setattr(brand, k, v)
    db.commit()
    db.refresh(brand)
    return brand


@router.delete("/brands/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(
    brand_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    brand = db.query(models.Brand).get(brand_id)
    if not brand:
        raise HTTPException(status_code=404, detail="Marca no encontrada")
    db.delete(brand)
    db.commit()


# ── Gallery ─────────────────────────────────────────────────────────────────

@router.post("/gallery", response_model=GalleryImageOut, status_code=status.HTTP_201_CREATED)
def add_gallery_image(
    body: GalleryImageCreate,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    img = models.GalleryImage(**body.model_dump())
    db.add(img)
    db.commit()
    db.refresh(img)
    return img


@router.delete("/gallery/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery_image(
    image_id: int,
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    img = db.query(models.GalleryImage).get(image_id)
    if not img:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    db.delete(img)
    db.commit()


# ── Image upload ─────────────────────────────────────────────────────────────

@router.post("/upload-image")
async def upload_product_image(
    file: UploadFile = File(...),
    _: models.AdminUser = Depends(get_current_admin),
):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(status_code=400, detail="Solo se aceptan imágenes JPG, PNG o WEBP")
    data = await file.read()
    url = upload_image(data)
    return {"url": url}


# ── Excel import ─────────────────────────────────────────────────────────────

@router.post("/import-excel")
def import_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _: models.AdminUser = Depends(get_current_admin),
):
    content = file.file.read()
    result = _process_excel(content, db)
    return result


# ── Helpers ──────────────────────────────────────────────────────────────────

def _get_or_404(db: Session, product_id: int) -> models.Product:
    product = db.query(models.Product).get(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product


def _load_product(db: Session, product_id: int) -> models.Product:
    return (
        db.query(models.Product)
        .options(joinedload(models.Product.category), joinedload(models.Product.brand))
        .filter(models.Product.id == product_id)
        .first()
    )


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text


TIRE_BRANDS = {"KENDA", "MICHELIN", "PIRELLI", "DUNLOP", "CONTINENTAL", "METZELER", "MITAS", "MAGGION"}
OIL_BRANDS = ["WOLVER", "MOTORTEC", "REPSOL", "MANNOL"]
MEASURE_RE = re.compile(r"\d{2,3}[/]\d{2,3}[-R]\d{2}")

# Order matters: "super sport" must precede "sport"
TIRE_APPLICATION_MAP = [
    ("super sport",  "Super Sport"),
    ("ciudad",       "Ciudad"),
    ("sport",        "Sport Touring"),
    ("dual",         "Doble Proposito"),
    ("track",        "Pista"),
    ("cross",        "Cross"),
    ("road sport",   "Road Sport"),
]


def _extract_measure(text: str) -> Optional[str]:
    m = MEASURE_RE.search(text or "")
    return m.group() if m else None


def _tire_category_from_application(db: Session, application: Optional[str]) -> models.Category:
    if application:
        app_lower = application.lower().strip()
        for prefix, cat_name in TIRE_APPLICATION_MAP:
            if app_lower.startswith(prefix):
                return _get_or_create_category(db, cat_name)
    return _get_or_create_category(db, "Llantas")


def _get_or_create_category(db: Session, name: str) -> models.Category:
    slug = _slugify(name)
    cat = db.query(models.Category).filter(models.Category.slug == slug).first()
    if not cat:
        cat = models.Category(name=name, slug=slug)
        db.add(cat)
        db.flush()
    return cat


def _get_or_create_brand(db: Session, name: str) -> models.Brand:
    slug = _slugify(name)
    brand = db.query(models.Brand).filter(models.Brand.slug == slug).first()
    if not brand:
        brand = models.Brand(name=name, slug=slug)
        db.add(brand)
        db.flush()
    return brand


def _parse_xlsx_rows(content: bytes):
    with zipfile.ZipFile(io.BytesIO(content)) as z:
        with z.open("xl/sharedStrings.xml") as f:
            ss_tree = ET.parse(f)
        strings = []
        for si in ss_tree.findall(f".//{{{NS}}}si"):
            parts = si.findall(f".//{{{NS}}}t")
            strings.append("".join(p.text or "" for p in parts))

        with z.open("xl/worksheets/sheet1.xml") as f:
            sheet_tree = ET.parse(f)

        for row in sheet_tree.findall(f".//{{{NS}}}row"):
            cells = []
            for c in row.findall(f"{{{NS}}}c"):
                t = c.get("t", "")
                v = c.find(f"{{{NS}}}v")
                if v is None:
                    cells.append(None)
                elif t == "s":
                    cells.append(strings[int(v.text)])
                else:
                    cells.append(v.text)
            yield cells

def _process_excel(content: bytes, db: Session) -> dict:
    cat_aceites   = _get_or_create_category(db, "Aceites y Lubricantes")
    cat_pastillas = _get_or_create_category(db, "Pastillas de freno")

    is_tire_section  = True
    current_category = None
    current_brand    = None
    current_model    = None
    created = 0
    skipped = 0

    for cells in _parse_xlsx_rows(content):
        if not cells or not any(cells):
            continue

        if cells[0] is None and len(cells) > 1 and cells[1]:
            section = str(cells[1]).strip()
            section_upper = section.upper()

            if section_upper == "ACEITES":
                is_tire_section  = False
                current_category = cat_aceites
                current_brand    = None
                current_model    = None
            elif section_upper == "EBC":
                is_tire_section  = False
                current_category = cat_pastillas
                current_brand    = _get_or_create_brand(db, "EBC")
                current_model    = None
            elif section_upper in ("CODIGO", "LISTA DE PRECIOS DE PRODUCTOS"):
                continue
            else:
                is_tire_section  = True
                current_category = None
                words = section.split()
                first_word = words[0].upper()
                if first_word == "SCOOTERS":
                    current_brand = None
                    current_model = "SCOOTERS"
                else:
                    current_brand = _get_or_create_brand(db, words[0].capitalize())
                    current_model = " ".join(words[1:]).strip() or None
            continue

        if cells[0] is None:
            continue

        sku         = str(cells[0]).strip()
        name        = str(cells[1]).strip() if len(cells) > 1 and cells[1] else ""
        application = str(cells[2]).strip() if len(cells) > 2 and cells[2] else None

        if not name:
            skipped += 1
            continue

        try:
            price_cost = float(cells[3]) if len(cells) > 3 and cells[3] else 0.0
            price_pvp  = float(cells[4]) if len(cells) > 4 and cells[4] else 0.0
            price_cash = float(cells[5]) if len(cells) > 5 and cells[5] else None
        except (ValueError, TypeError):
            skipped += 1
            continue

        # ── Deduplicación ──────────────────────────────────────────
        # Si tiene SKU: verificar que no exista otro con el mismo SKU
        # Si no tiene SKU: verificar por nombre + model_name
        if sku:
            exists = db.query(models.Product).filter(
                models.Product.sku == sku
            ).first()
        else:
            exists = db.query(models.Product).filter(
                models.Product.name == name,
                models.Product.model_name == (current_model if is_tire_section else None)
            ).first()

        if exists:
            skipped += 1
            continue
        # ───────────────────────────────────────────────────────────

        if is_tire_section:
            row_category = _tire_category_from_application(db, application)
        else:
            row_category = current_category

        brand = current_brand
        if not is_tire_section and current_category == cat_aceites and brand is None:
            name_upper = name.upper()
            for ob in OIL_BRANDS:
                if ob in name_upper:
                    brand = _get_or_create_brand(db, ob.capitalize())
                    break
            if brand is None:
                brand = _get_or_create_brand(db, "Varios")

        if brand is None:
            brand = _get_or_create_brand(db, "Varios")

        measure = _extract_measure(name) if is_tire_section else None

        product = models.Product(
            sku=sku,
            name=name,
            application=application,
            category_id=row_category.id,
            brand_id=brand.id,
            measure=measure,
            model_name=current_model if is_tire_section else None,
            price_cost=price_cost,
            price_pvp=price_pvp,
            price_cash=price_cash,
            stock=1,
            active=True,
        )
        db.add(product)
        created += 1

    db.commit()
    return {"created": created, "skipped": skipped}