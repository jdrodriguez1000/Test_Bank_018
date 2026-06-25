"""Alembic env.py — Reservas Sala Comunitaria.

La URL de la base de datos se obtiene de pydantic-settings (Settings.DATABASE_URL),
nunca de una cadena hardcodeada aqui.
Las migraciones de negocio seran generadas por los arneses posteriores.
"""
from __future__ import annotations

import sys
from logging.config import fileConfig
from pathlib import Path

from alembic import context
from sqlalchemy import engine_from_config, pool

# ---------------------------------------------------------------------------
# Asegurar que el paquete src este en el path cuando se corre alembic desde
# backend/ (e.g. `uv run alembic upgrade head`).
# ---------------------------------------------------------------------------
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# ---------------------------------------------------------------------------
# Configuracion de logging de Alembic
# ---------------------------------------------------------------------------
config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# ---------------------------------------------------------------------------
# Importar Settings para leer DATABASE_URL via pydantic-settings
# ---------------------------------------------------------------------------
try:
    from src.infrastructure.config import Settings  # type: ignore[import]

    _settings = Settings()
    config.set_main_option("sqlalchemy.url", _settings.DATABASE_URL)
except ImportError:
    # Durante el bootstrap (antes de que src/infrastructure/config.py exista)
    # Alembic puede iniciarse con la URL vacia; las migraciones se generan mas tarde.
    pass

# ---------------------------------------------------------------------------
# target_metadata: se importara el Base de SQLAlchemy cuando existan modelos.
# Por ahora es None (scaffold vacio, sin logica de negocio).
# ---------------------------------------------------------------------------
target_metadata = None  # noqa: N816 — se sobrescribira al agregar modelos ORM


# ---------------------------------------------------------------------------
# Funciones de migracion offline / online
# ---------------------------------------------------------------------------

def run_migrations_offline() -> None:
    """Corre las migraciones en modo offline (sin conexion activa)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Corre las migraciones en modo online (con conexion activa)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
