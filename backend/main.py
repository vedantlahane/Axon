from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings
from .routers import api_compat

settings = Settings()

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(api_compat.router, tags=['api'])


@app.get('/')
async def root():
    return {'status': 'ok', 'app': settings.APP_NAME}


@app.get('/health')
async def health_alias():
    return {'status': 'ok'}
