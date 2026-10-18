/**
 * Remember Together form backend.
 *
 * Every form on the website posts here. For each submission this script:
 *   1. adds a row to the matching tab of the Google Sheet it is attached to,
 *   2. emails the team,
 *   3. sends the visitor a short "we got it" email (when they gave an email address).
 *
 * Setup steps are in apps-script/README.md.
 */

const TEAM_EMAIL = 'remembertogetherhosa@gmail.com';
const SITE_URL = 'https://remembertogether.vercel.app';

// Website form name -> Sheet tab name.
const FORMS = {
  'contact': 'Contact',
  'talk-request': 'Talk requests',
  'story': 'Stories',
  'volunteer': 'Volunteers',
  'newsletter': 'Newsletter',
  'app-launch': 'App launch',
};

// The short reply each visitor gets. Plain text, so it reads well in any email app.
const REPLIES = {
  'contact': {
    subject: 'We got your message',
    body: 'Thank you for writing to Remember Together. A member of our team will reply to this email address soon.',
  },
  'talk-request': {
    subject: 'We got your talk request',
    body: 'Thank you for inviting Remember Together to speak. We will email you soon to talk about dates and details.',
  },
  'story': {
    subject: 'Thank you for sharing your story',
    body: 'Your story reached our team, and we are grateful you trusted us with it. If you said we may publish it, we will read it first and email you if we have a question. You can ask us to remove it at any time by replying to this email.',
  },
  'volunteer': {
    subject: 'Thank you for offering to help',
    body: 'Thank you for offering to help Remember Together. We read every message and will email you soon about next steps.',
  },
  'newsletter': {
    subject: 'You are signed up for updates',
    body: 'Thank you for signing up. We will only email when we have something worth sharing. To stop getting emails, reply to this one and say so.',
  },
  'app-launch': {
    subject: 'You are on the launch list',
    body: 'Thank you. We will email you once when the Remember Together app is on the App Store. Until then, our lessons and caregiver guides are free to read at ' + SITE_URL + '.',
  },
};

const MAX_FIELD_LENGTH = 5000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const tabName = FORMS[data.form];
    if (!tabName) return json({ ok: false, error: 'Unknown form' });

    const clean = {};
    Object.keys(data).forEach(function (key) {
      clean[key] = sanitize(data[key]);
    });

    saveRow(tabName, clean);

    // The row is already saved, so a mail problem (like the daily limit) should not show the visitor an error.
    try {
      notifyTeam(tabName, clean);
      replyToVisitor(data.form, clean);
    } catch (mailError) {
      console.error(mailError);
    }

    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ ok: false, error: 'Could not save the form' });
  } finally {
    lock.releaseLock();
  }
}

// Lets you check the deployment in a browser: it should say ok.
function doGet() {
  return json({ ok: true, service: 'Remember Together forms' });
}

function saveRow(tabName, clean) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(tabName) || spreadsheet.insertSheet(tabName);

  // Columns are created the first time a field appears, so new form fields just work.
  let headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  if (headers.length === 0) headers = ['Received'];
  Object.keys(clean).forEach(function (key) {
    if (key !== 'form' && headers.indexOf(key) === -1) headers.push(key);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  const row = headers.map(function (header) {
    return header === 'Received' ? new Date() : (clean[header] || '');
  });
  sheet.appendRow(row);
}

function notifyTeam(tabName, clean) {
  const lines = Object.keys(clean)
    .filter(function (key) { return key !== 'form'; })
    .map(function (key) { return key + ': ' + clean[key]; });
  const options = {
    to: TEAM_EMAIL,
    subject: 'New ' + tabName + ' form from the website',
    body: lines.join('\n\n') + '\n\nAll responses: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl(),
    name: 'Remember Together website',
  };
  if (EMAIL_PATTERN.test(clean.email || '')) options.replyTo = clean.email;
  MailApp.sendEmail(options);
}

function replyToVisitor(formName, clean) {
  const reply = REPLIES[formName];
  if (!reply || !EMAIL_PATTERN.test(clean.email || '')) return;
  const greeting = clean.name ? 'Hi ' + clean.name.split(' ')[0] + ',' : clean.firstName ? 'Hi ' + clean.firstName + ',' : 'Hi,';
  MailApp.sendEmail({
    to: clean.email,
    subject: reply.subject,
    body: greeting + '\n\n' + reply.body + '\n\nThe Remember Together team\nA HOSA Community Awareness project\n' + SITE_URL,
    name: 'Remember Together',
    replyTo: TEAM_EMAIL,
  });
}

// Trims long values and stops spreadsheet formulas from running if someone types one in.
function sanitize(value) {
  let text = String(value == null ? '' : value).slice(0, MAX_FIELD_LENGTH).trim();
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}

function json(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
