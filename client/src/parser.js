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
         //remove all cases that lack either a push or pop. without these, we lack necessary info
         data[method][id] = data[method][id].filter((instance) => {
            return instance.PUSH && instance.POP;
         });

         //remove the entire branch if no instances remain
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

//returns if state1 is a valid next step from state2 within the same process
function IsNextQueueState(state1, state2) {

   switch(state1){
      case "QUEUE_PUSH":
         return false; //queue push is always a first step
      case "PUSH":
         return state2 === "QUEUE_PUSH";
      case "QUEUE_POP":
         return state2 === "PUSH";
      case "POP":
         return state2 === "PUSH" || state2 === "QUEUE_POP"; //queue_pop may be skipped
   }
}

//returns true if the given method is valid and is just using an alias (i.e.: defaultAllowPCDialogueScript.GetLevel and Actor.GetLevel)
function IsSourceAlias(nextLine, queueState, validSource, validMethod){
   let lookaheadComponents = nextLine.split(':');
   if(lookaheadComponents.length != 6) {
      return false;
   }

   let nextMethodParts = lookaheadComponents[5].trim().split('.');
   let nextQueueState = lookaheadComponents[1];

   if(nextMethodParts.pop() !== validMethod || nextMethodParts[0] !== validSource || IsNextQueueState(nextQueueState, queueState) === false){
      return false;
   }

   return true; //next line is the appropriate method, source, and follows as the next step in the same process. this is an alias
}

//returns the new method name in the [script].[method] format when disambiguating
function AppendScriptName(method, callingScript, nextLine, queueState){
   let newName = "";
   //if possible, use the script associated w. next line (to prevent aliases from being split off)
   if(nextLine.length === 6 && IsNextQueueState(nextLine[1], queueState)) { 
      newName = nextLine[5].trim().split('.')[0] + '.' + method;
   } else {
      newName = callingScript + '.' + method;
   }

   return newName;
}

// turn logs into usable data
function Parse(fileContent)
{
   let lines = fileContent.split('\n');
   let data = {"Stack Timings": {}};

   let methodSources = {}; //pairs each method name with it's script source (to distinguish functions sharing names)

   // extract important data from each line
   lines.forEach((line, i) => {
      let components = line.split(':');
      if(components.length != 6) {
         return;
      }

      let methodDataParts = components[5].trim().split('.');
      let callingScript = methodDataParts[0]; //the name of the script that called the method
      let method = methodDataParts.pop(); //the name of the method

      let id = components[2];
      let queueState = components[1];
      let time = components[0];

      if(!method || !id || !queueState || !time)
         return;

      //track global timings for each stack
      if(!data["Stack Timings"][id]) {
         data["Stack Timings"][id] = [{PUSH: time}];
      }
      data["Stack Timings"][id][0].POP = time;

      let nextLine = (i+1 < lines.length) ? lines[i+1] : "";
      let nextLineSplit = nextLine.split(':');

      //expand the method name if different sources have methods of the same name
      if(methodSources[method] === undefined && nextLineSplit.length === 6 && IsNextQueueState(nextLineSplit[1], queueState) === false) {
         methodSources[method] = {source: callingScript, multipleSources: false, lastQueueState: queueState};
      } else if (methodSources[method] !== undefined) {
         if(methodSources[method].multipleSources === true) { 
            method = AppendScriptName(method, callingScript, nextLineSplit, queueState); //disambiguate by appending script name to method
         } else if(methodSources[method].source !== callingScript && IsSourceAlias(lines[i+1], queueState, methodSources[method].source, method) === false) {
            methodSources[method].multipleSources = true;
            delete Object.assign(data, {[methodSources[method].source + '.' + method]: data[method] })[method]; //rename [method] to [source.method]
            method = AppendScriptName(method, callingScript, nextLineSplit, queueState);
         }
      }

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
