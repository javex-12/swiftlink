import sqlite3
import json

DB_PATH = r"C:\Users\USER\.local\share\mimocode\mimocode.db"
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Get all sessions for swiftlink directories (predecessors)
for sid in ['ses_111eb6af5ffejE6T9srlT5Gkk2', 'ses_111eb68c8ffeHd4FmwimH4XKSL']:
    print(f"\n{'='*80}")
    print(f"SESSION: {sid}")
    print(f"{'='*80}")
    
    cur.execute("SELECT id, directory, title FROM session WHERE id = ?", (sid,))
    s = cur.fetchone()
    print(f"  Dir: {s['directory']}")
    print(f"  Title: {s['title']}")
    
    # Get all messages
    cur.execute("""
        SELECT m.id, json_extract(m.data, '$.role') as role, m.time_created
        FROM message m WHERE m.session_id = ?
        ORDER BY m.time_created
    """, (sid,))
    messages = cur.fetchall()
    
    for msg in messages:
        role = msg['role']
        cur.execute("""
            SELECT json_extract(p.data, '$.type') as ptype, 
                   json_extract(p.data, '$.text') as text,
                   json_extract(p.data, '$.tool') as tool,
                   json_extract(p.data, '$.state.input') as inp
            FROM part p WHERE p.message_id = ? ORDER BY p.time_created
        """, (msg['id'],))
        parts = cur.fetchall()
        for p in parts:
            if p['text'] and len(p['text']) > 10:
                print(f"  [{role}] TEXT: {p['text'][:500]}")
            elif p['tool']:
                inp_str = str(p['inp'])[:300] if p['inp'] else ''
                print(f"  [{role}] TOOL({p['tool']}): {inp_str}")

conn.close()
