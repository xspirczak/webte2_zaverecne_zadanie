from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os
from jose import JWTError, jwt, ExpiredSignatureError
from dotenv import load_dotenv

# Načítanie premenných z .env
load_dotenv()
print("DEBUG: ACCESS_TOKEN_EXPIRE_MINUTES =", os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

SECRET_KEY = os.getenv("SECRET_KEY", "tajnykluc")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
#ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 120))
ACCESS_TOKEN_EXPIRE_MINUTES = float(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 0.5))





# Token z hlavičky "Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/login")

# Hashovanie hesiel
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Heslo → hash
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Porovnanie hesla s hashom
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Vytvorenie JWT tokenu
def create_access_token(data: dict, expires_delta: timedelta = None):
     to_encode = data.copy()
     expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
     print(f"DEBUG: Token will expire at {expire.isoformat()}")  # ⬅️ pridaj
     to_encode.update({"exp": expire})
     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


from jose import JWTError, jwt, ExpiredSignatureError

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")

        if email is None or role is None:
            raise HTTPException(status_code=401, detail="Neplatný token")

        return {"email": email, "role": role}

    except ExpiredSignatureError:
        # Špeciálne pre endpoint refresh-token – tam tolerujeme expirovaný token
        # Vráť payload bez overenia expirácie
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
            return {"email": payload.get("sub"), "role": payload.get("role")}
        except JWTError:
            raise HTTPException(status_code=401, detail="Neplatný alebo poškodený token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Neplatný alebo poškodený token")
