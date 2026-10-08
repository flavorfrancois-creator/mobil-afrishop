from fastapi import FastAPI, APIRouter, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
import httpx


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection (kept available; this app proxies the AfriMarket backend)
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Upstream AfriMarket marketplace API (africashop.win)
UPSTREAM = "https://africashop.win/api"

app = FastAPI()
api_router = APIRouter(prefix="/api")

http_client = httpx.AsyncClient(timeout=httpx.Timeout(30.0))

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

HOP_BY_HOP = {
    "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
    "te", "trailers", "transfer-encoding", "upgrade", "content-encoding",
    "content-length", "host",
}


@api_router.get("/")
async def root():
    return {"message": "Afrishop API proxy", "status": "ok"}


@app.api_route(
    "/api/afm/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
)
async def afrimarket_proxy(path: str, request: Request):
    """Reverse-proxy every mobile request to the live AfriMarket API.

    The web preview cannot call africashop.win directly (CORS), so the Expo
    app calls this same-origin proxy which forwards to the upstream API.
    """
    url = f"{UPSTREAM}/{path}"
    params = dict(request.query_params)

    fwd_headers = {}
    for name, value in request.headers.items():
        if name.lower() in ("authorization", "content-type", "accept", "accept-language"):
            fwd_headers[name] = value

    body = await request.body()

    try:
        upstream = await http_client.request(
            request.method,
            url,
            params=params,
            headers=fwd_headers,
            content=body if body else None,
        )
    except httpx.RequestError as exc:
        logger.error("Upstream request failed: %s", exc)
        return Response(
            content=b'{"detail":"Service indisponible"}',
            status_code=502,
            media_type="application/json",
        )

    resp_headers = {
        k: v for k, v in upstream.headers.items() if k.lower() not in HOP_BY_HOP
    }
    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        media_type=upstream.headers.get("content-type"),
        headers=resp_headers,
    )


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    await http_client.aclose()
