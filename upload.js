#!/usr/bin/env node
// Make sure AWS credentials are loaded.
let config = require ('./config/config.json');
const AWS = require('aws-sdk');
const fs = require('fs');
const breadcrumb = require('path');
const  watchd = require('node-watch');
// const mysql = require('./helpers/database.js');
// const cron = require('node-cron');
const mailer =  require('./helpers/nodemail.js');
// let winston = require('winston');
//configuring the AWS environment
AWS.config.update({
  accessKeyId: config.accessKeyId,
  secretAccessKey: config.secretAccessKey
});

let s3 = new AWS.S3({logger: console});

let aws = {
  watchImages(path){
    let watcher = new watchd(path, {recursive: true, filter: /\.(jpeg|jpg|svg|gif|png)$/i});

    watcher.on('change', function (evt, name) {
      if (evt === 'update') {
        console.info(`Listener triggered. Some file(s)  at ${path}`);
        let type =  'image';

        aws.uploader(name, path,type);
      }
    });
    watcher.on('error', function(error){
      console.error(error);
    });
  },
  watchDocs(path){
    let watcher = new watchd(path, {recursive: true, filter: /\.(csv|txt)$/i});

    watcher.on('change', function (evt, name) {
      if (evt === 'update') {
        console.info(`Listener triggered. Some file(s)  at ${path}`);
        let type =   'documents';

        aws.uploader(name, path,type);
      }
    });
    watcher.on('error', function(error){
      console.error(error);
    });
  },
  logDBUpload(){

  },
  watchReports(path){
    let watcher = new watchd(path, {recursive: true, filter: /\.(html|pdf)$/i});

    watcher.on('change', function (evt, name) {
      if (evt === 'update') {
        console.info(`Listener triggered. Some file(s)  at ${path}`);
        let type =   'reports';

        aws.uploader(name, path,type);
      }
    });
    watcher.on('error', function(error){
      console.error(error);
    });
  },
  uploader(name,path,type) {
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
      }
    });

    /*    else {
          console.info(`File format not valid ${name}`);
          aws.email(name,`File format not valid ${name}`,`File format not valid`);
        }*/
  },
  download(){

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
let env = (process.env.OS == 'Windows_NT') ? 'local' : 'GCP ';
console.info(`Running on ${env} env`);
let pwd = (env == 'local') ? config.paths.results.source.prueba : config.paths.results.source.cloud;
aws.watchDocs(pwd);
aws.watchReports(pwd);
aws.watchImages(pwd);
console.info(`Watching on ${config.paths.results.source.prueba}`);

module.exports = aws;
