import sqlite3
import os

db_paths = ["homeverse.db", os.path.join("backend", "homeverse.db")]
for p in db_paths:
    if os.path.exists(p):
        conn = sqlite3.connect(p)
        cur = conn.cursor()
        try:
            cols = [c[1] for c in cur.execute("PRAGMA table_info(budgets)").fetchall()]
            print(f"{p} budgets columns: {cols}")
            if "currency" not in cols:
                cur.execute("ALTER TABLE budgets ADD COLUMN currency VARCHAR DEFAULT 'INR'")
                print("Added currency")
            if "flexibility" not in cols:
                cur.execute("ALTER TABLE budgets ADD COLUMN flexibility VARCHAR DEFAULT 'Moderate'")
                print("Added flexibility")
            if "estimated_amount" not in cols:
                cur.execute("ALTER TABLE budgets ADD COLUMN estimated_amount FLOAT DEFAULT 0.0")
                print("Added estimated_amount")
            if "updated_at" not in cols:
                cur.execute("ALTER TABLE budgets ADD COLUMN updated_at DATETIME")
                print("Added updated_at")
            conn.commit()
        except Exception as e:
            print(f"Error on {p}: {e}")
        finally:
            conn.close()

print("Migration completed.")
