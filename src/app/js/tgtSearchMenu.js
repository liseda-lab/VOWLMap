/**
 * Contains the search "engine"
 *
 * @param graph the associated webvowl graph
 * @returns {{}}
 */
module.exports = function (graph) {
    var tgtSearchMenu = {},
        alignmentPane = require("./menu/alignmentPane")(graph),
        dictionary = [],
        entryNames = [],
        searchLineEdit,
        mergedStringsList,
        mergedIdList,
        maxEntries = 6,
        dictionaryUpdateRequired = true,
        labelDictionary,
        inputText,
        viewStatusOfSearchEntries = false;

    var results = [];
    var resultID = [];
    var tgt_search = d3.select("#target_search"); // << dropdown container;


    String.prototype.beginsWith = function (string) {
        return (this.indexOf(string) === 0);
    };

    tgtSearchMenu.requestDictionaryUpdate = function () {
        dictionaryUpdateRequired = true;
        // clear possible pre searched entries
        var htmlCollection = tgt_search.node().children;
        var numEntries = htmlCollection.length;

        for (var i = 0; i < numEntries; i++)
            htmlCollection[0].remove();
        searchLineEdit.node().value = "";
    };


    function updateSearchDictionary() {
        labelDictionary = [];
        nodes = graph.getUnfilteredData().nodes
        for (i in nodes) {
            if (nodes[i].attributes().includes("external")) {
                labelDictionary.push(nodes[i])
            }
        }

        dictionaryUpdateRequired = false;
        dictionary = [];
        entryNames = [];
        var idList = [];
        var stringList = [];

        var i;
        for (i = 0; i < labelDictionary.length; i++) {
            var lEntry = labelDictionary[i].labelForCurrentLanguage();

            idList.push(labelDictionary[i].id());
            stringList.push(lEntry);
            // add all equivalents to the search space;
            if (labelDictionary[i].equivalents && labelDictionary[i].equivalents().length > 0) {
                var eqs = labelDictionary[i].equivalentsString();
                var eqsLabels = eqs.split(", ");
                for (var e = 0; e < eqsLabels.length; e++) {
                    idList.push(labelDictionary[i].id());
                    stringList.push(eqsLabels[e]);
                }
            }
        }

        mergedStringsList = [];
        mergedIdList = [];
        var indexInStringList = -1;
        var currentString;
        var currentObjectId;

        for (i = 0; i < stringList.length; i++) {
            if (i === 0) {
                // just add the elements
                mergedStringsList.push(stringList[i]);
                mergedIdList.push([]);
                mergedIdList[0].push(idList[i]);
                continue;
            } else {
                currentString = stringList[i];
                currentObjectId = idList[i];
                indexInStringList = mergedStringsList.indexOf(currentString);
            }
            if (indexInStringList === -1) {
                mergedStringsList.push(stringList[i]);
                mergedIdList.push([]);
                var lastEntry = mergedIdList.length;
                mergedIdList[lastEntry - 1].push(currentObjectId);
            } else {
                mergedIdList[indexInStringList].push(currentObjectId);
            }
        }

        for (i = 0; i < mergedStringsList.length; i++) {
            var aString = mergedStringsList[i];
            var correspondingIdList = mergedIdList[i];
            var idListResult = "[ ";
            for (var j = 0; j < correspondingIdList.length; j++) {
                idListResult = idListResult + correspondingIdList[j].toString();
                idListResult = idListResult + ", ";
            }
            idListResult = idListResult.substring(0, idListResult.length - 2);
            idListResult = idListResult + " ]";

            dictionary.push(aString);
            entryNames.push(aString);
        }
    }

    tgtSearchMenu.setup = function () {
        // clear dictionary;
        dictionary = [];
        searchLineEdit = d3.select("#tname");
        searchLineEdit.on("input", userInput);
        searchLineEdit.on("keydown", hoverSearchEntryView);

    };

    function hoverSearchEntryView() {
        updateSelectionStatusFlags();
        tgtSearchMenu.showSearchEntries();
    }

    tgtSearchMenu.hideSearchEntries = function () {
        tgt_search.style("display", "none");
        viewStatusOfSearchEntries = false;
    };

    tgtSearchMenu.showSearchEntries = function () {
        tgt_search.style("display", "block");
        viewStatusOfSearchEntries = true;
    };

    function updateSelectionStatusFlags() {
        if (searchLineEdit.node().value.length === 0) {
            createSearchEntries();
            return;
        }
        handleAutoCompletion();
    }



    function clearSearchEntries() {
        var htmlCollection = tgt_search.node().children;
        var numEntries = htmlCollection.length;
        for (var i = 0; i < numEntries; i++) {
            htmlCollection[0].remove();
        }
        results = [];
        resultID = [];

    }

    function createSearchEntries() {
        inputText = searchLineEdit.node().value;
        var i;
        var lc_text = inputText.toLowerCase();
        var token;

        for (i = 0; i < dictionary.length; i++) {
            var tokenElement = dictionary[i];
            if (tokenElement === undefined) {
                //@WORKAROUND : nodes with undefined labels are skipped
                //@FIX: these nodes are now not added to the dictionary
                continue;
            }
            token = dictionary[i].toLowerCase();
            if (token.indexOf(lc_text) > -1) {
                results.push(dictionary[i]);
                resultID.push(i);
            }
        }
    }

    function measureTextWidth(text, textStyle) {
        // Set a default value
        if (!textStyle) {
            textStyle = "text";
        }
        var d = d3.select("body")
            .append("div")
            .attr("class", textStyle)
            .attr("id", "width-test") // tag this element to identify it
            .attr("style", "position:absolute; float:left; white-space:nowrap; visibility:hidden;")
            .text(text),
            w = document.getElementById("width-test").offsetWidth;
        d.remove();
        return w;
    }

    function cropText(input) {
        var maxWidth = 250;
        var textStyle = "dbEntry";
        var truncatedText = input;
        var textWidth;
        var ratio;
        var newTruncatedTextLength;
        while (true) {
            textWidth = measureTextWidth(truncatedText, textStyle);
            if (textWidth <= maxWidth) {
                break;
            }

            ratio = textWidth / maxWidth;
            newTruncatedTextLength = Math.floor(truncatedText.length / ratio);

            // detect if nothing changes
            if (truncatedText.length === newTruncatedTextLength) {
                break;
            }

            truncatedText = truncatedText.substring(0, newTruncatedTextLength);
        }

        if (input.length > truncatedText.length) {
            return input.substring(0, truncatedText.length - 6);
        }
        return input;
    }

    function createDropDownElements() {
        var numEntries;
        var copyRes = results;
        var i;
        var token;
        var newResults = [];
        var newResultsIds = [];

        var lc_text = searchLineEdit.node().value.toLowerCase();
        // set the number of shown results to be maxEntries or less;
        numEntries = results.length;
        if (numEntries > maxEntries)
            numEntries = maxEntries;


        for (i = 0; i < numEntries; i++) {
            // search for the best entry
            var indexElement = 1000000;
            var lengthElement = 1000000;
            var bestElement = -1;
            for (var j = 0; j < copyRes.length; j++) {
                token = copyRes[j].toLowerCase();
                var tIe = token.indexOf(lc_text);
                var tLe = token.length;
                if (tIe > -1 && tIe <= indexElement && tLe <= lengthElement) {
                    bestElement = j;
                    indexElement = tIe;
                    lengthElement = tLe;
                }
            }
            newResults.push(copyRes[bestElement]);
            newResultsIds.push(resultID[bestElement]);
            copyRes[bestElement] = "";
        }

        // add the results to the entry menu
        //******************************************
        numEntries = results.length;
        if (numEntries > maxEntries)
            numEntries = maxEntries;


        for (i = 0; i < numEntries; i++) {
            //add results to the dropdown menu
            var testEntry = document.createElement('li');
            var entries = mergedIdList[newResultsIds[i]];
            testEntry.setAttribute('elementID', newResultsIds[i]);
            testEntry.onclick = handleClick(newResultsIds[i]);
            graph.executeColorExternalsModule();
            graph.lazyRefresh();
            testEntry.setAttribute('class', "dbEntry");

            var eLen = entries.length;

            var croppedText = cropText(newResults[i]);


            var el0 = entries[0];
            var allSame = true;
            var nodeMap = graph.getNodeMapForSearch();
            var visible = eLen;
            if (eLen > 1) {
                for (var q = 0; q < eLen; q++) {
                    if (nodeMap[entries[q]] === undefined) {
                        visible--;
                    }
                }
            }

            for (var a = 0; a < eLen; a++) {
                if (el0 !== entries[a]) {
                    allSame = false;
                }
            }
            if (croppedText !== newResults[i]) {
                // append ...(#numElements) if needed
                if (eLen > 1 && allSame === false) {
                    if (eLen !== visible)
                        croppedText += "... (" + visible + "/" + eLen + ")";
                } else {
                    croppedText += "...";
                }
                testEntry.title = newResults[i];
            } else {
                if (eLen > 1 && allSame === false) {
                    if (eLen !== visible)
                        croppedText += " (" + visible + "/" + eLen + ")";
                    else
                        croppedText += " (" + eLen + ")";
                }
            }

            var searchEntryNode = d3.select(testEntry);

            searchEntryNode.node().innerHTML = croppedText;
            tgt_search.node().appendChild(testEntry);
        }
    }


    function handleAutoCompletion() {
        /**  pre condition: autoCompletion has already a valid text**/
        clearSearchEntries();
        createSearchEntries();
        createDropDownElements();
    }

    function userInput() {
        if (dictionaryUpdateRequired) {
            updateSearchDictionary();
        }

        if (dictionary.length === 0) {
            console.log("dictionary is empty");
            return;
        }
        inputText = searchLineEdit.node().value;

        clearSearchEntries();
        if (inputText.length !== 0) {
            createSearchEntries();
            createDropDownElements();
        }
    }

    function handleClick(elementId) {


        return function () {
            var id = elementId;
            var correspondingStr = mergedStringsList[id]
            var correspondingIds = mergedIdList[id];
            // autoComplete the text for the user
            var autoComStr = entryNames[id];
            searchLineEdit.node().value = autoComStr;

            if (autoComStr !== inputText) {
                handleAutoCompletion();
            }

            tgtSearchMenu.hideSearchEntries();
            d3.select("#tname").attr("value", correspondingStr);
            tgt_search.style("display", "none")
        };
    }

    tgtSearchMenu.clearText = function () {
        searchLineEdit.node().value = "";
        var htmlCollection = tgt_search.node().children;
        var numEntries = htmlCollection.length;
        for (var i = 0; i < numEntries; i++) {
            htmlCollection[0].remove();
        }
    };

    return tgtSearchMenu;
};