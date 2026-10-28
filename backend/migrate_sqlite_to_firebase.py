"""
Non-destructive, resumable SQLite -> Firestore migration for Alumni Portal.

- Copies all ordinary SQLite tables as Firestore collections.
- Preserves integer primary-key IDs as Firestore document IDs when available.
- Creates a separate SQLite backup before writing to Firestore.
- Never modifies/deletes SQLite.
- Never overwrites an existing Firestore document.
- Reports conflicting same-ID documents rather than silently replacing them.

Run from the project root or backend folder:
    python backend/migrate_sqlite_to_firebase.py
Optional source path:
    SQLITE_DB_PATH=/absolute/path/to/alumni.db python backend/migrate_sqlite_to_firebase.py
"""
import hashlib
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
PROJECT_ROOT = HERE.parent
load_dotenv(HERE / ".env")

# Import the shared initializer so migration and application use identical credentials.
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))
import firebase_db  # noqa: E402


BATCH_SIZE = 400  # Leave room below Firestore's 500-write batch limit.
IGNORED_TABLES = {"sqlite_sequence"}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def sqlite_readonly_uri(path: Path) -> str:
    # Quote special characters while preserving Windows drive separators.
    return "file:" + quote(path.resolve().as_posix(), safe="/:") + "?mode=ro"


def create_verified_backup(source_path: Path) -> tuple[Path, str]:
    """Use SQLite's online backup API so an active WAL database is copied safely."""
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S-%f")
    backup_path = source_path.with_name(f"{source_path.stem}-backup-{stamp}{source_path.suffix}")
    source_hash_before = sha256_file(source_path)

    source = sqlite3.connect(sqlite_readonly_uri(source_path), uri=True)
    backup = sqlite3.connect(str(backup_path))
    try:
        check = source.execute("PRAGMA integrity_check").fetchone()
        if not check or check[0] != "ok":
            raise RuntimeError(f"SQLite integrity check failed: {check[0] if check else 'no result'}")
        source.backup(backup)
        backup.commit()
    except Exception:
        backup.close()
        source.close()
        if backup_path.exists():
            backup_path.unlink()
        raise
    else:
        backup.close()
        source.close()

    verify = sqlite3.connect(sqlite_readonly_uri(backup_path), uri=True)
    try:
        check = verify.execute("PRAGMA integrity_check").fetchone()
        if not check or check[0] != "ok":
            raise RuntimeError(f"Backup integrity check failed: {check[0] if check else 'no result'}")
    finally:
        verify.close()

    if sha256_file(source_path) != source_hash_before:
        raise RuntimeError("The source SQLite file changed during backup. Stop and investigate.")
    return backup_path, source_hash_before


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def record_document_id(table_name: str, row: dict[str, Any], row_number: int) -> str:
    if "id" in row and row["id"] is not None:
        return str(row["id"])
    # Stable for an unchanged, same-order source table, while keeping duplicate rows distinct.
    safe_row = {
        key: ({"__bytes_base64__": value.hex()} if isinstance(value, bytes) else value)
        for key, value in row.items()
    }
    encoded = json.dumps(safe_row, sort_keys=True, ensure_ascii=False, default=str)
    digest = hashlib.sha256(encoded.encode("utf-8")).hexdigest()[:24]
    return f"row-{row_number}-{digest}"


def as_firestore_document(row: dict[str, Any], doc_id: str) -> dict[str, Any]:
    result = dict(row)
    if "id" not in result:
        # Tables without a numeric primary key receive a deterministic string id field.
        result["id"] = doc_id
    return result


def migrate_table(connection: sqlite3.Connection, firestore_client, table_name: str) -> dict[str, Any]:
    collection = firestore_client.collection(table_name)
    quoted = quote_identifier(table_name)
    cursor = connection.execute(f"SELECT * FROM {quoted}")
    columns = [col[0] for col in (cursor.description or [])]

    # Existing IDs are used only to prevent overwrites, never to delete records.
    existing_ids = {doc.id for doc in collection.stream()}
    inserted = 0
    skipped = 0
    conflicts = []
    source_count = 0
    batch = firestore_client.batch()
    batch_size = 0
    max_numeric_id = 0

    def flush():
        nonlocal batch, batch_size, inserted
        if batch_size:
            batch.commit()
            inserted += batch_size
            batch = firestore_client.batch()
            batch_size = 0

    row_number = 0
    while True:
        rows = cursor.fetchmany(BATCH_SIZE)
        if not rows:
            break
        for sqlite_row in rows:
            row_number += 1
            source_count += 1
            data = dict(zip(columns, tuple(sqlite_row)))
            doc_id = record_document_id(table_name, data, row_number)
            payload = as_firestore_document(data, doc_id)

            try:
                numeric_id = int(doc_id)
                max_numeric_id = max(max_numeric_id, numeric_id)
            except (TypeError, ValueError):
                pass

            doc_ref = collection.document(doc_id)
            if doc_id in existing_ids:
                # Compare source fields; preserve existing destination if any field differs.
                current = doc_ref.get().to_dict() or {}
                differences = [
                    key for key, value in payload.items()
                    if key not in current or current.get(key) != value
                ]
                if differences:
                    conflicts.append({
                        "document_id": doc_id,
                        "fields_different": differences[:25],
                    })
                else:
                    skipped += 1
                continue

            batch.set(doc_ref, payload)
            batch_size += 1
            existing_ids.add(doc_id)
            if batch_size >= BATCH_SIZE:
                flush()

    flush()

    # Synchronize the app's compatibility ID counter, without moving it backward.
    if "id" in columns:
        counter_ref = firestore_client.collection("_counters").document(table_name)
        current_counter = counter_ref.get().to_dict() or {}
        try:
            counter_value = int(current_counter.get("last_id", 0))
        except (TypeError, ValueError):
            counter_value = 0
        max_existing = max_numeric_id
        for existing_id in existing_ids:
            try:
                max_existing = max(max_existing, int(existing_id))
            except (TypeError, ValueError):
                pass
        counter_ref.set({"last_id": max(counter_value, max_existing)})

    return {
        "table": table_name,
        "collection": table_name,
        "source_rows": source_count,
        "inserted": inserted,
        "skipped_identical": skipped,
        "conflicts_not_overwritten": len(conflicts),
        "conflict_examples": conflicts[:50],
        "status": "needs_review" if conflicts else "copied_or_already_present",
    }


def main() -> int:
    configured = os.getenv("SQLITE_DB_PATH", "").strip()
    source_path = Path(configured) if configured else HERE / "alumni.db"
    if not source_path.is_absolute():
        # Prefer backend-relative paths such as ./alumni.db; also accept
        # repository-relative paths such as backend/alumni.db.
        backend_candidate = (HERE / source_path).resolve()
        root_candidate = (PROJECT_ROOT / source_path).resolve()
        source_path = backend_candidate if backend_candidate.is_file() else root_candidate
    if not source_path.is_file():
        print(f"ERROR: SQLite source database not found: {source_path}", file=sys.stderr)
        print("Set SQLITE_DB_PATH to your existing database path. No changes were made.", file=sys.stderr)
        return 2

    print(f"SQLite source: {source_path}")
    backup_path, source_hash = create_verified_backup(source_path)
    print(f"Verified backup created: {backup_path}")
    print(f"Original SQLite SHA-256: {source_hash}")

    source = sqlite3.connect(sqlite_readonly_uri(source_path), uri=True)
    source.row_factory = sqlite3.Row
    manifest: dict[str, Any] = {
        "started_at_utc": datetime.now(timezone.utc).isoformat(),
        "source_database": str(source_path),
        "backup_database": str(backup_path),
        "source_sha256_before": source_hash,
        "tables": [],
        "errors": [],
        "source_preserved": None,
    }

    try:
        rows = source.execute(
            "SELECT name FROM sqlite_master "
            "WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        ).fetchall()
        table_names = [row[0] for row in rows if row[0] not in IGNORED_TABLES]
        if not table_names:
            raise RuntimeError("No ordinary SQLite tables were found; refusing an empty migration.")

        print(f"Tables discovered: {', '.join(table_names)}")
        fs = firebase_db.get_firestore_client()

        for table_name in table_names:
            try:
                result = migrate_table(source, fs, table_name)
                manifest["tables"].append(result)
                print(
                    f"{table_name}: source={result['source_rows']}, "
                    f"inserted={result['inserted']}, "
                    f"identical skipped={result['skipped_identical']}, "
                    f"conflicts={result['conflicts_not_overwritten']}"
                )
                if result["conflicts_not_overwritten"]:
                    print(f"  REVIEW: Existing documents were not overwritten for {table_name}.")
            except Exception as exc:
                manifest["errors"].append({"table": table_name, "error": str(exc)})
                print(f"ERROR migrating {table_name}: {exc}", file=sys.stderr)
                break
    except Exception as exc:
        manifest["errors"].append({"error": str(exc)})
        print(f"ERROR: {exc}", file=sys.stderr)
    finally:
        source.close()
        manifest["finished_at_utc"] = datetime.now(timezone.utc).isoformat()
        manifest["source_preserved"] = (
            source_path.is_file() and sha256_file(source_path) == source_hash
        )
        manifest_path = HERE / f"migration-manifest-{datetime.now().strftime('%Y%m%d-%H%M%S-%f')}.json"
        manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"Migration manifest: {manifest_path}")
        print(f"Original SQLite unchanged: {manifest['source_preserved']}")

    has_conflicts = any(row.get("conflicts_not_overwritten", 0) for row in manifest["tables"])
    if manifest["errors"] or has_conflicts or not manifest["source_preserved"]:
        print("MIGRATION NEEDS ATTENTION. Do not remove or stop using SQLite yet.", file=sys.stderr)
        return 2

    print("Migration copy completed without detected conflicts.")
    print("Verify Firestore counts and test login/features before any production cutover.")
    print("The original SQLite database and verified backup were retained.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
