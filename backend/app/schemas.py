from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
from decimal import Decimal


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    image_url: Optional[str] = None


class BrandOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    slug: str
    image_url: Optional[str] = None


class ProductPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    sku: Optional[str] = None
    name: str
    application: Optional[str] = None
    category: CategoryOut
    brand: BrandOut
    position: Optional[str] = None
    measure: Optional[str] = None
    price_pvp: Decimal
    stock: int
    image_url: Optional[str] = None
    model_name: Optional[str] = None
    is_promo: bool
    promo_price: Optional[Decimal] = None
    promo_ends_at: Optional[datetime] = None


class ProductAdmin(ProductPublic):
    price_cost: Decimal
    price_cash: Optional[Decimal] = None
    active: bool
    created_at: Optional[datetime] = None


class ProductCreate(BaseModel):
    sku: Optional[str] = None
    name: str
    application: Optional[str] = None
    category_id: int
    brand_id: int
    position: Optional[str] = None
    measure: Optional[str] = None
    model_name: Optional[str] = None
    price_cost: Decimal = Decimal("0")
    price_pvp: Decimal = Decimal("0")
    price_cash: Optional[Decimal] = None
    stock: int = 1
    active: bool = True
    image_url: Optional[str] = None
    is_promo: bool = False
    promo_price: Optional[Decimal] = None
    promo_ends_at: Optional[datetime] = None


class ProductUpdate(ProductCreate):
    pass


class CategoryCreate(BaseModel):
    name: str
    slug: str
    image_url: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: str
    slug: str
    image_url: Optional[str] = None


class BrandCreate(BaseModel):
    name: str
    slug: str
    image_url: Optional[str] = None


class BrandUpdate(BaseModel):
    name: str
    slug: str
    image_url: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GalleryImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    url: str
    caption: Optional[str] = None
    display_order: int


class GalleryImageCreate(BaseModel):
    url: str
    caption: Optional[str] = None
    display_order: int = 0


class ProductListResponse(BaseModel):
    items: list[ProductPublic]
    total: int
    page: int
    per_page: int
    pages: int


class ProductAdminListResponse(BaseModel):
    items: list[ProductAdmin]
    total: int
    page: int
    per_page: int
    pages: int
