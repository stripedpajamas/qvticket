const express = require('express')
const builder = require('botbuilder')
const teams = require('botbuilder-teams')
const url = require('url')
const fetch = require('node-fetch')
const ninja = require('./ninja')

const botConfig = {
  microsoftAppId: process.env.MICROSOFT_APP_ID,
  microsoftAppPassword: process.env.MICROSOFT_APP_PASSWORD,
  ticketSystemUrl: process.env.TICKET_SYSTEM_URL,
  ticketSystemAPIKey: process.env.TICKET_SYSTEM_API_KEY
}

const app = express()

const connector = new teams.TeamsChatConnector({
  appId: botConfig.microsoftAppId,
  appPassword: botConfig.microsoftAppPassword
})

const bot = new builder.UniversalBot(connector, (session) => {
  const text = session.message.text
  const ticketId = (text.match(/([0-9]+)/) || [])[0]
  if (!ticketId) {
    session.send('I need a ticket ID to be useful :)')
  }
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

ninja.startListening()