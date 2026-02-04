from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import connect_db, close_db
from app.routes.starters import router as starters_router
from app.services.words import load_words


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_words()
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="Track My Starter", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(starters_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
