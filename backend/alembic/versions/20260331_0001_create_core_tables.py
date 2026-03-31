"""create core tables

Revision ID: 20260331_0001
Revises:
Create Date: 2026-03-31 00:00:00

"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '20260331_0001'
down_revision = None
branch_labels = None
depends_on = None


def _table_names() -> set[str]:
    return set(sa.inspect(op.get_bind()).get_table_names())


def _index_names(table_name: str) -> set[str]:
    return {index['name'] for index in sa.inspect(op.get_bind()).get_indexes(table_name)}


def _ensure_index(name: str, table_name: str, columns: list[str], *, unique: bool = False) -> None:
    if name in _index_names(table_name):
        return
    op.create_index(name, table_name, columns, unique=unique)


def upgrade() -> None:
    tables = _table_names()

    if 'users' not in tables:
        op.create_table(
            'users',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('email', sa.String(), nullable=False),
            sa.Column('full_name', sa.String(), nullable=True),
            sa.Column('hashed_password', sa.String(), nullable=False),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('is_superuser', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.UniqueConstraint('email', name='uq_users_email'),
        )

    if 'conversations' not in tables:
        op.create_table(
            'conversations',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('title', sa.String(length=255), nullable=True),
            sa.Column('summary', sa.Text(), nullable=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
        )

    if 'documents' not in tables:
        op.create_table(
            'documents',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
            sa.Column('original_name', sa.String(length=512), nullable=False),
            sa.Column('storage_path', sa.String(length=2048), nullable=False),
            sa.Column('size', sa.Integer(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
        )

    if 'system_graphs' not in tables:
        op.create_table(
            'system_graphs',
            sa.Column('id', sa.Integer(), primary_key=True),
            sa.Column('name', sa.String(length=255), nullable=False),
            sa.Column('metadata', sa.JSON(), nullable=True),
            sa.Column('is_active', sa.Boolean(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.UniqueConstraint('name', name='uq_system_graphs_name'),
        )

    _ensure_index('ix_users_id', 'users', ['id'])
    _ensure_index('ix_users_email', 'users', ['email'])
    _ensure_index('ix_conversations_id', 'conversations', ['id'])
    _ensure_index('ix_documents_id', 'documents', ['id'])
    _ensure_index('ix_system_graphs_id', 'system_graphs', ['id'])


def downgrade() -> None:
    tables = _table_names()

    if 'system_graphs' in tables:
        indexes = _index_names('system_graphs')
        if 'ix_system_graphs_id' in indexes:
            op.drop_index('ix_system_graphs_id', table_name='system_graphs')
        op.drop_table('system_graphs')

    if 'documents' in tables:
        indexes = _index_names('documents')
        if 'ix_documents_id' in indexes:
            op.drop_index('ix_documents_id', table_name='documents')
        op.drop_table('documents')

    if 'conversations' in tables:
        indexes = _index_names('conversations')
        if 'ix_conversations_id' in indexes:
            op.drop_index('ix_conversations_id', table_name='conversations')
        op.drop_table('conversations')

    if 'users' in tables:
        indexes = _index_names('users')
        if 'ix_users_email' in indexes:
            op.drop_index('ix_users_email', table_name='users')
        if 'ix_users_id' in indexes:
            op.drop_index('ix_users_id', table_name='users')
        op.drop_table('users')
