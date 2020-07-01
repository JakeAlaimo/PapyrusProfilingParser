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
      let reader = new FileReader();

      //parse each file and assemble all data
      for(let i = 0; i < files.length; i++) {
         reader.readAsText(files[i],'UTF-8');
         let readData = await ReadFile(reader);
         let parsedData = Parse(readData);

         if(Object.keys(parsedData).length == 0) {
            reject("File \'" + files[i].name + "\' has failed to parse.");
            return;
         }

         //add the results of this file to the overall data
         for (let [method, value] of Object.entries(parsedData)) {
            if(!data[method]) { data[method] = {}; }

            //merge id arrays into data object
            for (let id of Object.keys(value)) {
               if(data[method].hasOwnProperty(id)) {
                  data[method][id] = data[method][id].concat(value[id]);
               } else {
                  data[method][id] = value[id];
               }
            }
         }
      }  

      //resolve after all files are parsed
      resolve(data);
   });   

   return parsePromise;
}

//removes incomplete data points from the set
function CleanData(data){

   for (let method of Object.keys(data)) {
      let children = 0;
      let deletedChildren = 0;

      for (let id of Object.keys(data[method])) {
         data[method][id] = data[method][id].filter((instance) => {
            return instance.PUSH && instance.POP;
         });

         if(data[method][id].length === 0){
            delete data[method][id];
            deletedChildren++;
         }

         children++;
      }

      //get rid of the method category itself if every child under it held incomplete data
      if(children === deletedChildren){
         delete data[method];
      }
   }
}

// turn logs into usable data
function Parse(fileContent)
{
   let lines = fileContent.split('\n');
   let data = {StackTimings: {}};

   // extract important data from each line
   lines.forEach(line => {
      let components = line.split(':');

      if(components.length != 6) {
         return;
      }

      let method = components[5].trim().split('.').pop();
      let id = components[2];
      let queueState = components[1];
      let time = components[0];

      if(!method || !id || !queueState || !time)
         return;

      //track global timings for each stack
      if(!data.StackTimings[id]) {
         data.StackTimings[id] = [{PUSH: time}];
      }
      data.StackTimings[id][0].POP = time;

      //ensure the data store has a place to put this bit
      if(!data[method]) { data[method] = {}; }
      if(!data[method][id]) { data[method][id] = [{[queueState]: time}]; return;}
      
      let methodInstances = data[method][id]; //gets the array of method instances of this method for a given stack ID
      let lastMethodInstance = methodInstances[methodInstances.length - 1];

      //a new instance of a method has been reached 
      if(lastMethodInstance[queueState] !== undefined || (queueState === "QUEUE_PUSH" && lastMethodInstance.PUSH)) {
         //push new instance onto method instances
         methodInstances.push({[queueState]: time});
      } else {
         lastMethodInstance[queueState] = time; //add data to current method instance
      } 
   });

   //remove incomplete data points from the set
   CleanData(data);

   return data;
}
