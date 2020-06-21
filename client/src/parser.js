/*
Copyright (C) 2020 Jake Alaimo

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

//parser.js is responsible for converting profiling logs into table-ready data 

//promisifies the reader.onload event
function ReadFile(reader) {
   let readFilePromise = new Promise((resolve) => {
      reader.onload = (e) => {
         resolve(e.target.result);
      }
   });

   return readFilePromise;
}

// read and then parse the given files
function ProcessFile(files){
   if(files.length == 0){
      return;
   }

   let parsePromise = new Promise(async (resolve, reject) => {
      let data = {};
      let quantAlert = false;

      for(let i = 0; i < files.length; i++) {
         // read the file in
         let reader = new FileReader();
         reader.readAsText(files[i],'UTF-8');
   
         //once read, parse the file
         let readData = await ReadFile(reader);
         let parsedData = Parse(readData);

         //add the results of this file to the overall data
         if(Object.keys(parsedData).length > 0) {
            for (let [type, value] of Object.entries(parsedData)) {

               if(!data[type]) { data[type] = {}; }

               //if id values overlap between files, append filename. Notify the user of this change
               for (let id of Object.keys(value)) {
                  if(data[type].hasOwnProperty(id))
                  {
                     if(!quantAlert) {
                        alert("More than one selected file has data for ID:" + id + ". ID will have its filename appended, so the column will not be quantitative.");
                        quantAlert = true;
                     }

                     //rename the root key, appending the filename
                     delete Object.assign(value, {[id + "_" + files[i].name ]: value[id] })[id];
                  }
               }

               data[type] = Object.assign(data[type], value);
            }
         } else {
            reject("File \'" + files[i].name + "\' has failed to parse.");
         }
      }  

      //resolve after all files are parsed
      resolve(data);
   });   

   return parsePromise;
}

// turn logs into usable data
function Parse(fileContent)
{
   let lines = fileContent.split('\n');
   let data = {};

   // extract important data from each line
   lines.forEach(line => {
      let components = line.split(':');

      if(components.length != 6){
         return;
      }

      //let type = components[5].trim().match(/(?<=\.)(?!Register)[^\.]*$/);
      let type = components[5].trim().split('.').pop();
      
      let id = components[2];

      if(!type || type.substring(0, 8) === "Register") {
         return;
      }

      if(!data[type]) { data[type] = {}; }
      if(!data[type][id]) { data[type][id] = {}; }
  
      data[type][id][components[1]] = parseInt(components[0]);      
   });

   return data;
}
