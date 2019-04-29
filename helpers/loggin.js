const fs = require('fs');
let log = module.exports = {
  write: function (filename, data) {
    'use strict';
    let d = log.getdate();
    fs.appendFile(filename, d+"," +data+"\r\n", function (err) {
      if (err) {
        console.err(filename);
        // throw err;
      }
    });
  },
  writeCSV: function (filename, json) {
    'use strict';
    if (!fs.exists(filename)) {
      let header = "";
      for (let key in header) {
        header += key + ", ";
        row += json[key] + ", ";
      }
      header = header.substring(header.length-2) + "\r\n";
      fs.appendFile(filename, header);
    }
    let row = "";
    for (let key in json) {
      row += json[key] + ", ";
    }
    row = row.substring(row.length-2) + "\r\n";
    fs.appendFile(filename, row);
  },
  getdate: function () {
    'use strict';
    let date = new Date();
    let d = date.getFullYear()+"-"+((date.getMonth() < 10) ? "0"+date.getMonth() : date.getMonth())+"-"+((date.getDate() < 10) ? "0"+date.getDate() : date.getDate())+" "+date.getHours()+":"+date.getMinutes()+":"+((date.getSeconds()<10) ? "0"+date.getSeconds() : date.getSeconds())+"."+date.getMilliseconds();
    return d;
  },
  show: function (data) {
    'use strict';
    console.log(data);
  }
};
