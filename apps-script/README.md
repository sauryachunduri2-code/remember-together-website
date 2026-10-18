# Connecting the website forms (about 10 minutes)

Every form on the site sends to one Google Apps Script. It saves each submission in a Google Sheet, emails the team, and sends the visitor a short "we got it" email. It is free and needs no other accounts.

Do all of this while signed in as **remembertogetherhosa@gmail.com**.

1. Go to sheets.google.com and create a blank spreadsheet. Name it **Remember Together website forms**.
2. In the spreadsheet, open **Extensions > Apps Script**.
3. Delete the code that is already there. Paste in everything from `Code.gs` in this folder. Click the save icon.
4. Click **Deploy > New deployment**. Click the gear next to "Select type" and choose **Web app**.
   - Description: `Website forms`
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Click **Deploy**. Google asks you to authorize: choose the team account, click **Advanced**, then **Go to (project name)**, then **Allow**. (Google shows this warning for every personal script. The script only touches this spreadsheet and sends email from this account.)
6. Copy the **Web app URL** (it ends in `/exec`).
7. Paste it into `src/site.config.ts` as `formEndpoint`, or send it to Claude to add.

The Sheet makes one tab per form (Contact, Talk requests, Stories, Volunteers, Newsletter, App launch) the first time each is used.

## Check that it works

- Open the Web app URL in a browser. It should show `{"ok":true,...}`.
- Send each form on the live site. You should see a new row in the Sheet, an email to the team, and a reply in the inbox you typed in.

## Visit counter

The same script also counts page views. Each day and page gets one row in the **Visits** tab:

| Date | Page | Page views | New visits |
|---|---|---|---|

- **Page views**: every time the page was opened.
- **New visits**: browser sessions that started on that page. Add up a day's New visits to get the total visits that day.

It sends no cookies or personal details, and ad blockers do not block it, so it counts more of your real traffic than Google Analytics. Visits from `localhost` are never counted.

A quick total: in any empty cell, type `=SUM(Visits!D:D)` for all visits ever, or `=SUM(Visits!C:C)` for all page views.

## Changing the script later

After editing `Code.gs`, use **Deploy > Manage deployments > Edit (pencil) > Version: New version > Deploy**. This keeps the same URL. Creating a brand new deployment gives a new URL that you would have to paste into the site again.

## Limits

A free Gmail account can send about 100 emails a day from a script. Each form uses up to two (one to the team, one to the visitor), so that is roughly 50 submissions a day. If you ever hit that, the rows are still saved in the Sheet.
