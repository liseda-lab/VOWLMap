/**
 * Contains the logic for the sidebar.
 * @param graph the graph that belongs to these controls
 * @returns {{}}
 */
module.exports = function (graph) {

    var alignmentPane = {},

        languageTools = webvowl.util.languageTools(),
        elementTools = webvowl.util.elementTools(),
        mappingsNames = {},
        storedMappings = [],
        currentId = "",
        currentDegree = 1;


    alignmentPane.setup = function () {
        d3.select("#c_node").select("a").attr("style", "padding-left: 12px;")
        var unfilteredProperties = graph.getUnfilteredData().properties
        resetStoredMappings()
        storeMappings(unfilteredProperties)
        displayMappings(storedMappings);
        d3.select("#mappingsList").on("click", function () {
            d3.select("#source_search").style("display", "none")
            d3.select("#target_search").style("display", "none")

        })

        var returnButton = d3.select("#returnAlignmentPane");
        returnButton.on("click", function () {
            graph.mapMode(true);
            d3.select("#m_node").selectAll(".toggleOption").classed("selected", false);
        })

        var addButton = d3.select("#addMappingButton");
        addButton.on("click", function () {
            graph.createNewMapping(d3.select("#tname").node().value, d3.select("#sname").node().value)
            mapping = graph.getNewMapping()
            if (mapping !== undefined) {
                d3.select("#c_node").classed("hidden", false);
                d3.selectAll(".containerForMapSelection").classed("mapSelected", false);
                d3.select("#containerForAlignment").classed("hidden", true);
                d3.select("#zoomSlider").classed("hidden", false);
                d3.select("#returnAlignmentPane").classed("hidden", false);
                d3.select("#m_node").selectAll(".toggleOption").classed("selected", false);
                d3.select("#degreeOption1").classed("selected", true);

                graph.subgraphGenerator(mapping.id(), 1)

                graph.executeColorExternalsModule();
                graph.lazyRefresh();
                graph.subgraphGenerator(mapping.id(), 1)
                alignmentPane.NodeDistanceDropdown(mapping.id())
                alignmentPane.setup();
                currentDegree = 1;
                currentId = mapping.id()
                d3.select("#tname").node().value = ""
                d3.select("#sname").node().value = ""
            } else {
                d3.select("#containerForAlignment").classed("hidden", false);
            }
        })

        // //Sorting Scores
        sortAsc = d3.select("#sortAsc");
        sortAsc.on("click", function () {
            var orderAscMappings = storedMappings
            d3.select("#mappingsList").selectAll("div").remove();
            orderAscMappings.sort(function (a, b) {
                return parseFloat(b.annotations().score[0].value) - parseFloat(a.annotations().score[0].value);
            });
            displayMappings(orderAscMappings);
        });

        sortDsc = d3.select("#sortDsc")
        sortDsc.on("click", function () {
            var orderDscMappings = storedMappings;
            d3.select("#mappingsList").selectAll("div").remove();
            orderDscMappings.sort(function (a, b) {
                return parseFloat(a.annotations().score[0].value) - parseFloat(b.annotations().score[0].value);
            });
            displayMappings(orderDscMappings);
        });


        // //Sorting Status

        sortCorrect = d3.select("#sortCorrect")
        sortCorrect.on("click", function () {
            var orderCrrMappings = storedMappings;
            d3.select("#mappingsList").selectAll("div").remove();
            orderCrrMappings.sort(function (a, b) {
                if (a.annotations().status[0].value < b.annotations().status[0].value) {
                    return -1;
                }
                if (a.annotations().status[0].value > b.annotations().status[0].value) {
                    return 1;
                }
                return 0;
            });
            displayMappings(orderCrrMappings);
        })

        sortIncorrect = d3.select("#sortIncorrect")
        sortIncorrect.on("click", function () {
            var orderIcrMappings = storedMappings;
            d3.select("#mappingsList").selectAll("div").remove();
            orderIcrMappings.sort(function (a, b) {
                if (a.annotations().status[0].value < b.annotations().status[0].value) {
                    return 1;
                }
                if (a.annotations().status[0].value > b.annotations().status[0].value) {
                    return -1;
                }
                return 0;
            });

            displayMappings(orderIcrMappings);
        })
    };

    alignmentPane.getMapId = function () {
        return currentId;
    }

    alignmentPane.getNodeDegree = function () {
        return currentDegree;
    }

    alignmentPane.closingPane = function () {
        d3.select("#tname").node().value = ""
        d3.select("#sname").node().value = ""
        resetStoredMappings()
        displayMappings(storedMappings);
    }

    function storeMappings(properties) {
        for (var i = 0, l = properties.length; i < l; i++) {
            var property = properties[i];
            if (property.labelForCurrentLanguage() === "mapping") {

                if (Object.values(mappingsNames).includes(property.range().labelForCurrentLanguage() + " = " + property.domain().labelForCurrentLanguage()) === false & Object.values(mappingsNames).includes(property.domain().labelForCurrentLanguage() + " = " + property.range().labelForCurrentLanguage()) === false & property.range().labelForCurrentLanguage() != "Thing" & property.domain().labelForCurrentLanguage() != "Thing") {
                    mappingsNames[property.id()] = property.range().labelForCurrentLanguage() + " = " + property.domain().labelForCurrentLanguage();
                    storedMappings.push(property)
                };
            };
        };
    };

    function resetStoredMappings() {
        mappingsNames = {};
        storedMappings = [];
        d3.select("#mappingsList").selectAll("div").remove();
    }


    function displayMappings(mappings) {
        var mapContainer = d3.select("#mappingsList");
        if (mappings.length == 0) {
            mapContainer.append("div").text("No mappings available").attr("style", "text-align: center; font-size: 1.2em; font-weight: 600; color: #394f5a; ")
        }
        for (var i in mappings) {
            if (mappings[i].annotations()) {
                var mapSelectionContainer = mapContainer.append("div")
                    .attr("id", "mapping" + mappings[i].id())
                    .classed("row", true);

                var mappingContainer = mapSelectionContainer.append("div")
                    .classed("column", true)
                    .attr("id", "column" + mappings[i].id())
                    .classed("containerForMapSelection", true)
                    .text(mappingsNames[mappings[i].id()])

                if (mappings[i].annotations().score) {
                    var scoreContainer = mapSelectionContainer.append("div")
                        .classed("column", true)
                        .text(mappings[i].annotations().score[0].value);

                } else {
                    var scoreContainer = mapSelectionContainer.append("div")
                        .classed("column", true)
                        .text("unknown");
                }

                var statusContainer = mapSelectionContainer.append("div")
                    .classed("column", true)
                    .classed("status", true);

                if (mappings[i].annotations().status) {
                    var validBox = statusContainer.append("span")
                        .classed("checkbox", true)
                        .attr("value", mappings[i].annotations().status[0].value)
                        .attr("id", i);

                } else {
                    var validBox = statusContainer.append("span")
                        .classed("checkbox", true)
                        .attr("value", "unreviewed")
                        .attr("id", i);
                }

                validBox.append("label")
                    .classed("labelForCheckbox", true)
                    .attr("for", "checkbox");

                validBox.append("svg")
                    .attr("id", "checkmark")
                    .attr("width", "15")
                    .attr("height", "20")
                    .attr("viewBox", "0 0 32 32")
                    .attr("stroke", "currentcolor")
                    .append("path")
                    .attr("id", "no-mark")
                    .style("stroke", "#ecf0f1")
                    .style("stroke-linecap", "round")
                    .style("stroke-width", "4");

                if (validBox.attr("value") == "correct") {
                    validBox.classed("correct", true);
                    validBox.select("#no-mark").attr("d", "M2 20 L12 28 30 4").attr("id", "positive-mark");

                } else if (validBox.attr("value") == "incorrect") {
                    validBox.classed("incorrect", true);
                    validBox.select("#no-mark").attr("id", "negative-mark")
                        .attr("d", "M2 30 L30 2 M30 30 L2 2");

                } else if (validBox.attr("value") == "unsure") {
                    validBox.classed("unsure", true);
                    validBox.select("#no-mark").attr("id", "unsure-mark")
                        .attr("d", "");
                    validBox.select(".labelForCheckbox").text("?");

                } else if (validBox.attr("value") == "unreviewed") {
                    validBox.select(".labelForCheckbox").text("")
                }

                validBox.on("click", function () {
                    if (d3.select(this).attr("value") == "unreviewed") {
                        d3.select(this).attr("value", "correct")
                            .classed("correct", true);
                        d3.select(this).select(".labelForCheckbox").text("");
                        d3.select(this).select("#no-mark").attr("d", "M2 20 L12 28 30 4")
                            .attr("id", "positive-mark");
                        graph.changePropertyStatus(mappings[d3.select(this).attr("id")], "correct");
                        graph.changePropertyStatus(mappings[d3.select(this).attr("id")].inverse(), "correct")
                        graph.options().sidebar().updateSelectionInformation(mappings[d3.select(this).attr("id")])

                    } else if (d3.select(this).attr("value") == "correct") {
                        d3.select(this).attr("value", "incorrect")
                            .classed("correct", false)
                            .classed("incorrect", true);
                        d3.select(this).select(".labelForCheckbox").text("");
                        d3.select(this).select("#positive-mark").attr("id", "negative-mark")
                            .attr("d", "M2 30 L30 2 M30 30 L2 2");
                        graph.changePropertyStatus(mappings[d3.select(this).attr("id")], "incorrect");
                        graph.changePropertyStatus(mappings[d3.select(this).attr("id")].inverse(), "incorrect")
                        graph.options().sidebar().updateSelectionInformation(mappings[d3.select(this).attr("id")])

                    } else if (d3.select(this).attr("value") == "incorrect") {
                        d3.select(this).attr("value", "unsure")
                            .classed("incorrect", false)
                            .classed("unsure", true);
                        d3.select(this).select("#negative-mark").attr("id", "unsure-mark")
                            .attr("d", null);
                        d3.select(this).select(".labelForCheckbox").text("?");
                        graph.changePropertyStatus(mappings[d3.select(this).attr("id")], "unsure");
                        graph.changePropertyStatus(mappings[d3.select(this).attr("id")].inverse(), "unsure")
                        graph.options().sidebar().updateSelectionInformation(mappings[d3.select(this).attr("id")])

                    } else {
                        d3.select(this).attr("value", "unreviewed")
                            .classed("unsure", false);
                        d3.select(this).select("#unsure-mark").attr("id", "no-mark")
                            .attr("d", null);
                        d3.select(this).select(".labelForCheckbox").text("");
                        graph.changePropertyStatus(mappings[d3.select(this).attr("id")], "unreviewed");
                        graph.changePropertyStatus(mappings[d3.select(this).attr("id")].inverse(), "unreviewed")
                        graph.options().sidebar().updateSelectionInformation(mappings[d3.select(this).attr("id")])
                    };
                });

                mappingContainer.on("click", function () {
                    var mapId = d3.select(this).attr("id").split("column")[1];
                    currentId = mapId;
                    d3.select("#c_node").classed("hidden", false);
                    d3.selectAll(".containerForMapSelection").classed("mapSelected", false);
                    d3.select(this).classed("mapSelected", true);
                    d3.select("#containerForAlignment").classed("hidden", true);
                    d3.select("#zoomSlider").classed("hidden", false);
                    d3.select("#returnAlignmentPane").classed("hidden", false);
                    graph.subgraphGenerator(mapId, 1);
                    d3.select("#m_node").selectAll(".toggleOption").classed("selected", false);
                    d3.select("#degreeOption1").classed("selected", true);
                    currentDegree = 1;
                    graph.executeColorExternalsModule();
                    graph.executeCompactNotationModule();
                    graph.lazyRefresh();
                    alignmentPane.NodeDistanceDropdown(mapId)
                    graph.subgraphGenerator(mapId, 1);

                });
            };
        };

    };

    alignmentPane.NodeDistanceDropdown = function (mapId) {
        var degreeCheckbox0 = d3.select("#degreeOption0")
        var degreeCheckbox1 = d3.select("#degreeOption1")
        var degreeCheckbox2 = d3.select("#degreeOption2")
        var degreeCheckbox3 = d3.select("#degreeOption3")
        degreeCheckbox0.attr("style", "width:100px; text-align: center;")
        degreeCheckbox1.attr("style", "width:100px; text-align: center;")
        degreeCheckbox2.attr("style", "width:100px; text-align: center;")
        degreeCheckbox3.attr("style", "width:100px; text-align: center;")

        degreeCheckbox0.on("click", function () {
            d3.select("#m_node").selectAll(".toggleOption").classed("selected", false);
            d3.select(this).classed("selected", true);
            graph.executeColorExternalsModule();
            graph.lazyRefresh();
            graph.subgraphGenerator(mapId, 0);
            currentDegree = 0;
        });

        degreeCheckbox1.on("click", function () {
            d3.select("#m_node").selectAll(".toggleOption").classed("selected", false);
            d3.select(this).classed("selected", true);
            graph.executeColorExternalsModule();
            graph.lazyRefresh();
            graph.subgraphGenerator(mapId, 1);
            currentDegree = 1;
        });

        degreeCheckbox2.on("click", function () {
            d3.select("#m_node").selectAll(".toggleOption").classed("selected", false);
            d3.select(this).classed("selected", true);
            graph.executeColorExternalsModule();
            graph.lazyRefresh();
            graph.subgraphGenerator(mapId, 2);
            currentDegree = 2;
        });

        degreeCheckbox3.on("click", function () {
            d3.select("#m_node").selectAll(".toggleOption").classed("selected", false);
            d3.select(this).classed("selected", true);
            graph.executeColorExternalsModule();
            graph.lazyRefresh();
            graph.subgraphGenerator(mapId, 3);
            currentDegree = 3;
        });
    };


    alignmentPane.updateStatusValue = function (id, val) {
        var mapContainer = d3.select("#mapping" + id)
        var checkbox = mapContainer.select(".checkbox")

        if (val == "correct") {
            checkbox.attr("value", "correct")
                .attr("class", null)
                .classed("checkbox", true)
                .classed("correct", true);
            checkbox.select("path").attr("d", "M2 20 L12 28 30 4")
                .attr("id", "positive-mark");
            checkbox.select(".labelForCheckbox").text("");

        } else if (val == "incorrect") {
            checkbox.attr("value", "incorrect")
                .attr("class", null)
                .classed("checkbox", true)
                .classed("incorrect", true);
            checkbox.select("path").attr("id", "negative-mark")
                .attr("d", "M2 30 L30 2 M30 30 L2 2");
            checkbox.select(".labelForCheckbox").text("");

        } else if (val == "unsure") {
            checkbox.attr("value", "unsure")
                .attr("class", null)
                .classed("checkbox", true)
                .classed("unsure", true);
            checkbox.select("path").attr("id", "unsure-mark")
                .attr("d", null);
            checkbox.select(".labelForCheckbox").text("?");

        } else if (val == "unreviewed") {
            checkbox.attr("value", "unreviewed")
                .attr("class", null)
                .classed("checkbox", true);
            checkbox.select("path").attr("id", "no-mark")
                .attr("d", null);
            checkbox.select(".labelForCheckbox").text("");
        }
    }

    return alignmentPane;
};