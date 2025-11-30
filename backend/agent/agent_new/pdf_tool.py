import os
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document
from langchain_core.tools import tool
from langchain_core.vectorstores import InMemoryVectorStore
from langchain_openai.embeddings import OpenAIEmbeddings

load_dotenv()

# Path relative to backend root
_BACKEND_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PDF_PATH = _BACKEND_ROOT / "media" / "uploaded_docs"


def _require_openai_api_key() -> None:
    """Validate that OpenAI API key is set."""
    if not os.getenv("OPENAI_API_KEY"):
        raise EnvironmentError("OPENAI_API_KEY environment variable is not set")


def _load_documents(pdf_path: Path) -> List[Document]:
    """Load documents from a PDF file."""
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF document not found at {pdf_path}")
    loader = PyPDFLoader(str(pdf_path))
    return loader.load()


def _collect_pdf_paths() -> List[Path]:
    """Collect all PDF file paths from upload directories."""
    paths: List[Path] = []
    
    # Try Django settings first
    try:
        from django.conf import settings
        media_root = getattr(settings, "MEDIA_ROOT", None)
        if media_root:
            uploads_dir = Path(media_root) / "uploaded_docs"
            if uploads_dir.exists():
                paths.extend(sorted(uploads_dir.glob("*.pdf")))
    except Exception:
        pass
    
    # Fallback to default path
    if not paths and DEFAULT_PDF_PATH.exists():
        paths.extend(sorted(DEFAULT_PDF_PATH.glob("*.pdf")))
    
    return paths


def _build_vector_store(paths: List[Path]) -> InMemoryVectorStore:
    """Build an in-memory vector store from PDF documents."""
    _require_openai_api_key()
    documents: List[Document] = []
    
    for path in paths:
        try:
            documents.extend(_load_documents(path))
            print(f"Loaded: {path.name}")
        except FileNotFoundError:
            print(f"Warning: Could not load {path.name}")
            continue
        except Exception as e:
            print(f"Warning: Error loading {path.name}: {e}")
            continue

    if not documents:
        raise FileNotFoundError("No PDF documents available for search.")

    embeddings = OpenAIEmbeddings()
    return InMemoryVectorStore.from_documents(documents, embedding=embeddings)


# Global cache for vector store
_vector_store: Optional[InMemoryVectorStore] = None


def build_pdf_search_tool(
    pdf_path: Optional[Path] = None, 
    *, 
    force_rebuild: bool = False
) -> InMemoryVectorStore:
    """
    Build or retrieve the cached PDF vector store.
    
    Args:
        pdf_path: Optional specific PDF path to use
        force_rebuild: If True, rebuild the vector store even if cached
    
    Returns:
        InMemoryVectorStore: Vector store for PDF search
    """
    global _vector_store
    
    if force_rebuild:
        _vector_store = None

    if _vector_store is None:
        if pdf_path:
            paths = [pdf_path] if pdf_path.is_file() else list(pdf_path.glob("*.pdf"))
        else:
            paths = _collect_pdf_paths()

        if not paths:
            raise FileNotFoundError("No PDF documents have been uploaded yet.")

        _vector_store = _build_vector_store(paths)
        print(f"Built vector store with {len(paths)} PDF files")

    return _vector_store


@tool
def search_pdf(query: str) -> str:
    """
    Search uploaded PDF documents for relevant information matching the query.
    Use this when users ask about content in their uploaded PDFs or documents.
    
    Args:
        query (str): The search query string to find relevant information.
    
    Returns:
        str: Relevant text excerpts from the PDF documents or an error message.
    """
    try:
        vector_store = build_pdf_search_tool()
    except (EnvironmentError, FileNotFoundError) as exc:
        return f"PDF search is unavailable: {exc}"
    except Exception as exc:
        return f"Error initializing PDF search: {exc}"
    
    try:
        docs = vector_store.similarity_search(query, k=3)
        
        if not docs:
            return "No relevant content found in the uploaded PDF documents."
        
        # Format results with source info
        results = []
        for i, doc in enumerate(docs, 1):
            source = Path(doc.metadata.get("source", "Unknown")).name if doc.metadata else "Unknown"
            page = doc.metadata.get("page", "?") if doc.metadata else "?"
            content = doc.page_content.strip()[:500]  # Limit excerpt length
            results.append(f"**Match {i}** (Source: {source}, Page: {page}):\n{content}")
        
        return "\n\n---\n\n".join(results)
    
    except Exception as exc:
        return f"Search error: {exc}"
