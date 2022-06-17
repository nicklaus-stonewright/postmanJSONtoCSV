const argv = require('yargs').argv;
const express = require('express'),
  app = express(),
  fs = require('fs'),
  shell = require('shelljs'),

   // Modify the folder path in which responses need to be stored
  folderPath = './Responses/',
  defaultFileExtension = 'json',
  bodyParser = require('body-parser'),
  DEFAULT_MODE = 'writeFile',
  path = require('path');

const { readFile, writeFile } = require('fs').promises;

async function parseJSONFile (fileName) {
  try {
    const file = await readFile(fileName);
    return JSON.parse(file);
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

function arrayToCSV (data) {
  csv = data.map(row => Object.values(row));
  csv.unshift(Object.keys(data[0]));
  return `"${csv.join('"\n"').replace(/,/g, '","')}"`;
}

async function writeCSV (fileName, data) {
  try {
  	await writeFile(fileName, data, 'utf8'); 
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
}

// Create the folder path in case it doesn't exist
shell.mkdir('-p', folderPath);

 // Change the limits according to your response size
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); 

app.get('/', (req, res) => res.send('Hello, I write data to file. Send them requests!'));

// let input = "Responses/LIST Contacts - filters Copy.json"
// let output = "results/output.csv"

// const inputFileName = input;
// const outputFileName = output;

// const inputFileName = argv._[0];
// const outputFileName = argv._[1];


app.post('/write', (req, res) => {
  let date_ob = new Date();
let year = date_ob.getFullYear();
let month = date_ob.getMonth() + 1;
let day = date_ob.getDate();
let hour = date_ob.getHours();
let minute = date_ob.getMinutes();
let second = date_ob.getSeconds();
let date_file = `${year}-${month}-${day}-${hour}-${minute}-${second}`
  let extension = req.body.fileExtension || defaultFileExtension,
    fsMode = req.body.mode || DEFAULT_MODE,
    uniqueIdentifier = req.body.uniqueIdentifier ? typeof req.body.uniqueIdentifier === 'boolean' ? Date.now() : req.body.uniqueIdentifier : false,
    filename = `${date_file}${req.body.requestName}${uniqueIdentifier || ''}`,
    filePath = `${path.join(folderPath, filename)}.${extension}`,
    options = req.body.options || undefined;

  fs[fsMode](filePath, req.body.responseData, options, (err) => {
    if (err) {
      console.log(err);
      res.send('Error');
    }
    else {
      res.send('Success');
      (async () => {
        const data = await parseJSONFile(filePath);
        const CSV = arrayToCSV(data);
        const outputFileName = `results/${filename}.csv`
        await writeCSV(outputFileName, CSV);
      console.log(`Successfully converted ${outputFileName}!`);
      })();
    }
  });
});



app.listen(3000, () => {
  console.log('ResponsesToFile App is listening now! Send them requests my way!');
  console.log(`Data is being stored at location: ${path.join(process.cwd(), folderPath)}`);
});