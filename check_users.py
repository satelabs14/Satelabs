from sqlalchemy import create_engine, text

engine = create_engine('sqlite:///satelabs.db')
with engine.connect() as conn:
    result = conn.execute(text('SELECT id, username, email FROM "user" LIMIT 20;'))
    print("Registered Users:")
    print("-" * 50)
    for row in result:
        print(f"ID: {row[0]}, Username: {row[1]}, Email: {row[2]}")
