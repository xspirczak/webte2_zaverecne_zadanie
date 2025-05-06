from database import database
from models import history_table
from datetime import datetime
import httpx

async def log_history(user_email: str, action: str, access_type: str, client_ip: str):
    city = country = "Neznáme"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"http://ip-api.com/json/{client_ip}")
            data = response.json()
            print(data)
            city = data.get("city", "Neznáme")
            country = data.get("country", "Neznáme")
    except:
        pass  # Nepodarilo sa získať lokalitu

    query = history_table.insert().values(
        user_email=user_email,
        action=action,
        timestamp=datetime.utcnow(),
        access_type=access_type,
        city=city,
        country=country
    )
    await database.execute(query)
