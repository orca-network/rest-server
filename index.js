const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("./credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Sheets API.
  //   authorize(JSON.parse(content), listMajors);
//   authorize(JSON.parse(content), getData);
//   authorize(JSON.parse(content), writeData);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, data) {
  //   const {client_secret, client_id, redirect_uris} = credentials.installed;
  const { client_secret, client_id, redirect_uris } = credentials.web;
  console.log(client_secret, client_id, redirect_uris);

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  let results;
  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    results = callback(oAuth2Client, data);
  });
  console.log('the callback results', results);
  return results;
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question("Enter the code from that page here: ", code => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      range: "Class Data!A2:E"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        console.log("Name, Major:");
        // Print columns A and E, which correspond to indices 0 and 4.
        rows.map(row => {
          console.log(`${row[0]}, ${row[4]}`);
        });
      } else {
        console.log("No data found.");
      }
    }
  );
}

function getData(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1wKPEZu_Sr1LuUZ-LTtNNswvEnV80ishZy7XwatpCkr8",
      range: "sightings!A1:B"
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        rows.map(row => {
          console.log(`${row[0]}, ${row[1]}`);
        });
      } else {
        console.log("No data found.");
      }
    }
  );
}




async function writeData(auth, data) {
  const sheets = google.sheets({ version: "v4", auth });
//   let data = ["Item", "Wheel"];
  var request = {
    spreadsheetId: "1wKPEZu_Sr1LuUZ-LTtNNswvEnV80ishZy7XwatpCkr8",

    //provide the range to which the row data will be appended
    range: "sightings!A1:B",
    valueInputOption: "USER_ENTERED", 
    insertDataOption: "INSERT_ROWS",
    resource: 
      {
        "majorDimension": "ROWS",
        "values": [
            //provide the row data to add here as an array
            // ["Item", "Wheel"]
            data
        ]
      },

    auth: auth
  };

  let results;
  sheets.spreadsheets.values.append(request, function(err, response) {
    if (err) {
      console.error(err);
      return;
    }
    // TODO: Change code below to process the `response` object:
    console.log(JSON.stringify(response, null, 2));
    return JSON.stringify(response, null, 2);
  });

  console.log('results in callback', results)
  return results;
}

module.exports = { writeData, authorize };

