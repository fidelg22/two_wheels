# Two Wheels World

Sitio web de e-commerce para repuestos de motos. Catálogo dinámico, carrito con integración WhatsApp, y panel de administración.

## Stack

- **Backend:** FastAPI + PostgreSQL (SQLAlchemy)
- **Frontend:** React 18 + Vite + TypeScript
- **Imágenes:** Cloudinary (almacenamiento externo)

---

## Requisitos previos

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Una cuenta gratuita en [Cloudinary](https://cloudinary.com)

---

## 1. Base de datos

Crear la base de datos en PostgreSQL:

```sql
CREATE DATABASE twowheels;
```

---

## 2. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env
# Editar .env con tus datos (DATABASE_URL, SECRET_KEY, ADMIN_USERNAME, ADMIN_PASSWORD, Cloudinary)

# Arrancar el servidor
uvicorn app.main:app --reload
```

El backend queda disponible en `http://localhost:8000`.
La documentación de la API está en `http://localhost:8000/docs`.

Las tablas se crean automáticamente al arrancar.
El usuario admin se crea desde los valores `ADMIN_USERNAME` y `ADMIN_PASSWORD` del `.env`.

---

## 3. Importar el inventario Excel

Con el backend corriendo y la DB lista:

```bash
cd backend
python -m scripts.import_excel "../LISTA DE PRECIOS TWO WHEELS 2026.xlsx"
```

Esto crea todas las categorías, marcas y productos automáticamente.
Todos los productos quedan con `stock = 1` y `active = true`.

---

## 4. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Arrancar en desarrollo
npm run dev
```

El sitio queda disponible en `http://localhost:5173`.

> El frontend se comunica con el backend vía proxy Vite en `/api` → `http://localhost:8000`.

---

## 5. Cloudinary (para fotos de productos y galería)

1. Crear cuenta gratuita en cloudinary.com
2. En el Dashboard de Cloudinary, ir a **Settings → Upload → Upload presets**
3. Crear un preset con nombre `twowheels_unsigned` en modo **Unsigned**
4. Copiar el `cloud_name` y agregarlo al `.env`

Para subir fotos de productos:
- Ir al dashboard de Cloudinary y subir la imagen manualmente, o
- Desde el admin del sitio, pegar la URL de Cloudinary en el campo "URL de la foto"

---

## Variables de entorno (backend/.env)

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | URL de conexión a PostgreSQL |
| `SECRET_KEY` | Clave secreta para JWT (generá una larga y aleatoria) |
| `ADMIN_USERNAME` | Usuario del panel admin |
| `ADMIN_PASSWORD` | Contraseña del panel admin |
| `CLOUDINARY_CLOUD_NAME` | Cloud name de tu cuenta Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `CLOUDINARY_UPLOAD_PRESET` | Nombre del upload preset unsigned |
| `CORS_ORIGINS` | Origen del frontend (ej. `http://localhost:5173`) |

---

## Estructura del proyecto

```
two-wheels-world/
├── backend/
│   ├── app/
│   │   ├── models.py        # Modelos de base de datos
│   │   ├── schemas.py       # Esquemas Pydantic
│   │   ├── auth.py          # JWT y autenticación
│   │   ├── database.py      # Conexión a PostgreSQL
│   │   ├── main.py          # App FastAPI
│   │   └── routers/
│   │       ├── products.py  # Catálogo público
│   │       ├── categories.py
│   │       ├── gallery.py
│   │       ├── admin.py     # CRUD protegido + import Excel
│   │       └── auth.py      # Login
│   ├── scripts/
│   │   └── import_excel.py  # Script de importación inicial
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── src/
│       ├── components/      # Navbar, WheelAnimation, ProductCard, CartDrawer, FilterPanel
│       ├── pages/           # Home, Catalog, admin/*
│       ├── context/         # CartContext, AuthContext
│       ├── lib/             # api.ts, cart.ts, whatsapp.ts
│       └── styles/          # tokens.css, reset.css, global.css
├── LISTA DE PRECIOS TWO WHEELS 2026.xlsx
└── README.md
```

---

## Reglas de visibilidad de productos

Un producto aparece en el catálogo público **solo si**:
- `active = true` **Y**
- `stock > 0`

Si el stock llega a cero, el producto desaparece automáticamente sin necesidad de desactivarlo manualmente.

---

## Panel de administración

Acceder en: `http://localhost:5173/admin/login`

Desde el panel podés:
- **Productos:** crear, editar, eliminar, cambiar precio/stock/foto, marcar como oferta
- **Galería:** agregar y eliminar fotos para la sección de experiencias
- **Categorías y Marcas:** agregar nuevas categorías o marcas
- **Importar Excel:** cargar un archivo .xlsx para actualizar el inventario

---

## WhatsApp

El número configurado es `+593 983 345 340`.

El carrito genera un mensaje de texto con la lista de productos y abre `wa.me/593983345340` al presionar "Pedir por WhatsApp". No hay pasarela de pago.
