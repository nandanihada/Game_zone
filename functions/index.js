const functions = require("firebase-functions");
const {google} = require("googleapis");

exports.getUserGmail = functions.https.onCall(async (data, context) => {
  const {accessToken} = data;

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({access_token: accessToken});

  const gmail = google.gmail({version: "v1", auth: oauth2Client});

  try {
    const res = await gmail.users.messages.list({
      userId: "me",
      maxResults: 5,
    });

    const messages = res.data.messages || [];
    const fullMessages = [];

    for (const msg of messages) {
      const msgData = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });
      fullMessages.push({
        id: msgData.data.id,
        snippet: msgData.data.snippet,
        from: (msgData.data.payload.headers.find(
            (h) => h.name === "From") || {}).value,
        subject: (msgData.data.payload.headers.find(
            (h) => h.name === "Subject") || {}).value,
      });
    }

    return fullMessages;
  } catch (error) {
    console.error("Error fetching Gmail:", error);
    throw new functions.https.HttpsError("internal", "Failed to fetch Gmail");
  }
});
