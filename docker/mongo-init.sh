#!/bin/bash
set -euo pipefail

root_password=$(cat ${MONGO_INITDB_ROOT_PASSWORD_FILE})
app_password=$(cat ${MONGO_APP_PASSWORD_FILE})
export MONGO_APP_PASSWORD=${app_password}

mongosh --quiet \
  --username ${MONGO_INITDB_ROOT_USERNAME} \
  --password ${root_password} \
  --authenticationDatabase admin \
  ${MONGO_INITDB_DATABASE} \
  --eval '
    const username = process.env.MONGO_APP_USER;
    const password = process.env.MONGO_APP_PASSWORD;
    const databaseName = process.env.MONGO_INITDB_DATABASE;
    if (!username || !password || !databaseName) throw new Error(`Missing application database credentials`);
    db.createUser({
      user: username,
      pwd: password,
      roles: [{ role: `readWrite`, db: databaseName }]
    });
  '

unset MONGO_APP_PASSWORD
