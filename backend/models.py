from sqlalchemy import Table, Column, Integer, String, MetaData, DateTime

metadata = MetaData()

users_table = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("username", String(255)),
    Column("email", String(255), unique=True),
    Column("hashed_password", String(255)),
    Column("role", String(50)),
    Column("created_at", DateTime)
)

history_table = Table(
    "history",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("user_email", String(255), nullable=False),
    Column("action", String(255), nullable=False),
    Column("timestamp", DateTime),
    Column("access_type", String(50)),  # frontend alebo API
    Column("city", String(255)),
    Column("country", String(255)),
)
