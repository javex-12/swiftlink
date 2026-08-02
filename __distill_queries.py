import sqlite3, json, sys
from datetime import datetime

db = sqlite3.connect(r'C:\Users\USER\.local\share\mimocode\mimocode.db')
db.row_factory = sqlite3.Row

action = sys.argv[1] if len(sys.argv) > 1 else "sessions"

if action == "sessions":
    rows = db.execute('SELECT id, time_created, title, directory FROM session ORDER BY time_created DESC').fetchall()
    print(f"Total sessions: {len(rows)}")
    for r in rows:
        ts = r["time_created"] / 1000
        dt = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')
        print(f"  {r['id']} | {dt} | {r['title']} | {r['directory']}")

elif action == "recent_tools":
    now_ms = datetime.now().timestamp() * 1000
    cutoff_ms = now_ms - 30 * 86400 * 1000
    rows = db.execute("""
        SELECT json_extract(p.data, '$.tool') as tool,
               substr(json_extract(p.data, '$.state.input'), 1, 200) as input_preview,
               count(*) as n
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND m.time_created > ?
        GROUP BY tool, input_preview
        ORDER BY n DESC
        LIMIT 50
    """, (cutoff_ms,)).fetchall()
    print(f"Top tool usage patterns (last 30 days):")
    for r in rows:
        print(f"  {r['n']:3d} | {r['tool']}: {r['input_preview'][:150]}")

elif action == "recent_tools_global":
    now_ms = datetime.now().timestamp() * 1000
    cutoff_ms = now_ms - 30 * 86400 * 1000
    rows = db.execute("""
        SELECT json_extract(p.data, '$.tool') as tool,
               count(*) as n
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND m.time_created > ?
        GROUP BY tool
        ORDER BY n DESC
        LIMIT 30
    """, (cutoff_ms,)).fetchall()
    print(f"Tool distribution (last 30 days):")
    for r in rows:
        print(f"  {r['n']:4d} | {r['tool']}")

elif action == "all_sessions_with_messages":
    rows = db.execute("""
        SELECT s.id as sid, s.title, s.directory, s.time_created,
               (SELECT count(*) FROM message m WHERE m.session_id = s.id) as msg_count
        FROM session s
        ORDER BY s.time_created DESC
    """).fetchall()
    print(f"Sessions with message counts:")
    for r in rows:
        ts = r["time_created"] / 1000
        dt = datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M')
        print(f"  {r['sid']} | {dt} | msgs={r['msg_count']} | {r['title']}")

elif action == "task_events":
    rows = db.execute("""
        SELECT te.session_id, te.task_id, te.kind, substr(te.summary, 1, 300) as summary_preview
        FROM task_event te
        ORDER BY te.at DESC
        LIMIT 40
    """).fetchall()
    print(f"Recent task events: {len(rows)}")
    for r in rows:
        print(f"  [{r['kind']}] session={r['session_id']} task={r['task_id']} | {(r['summary_preview'] or '')[:150]}")

elif action == "session_parts":
    sid = sys.argv[2]
    rows = db.execute("""
        SELECT json_extract(p.data, '$.type') as ptype,
               json_extract(p.data, '$.tool') as tool,
               substr(json_extract(p.data, '$.text'), 1, 300) as text_preview,
               substr(json_extract(p.data, '$.state.input'), 1, 300) as input_preview
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE m.session_id = ?
        ORDER BY m.time_created, p.id
    """, (sid,)).fetchall()
    print(f"Parts for session {sid}: {len(rows)}")
    for r in rows:
        ptype = r["ptype"]
        if ptype == "tool":
            print(f"  [tool: {r['tool']}] {r['input_preview'][:200]}")
        elif ptype == "text":
            t = (r["text_preview"] or "")[:200]
            print(f"  [text] {t}")
        else:
            print(f"  [{ptype}]")

elif action == "search_commands":
    now_ms = datetime.now().timestamp() * 1000
    cutoff_ms = now_ms - 60 * 86400 * 1000
    rows = db.execute("""
        SELECT json_extract(p.data, '$.tool') as tool,
               substr(json_extract(p.data, '$.state.input'), 1, 300) as inp,
               count(*) as n
        FROM message m
        JOIN part p ON p.message_id = m.id
        WHERE json_extract(m.data, '$.role') = 'assistant'
          AND json_extract(p.data, '$.type') = 'tool'
          AND m.time_created > ?
        GROUP BY tool, inp
        HAVING n >= 2
        ORDER BY n DESC
        LIMIT 40
    """, (cutoff_ms,)).fetchall()
    print(f"Repeated tool patterns (>=2 times, last 60 days):")
    for r in rows:
        print(f"  {r['n']:3d}x | {r['tool']}: {r['inp'][:200]}")

elif action == "user_repeated":
    now_ms = datetime.now().timestamp() * 1000
    cutoff_ms = now_ms - 60 * 86400 * 1000
    keywords = ["again", "every time", "like last time", "the usual", "repeat", "same as before", "don't forget", "always do", "workflow", "process"]
    for kw in keywords:
        rows = db.execute("""
            SELECT m.session_id, substr(json_extract(m.data, '$.content'), 1, 400) as content
            FROM message m
            WHERE json_extract(m.data, '$.role') = 'user'
              AND json_extract(m.data, '$.content') LIKE ?
              AND m.time_created > ?
            LIMIT 5
        """, (f"%{kw}%", cutoff_ms)).fetchall()
        if rows:
            print(f"\nKeyword '{kw}':")
            for r in rows:
                print(f"  [{r['session_id']}] {r['content'][:250]}")

elif action == "actor_registry":
    rows = db.execute("""
        SELECT session_id, actor_id, mode, description, agent, status,
               turn_count, last_outcome
        FROM actor_registry
        ORDER BY time_created DESC
        LIMIT 30
    """).fetchall()
    print(f"Recent actors:")
    for r in rows:
        print(f"  {r['actor_id']} | mode={r['mode']} | agent={r['agent']} | turns={r['turn_count']} | {r['description'][:120] if r['description'] else ''}")

elif action == "workflow_runs":
    rows = db.execute("""
        SELECT session_id, name, status, current_phase, 
               substr(args, 1, 200) as args_preview,
               succeeded, failed
        FROM workflow_run
        ORDER BY time_created DESC
        LIMIT 20
    """).fetchall()
    print(f"Recent workflow runs:")
    for r in rows:
        print(f"  [{r['status']}] {r['name']} | phase={r['current_phase']} | ok={r['succeeded']} fail={r['failed']} | {r['args_preview'][:150]}")

db.close()
