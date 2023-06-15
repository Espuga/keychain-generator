///<reference path="node_modules/makerjs/index.d.ts" />

var makerjs = require('makerjs') as typeof MakerJs;

class App {

    public fontList: google.fonts.WebfontList;
    private selectFamily: HTMLSelectElement;
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

        this.render(
            this.selectFamily.selectedIndex,
            this.textInput.value,
            size,
            holePositionY,
            holePositionX,
            outlineMargin,
        );
    };

    private updateUrl = () => {
        var urlSearchParams = new URLSearchParams(window.location.search);

        urlSearchParams.set('font-select', this.selectFamily.value);
        urlSearchParams.set('input-text', this.textInput.value);
        urlSearchParams.set('input-size', this.sizeInput.value);
        urlSearchParams.set('holePositionY', this.holePositionY.value);
        urlSearchParams.set('holePositionX', this.holePositionX.value);
        urlSearchParams.set('outlineMargin', this.outlineMargin.value);
        
        const url = window.location.protocol 
                    + "//" + window.location.host 
                    + window.location.pathname 
                    + "?" 
                    + urlSearchParams.toString();

        window.history.replaceState({path: url}, "", url)

    }

    constructor() {

    }

    init() {
        this.selectFamily = this.$('#font-select') as HTMLSelectElement;
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
    }

    readQueryParams() {
        var urlSearchParams = new URLSearchParams(window.location.search);

        var selectFamily = urlSearchParams.get('font-select');
        var textInput = urlSearchParams.get('input-text');
        var sizeInput = urlSearchParams.get('input-size');
        var holePositionY = urlSearchParams.get('holePositionY');
        var holePositionX = urlSearchParams.get('holePositionX');
        var outlineMargin = urlSearchParams.get('outlineMargin');

        if (selectFamily !== "" && selectFamily !== null)
            this.selectFamily.value = selectFamily;
     
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

    }

    handleEvents() {
        this.selectFamily.onchange = this.renderCurrent;
        this.textInput.onchange =
            this.textInput.onkeyup =
            this.sizeInput.onchange =
            this.holePositionY.onchange = 
            this.holePositionX.onchange = 
            this.outlineMargin.onchange = 
            this.renderCurrent
            ;

        // Is triggered on the document whenever a new color is picked
        document.addEventListener("coloris:pick", debounce(this.renderCurrent))
    }

    $(selector: string) {
        return document.querySelector(selector);
    }

    addOption(select: HTMLSelectElement, optionText: string) {
        var option = document.createElement('option');
        option.text = optionText;
        option.value = optionText;
        select.options.add(option);
    }

    getGoogleFonts(apiKey: string) {
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'https://www.googleapis.com/webfonts/v1/webfonts?key=' + apiKey, true);
        xhr.onloadend = () => {
            this.fontList = JSON.parse(xhr.responseText);
            this.fontList.items.forEach(font => this.addOption(this.selectFamily, font.family));

            this.handleEvents();
            this.readQueryParams();
            this.renderCurrent();
        };
        xhr.send();
    }

    callMakerjs(font: opentype.Font, text: string, size: number, 
         holePositionY: number, holePositionX: number,
         outlineMargin: number) {

        // Text model
        var varTextModel = new makerjs.models.Text(font, text, size, true);

        function example(origin: number[]) {
            // All the models
            this.models = {
                textModel: varTextModel,
                outlineTextModel: makerjs.model.outline(varTextModel, outlineMargin),
                outlineRingModel: makerjs.model.move(new makerjs.models.Oval(12, 12), [holePositionX, holePositionY]),
                ringModel: makerjs.model.move(new makerjs.models.Oval(5, 5), [holePositionX+3.4, holePositionY+4])
            };
            this.origin = origin;
        }

        var examples = {
            models: {
                x1: new example([0, 0])
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
        var svg = makerjs.exporter.toSVG(examples, {
            fill: 'none',
            units: 'mm' 
        });
        
        // Show in screen
        this.renderOutlineDiv.innerHTML = svg;
        this.outlineTextarea.value = svg; 

    }

    render(
        fontIndex: number,
        text: string,
        size: number,
        holePositionY: number,
        holePositionX: number,
        outlineMargin: number,
        
    ) {
        
        var f = this.fontList.items[fontIndex];
        var url = f.files['regular'].substring(5); //remove http:
        document.getElementById('input-size-label').innerHTML = size.toString();
        document.getElementById('holePositionYLabel').innerHTML = holePositionY.toString();
        document.getElementById('holePositionXLabel').innerHTML = holePositionX.toString();
        document.getElementById('outlineMarginLabel').innerHTML = outlineMargin.toString();
       
        opentype.load(url, (err, font) => {
            if(text != ""){
                this.callMakerjs(font, text, size, holePositionY, holePositionX, outlineMargin);
            }
        });
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
