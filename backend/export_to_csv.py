import sqlite3
import csv
import os
import sys

DB_NAME = "blinkit_v2.db"
DB_PATH = os.path.join(os.path.dirname(__file__), DB_NAME)

if not os.path.exists(DB_PATH):
    print(f"🚨 Error: Could not find {DB_NAME} at: {DB_PATH}")
    sys.exit()

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

try:
    # 1. Auto-detect all tables inside the file
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [t[0] for t in cursor.fetchall() if t[0] != 'sqlite_sequence']
    
    print(f"📊 Tables actually found in your DB file: {tables}")
    
    if not tables:
        print("🚨 Error: Your database file is completely empty! No tables exist yet.")
        conn.close()
        sys.exit()
        
    # 2. Pick the correct table (prefers 'products', otherwise grabs the first available)
    target_table = 'products' if 'products' in tables else tables[0]
    print(f"🎯 Auto-selected table for export: '{target_table}'")

    # 3. Grab the columns dynamically so we don't hardcode anything mismatching
    cursor.execute(f"PRAGMA table_info({target_table});")
    columns = [col[1] for col in cursor.fetchall()]
    print(f"📋 Detected Columns: {columns}")

    # 4. Fetch the data rows
    cursor.execute(f"SELECT * FROM {target_table}")
    rows = cursor.fetchall()

    # 5. Write to CSV dynamically
    csv_file_path = os.path.join(os.path.dirname(__file__), "products.csv")
    with open(csv_file_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(columns)  # Dynamic headers
        writer.writerows(rows)    # Data dump

    print(f"✅ Success! Exported {len(rows)} items from '{target_table}' into 'products.csv'!")

except Exception as e:
    print(f"🚨 Failed to export database. Error details: {e}")
finally:
    conn.close()