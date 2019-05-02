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
        aws.email(path,`The Folder  is empty!`,`The Folder ${path}  is empty!`);
      });
    });
  },
  logDBUpload(name,path,pfolder,extension,data) {
    let query = `Insert into media (resource_name, resource_path,  imagable_id, imagable_type, extension, storage_key,etag, object_url) 
                 values ('${name}','${path}','${name}','${pfolder}','${extension}','${path}','${data.ETag}','https://s3.amazonaws.com/${config.bucket}/${path}${name}')`;
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
  getObject(id){
    try {
    let params = {
      Bucket: config.bucket,
     Key: id
    };

    s3.getObject(params, function (err, data) {

      if(err)throw err;
      let objectData = data.Body.toString('utf-8');
      console.info(objectData);
    });
    } catch (e) {
      throw new Error(`Could not retrieve file from S3: ${e.message}`);
    }
  },
  listObjects(folder='reports'){
    let prefix = (folder == 'reports')  ?`${folder}/`: '';
    let params = {
      Bucket: config.bucket,
      MaxKeys: 2147483647, // Maximum allowed by S3 API,
      Delimiter: '/ / /' ,
      Prefix: prefix
    };

    s3.listObjects(params, function (err, data) {
      if(err)throw err;
       data.Contents.forEach(function (item) {
       });
    });
  },
  getdate: function () {
    'use strict';
    let date = new Date();
    let d = date.getFullYear()+"-"+((date.getMonth() < 10) ? "0"+date.getMonth() : date.getMonth())+"-"+((date.getDate() < 10) ? "0"+date.getDate() : date.getDate())+" "+date.getHours()+":"+date.getMinutes()+":"+((date.getSeconds()<10) ? "0"+date.getSeconds() : date.getSeconds())+"."+date.getMilliseconds();
    return d;
  },
  getObjetUrl(accession){
    try{
    let query = `Select * from media where resource_name like '%${accession}%'`;
    mysql.exec(query,'',function (resultado) {
      resultado.forEach(function (item) {
        console.log(item.object_url);
      });

    });

  } catch (e) {
    throw new Error(`Could not retrieve file from S3: ${e.message}`);
  }

  },
  updateFields(data){
      let uri = `https://s3.amazonaws.com/${config.bucket}/${data.Key}`;
      let query = `Update media set 
                 created_at = '${aws.getdate()}',
                 updated_at = '${aws.getdate()}',
                 etag = '${data.ETag}',
                 object_url = '${uri}'
                 where storage_key =  '${data.Key}'`;
      mysql.exec(query, '', function (result) {
        console.log(`Resource Name updated ${data.ETag} - # Rows affected ${result.affectedRows}`);
      });
  },
  uploader(name,path,type,extension) {
//configuring parameters
      let date =  new Date();
    let filterName = '';
      if(env == 'local'){

         filterName = name.replace(path+'/','');
      }
      else{
         filterName = name.replace(path+'\\','');
      }
      console.log( 'Filtername' + filterName);
      path = `${type}/${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}/${breadcrumb.basename(filterName)}`;
      let params = {
        Bucket: config.bucket,
        ACL: config.acl,
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
          aws.logDBUpload(filterName, path,type,extension,data);
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
/*      let user='';
      if(env != 'local') {
        user = 'mlaping';

        mailParam.cc = [
          // (flag == 1 || subject ==1)? 'mlaping@acslabtest.com':'',
          `${user}@acslabtest.com`
        ];
      }*/
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
// aws.listObjects();
// aws.getObject('reports/2019/4/29/695288_9LB180828PH .pdf');
// aws.getObjetUrl('699873');
module.exports = aws;
