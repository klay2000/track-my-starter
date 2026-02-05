from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from bson import ObjectId


class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, handler):
        if isinstance(v, ObjectId):
            return str(v)
        if isinstance(v, str) and ObjectId.is_valid(v):
            return v
        raise ValueError("Invalid ObjectId")


STARTER_TYPES = [
    "sourdough",
    "friendship_bread",
    "kefir_milk",
    "kefir_water",
    "kombucha",
    "ginger_bug",
    "jun",
    "other",
]


class Location(BaseModel):
    type: str = "Point"
    coordinates: list[float]  # [longitude, latitude]


class StarterCreate(BaseModel):
    name: Optional[str] = None
    starter_type: str
    type_other: Optional[str] = None
    lat: float
    lng: float


class StarterInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    words: list[str]
    name: Optional[str] = None
    starter_type: str
    type_other: Optional[str] = None
    location: Location
    parent_id: Optional[str] = None
    created_at: datetime

    class Config:
        populate_by_name = True


class StarterResponse(BaseModel):
    words: list[str]
    name: Optional[str] = None
    starter_type: str
    type_other: Optional[str] = None
    location: Location
    parent_words: Optional[list[str]] = None
    created_at: datetime


class StarterMapItem(BaseModel):
    words: list[str]
    name: Optional[str] = None
    starter_type: str
    location: Location


class TreeNode(BaseModel):
    words: list[str]
    name: Optional[str] = None
    starter_type: str
    is_target: bool = False
    location: Location


class TreeResponse(BaseModel):
    nodes: list[TreeNode]
    edges: list[dict]
    truncated: bool = False
