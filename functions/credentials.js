function testClient(client, sipDomainSid) {
  console.log(client);
  console.log(sipDomainSid);
}

function fetchCredentials(client, sipDomainSid) {
  // Call enumerateCredentialLists function
  enumerateCredentialLists(client, sipDomainSid).then((credentialLists) => {
    // setup an array to store Credentials

    let mergedAggregatedE164CredentialUsernames = [];

    Promise.all(
      credentialLists.map((credList) => {
        return getSIPCredentialListUsernames(credList.sid);
      })
    )
      .then((results) => {
        results.forEach((credentials) => {
          // Merge together all SIP Domain associated registration
          // credential list usernames prefixed by + into one array
          mergedAggregatedE164CredentialUsernames.push.apply(
            mergedAggregatedE164CredentialUsernames,
            credentials
              .filter((record) => record["username"].startsWith("+"))
              .map((record) => record.username)
          );
        });
        console.log(mergedAggregatedE164CredentialUsernames);
        callback(null, mergedAggregatedE164CredentialUsernames);
      })
      .catch((err) => {
        console.log(err);
        callback(err);
      });
  });
}

function enumerateCredentialLists(sipDomainSid) {
  return client.sip
    .domains(sipDomainSid)
    .auth.registrations.credentialListMappings.list();
}

function getSIPCredentialListUsernames(credList) {
  return client.sip.credentialLists(credList).credentials.list();
}

module.exports = {
  fetchCredentials,
  testClient,
};
