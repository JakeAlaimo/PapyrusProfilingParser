let app;

window.onload = () => {

    app = new Vue({
        el: '#app',
        data: {
          logData: {},
          displayedData: {},
          displayedCategory: "",

          selectedFile: "Choose a file...",
          tableFile: "",
          file: {},

          dragCounter: 0
        },
        methods: {
           FileChanged: function(e) {
              let newFileName = e.target.value.split('\\').pop();

              if(newFileName) {
                 this.file = e.target.files[0];

                 this.selectedFile = newFileName;
                 document.querySelector("#fileStyled").classList.remove('emptyFile');

                 this.dragCounter = 0;
                 document.querySelector("#fileStyled").classList.remove('dragOver');
              }
           },
           FileDragged: function(e) {
              e.preventDefault();
              this.dragCounter++;
              if(this.dragCounter === 1){
                 document.querySelector("#fileStyled").classList.add('dragOver');
              }
           },
           FileUndragged: function(e) {
              e.preventDefault();
              this.dragCounter--;
              if(this.dragCounter === 0){
                 document.querySelector("#fileStyled").classList.remove('dragOver');
              }
           },
           FileDropped: function(e) {
              e.preventDefault();
              this.file = e.dataTransfer.files[0];
              this.FileChanged({target: {value: this.file.name, files: [this.file]}});
           },

           Process: function() {
              if(!this.file)
                 return;

              ProcessFile(this.file).then((parsedData) => {
                 this.logData = parsedData;  
                 this.DisplayCategory({target: {value: Object.keys(this.logData)[0]}});                 
              })
              .catch(()=> {
                 this.logData = {};
                 this.displayedCategory = "";
                 this.displayedData = {};

                 alert("File \'" + this.selectedFile + "\' has failed to parse.");

                 this.selectedFile = "Choose a file...";
                 document.querySelector("#fileStyled").classList.add('emptyFile');
                 this.file = null;
              });
           },

           DisplayCategory: function(e) {
              let type = e.target.value;

              for (let [key, value] of Object.entries(this.logData)) {
                 if(key === type) {
                    this.displayedData = value;
                    this.displayedCategory = key;
                    this.tableFile = this.selectedFile;
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
              //structure data into CSV format first
              let lines = "ID,QUEUE_PUSH,PUSH,QUEUE_POP,POP\n";

              for (let [key, value] of Object.entries(this.displayedData)) {
                 lines += key + "," + value.QUEUE_PUSH + "," + value.PUSH + ",";
                 lines += value.QUEUE_POP + "," + value.POP + "\n";
              }

              try {
               let blob = new Blob([lines], {type: "text/csv;charset=utf-8"});
               saveAs(blob, this.tableFile + "_" + this.displayedCategory + ".csv");

              } catch (e) {
                 alert("Sorry, your browser does not support offline file saving.");
                 //to-do: develop backend capable of online file saving as a fallback (Content-Disposition resp. header)
              }
              
           }
        }
    });
};


