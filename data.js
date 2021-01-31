const { Pool } = require('pg');


class Data {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ssl: {
      //   rejectUnauthorized: false
      // }
      ssl: false
    });
  }
  refreshPool() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // ssl: {
      //   rejectUnauthorized: false
      // }
      ssl: false
    });
  }
  async openConnection() {
    return this.pool.connect()
  }
}

let data = null

exports.init = () => {
  data = new Data()
}
exports.openConnection = async () => {
  console.log("opening data connection...")
  const client = await data.openConnection()
  return client
}
exports.releaseConnection = async (client) => {
  console.log("releasing data connection...")
  return client.release()
}
