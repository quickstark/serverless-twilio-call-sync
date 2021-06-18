// Grab function paths
const syncpath = Runtime.getFunctions().sync.path;

// // Next, simply use the standard require() to bring the library into scope
const sync = require(syncpath);

/**
 * Function to cleanup a Sync Map Item
 * Will delete call attributes from the SyncMap name defined in .ENV
 *
 * @param {Object} context Twilio Context Object (see docs)
 * @param {Object} event Inbound event payload
 * @param {Function} callback Will successfully complete the function or issue an error
 * @returns {Various} Often returns Twiml, but could return any variable
 */
exports.handler = function (context, event, callback) {
  // instantiate Twilio Client
  const client = context.getTwilioClient();

  // console our event
  console.log("Callback Event on Complete");
  console.log(event);

  // get the CallSID (this is the key to the SyncMap)
  const callsid = event.CallSid;

  if (event.CallStatus == "completed") {
    removeCallfromSync(callsid).then((res) => {
      console.log(res);
      callback(null, `Deleted: ${res}`);
    });
  }
};

/**
 * Delete Call Data to a SyncMap
 *
 * @param {string} callsid The Call SID we want to remove from to Sync
 * @returns {Object} Sync response
 */
async function removeCallfromSync(callsid) {
  // Remove item from SyncMap
  try {
    let syncservice = await sync.fetchSyncService(process.env.SYNC_NAME);
    let syncmap = await sync.fetchSyncMap(
      syncservice.sid,
      process.env.SYNC_NAME
    );
    let syncmapitem = await sync.removeMapItem(
      syncservice.sid,
      syncmap.sid,
      callsid
    );
    return syncmapitem;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}
