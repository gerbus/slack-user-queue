let conn = null

exports.setConnection = (connection) => {
  conn = connection
}
exports.initTables = async () => {
  await conn.query('CREATE TABLE IF NOT EXISTS queues (queue_id INT GENERATED ALWAYS AS IDENTITY, queue_name VARCHAR NOT NULL, PRIMARY KEY(queue_id))')
  await conn.query('CREATE TABLE IF NOT EXISTS users (user_id INT GENERATED ALWAYS AS IDENTITY, user_name VARCHAR NOT NULL, PRIMARY KEY(user_id))')
  await conn.query('CREATE TABLE IF NOT EXISTS queue_users (queue_users_id INT GENERATED ALWAYS AS IDENTITY, queue_id INT NOT NULL, user_id INT NOT NULL, rank BIGINT DEFAULT 0, PRIMARY KEY(queue_users_id))')

  return console.log('queue tables initialized')
}
exports.getQueues = async () => {
  return conn.query('SELECT * FROM queues')
}
exports.createQueue = async (name) => {
  return conn.query('INSERT INTO queues (queue_name) VALUES($1)', [name])
}
exports.resetQueue = async (id) => {
  return conn.query(`DELETE FROM queue_users WHERE queue_id = ${id}`)
}
exports.getQueueUsers = async (id) => {
  return conn.query(`SELECT * FROM queue_users qu LEFT JOIN users u ON u.user_id = qu.user_id WHERE qu.queue_id = ${id} ORDER BY rank`)
}
exports.sendUserBackOfQueue = async () => {}
exports.sendUserFrontOfQueue = async () => {}
