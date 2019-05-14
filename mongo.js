const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

const uri = process.env.MONGO_URI
const dbName = 'shuriken'
const collectioName = 'alerts'

let latestId

const setLatest = (id) => {
  if (id === latestId) {
    return
  }
  MongoClient.connect(uri, (err, client) => {
    assert.equal(null, err)
    const db = client.db(dbName)
    const collection = db.collection(collectioName)
    collection.updateOne(
      { latestAlertDoc: 1 },
      { $set: { latestAlert: id } }, 
      { upsert: true },
      (err, result) => {
        latestId = id
        client.close()
    })
  })
}

const getLatest = () => new Promise((resolve, reject) => {
  MongoClient.connect(uri, (err, client) => {
    if (err) {
      return reject(err)
    }
    const db = client.db(dbName)
    const collection = db.collection(collectioName)
    collection.findOne(
      { latestAlertDoc: 1 },
      (err, result) => {
        latestId = result.latestAlert
        client.close()
        resolve(latestId)
    })
  })
})

module.exports = {
  setLatest,
  getLatest
}