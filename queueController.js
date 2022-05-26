const queueModel = require('./queueModel')

exports.sendUsersBackOfQueue = (queueId, users) => {
  // get users already in queue
  const usersInQueue = queueModel.getQueueUsers(queueId)

  // 
}

exports.sendUsersFrontOfQueue = (queueId, users) => {}

