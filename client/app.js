let app;

window.onload = () => {

    app = new Vue({
        el: '#app',
        data: {
          logData: {},
          displayedData: {},
          displayedCategory: "",
          selectedFile: "Choose a file..."
        },
        methods: {
           FileChanged: function(e) {
              this.selectedFile = e.target.value.split('\\').pop();

              if(this.selectedFile) {
                 document.querySelector("#fileStyled").classList.remove('emptyFile');
              } else {
                 this.selectedFile = "Choose a file...";
                 document.querySelector("#fileStyled").classList.add('emptyFile');
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
                 this.displayedCategory = Object.keys(this.logData)[0];
                 this.displayedData = this.logData[this.displayedCategory];
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
           }
        }
    });
};


