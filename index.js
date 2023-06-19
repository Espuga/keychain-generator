///<reference path="node_modules/makerjs/index.d.ts" />
var makerjs = require('makerjs');
var App = /** @class */ (function () {
    function App() {
        var _this = this;
        this.indexFonts = {};
        this.renderCurrent = function () {
            var size = _this.sizeInput.valueAsNumber;
            if (!size)
                size = parseFloat(_this.sizeInput.value);
            if (!size)
                size = 100;
            var holePositionY = _this.holePositionY.valueAsNumber;
            if (!holePositionY)
                holePositionY = parseFloat(_this.holePositionY.value);
            if (!holePositionY)
                holePositionY = 50;
            var holePositionX = _this.holePositionX.valueAsNumber;
            if (!holePositionX)
                holePositionX = parseFloat(_this.holePositionX.value);
            if (!holePositionX)
                holePositionX = 50;
            var outlineMargin = _this.outlineMargin.valueAsNumber;
            if (!outlineMargin)
                outlineMargin = parseFloat(_this.outlineMargin.value);
            if (!outlineMargin)
                outlineMargin = 50;
            var fontName = _this.fontSelector.value;
            _this.render(_this.textInput.value, size, holePositionY, holePositionX, outlineMargin, fontName);
        };
    }
    App.prototype.init = function () {
        this.textInput = this.$('#input-text');
        this.sizeInput = this.$('#input-size');
        this.renderDiv = this.$('#svg-render');
        this.outputTextarea = this.$('#output-svg');
        this.renderOutlineDiv = this.$('#svg-render-outline');
        this.outlineTextarea = this.$('#outline-svg');
        this.dummy = this.$('#dummy');
        this.holePositionY = this.$('#holePositionY');
        this.holePositionX = this.$('#holePositionX');
        this.outlineMargin = this.$('#outlineMargin');
        this.fontSelector = this.$('#fontSelector');
        this.indexFonts["ABeeZee"] = 0;
        this.indexFonts["Acme"] = 7;
        this.indexFonts["Bree Serif"] = 205;
        this.indexFonts["Oswald"] = 1093;
        this.indexFonts["Old Standard TT"] = 1079;
    };
    App.prototype.readQueryParams = function () {
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
    };
    App.prototype.handleEvents = function () {
        this.textInput.onchange =
            this.textInput.onkeyup =
                this.sizeInput.onchange =
                    this.holePositionY.onchange =
                        this.holePositionX.onchange =
                            this.outlineMargin.onchange =
                                this.fontSelector.onchange =
                                    this.renderCurrent;
        // Is triggered on the document whenever a new color is picked
        document.addEventListener("coloris:pick", debounce(this.renderCurrent));
    };
    App.prototype.$ = function (selector) {
        return document.querySelector(selector);
    };
    App.prototype.getGoogleFonts = function (apiKey) {
        var _this = this;
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'https://www.googleapis.com/webfonts/v1/webfonts?key=' + apiKey, true);
        xhr.onloadend = function () {
            _this.fontList = JSON.parse(xhr.responseText);
            _this.handleEvents();
            _this.readQueryParams();
            _this.renderCurrent();
        };
        xhr.send();
    };
    App.prototype.callMakerjs = function (font, text, size, holePositionY, holePositionX, outlineMargin) {
        function obtainSvg(text) {
            var svg = "";
            text.forEach(function (textName) {
                // Text model
                var varTextModel = new makerjs.models.Text(font, textName, size, true);
                function example(origin) {
                    // All the models
                    this.models = {
                        textModel: varTextModel,
                        /* outlineTextModel: makerjs.model.outline(varTextModel, outlineMargin, 0, false), */
                        outlineTextModel: makerjs.model.expandPaths(varTextModel, outlineMargin),
                        outlineRingModel: makerjs.model.move(new makerjs.models.Oval(12, 12), [holePositionX, holePositionY]),
                        ringModel: makerjs.model.move(new makerjs.models.Oval(5, 5), [holePositionX + 3.4, holePositionY + 4])
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
                svg += makerjs.exporter.toSVG(examples, {
                    fill: 'none',
                    units: 'mm'
                });
            });
            return svg;
        }
        // Show in screen
        this.renderOutlineDiv.innerHTML = obtainSvg(text);
        this.outlineTextarea.value = obtainSvg(text);
    };
    App.prototype.render = function (text, size, holePositionY, holePositionX, outlineMargin, fontName) {
        var _this = this;
        var f = this.fontList.items[this.indexFonts[fontName]];
        var url = f.files['regular'].substring(5); //remove http:
        document.getElementById('input-size-label').innerHTML = size.toString();
        document.getElementById('holePositionYLabel').innerHTML = holePositionY.toString();
        document.getElementById('holePositionXLabel').innerHTML = holePositionX.toString();
        document.getElementById('outlineMarginLabel').innerHTML = outlineMargin.toString();
        if (text) {
            var textArray = text.split(" ");
            opentype.load(url, function (err, font) {
                _this.callMakerjs(font, textArray, size, holePositionY, holePositionX, outlineMargin);
            });
        }
    };
    return App;
}());
var app = new App();
window.onload = function () {
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
function debounce(callback, wait) {
    if (wait === void 0) { wait = 200; }
    var timeoutId = null;
    return function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        window.clearTimeout(timeoutId);
        timeoutId = window.setTimeout(function () {
            callback.apply(null, args);
        }, wait);
    };
}
