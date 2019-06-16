const Ninja = require('ninja-rmm-api')
const fetch = require('node-fetch')
const moment = require('moment-timezone')
const mongo = require('./mongo')

const getTime = (t) => moment
  .tz(t, 'ddd, DD MMM YYYY HH:mm:ss', 'Europe/London')
  .clone()
  .tz('America/New_York')

const alertsHook = process.env.ALERTS_HOOK
const alertMessage = (alert) => JSON.stringify(
  {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": "0076D7",
    "summary": `ALERT for ${alert.device.display_name} at ${alert.customer.name}`,
    "sections": [{
      "activityTitle": `**ALERT for ${alert.device.display_name} at ${alert.customer.name}**`,
      "text": `${alert.message}`,
      "facts": [
        {
          "name": "Timestamp",
          "value": `${getTime(alert.timestamp).format('llll')}`
        }
      ],
      "markdown": true
    }]
  }
)

const ninja = new Ninja({
  accessKeyId: process.env.NINJA_ACCESS_KEY_ID,
  secret: process.env.NINJA_SECRET,
  host: 'http://api.ninjarmm.com',
})

let currentLatest

mongo.getLatest()
  .then(id => { currentLatest = id })
  .catch(() => { currentLatest = 0 })

const retrieveLatestAlert = () => new Promise((resolve, reject) => {
  const { url, method, headers } = ninja.generateOptions({
    method: 'GET',
    resource: `/v1/alerts/since/${currentLatest}`
  })
  fetch(url, { method, headers })
    .then(res => res.json())
    .then(alerts => {
      if (alerts.length) {
        currentLatest = Math.max(...alerts.map(alert => +alert.id))
        mongo.setLatest(currentLatest)
        resolve(alerts)
      }
    })
    .catch(e => console.log(e))
})

const notifyTeams = (alert) => {
  const hour = getTime(alert.timestamp).hour()
  if (hour >= 17 || hour < 8) return
  fetch(alertsHook, {
    method: 'POST',
    body: alertMessage(alert)
  }).catch((e) => console.log(e))
}

module.exports = {
  startListening: () => {
    // start polling for events from ninja
    setInterval(() => {
      retrieveLatestAlert()
        .then((alerts) => alerts.forEach(notifyTeams))
        .catch((e) => console.log(e))
    }, 10000)
  }
}