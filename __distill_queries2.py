import sqlite3, json, sys
from datetime import datetime

db = sqlite3.connect(r'C:\Users\USER\.local\share\mimocode\mimocode.db')
db.row_factory = sqlite3.Row

action = sys.argv[1] if len(sys.argv) > 1 else "user_msgs"
sid = sys.argv[2] if len(sys.argv) > 2 else ""

if action == "user_msgs":
    # Get all user messages for a session
    rows = db.execute("""
        SELECT m.id, json_extract(m.data, '$.content') as content
        FROM message m
        WHERE m.session_id = ?
          AND json_extract(m.data, '$.role') = 'user'
        ORDER BY m.time_created
    """, (sid,)).fetchall()
    print(f"User messages for {sid}: {len(rows)}")
    for r in rows:
        content = (r["content"] or "")[:500]
        print(f"  [{r['id']}] {content}")
        print()

elif action == "assistant_summary":
    # Get assistant text parts for a session
    rows = db.execute("""
        SELECT substr(json_extract(p.data, '$.text'), 1, 500) as text
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ?
          AND json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'text'
        ORDER BY m.time_created, p.id
    """, (sid,)).fetchall()
    print(f"Assistant text parts for {sid}: {len(rows)}")
    for i, r in enumerate(rows):
        t = (r["text"] or "")[:300]
        print(f"  [{i}] {t}")
        print()

elif action == "git_push_sessions":
    # Find sessions that involve git push
    now_ms = datetime.now().timestamp() * 1000
    cutoff_ms = now_ms - 60 * 86400 * 1000
    rows = db.execute("""
        SELECT DISTINCT m.session_id, s.title, s.time_created
        FROM message m
        JOIN part p ON p.message_id = m.id
        JOIN session s ON s.id = m.session_id
        WHERE json_extract(p.data, '$.type') = 'tool'
          AND json_extract(p.data, '$.tool') = 'bash'
          AND json_extract(p.data, '$.state.input') LIKE '%git push%'
          AND m.time_created > ?
        ORDER BY s.time_created DESC
    """, (cutoff_ms,)).fetchall()
    print(f"Sessions with git push (last 60 days):")
    for r in rows:
        ts = r["time_created"] / 1000
        dt = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')
        print(f"  {r['session_id']} | {dt} | {r['title']}")

elif action == "vite_lovable":
    # Find sessions dealing with Lovable/Vite migration
    rows = db.execute("""
        SELECT DISTINCT m.session_id, s.title, s.time_created
        FROM message m
        JOIN part p ON p.message_id = m.id
        JOIN session s ON s.id = m.session_id
        WHERE json_extract(p.data, '$.type') = 'tool'
          AND (json_extract(p.data, '$.state.input') LIKE '%lovable%' 
               OR json_extract(p.data, '$.state.input') LIKE '%Lovable%')
        ORDER BY s.time_created DESC
        LIMIT 10
    """).fetchall()
    print(f"Sessions dealing with Lovable:")
    for r in rows:
        ts = r["time_created"] / 1000
        dt = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')
        print(f"  {r['session_id']} | {dt} | {r['title']}")

elif action == "content_rewrite":
    # Find sessions dealing with MDX content rewriting
    rows = db.execute("""
        SELECT DISTINCT m.session_id, s.title, s.time_created
        FROM message m
        JOIN part p ON p.message_id = m.id
        JOIN session s ON s.id = m.session_id
        WHERE json_extract(p.data, '$.type') = 'tool'
          AND json_extract(p.data, '$.tool') = 'edit'
          AND json_extract(p.data, '$.state.input') LIKE '%content%mdx%'
        ORDER BY s.time_created DESC
        LIMIT 10
    """).fetchall()
    print(f"Sessions with MDX content edits:")
    for r in rows:
        ts = r["time_created"] / 1000
        dt = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')
        print(f"  {r['session_id']} | {dt} | {r['title']}")

db.close()
