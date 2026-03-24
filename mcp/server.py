from fastapi import FastAPI

from axon.main import app as axon_app

mcp_server = FastAPI(title='Axon MCP Bridge')


@mcp_server.get('/ping')
async def ping():
    return {'status': 'ok'}


# mount the Axon API app under /axon for compatibility
mcp_server.mount('/axon', axon_app)
