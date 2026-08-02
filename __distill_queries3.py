import sqlite3, json, sys
from datetime import datetime

db = sqlite3.connect(r'C:\Users\USER\.local\share\mimocode\mimocode.db')
db.row_factory = sqlite3.Row

action = sys.argv[1] if len(sys.argv) > 1 else "raw_msg"
sid = sys.argv[2] if len(sys.argv) > 2 else ""

if action == "raw_msg":
    # Get raw message data for a session
    rows = db.execute("""
        SELECT m.id, json_extract(m.data, '$.role') as role, m.data as raw_data
        FROM message m
        WHERE m.session_id = ?
        ORDER BY m.time_created
    """, (sid,)).fetchall()
    print(f"Messages for {sid}: {len(rows)}")
    for r in rows:
        role = r["role"]
        raw = json.loads(r["raw_data"])
        # Print just the key structure
        print(f"  [{role}] keys: {list(raw.keys())}")
        if role == "user":
            content = raw.get("content", "")
            if isinstance(content, list):
                for item in content:
                    if isinstance(item, dict) and item.get("type") == "text":
                        print(f"    text: {item['text'][:300]}")
            elif isinstance(content, str):
                print(f"    content: {content[:300]}")

elif action == "recent_user_msgs":
    # Get recent user messages across all sessions (last 60 days)
    now_ms = datetime.now().timestamp() * 1000
    cutoff_ms = now_ms - 60 * 86400 * 1000
    rows = db.execute("""
        SELECT m.session_id, m.id, json_extract(m.data, '$.content') as content, m.time_created
        FROM message m
        WHERE json_extract(m.data, '$.role') = 'user'
          AND m.time_created > ?
        ORDER BY m.time_created DESC
        LIMIT 40
    """, (cutoff_ms,)).fetchall()
    print(f"Recent user messages:")
    for r in rows:
        ts = r["time_created"] / 1000
        dt = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')
        content = r["content"]
        if isinstance(content, list):
            text_parts = [item.get("text", "") for item in content if isinstance(item, dict) and item.get("type") == "text"]
            content = " ".join(text_parts)
        elif content is None:
            content = "(none)"
        print(f"  {dt} [{r['session_id']}] {str(content)[:250]}")

elif action == "session_detail":
    # Get session info
    rows = db.execute("""
        SELECT * FROM session WHERE id = ?
    """, (sid,)).fetchall()
    for r in rows:
        print(f"Session: {r['id']}")
        print(f"  title: {r['title']}")
        print(f"  directory: {r['directory']}")
        print(f"  project_id: {r['project_id']}")
        print(f"  time_created: {datetime.fromtimestamp(r['time_created']/1000).strftime('%Y-%m-%d %H:%M')}")
        print(f"  summary_files: {r['summary_files']}")
        print(f"  summary_additions: {r['summary_additions']}")
        print(f"  summary_deletions: {r['summary_deletions']}")

elif action == "push_workflow":
    # Find the git push workflow - look at what commands precede git push
    now_ms = datetime.now().timestamp() * 1000
    cutoff_ms = now_ms - 60 * 86400 * 1000
    # For sessions with git push, get the tool call sequence
    rows = db.execute("""
        SELECT m.session_id, json_extract(p.data, '$.tool') as tool,
               substr(json_extract(p.data, '$.state.input'), 1, 300) as inp,
               m.time_created
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND m.session_id IN (
              SELECT DISTINCT m2.session_id
              FROM message m2
              JOIN part p2 ON p2.message_id = m2.id
              WHERE json_extract(p2.data, '$.tool') = 'bash'
                AND json_extract(p2.data, '$.state.input') LIKE '%git push%'
                AND m2.time_created > ?
          )
        ORDER BY m.session_id, m.time_created, p.id
    """, (cutoff_ms,)).fetchall()
    
    current_session = None
    for r in rows:
        if r["session_id"] != current_session:
            current_session = r["session_id"]
            print(f"\n=== Session {current_session} ===")
        print(f"  {r['tool']}: {r['inp'][:200]}")

db.close()
