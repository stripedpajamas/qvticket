const express = require('express')
const builder = require('botbuilder')
const teams = require('botbuilder-teams')
const url = require('url')
const fetch = require('node-fetch')
const botConfig = config.get('bot')

const app = express()

const connector = new teams.TeamsChatConnector({
  appId: process.env.MICROSOFT_APP_ID || botConfig.microsoftAppId,
  appPassword: process.env.MICROSOFT_APP_PASSWORD || botConfig.microsoftAppPassword
})

new builder.UniversalBot(connector, (session) => {
  const text = session.message.text
  const ticketId = (text.match(/([0-9]+)/) || [])[0]
  const ticketUrl = url.resolve(`https://${botConfig.ticketSystemUrl}`, ticketId)
  const ticketJson = url.resolve(
    `https://${botConfig.ticketSystemAPIKey}:dummy@${botConfig.ticketSystemUrl}`,
    `${ticketId}.json`
  )

  fetch(ticketJson)
  .then(res => res.json())
  .then(json => {
    session.send(`## [Ticket ${ticketId}: ${json.helpdesk_ticket.subject}](${ticketUrl})
${json.helpdesk_ticket.description.substring(0, 300)}`)
  })
  .catch(e => {
    console.log(e)
    session.send(`[Ticket ${ticketId}](${ticketUrl})`)
  })
})

app.post('/api/messages', connector.listen())

app.listen(process.env.PORT || 3333, () => {
  console.log('App started listening on port 3333')
})