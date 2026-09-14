import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal, engine
from app import models
from app.routers.admin import _process_excel

models.Base.metadata.create_all(bind=engine)


def main():
    if len(sys.argv) < 2:
        print("Uso: python -m scripts.import_excel <ruta-al-excel>")
        sys.exit(1)

    path = sys.argv[1]
    if not os.path.exists(path):
        print(f"Archivo no encontrado: {path}")
        sys.exit(1)

    print(f"Leyendo {path}...")
    with open(path, "rb") as f:
        content = f.read()

    db = SessionLocal()
    try:
        result = _process_excel(content, db)
        print(f"OK Productos creados: {result['created']}")
        print(f"   Filas omitidas:    {result['skipped']}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
