///<reference path="node_modules/makerjs/index.d.ts" />


var makerjs = require('makerjs') as typeof MakerJs;

class App {

    public fontList: google.fonts.WebfontList;
    private textInput: HTMLInputElement; 
    private sizeInput: HTMLInputElement;
    private renderDiv: HTMLDivElement;
    private outputTextarea: HTMLTextAreaElement;
    private renderOutlineDiv: HTMLDivElement;
    private outlineTextarea: HTMLTextAreaElement;
    private dummy: HTMLInputElement;
    private holePositionY: HTMLInputElement;
    private holePositionX: HTMLInputElement;
    private outlineMargin: HTMLInputElement;
    private indexFonts: Record<string, number> = {};
    private fontSelector: HTMLInputElement;

    private renderCurrent = () => {
        var size = this.sizeInput.valueAsNumber;
        if (!size) size = parseFloat(this.sizeInput.value);
        if (!size) size = 100;

        var holePositionY = this.holePositionY.valueAsNumber;
        if (!holePositionY) holePositionY = parseFloat(this.holePositionY.value);
        if (!holePositionY) holePositionY = 50;

        var holePositionX = this.holePositionX.valueAsNumber;
        if (!holePositionX) holePositionX = parseFloat(this.holePositionX.value);
        if (!holePositionX) holePositionX = 50;

        var outlineMargin = this.outlineMargin.valueAsNumber;
        if (!outlineMargin) outlineMargin = parseFloat(this.outlineMargin.value);
        if (!outlineMargin) outlineMargin = 50;

        var fontName = this.fontSelector.value;

        this.render(
            this.textInput.value,
            size,
            holePositionY,
            holePositionX,
            outlineMargin,
            fontName

        );
    };

    constructor() {

    }

    init() {
        this.textInput = this.$('#input-text') as HTMLInputElement;
        this.sizeInput = this.$('#input-size') as HTMLInputElement;
        this.renderDiv = this.$('#svg-render') as HTMLDivElement;
        this.outputTextarea = this.$('#output-svg') as HTMLTextAreaElement;
        this.renderOutlineDiv = this.$('#svg-render-outline') as HTMLDivElement;
        this.outlineTextarea = this.$('#outline-svg') as HTMLTextAreaElement;
        this.dummy = this.$('#dummy') as HTMLInputElement;
        this.holePositionY = this.$('#holePositionY') as HTMLInputElement;
        this.holePositionX = this.$('#holePositionX') as HTMLInputElement;
        this.outlineMargin = this.$('#outlineMargin') as HTMLInputElement;
        this.fontSelector = this.$('#fontSelector') as HTMLInputElement;
        this.indexFonts["ABeeZee"] = 0;
        this.indexFonts["Acme"] = 7;
        this.indexFonts["Bree Serif"] = 205;
        this.indexFonts["Oswald"] = 1093;
        this.indexFonts["Old Standard TT"] = 1079;
    }

    readQueryParams() {
        var urlSearchParams = new URLSearchParams(window.location.search);

        var textInput = urlSearchParams.get('input-text');
        var sizeInput = urlSearchParams.get('input-size');
        var holePositionY = urlSearchParams.get('holePositionY');
        var holePositionX = urlSearchParams.get('holePositionX');
        var outlineMargin = urlSearchParams.get('outlineMargin');
        var fontSelector = urlSearchParams.get('fontSelector');
     
        if (textInput !== "" && textInput !== null)
            this.textInput.value = textInput;
        
        if (sizeInput !== "" && sizeInput !== null)
            this.sizeInput.value = sizeInput;

        if (holePositionY !== "" && holePositionY !== null)
            this.holePositionY.value = holePositionY;

        if (holePositionX !== "" && holePositionX !== null)
            this.holePositionX.value = holePositionX;

        if (outlineMargin !== "" && outlineMargin !== null)
            this.outlineMargin.value = outlineMargin;

        if (fontSelector !== "" && fontSelector !== null)
            this.fontSelector.value = fontSelector;

    }

    handleEvents() {
        this.textInput.onchange =
            this.textInput.onkeyup =
            this.sizeInput.onchange =
            this.holePositionY.onchange = 
            this.holePositionX.onchange = 
            this.outlineMargin.onchange = 
            this.fontSelector.onchange = 
            this.renderCurrent
            ;

        // Is triggered on the document whenever a new color is picked
        document.addEventListener("coloris:pick", debounce(this.renderCurrent))
    }

    $(selector: string) {
        return document.querySelector(selector);
    }

    getGoogleFonts(apiKey: string) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'https://www.googleapis.com/webfonts/v1/webfonts?key=' + apiKey, true);
        xhr.onloadend = () => {
            this.fontList = JSON.parse(xhr.responseText);

            this.handleEvents();
            this.readQueryParams();
            this.renderCurrent();
        };
        xhr.send();
    }

    callMakerjs(font: opentype.Font, text: string[], size: number, 
         holePositionY: number, holePositionX: number,
         outlineMargin: number) {

        document.getElementById("svg-render-outline").innerHTML = "";


        function addName(textName:string, position:number[]) {
            var varTextModel = new makerjs.models.Text(font, textName, size, true);

            function example(origin: number[]) {
                // All the models
                this.models = {
                    textModel: varTextModel,
                    /* outlineTextModel: makerjs.model.outline(varTextModel, outlineMargin, 0, false), */
                    outlineTextModel: makerjs.model.expandPaths(varTextModel, outlineMargin),
                    outlineRingModel: makerjs.model.move(new makerjs.models.Oval(12, 12), [holePositionX, holePositionY]),
                    ringModel: makerjs.model.move(new makerjs.models.Oval(5, 5), [holePositionX+3.4, holePositionY+4])
                };
                this.origin = origin;
            }

            var examples = {
                models: {
                    x1: new example(position)
                }
            };

            var x = examples.models;
            // Combine the ringModel with the outlineTextModel to make only 1 outline
            makerjs.model.combine(x.x1.models.outlineTextModel, x.x1.models.outlineRingModel, false, true, false, true);

            // Red outline
            x.x1.models.outlineRingModel.layer = "red";
            x.x1.models.ringModel.layer = "red";
            x.x1.models.outlineTextModel.layer = "red"; 

            // Export to svg
            /* var svg = makerjs.exporter.toSVG(examples, {
                fill: 'none',
                units: 'mm' 
            });
            
            document.getElementById("svg-render-outline").innerHTML += svg;
            document.getElementById("outline-svg").textContent += svg; */
            return examples.models.x1;

        };

        var toExport = {
            models: {

            }
        };
        var i = 1;
        var position:number[] = [0, 0];
        text.forEach((textName) => {
            var propName = "x"+i.toString();
            let prov = addName(textName, position);
            toExport.models[propName] = prov;

            const provModel1 = prov.models.outlineTextModel;
            const modelSize1 = makerjs.measure.modelExtents(provModel1);
            const provModel2 = prov.models.outlineRingModel;
            const modelSize2 = makerjs.measure.modelExtents(provModel2);
            const altura = modelSize1.height+modelSize2.height;

            position = [0, position[1]-altura];
            i++;
        });

        var svg = makerjs.exporter.toSVG(toExport, {
            fill: 'none',
            units: 'mm' 
        });
        
        document.getElementById("svg-render-outline").innerHTML = svg;
        document.getElementById("outline-svg").textContent = svg;


    }

    render(
        text: string,
        size: number,
        holePositionY: number,
        holePositionX: number,
        outlineMargin: number,
        fontName: string
        
    ) {
        var f = this.fontList.items[this.indexFonts[fontName]];
        var url = f.files['regular'].substring(5); //remove http:
        document.getElementById('input-size-label').innerHTML = size.toString();
        document.getElementById('holePositionYLabel').innerHTML = holePositionY.toString();
        document.getElementById('holePositionXLabel').innerHTML = holePositionX.toString();
        document.getElementById('outlineMarginLabel').innerHTML = outlineMargin.toString();

        if(text){
            var textArray = text.split(" ");

            opentype.load(url, (err, font) => {
                this.callMakerjs(font, textArray, size, holePositionY, holePositionX, outlineMargin);
            });
        }   
       
        
    }
}

var app = new App();

window.onload = () => {
    app.init();
    app.getGoogleFonts('AIzaSyAOES8EmKhuJEnsn9kS1XKBpxxp-TgN8Jc');
};

/**
 * Creates and returns a new debounced version of the passed function that will
 * postpone its execution until after wait milliseconds have elapsed since the last time it was invoked.
 * 
 * @param callback 
 * @param wait 
 * @returns 
 */
function debounce(callback, wait = 200) {
    let timeoutId = null;

    return (...args) => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        callback.apply(null, args);
      }, wait);
    };
  }
