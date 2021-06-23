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

  // {'key':'project_id+c}
  const client = context.getTwilioClient();

  // Key for the Map Item
  // Make sure to pass in a unique "key" value for the SyncMapItem
  const key = event.key;

  // console our event
  console.log("Fetching Map Item");

  fetchMapItem(key).then((res) => {
    callback(null, res);
  });
};

/**
 * Delete all Sync Map Items for the SyncMap specified in .ENV
 *
 * @returns {Object} Sync response
 */
async function fetchMapItem(key) {
  // Retrieve from SyncMap
  try {
    let syncservice = await sync.fetchSyncService(process.env.SYNC_NAME);
    let syncmap = await sync.fetchSyncMap(
      syncservice.sid,
      process.env.SYNC_NAME
    );
    let syncmapitems = await sync.fetchMapItem(
      syncservice.sid,
      syncmap.sid,
      key
    );
    return syncmapitems;
  } catch (err) {
    console.log(err);
    return Promise.reject(err);
  }
}
