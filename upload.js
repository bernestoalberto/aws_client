#!/usr/bin/env node
// Make sure AWS credentials are loaded.
let config = require ('./config/config.json');
const AWS = require('aws-sdk');
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const breadcrumb = require('path');
const  watchd = require('node-watch');
const mysql = require('./helpers/database.js');
const cron = require('node-cron');
const mailer =  require('./helpers/nodemail.js');
// let winston = require('winston');
//configuring the AWS environment
AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey
});

let s3 = new AWS.S3({logger: console});

let aws = {

  watchImages(path) {
    let watcher = new watchd(path, {recursive: true, filter: /\.(jpeg|jpg|svg|gif|png)$/i});

    watcher.on('change', function (evt, name) {
      if (evt === 'update') {
        console.info(`Listener triggered. Some file(s)  at ${path}`);
        let type = 'images';

        let extension = 'jpeg|jpg|svg|gif|png';
        aws.uploader(name, path, type,extension);
      }
    });
    watcher.on('error', function (error) {
      console.error(error);
    });
  },
  watchDocs(path) {
    let watcher = new watchd(path, {recursive: true, filter: /\.(csv|txt)$/i});

    watcher.on('change', function (evt, name) {
      if (evt === 'update') {
        console.info(`Listener triggered. Some file(s)  at ${path}`);
        let type = 'documents';
        let extension = '.csv|txt';
        aws.uploader(name, path, type,extension);
      }
    });
    watcher.on('error', function (error) {
      console.error(error);
    });
  },
  emptyDumpFolder: (path) => {
    'use strict';
    cron.schedule('* * 18 * * 0-5', () => {
      // cron.schedule('* * * * 1,2,3,4,5',()=>{
      console.log(`Attempting to delete the directory content @ ${path}`);
      fs.emptyDir(path, err => {
        if (err) return console.error(err);
        console.log(`The Folder ${path}  is empty!`);
      });
    });
  },
  logDBUpload(name,path,pfolder,extension) {
    let query = `Insert into media (resource_name, resource_path,  imagable_id, imagable_type, extension, storage_key) values ('${name}','${path}','${name}','${pfolder}','${extension}','${path}')`;
   mysql.exec(query,null, function (resultado){
     console.info(`File ${name} is located at ${path} on S3. DB result ${resultado}`);

  });
},
  watchHTMLReports(path){
    {
      let watcher = new watchd(path, {recursive: true, filter: /\.(html)$/i});
      aws.emptyDumpFolder(path);
      watcher.on('change', function (evt, name) {
        if (evt === 'update') {
          console.info(`Listener triggered. Some file(s)  at ${name}`);
          aws.convertHtmltoPdf(name);
        }
      });
      watcher.on('error', function(error){
        console.error(error);
      });
    }

    },
  watchPDFReports(path){
      let watcher = new watchd(path, {recursive: true, filter: /\.(pdf)$/i});
      aws.emptyDumpFolder();
      watcher.on('change', function (evt, name) {
        if (evt === 'update') {
          console.info(`Listener triggered. Some file(s)  at ${path}`);
          let type =   'reports';
          let extension = '.pdf';
          aws.uploader(name, path,type,extension);
        }
      });
      watcher.on('error', function(error){
        console.error(error);
      });
    },
  uploader(name,path,type,extension) {
//configuring parameters
      let date =  new Date();
      let filterName = name.replace(path+'/','');
      path = `${type}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}/${breadcrumb.basename(filterName)}`;
      let params = {
        Bucket: config.bucket,
        // Acl: config.acl,
        Body: fs.createReadStream(name),
        Key: path
      };
      s3.putObject(params, function (err, data) {
        //handle error
        if (err) {
          console.error("Error", err);
        }
        //success
        if (data) {
          console.log("Uploaded in:", data.ETag);
          aws.email(filterName,`The File ${filterName} has been uploaded successfully`,`A file has been upload via AWS to S3 bucket ${config.bucket}`);
          aws.logDBUpload(filterName, path,type,extension);
        }
      });
    },
    convertHtmltoPdf: async (pathToFile)=>{
      'use strict';
      console.log(`Starting the saving the html page as pdf process of ${pathToFile}`);
      let raw = pathToFile.replace(".html"," ");
      const browser = await puppeteer.launch({headless:true});
      const page = await browser.newPage();
      await page.goto(pathToFile, {waitUntil: 'networkidle2'});
      await page.pdf({path: `${raw}.pdf`, format: 'A4'});
      console.log('Ending the pdf process');
      await browser.close();
    },
    email: (name, message, subjecto, flag=0)=>{
      // 'use strict';
      let subject = `${subjecto}`;
      let body = `${message} ${name} `;
      let mailParam = {
        from: '"Do not reply "<no-reply@acslabcannabis.com>"',
        to: "ebonet@acslabtest.com",
        subject: (subject == 1 ) ? message: subject,
        text: body,
        html: body
      };
      let user='';
      if(env == 'GCP') {
        user = 'mlaping';

        mailParam.cc = [
          // (flag == 1 || subject ==1)? 'mlaping@acslabtest.com':'',
          `${user}@acslabtest.com`
        ];
      }
      mailer.sendMail(mailParam, 'The Server');
    }
  };
let env = (process.env.COMPUTERNAME == 'ACS-EBONET') ? 'local' : 'WDeploy ';
console.info(`Running on ${env} env`);
let pwd = (env == 'local') ? config.paths.results.source.prueba : config.paths.results.source.wdeployment;

aws.watchDocs(pwd);
aws.watchHTMLReports(pwd);
aws.watchPDFReports(pwd);
aws.watchImages(pwd);
console.info(`Watching on ${pwd}`);

module.exports = aws;
