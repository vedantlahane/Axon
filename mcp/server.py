from fastapi import FastAPI

mcp_server = FastAPI(title='Axon MCP Bridge')


@mcp_server.get('/ping')
async def ping():
    return {'status': 'ok'}


try:
    # Mount the main backend app when the backend package is available.
    from backend.main import app as axon_app

    mcp_server.mount('/axon', axon_app)
except Exception:
    @mcp_server.get('/axon/health')
    async def axon_unavailable():
        return {'status': 'degraded', 'detail': 'Backend app mount unavailable in MCP runtime'}
