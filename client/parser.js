//parser.js is responsible for converting profiling logs into excel-ready data 

// read and then parse the given file
function ProcessFile(file){
   if(!file){
      return;
   }

   // read the file in
   var reader = new FileReader();
   reader.readAsText(file,'UTF-8');

   //once read, parse the file
   let parsePromise = new Promise((resolve, reject) => {
      reader.onload = (e) => { 
         let parsedData = Parse(e.target.result);

         if(Object.keys(parsedData).length > 0) {
            resolve(parsedData);
         } else {
            reject();
         }
      };
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
