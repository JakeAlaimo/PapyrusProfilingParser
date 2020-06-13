let app;

window.onload = () => {

    app = new Vue({
        el: '#app',
        data: {
          logData: {},
          displayedData: {},
          displayedCategory: "",
          categoryNode: undefined,

        },
        methods: {
           Process: function() {
              let file = document.querySelector("#file");

              ProcessFile(file.files[0]).then((parsedData) => {
                 this.logData = parsedData;  
                 this.displayedCategory = Object.keys(this.logData)[0];
                 this.displayedData = this.logData[this.displayedCategory];
              });
           },

           DisplayCategory: function(e) {
              let type = e.target.value;

              for (let [key, value] of Object.entries(this.logData)) {
                 if(key === type) {
                    this.displayedData = value;
                    this.displayedCategory = key;

                    if(this.categoryNode)
                       this.categoryNode.classList.remove("selectedCategory")
                    
                    e.target.classList.add("selectedCategory");
                    this.categoryNode = e.target;
                 }
              }
           },

           CopyTable: function(e) {
              document.getSelection().removeAllRanges(); 

              //create selection range and then add to selection
              let range = new Range();
              range.setStart(document.querySelector("table"),0);
              range.setEnd(document.querySelector("#copyButton"),0);
              document.getSelection().addRange(range);

              document.execCommand("copy");
           }
        }
    });
}


