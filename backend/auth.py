import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from jose import JWTError, jwt, ExpiredSignatureError
from fastapi import Depends, HTTPException
#from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer()

# Načítanie premenných z .env
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "tajnykluc")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = float(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 0.5))

# Token z hlavičky "Authorization: Bearer <token>"
#oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/user/login")

# Hashovanie hesiel
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")

        if email is None or role is None:
            raise HTTPException(status_code=401, detail="Neplatný token")

        return {"email": email, "role": role}

    except ExpiredSignatureError:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
            return {"email": payload.get("sub"), "role": payload.get("role")}
        except JWTError:
            raise HTTPException(status_code=401, detail="Expirovaný alebo poškodený token")

    except JWTError:
        raise HTTPException(status_code=401, detail="Neplatný alebo poškodený token")