from pydantic import BaseModel


class SQLConnectionDetails(BaseModel):
    database_url: str


class QueryRequest(BaseModel):
    sql: str
