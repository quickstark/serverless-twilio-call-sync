// Require `PhoneNumberFormat`.
const PNF = require("google-libphonenumber").PhoneNumberFormat;

// Get an instance of `PhoneNumberUtil`.
const phoneUtil =
  require("google-libphonenumber").PhoneNumberUtil.getInstance();

// Grab function paths
const syncpath = Runtime.getFunctions().sync.path;

// // Next, simply use the standard require() to bring the library into scope
const sync = require(syncpath);

/**
 * Function to initiate an outbound call from a SIP Inbound call
 * Will write call attributes to the SyncMap name defined in .ENV
 *
 * @param {Object} context Twilio Context Object (see docs)
 * @param {Object} event Inbound event payload
 * @param {Function} callback Will successfully complete the function or issue an error
 * @returns {Various} Often returns Twiml, but could return any variable
 */
exports.handler = function (context, event, callback) {
  // instantiate Twilio Client
  const client = context.getTwilioClient();

  //console our inbound event
  console.log("Inbound Call Event");
  console.log(event);

  // Change the DEFAULT_CALLER_ID in .ENV to a phone number in your account
  const defaultCallerId = process.env.DEFAULT_CALLER_ID;
  const defaultMessage =
    event["SipHeader_X-Message"] ||
    "Hold on while we connect you to the next agent";
  const defaultCountry = event.defaultCountry || "US";

  // Destructure inbound
  // If passing in SIP Headers, can destructure those here too
  const { From: fromNumber, To: toNumber, SipDomainSid: sipDomainSid } = event;

  // Package any extra SIP data into an object to write to Sync later
  const payload = {
    inboundcallsid: event["CallSid"],
    sipcallid: event["SipCallId"] || "No SIP CallID",
    callerid: event["SipHeader_X-Message-CallerID"] || defaultCallerId,
    projectid: event["SipHeader_X-Message-ProjectID"] || "00001",
    clientid: event["SipHeader_X-Message-ClientID"] || "00001",
  };

  // Define Regex for SIP addressing
  let regExNumericSipUri = /^sip:((\+)?[0-9]+)@(.*)/;
  let regAlphaSipUri = /^sip:(([a-zA-Z][\w]+)@(.*))/;

  // Ternary eavluation of Numeric SIP URI vs Alpha
  let fromSipCallerId = fromNumber.match(regExNumericSipUri)
    ? fromNumber.match(regExNumericSipUri)[1]
    : fromNumber.match(regAlphaSipUri)[2];

  // Ternary eavluation to normalize the From number or use the Default instead
  let normalizedFrom = fromNumber.match(regExNumericSipUri)
    ? fromNumber.match(regExNumericSipUri)[1]
    : defaultCallerId;

  // Parse the To Number
  let normalizedTo = toNumber.match(regExNumericSipUri)[1];

  // Parse the SIP Domain
  let sipDomain = toNumber.match(regExNumericSipUri)[3];

  // Parse number with US country code and keep raw input.
  const rawFromNumber = phoneUtil.parseAndKeepRawInput(
    normalizedFrom,
    defaultCountry
  );
  const rawtoNumber = phoneUtil.parseAndKeepRawInput(
    normalizedTo,
    defaultCountry
  );

  // Format numbers into E.164 format
  fromE164Normalized = phoneUtil.format(rawFromNumber, PNF.E164);
  toE164Normalized = phoneUtil.format(rawtoNumber, PNF.E164);

  // Console Logs for data validation
  console.log(`Original From Number: ${fromNumber}`);
  console.log(`Original To Number: ${toNumber}`);
  console.log(`Normalized PSTN From Number: ${normalizedFrom}`);
  console.log(`Normalized To Number: ${normalizedTo}`);
  console.log(`SIP CallerID: ${fromSipCallerId}`);
  console.log(`E.164 From Number: ${fromE164Normalized}`);
  console.log(`E.164 To Number: ${toE164Normalized}`);

  // Dial an Alpha (if we have one)
  if (!toNumber.match(regExNumericSipUri)) {
    console.log("Dialing an alphanumeric SIP User");
    twiml
      .dial({ callerId: fromSipCallerId, answerOnBridge: true })
      .sip(toNumber);
    callback(null, twiml);
  } else {
    // or Dial PSTN
    console.log("Dialing a PSTN Number");
    const say = `<Response><Say>Hi. We wanted to say ${defaultMessage}</Say></Response>`;
    client.calls
      .create({
        to: toE164Normalized,
        from: fromE164Normalized,
        twiml: say,
        statusCallback: process.env.STATUS_CALLBACK,
      })
      .then((call) => {
        writeCallLogtoSync(call, payload).then((res) => {
          console.log(res);
          callback(null, `Success! Call SID: ${res}`);
        });
      })
      .catch((error) => {
        console.error(error);
        callback(error);
      });
  }
};

/**
 * Write Call Data to a SyncMap
 * Creates a Sync Service if name from .ENV isn't found
 *
 * @param {string} call The Call data we want to write to Sync
 * @returns {Object} Sync Service Object
 */
async function writeCallLogtoSync(call, payload) {
  //console our outbound call event
  console.log("Outbound Call Event");
  console.log(call);

  // Create a tailored object to write to Sync
  let syncdata = {
    from: call.from,
    to: call.to,
    ...payload,
  };
  // Write tokens to SyncMap
  try {
    let syncservice = await sync.fetchSyncService(process.env.SYNC_NAME);
    let syncmap = await sync.fetchSyncMap(
      syncservice.sid,
      process.env.SYNC_NAME
    );
    let syncmapitem = await sync.createOrupdateMapItem(
      syncservice.sid,
      syncmap.sid,
      call.sid,
      syncdata
    );
    return syncmapitem;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}
