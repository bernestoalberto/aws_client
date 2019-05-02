let os = require('os');
if (os.platform() == 'win32') {
  if (os.arch() == 'ia32') {
    let chilkat = require('@chilkat/ck-node11-win-ia32');
  } else {
    let chilkat = require('@chilkat/ck-node11-win64');
  }
} else if (os.platform() == 'linux') {
  if (os.arch() == 'arm') {
    let chilkat = require('@chilkat/ck-node11-arm');
  } else if (os.arch() == 'x86') {
    let chilkat = require('@chilkat/ck-node11-linux32');
  } else {
    let chilkat = require('@chilkat/ck-node11-linux64');
  }
} else if (os.platform() == 'darwin') {
  let chilkat = require('@chilkat/ck-node11-macosx');
}

let meta = {
  // The more common case is to use SharePoint Online authentication (via the SPOIDCRL cookie).
  // If so, do not set Login, Password, LoginDomain, and NtlmAuth, and instead.
  // establish the cookie as shown at SharePoint Online Authentication.
  getMetaData(file) {
    let fileSize = json.IntOf("d.Length");
    console.log("File Size = " + fileSize);

    let lastmod = new chilkat.CkDateTime();
    lastmod.SetFromTimestamp(json.StringOf("d.TimeLastModified"));

    // Once we have the CkDateTime object, we can get the date/time in all sorts of formats:

    // Get as a RFC822 GMT string:
    let bLocalTime = false;
    console.log(lastmod.GetAsRfc822(bLocalTime));

    // Get as an RFC822 string in the local timezone.
    // (remember, the daylight savings that existed at the given time in the past is applied)
    bLocalTime = true;
    console.log(lastmod.GetAsRfc822(bLocalTime));

    // Get as a 32-bit UNIX time (local or GMT..)
    // The Unix time is number of seconds since the Epoch, 1970-01-01 00:00:00 +0000 (UTC).
    let unixTime = lastmod.GetAsUnixTime(bLocalTime);
    console.log("Unix time: " + unixTime);

    // One can also get the as a "DtObj" object for accessing the individual
    // parts of the date/time, such as month, day, year, hour, minute, etc.
    // The DtObj can be obtained in the GMT or local timezone:
    // dtObj: DtObj
    let dtObj = lastmod.GetDtObj(bLocalTime);
    if (lastmod.LastMethodSuccess == false) {
      console.log("This should never really happen!");
      return;
    }

    console.log(`${dtObj.Day}  ${dtObj.Month} - ${dtObj.Year} ${dtObj.Hour} : ${dtObj.Minute}
    :${dtObj.Second}`);

    return dtObj;

    // -------------------------------------------------
    // The file's metadata look like this:

    // {
    //   "d": {
    //     "__metadata": {
    //       "id": "Web/GetFileByServerRelativeUrl('/Documents/VCAC-document.docx')",
    //       "uri": "https://SHAREPOINT_HTTPS_DOMAIN/_api/Web/GetFileByServerRelativeUrl('/Documents/VCAC-document.docx')",
    //       "type": "SP.File"
    //     },
    //     "Author": {
    //       "__deferred": {
    //         "uri": "https://SHAREPOINT_HTTPS_DOMAIN/_api/Web/GetFileByServerRelativeUrl('/Documents/VCAC-document.docx')/Author"
    //       }
    //     },
    //     "CheckedOutByUser": {
    //       "__deferred": {
    //         "uri": "https://SHAREPOINT_HTTPS_DOMAIN/_api/Web/GetFileByServerRelativeUrl('/Documents/VCAC-document.docx')/CheckedOutByUser"
    //       }
    //     },
    //     "ListItemAllFields": {
    //       "__deferred": {
    //         "uri": "https://SHAREPOINT_HTTPS_DOMAIN/_api/Web/GetFileByServerRelativeUrl('/Documents/VCAC-document.docx')/ListItemAllFields"
    //       }
    //     },
    //     "LockedByUser": {
    //       "__deferred": {
    //         "uri": "https://SHAREPOINT_HTTPS_DOMAIN/_api/Web/GetFileByServerRelativeUrl('/Documents/VCAC-document.docx')/LockedByUser"
    //       }
    //     },
    //     "ModifiedBy": {
    //       "__deferred": {
    //         "uri": "https://SHAREPOINT_HTTPS_DOMAIN/_api/Web/GetFileByServerRelativeUrl('/Documents/VCAC-document.docx')/ModifiedBy"
    //       }
    //     },
    //     "Versions": {
    //       "__deferred": {
    //         "uri": "https://SHAREPOINT_HTTPS_DOMAIN/_api/Web/GetFileByServerRelativeUrl('/Documents/VCAC-document.docx')/Versions"
    //       }
    //     },
    //     "CheckInComment": "",
    //     "CheckOutType": 2,
    //     "ContentTag": "{E2F05E75-B3EF-4826-8284-E572D3628A7D},9,10",
    //     "CustomizedPageStatus": 0,
    //     "ETag": "\"{E2F05E75-B3EF-4826-8284-E572D3628A7D},9\"",
    //     "Exists": true,
    //     "Length": "21082",
    //     "Level": 2,
    //     "MajorVersion": 0,
    //     "MinorVersion": 3,
    //     "Name": "VCAC-document.docx",
    //     "ServerRelativeUrl": "/Documents/VCAC-document.docx",
    //     "TimeCreated": "2016-03-04T12:38:01Z",
    //     "TimeLastModified": "2017-01-16T04:44:31Z",
    //     "Title": "",
    //     "UIVersion": 3,
    //     "UIVersionLabel": "0.3"
    //   }
    // }
    //
  }
};
module.exports = meta;
