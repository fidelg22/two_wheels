from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from .database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    image_url = Column(Text, nullable=True)

    products = relationship("Product", back_populates="category")


class Brand(Base):
    __tablename__ = "brands"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    image_url = Column(Text, nullable=True)

    products = relationship("Product", back_populates="brand")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String(100), nullable=True, index=True)
    name = Column(String(300), nullable=False)
    application = Column(String(150), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)
    brand_id = Column(Integer, ForeignKey("brands.id"), nullable=False)
    position = Column(String(20), nullable=True)       # delantera / trasera / ambas
    measure = Column(String(50), nullable=True, index=True)
    price_cost = Column(Numeric(10, 2), nullable=False, default=0)
    price_pvp = Column(Numeric(10, 2), nullable=False, default=0)
    price_cash = Column(Numeric(10, 2), nullable=True)
    stock = Column(Integer, nullable=False, default=1)
    active = Column(Boolean, nullable=False, default=True)
    image_url = Column(Text, nullable=True)
    model_name = Column(Text, nullable=True, index=True)
    is_promo = Column(Boolean, nullable=False, default=False)
    promo_price = Column(Numeric(10, 2), nullable=True)
    promo_ends_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    category = relationship("Category", back_populates="products")
    brand = relationship("Brand", back_populates="products")


class GalleryImage(Base):
    __tablename__ = "gallery_images"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(Text, nullable=False)
    caption = Column(String(200), nullable=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(200), nullable=False)
