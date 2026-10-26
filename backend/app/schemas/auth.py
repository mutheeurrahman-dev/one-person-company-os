from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    full_name: str
    business_name: str
    industry: str = "General"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str

    class Config:
        from_attributes = True


class BusinessResponse(BaseModel):
    id: str
    name: str
    industry: str
    currency: str

    class Config:
        from_attributes = True


class MeResponse(BaseModel):
    user: UserResponse
    business: BusinessResponse | None
