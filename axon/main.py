from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import Settings
from .routers import auth, chat, database, documents, export, graph, health

settings = Settings()

app = FastAPI(title=settings.APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(health.router, prefix='', tags=['health'])
app.include_router(auth.router, prefix='/auth', tags=['auth'])
app.include_router(chat.router, prefix='/chat', tags=['chat'])
app.include_router(documents.router, prefix='/documents', tags=['documents'])
app.include_router(database.router, prefix='/database', tags=['database'])
app.include_router(graph.router, prefix='/graph', tags=['graph'])
app.include_router(export.router, prefix='/export', tags=['export'])


@app.get('/')
async def root():
    return {'status': 'ok', 'app': settings.APP_NAME}
