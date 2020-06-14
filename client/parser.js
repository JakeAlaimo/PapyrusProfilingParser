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
   let parsePromise = new Promise((resolve) => {
      reader.onload = (e) => { 
         resolve(Parse(e.target.result));
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

      let type = components[5].trim().match(/(?<=\.)(?!Register)[^\.]*$/);
      let id = components[2];

      if(!type) {
         return;
      }

      if(!data[type]) { data[type] = {}; }
      if(!data[type][id]) { data[type][id] = {}; }
  
      data[type][id][components[1]] = parseInt(components[0]);      
   });

   return data;
}
/*
function SetInterface(){
   //add copy buttons to the interface
   let copyButtons = document.querySelector("#copyButtons");

   // clear all buttons
   var child = copyButtons.lastElementChild;  
    while (child) { 
        copyButtons.removeChild(child); 
        child = copyButtons.lastElementChild; 
    } 
   
   for (const type in deltaTimes) {

      let li = document.createElement("li");

      let copyButton = document.createElement("input");
      copyButton.type = "button";
      copyButton.value = "Copy " + type + " Data";

      copyButton.addEventListener("click", ()=>{
        let clipboard = document.querySelector("#clipboard");
        clipboard.value = "";

        deltaTimes[type].forEach((dt)=>{
           clipboard.value += dt + "\n";
        });

        clipboard.select();
        document.execCommand("copy");

        alert(type + " copied to clipboard.")
      });

      li.appendChild(copyButton);
      copyButtons.appendChild(li);
   }
}*/