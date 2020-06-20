let app;

window.onload = () => {

    app = new Vue({
        el: '#app',
        data: {
          logData: {},
          displayedData: {},
          displayedCategory: "",
          selectedFile: "Choose a file...",
          displayedFile: ""
        },
        methods: {
           FileChanged: function(e) {
              let newFile = e.target.value.split('\\').pop();

              if(newFile) {
                 this.selectedFile = newFile;
                 document.querySelector("#fileStyled").classList.remove('emptyFile');
              }

              this.FileUndragged();
           },
           FileDragged: function() {
              document.querySelector("#fileStyled").classList.add('dragOver');
           },
           FileUndragged: function() {
              document.querySelector("#fileStyled").classList.remove('dragOver');
           },

           Process: function() {
              let file = document.querySelector("#file");

              if(!file.files[0])
                 return;

              ProcessFile(file.files[0]).then((parsedData) => {
                 this.logData = parsedData;  
                 this.DisplayCategory({target: {value: Object.keys(this.logData)[0]}});                 
              })
              .catch(()=> {
                 this.logData = {};
                 this.displayedCategory = "";
                 this.displayedData = {};
                 alert("File \'" + this.selectedFile + "\' does not contain valid profiling data.");
              });
           },

           DisplayCategory: function(e) {
              let type = e.target.value;

              for (let [key, value] of Object.entries(this.logData)) {
                 if(key === type) {
                    this.displayedData = value;
                    this.displayedCategory = key;
                    this.displayedFile = this.selectedFile;
                 }
              }
           },

           CopyTable: function() {
              document.getSelection().removeAllRanges(); 

              //create selection range and then add to selection
              let range = new Range();
              range.setStart(document.querySelector("table"),0);
              range.setEnd(document.querySelector("#copyButton"),0);
              document.getSelection().addRange(range);

              document.execCommand("copy");
           },

           ExportTable: function() {
              console.log("woof");

              //structure data into CSV format first
              let lines = "ID,QUEUE_PUSH,PUSH,QUEUE_POP,POP\n";

              for (let [key, value] of Object.entries(this.displayedData)) {
                 lines += key + "," + value.QUEUE_PUSH + "," + value.PUSH + ",";
                 lines += value.QUEUE_POP + "," + value.POP + "\n";
              }

              try {
               let blob = new Blob([lines], {type: "text/csv;charset=utf-8"});
               saveAs(blob, this.displayedFile + "_" + this.displayedCategory + ".csv");

              } catch (e) {
                 alert("Sorry, your browser does not support offline file saving.");
                 //to-do: develop backend capable of online file saving as a fallback (Content-Disposition resp. header)
              }
              
           }
        }
    });
};


