import sqlite3

conn = sqlite3.connect('socialmedia.db')
cursor = conn.cursor()

# List all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print('=== TABLOLAR ===')
for t in tables:
    print(f'  - {t[0]}')

# For each table, show schema and data
for t in tables:
    table_name = t[0]
    print(f'\n{"="*50}')
    print(f'  {table_name.upper()} TABLOSU')
    print(f'{"="*50}')
    
    # Schema
    cursor.execute(f'PRAGMA table_info({table_name})')
    columns = cursor.fetchall()
    print('Kolonlar:')
    for col in columns:
        pk = ' (PRIMARY KEY)' if col[5] else ''
        nullable = '' if col[3] else ' (nullable)'
        print(f'  - {col[1]:20s} {col[2]:15s}{pk}{nullable}')
    
    # Row count
    cursor.execute(f'SELECT COUNT(*) FROM {table_name}')
    count = cursor.fetchone()[0]
    print(f'\nToplam kayit: {count}')
    
    # Data (limit 20)
    if count > 0:
        cursor.execute(f'SELECT * FROM {table_name} LIMIT 20')
        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]
        print(f'Kolonlar: {col_names}')
        print('-' * 50)
        for i, row in enumerate(rows, 1):
            print(f'  [{i}] {row}')

conn.close()
