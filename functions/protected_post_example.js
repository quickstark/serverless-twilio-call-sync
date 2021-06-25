// Get twilio-node from twilio.com/docs/libraries/node
const webhooks = require("twilio/lib/webhooks/webhooks"); //contains Signature helper
const qs = require("qs"); //query string builder library
const axios = require("axios"); //common HTTP library

/**
 * Example Function to call a Protected Twilio Function with X-Twilio-Signature
 *
 * @param {Object} context Twilio Context Object (see docs)
 * @param {Object} event Inbound event payload
 * @param {Function} callback Will successfully complete the function or issue an error
 * @returns {Various} Often returns Twiml, but could return any variable
 */
exports.handler = function (context, event, callback) {
  // The Twilio request URL
  const url = `${process.env.BASE_URL}/sync_fetchmapitem`;

  // Your Twilio environment Auth Token
  const token = process.env.AUTH_TOKEN;

  // The post variables in Twilio's request
  const data = {
    key: event.key || "00001",
  };

  console.log(data);

  // Call a quick function to produce the expected signature from helper library
  getTwilioSignature(token, url, data).then((sig) => {
    console.log(`Expected Signature: ${sig}`);
    postData(url, sig, data).then((mapitem) => {
      console.log(mapitem);
      callback(null, JSON.stringify({ response: mapitem }));
    });
  });
};

// Example function to build the expected Twilio X-Signature for a given Request
async function getTwilioSignature(token, url, data) {
  const signature = webhooks.getExpectedTwilioSignature(token, url, data);
  return signature;
}

// Example POST method implementation using Axios
async function postData(url = "", signature, data = {}) {
  let res = await axios({
    method: "post",
    url: url,
    data: qs.stringify(data),
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
      "X-TWILIO-SIGNATURE": signature,
    },
  });
  return res.data;
}
