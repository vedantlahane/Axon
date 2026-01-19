import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { runSqlQuery, requestSqlSuggestions, fetchDatabaseSchema, type SqlQueryResult, type SqlSchemaPayload } from "../services/chatApi";
import { normalizeSql } from "../utils/sqlUtils";

