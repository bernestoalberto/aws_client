// const mysql = require('mysql');
const mysql = require('mysql2');
const config = require('../config/config.json');
const logging = require('./loggin.js');
config.database.debug = config.system.debug;
// let pool = mysql.createPool(config.database.mysql);
const pool = mysql.createConnection(config.database.mysql);
console.info("Creating a new MySQL Pool");
console.info(`Connected to ${config.database.mysql.database} db`);
let dab ={
  exec:  function(req, param, callback){
    pool.execute(req,['Rick C-137', 53],function(err, results, fields) {
      // If you execute same statement again, it will be picked form a LRU cache
      // which will save query preparation time and give better performance

      // logging.write('./postFile.txt',req);
      // console.log(req);
      return (results) ? callback(results, err) : dab.error(err,req);

    });
  },
  run:function(callback){
    pool.execute('FLUSH HOSTS',['Rick C-137', 53],function(err, results, fields) {
      // If you execute same statement again, it will be picked form a LRU cache
      // which will save query preparation time and give better performance
      return (results) ?  callback(results, err): dab.error(err,results);
    });
  },
  error:  function(err,q='empty'){
    logging.write("./logs/database_error.log", err);
    logging.write("./logs/database_error.log", JSON.stringify(err));
    console.error(err.message);
    (q)?console.error(q):'';
  }
};
module.exports = dab;
