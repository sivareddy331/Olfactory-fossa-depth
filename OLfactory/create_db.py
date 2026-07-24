import pymysql

conn = pymysql.connect(host='127.0.0.1', user='root', password='')
cursor = conn.cursor()
cursor.execute('CREATE DATABASE IF NOT EXISTS olfactory_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
cursor.execute('SHOW DATABASES')
dbs = cursor.fetchall()
print('All databases:', [d[0] for d in dbs])
conn.close()
print('Done - olfactory_db created successfully!')
