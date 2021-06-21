# serverless-twilio-call-sync

Twilio Serverless Functions to store inbound call data to Sync (for Agent Assisted Pay or other use cases where call state needs to be retained)

**Important: Twilio Functions are limited to ~20 executions / second and Sync to 20 read/writes / sec, so these functions are useful for use cases within those ranges**

This uses the [Twilio CLI](https://www.twilio.com/docs/twilio-cli/quickstart) with the [Twilio Serverless Plugin](https://www.twilio.com/docs/twilio-cli/plugins)

# Installation

- Download / Clone this repo
- Update .env (_or, if you have an existing Twilio Serverless Project, copy/paste into existing .env file_)
  -- SYNC_NAME=CallLog
  -- DEFAULT_CALLER_ID=+1737555112  
  -- STATUS_CALLBACK=CallbackURL

- Test Serverless Application locally
  `twilio serverless:start`

- _Note: to attach to debugger_
  `twilio serverless:start --inspect=""`

- Deploy the Serverless Function to Twilio Cloud using Twilio CLI

  `twilio serverless:deploy`

  _Following initial deploy, if you want to overwrite an existing project_

  `twilio serverless:deploy --override-existing-project`

- Once deployed, visit your [Twilio Functions](https://www.twilio.com/console/functions/overview/services)
