/**
 * Contains the logic for the sidebar.
 * @param graph the graph that belongs to these controls
 * @returns {{}}
 */
 module.exports = function(graph) {

  var sidebar = {},
      alignmentPane = require("./menu/alignmentPane")(graph),
      languageTools = webvowl.util.languageTools(),
      elementTools = webvowl.util.elementTools(),
      // Required for reloading when the language changes
      ontologyInfo,
      visibleSidebar = 1,
      lastSelectedElement,

      detailArea = d3.select("#detailsArea"),
      graphArea = d3.select("#canvasArea"),
      menuArea = d3.select("#swipeBarContainer"),
      collapseButton = d3.select("#sidebarExpandButton");

  /**
   * Setup the menu bar.
   */


  function setupCollapsing() {
      // adapted version of this example: http://www.normansblog.de/simple-jquery-accordion/
      function collapseContainers(containers) {
          containers.classed("hidden", true);
      }

      function expandContainers(containers) {
          containers.classed("hidden", false);
      }

      var triggers = d3.selectAll(".accordion-trigger");

      // Collapse all inactive triggers on startup
      collapseContainers(d3.selectAll(".accordion-trigger:not(.accordion-trigger-active) + div"));

      triggers.on("click", function() {
          var selectedTrigger = d3.select(this),
              activeTriggers = d3.selectAll(".accordion-trigger-active");

          if (selectedTrigger.classed("accordion-trigger-active")) {
              // Collapse the active (which is also the selected) trigger
              collapseContainers(d3.select(selectedTrigger.node().nextElementSibling));
              selectedTrigger.classed("accordion-trigger-active", false);
          } else {
              // Collapse the other trigger ...
              collapseContainers(d3.selectAll(".accordion-trigger-active + div"));
              activeTriggers.classed("accordion-trigger-active", false);
              // ... and expand the selected one
              expandContainers(d3.select(selectedTrigger.node().nextElementSibling));
              selectedTrigger.classed("accordion-trigger-active", true);
          }
      });
  }

  sidebar.clearOntologyInformation = function() {
      d3.select("#newTitleForm").classed("hidden", false);
      d3.select("#about").attr("href", "#").attr("target", "_blank").text("not given");
      d3.select("#version").text("--");
      d3.select("#authors").text("--");
      d3.select("#source_name").text("--");
      d3.select("#target_name").text("--");
      d3.select("#newTitle").node().value = "";

      d3.select("#description").text("No description available.");
      var container = d3.select("#ontology-metadata");
      container.selectAll("*").remove();
      d3.select("#classCount")
          .text("0");
      d3.select("#objectPropertyCount")
          .text("0");
      d3.select("#datatypePropertyCount")
          .text("0");
      d3.select("#mappingsCount")
          .text("0");
      d3.select("#individualCount")
          .text("0");
      d3.select("#nodeCount")
          .text("0");
      d3.select("#edgeCount")
          .text("0");


      // clear selectedNode info
      var isTriggerActive = d3.select("#selection-details-trigger").classed("accordion-trigger-active");
      if (isTriggerActive) {
          // close accordion
          d3.select("#selection-details-trigger").node().click();
      }
      showSelectionAdvice();

  };

  /**
   * Updates the information of the passed ontology.
   * @param data the graph data
   * @param statistics the statistics module
   */
  sidebar.updateOntologyInformation = function(data, statistics) {
      data = data || {};
      ontologyInfo = data.header || {};

      updateGraphInformation();
      displayGraphStatistics(undefined, statistics);
      displayMetadata(ontologyInfo.other);

      // Reset the sidebar selection
      sidebar.updateSelectionInformation(undefined);

      setLanguages(ontologyInfo.languages);
  };

  function setLanguages(languages) {
      languages = languages || [];

      // Put the default and unset label on top of the selection labels
      languages.sort(function(a, b) {
          if (a === webvowl.util.constants().LANG_IRIBASED) {
              return -1;
          } else if (b === webvowl.util.constants().LANG_IRIBASED) {
              return 1;
          }
          if (a === webvowl.util.constants().LANG_UNDEFINED) {
              return -1;
          } else if (b === webvowl.util.constants().LANG_UNDEFINED) {
              return 1;
          }
          return a.localeCompare(b);
      });

      var languageSelection = d3.select("#language")
          .on("change", function() {
              graph.language(d3.event.target.value);
              updateGraphInformation();
              sidebar.updateSelectionInformation(lastSelectedElement);
          });

      languageSelection.selectAll("option").remove();
      languageSelection.selectAll("option")
          .data(languages)
          .enter().append("option")
          .attr("value", function(d) {
              return d;
          })
          .text(function(d) {
              return d;
          });

      if (!trySelectDefaultLanguage(languageSelection, languages, "en")) {
          if (!trySelectDefaultLanguage(languageSelection, languages, webvowl.util.constants().LANG_UNDEFINED)) {
              trySelectDefaultLanguage(languageSelection, languages, webvowl.util.constants().LANG_IRIBASED);
          }
      }
  }

  function trySelectDefaultLanguage(selection, languages, language) {
      var langIndex = languages.indexOf(language);
      if (langIndex >= 0) {
          selection.property("selectedIndex", langIndex);
          graph.language(language);
          return true;
      }

      return false;
  }

  function updateGraphInformation() {
      var title = languageTools.textInLanguage(ontologyInfo.title, graph.language());
      d3.select("#newTitle").attr("value", title);
      d3.select("#about").attr("href", ontologyInfo.iri).attr("target", "_blank").text(ontologyInfo.iri);
      d3.select("#version").text(ontologyInfo.version || "--");
      d3.select("#source_name").text(ontologyInfo.source || "--");
      d3.select("#target_name").text(ontologyInfo.target || "--");

      var authors = ontologyInfo.author;
      if (typeof authors === "string") {
          // Stay compatible with author info as strings after change in january 2015
          d3.select("#authors").text(authors);
      } else if (authors instanceof Array) {
          d3.select("#authors").text(authors.join(", "));
      } else {
          d3.select("#authors").text("--");
      }

      var description = languageTools.textInLanguage(ontologyInfo.description, graph.language());
      d3.select("#description").text(description || "No description available.");
  }

  function displayGraphStatistics(deliveredMetrics, statistics) {
      // Metrics are optional and may be undefined
      deliveredMetrics = deliveredMetrics || {};

      d3.select("#classCount")
          .text(deliveredMetrics.classCount || statistics.classCount());
      d3.select("#objectPropertyCount")
          .text(deliveredMetrics.objectPropertyCount || statistics.objectPropertyCount());
      d3.select("#datatypePropertyCount")
          .text(deliveredMetrics.datatypePropertyCount || statistics.datatypePropertyCount());
      d3.select("#mappingsCount")
          .text(deliveredMetrics.mappingsCount || statistics.mappingsCount());
      d3.select("#individualCount")
          .text(deliveredMetrics.totalIndividualCount || statistics.totalIndividualCount());
      d3.select("#nodeCount")
          .text(statistics.nodeCount());
      d3.select("#edgeCount")
          .text(statistics.edgeCount());
  }

  function displayMetadata(metadata) {
      var container = d3.select("#ontology-metadata");
      container.selectAll("*").remove();
      listAnnotations(container, metadata);

      if (container.selectAll(".annotation").size() <= 0) {
          container.append("p").text("No annotations available.");
      }
  }

  function listAnnotations(container, annotationObject, element = {}) {
      annotationObject = annotationObject || {}; //todo

      // Collect the annotations in an array for simpler processing
      var annotations = [];
      for (var annotation in annotationObject) {
          if (annotationObject.hasOwnProperty(annotation)) {
              if (annotationObject[annotation].length == 1) {
                  annotations.push(annotationObject[annotation][0]);
              } else {
                  for (j = 0; j < annotationObject[annotation].length; j++) {
                      annotations.push(annotationObject[annotation][j]);
                  }
              }
          }
      }

      d3.select("#statusEditForm").remove()
      container.selectAll(".annotation").remove();


      container.selectAll(".annotation").data(annotations).enter().append("p")
          .classed("annotation", true)
          .classed("statisticDetails", true)
          .attr("id", function(d) {
              return d.identifier.toLowerCase()
          })
          .text(function(d) {

              if (d.identifier.toLowerCase().search("synonym") !== -1) {
                  if (d.value.search("http://") === -1) {
                      return d.identifier + ":";
                  }
              } else {
                  return d.identifier + ":";
              }

          })
          .append("span")
          .each(function(d) {
              if (d.value.search("http://") === -1) {
                  appendIriLabel(d3.select(this), d.value, d.type === "iri" ? d.value : undefined);
              }

          });

      // if(d.identifier ==="hasRelatedSynonym"){
      //     if(d.value.search("http://") === -1)
      //                                     return d.identifier + ":";
      // }
      //only for mapping status annotations
      for (j in annotations) {
          if (annotations[j].identifier.toLowerCase() === "status") {

              d3.select("#status").remove()
              var statusContainer = container.append("form")
                  .attr("id", "statusEditForm")
                  .classed("converter-form-Editor", true)

              statusContainer.append("label")
                  .classed("EditLabelForInput", true)
                  .attr("id", "statusEditForm-label")
                  .attr("for", "statusEditor")
                  .text("Status:")
                  .style("font-size", "0.9em")
                  .style("line-height", "1.3")
                  .style("margin", "5px 10px")

              var selectContainer = statusContainer.append("select")
                  .attr("id", "statusEditor")
                  .classed("dropdownMenuClass", true)
                  .style("width", "74%")
                  .style("float", "none");


              // add status selector
              var statusEditorSelection = d3.select("#statusEditor").node();
              var htmlCollection = statusEditorSelection.children;
              var numEntries = htmlCollection.length;
              var i;
              var elementPrototypes = ["unsure", "unreviewed", "correct", "incorrect"];
              for (i = 0; i < numEntries; i++)
                  statusEditorSelection.removeChild(htmlCollection[0]);

              for (i = 0; i < elementPrototypes.length; i++) {
                  var optA = document.createElement('option');
                  optA.innerHTML = elementPrototypes[i];
                  statusEditorSelection.appendChild(optA);
              }

              // set the proper value in the selection
              statusEditorSelection.value = annotations[j].value

              d3.select("#statusEditor").on("change", function() {
                  graph.changePropertyStatus(element, statusEditorSelection.value);
                  graph.changePropertyStatus(element.inverse(), statusEditorSelection.value);
                  sidebar.updateSelectionInformation(element);
                  alignmentPane.updateStatusValue(element.id(), statusEditorSelection.value)
                  if (d3.select("#containerForAlignment").attr("class") == "hidden") {
                      graph.subgraphGenerator(graph.getCurrentId(), graph.getCurrentDegree())
                      sidebar.updateSelectionInformation(element);

                  }
              });

          }
      }
  }


  /**
   * Update the information of the selected node.
   * @param selectedElement the selection or null if nothing is selected
   */
  sidebar.updateSelectionInformation = function(selectedElement) {

      lastSelectedElement = selectedElement;

      // Click event was prevented when dragging
      if (d3.event && d3.event.defaultPrevented) {
          return;
      }

      var isTriggerActive = d3.select("#selection-details-trigger").classed("accordion-trigger-active");
      if (selectedElement && !isTriggerActive) {
          d3.select("#selection-details-trigger").node().click();
      } else if (!selectedElement && isTriggerActive) {
          showSelectionAdvice();
          return;
      }

      if (elementTools.isProperty(selectedElement)) {
          displayPropertyInformation(selectedElement);
      } else if (elementTools.isNode(selectedElement)) {
          displayNodeInformation(selectedElement);
      }
  };

  function showSelectionAdvice() {
      setSelectionInformationVisibility(false, false, true);
  }

  function setSelectionInformationVisibility(showClasses, showProperties, showAdvice) {
      d3.select("#classSelectionInformation").classed("hidden", !showClasses);
      d3.select("#propertySelectionInformation").classed("hidden", !showProperties);
      d3.select("#noSelectionInformation").classed("hidden", !showAdvice);
  }

  function displayPropertyInformation(property) {
      var synonyms = [];
      d3.select(d3.select("#target").node().parentNode).selectAll("p").remove();
      d3.select(d3.select("#source").node().parentNode).selectAll("p").remove();
      showPropertyInformations();
      setIriLabel(d3.select("#propname"), property.labelForCurrentLanguage());
      setIriLabel(d3.select("#propiri"), property.iri());

      if (property.labelForCurrentLanguage() == "mapping") {
          d3.select(d3.select("#typeProp").node().parentNode).classed("hidden", true)
      } else {
          d3.select("#typeProp").text(property.type());

      }

      if (property.inverse() !== undefined & property.labelForCurrentLanguage() !== "mapping") {
          d3.select("#inverse").classed("hidden", false);
          setIriLabel(d3.select("#inverse span"), property.inverse().labelForCurrentLanguage());
      } else {
          d3.select("#inverse").classed("hidden", true);
      }

      var equivalentIriSpan = d3.select("#propEquivUri");
      listNodeArray(equivalentIriSpan, property.equivalents());

      listNodeArray(d3.select("#subproperties"), property.subproperties());
      listNodeArray(d3.select("#superproperties"), property.superproperties());

      if (property.minCardinality() !== undefined) {
          d3.select("#infoCardinality").classed("hidden", true);
          d3.select("#minCardinality").classed("hidden", false);
          d3.select("#minCardinality span").text(property.minCardinality());
          d3.select("#maxCardinality").classed("hidden", false);

          if (property.maxCardinality() !== undefined) {
              d3.select("#maxCardinality span").text(property.maxCardinality());
          } else {
              d3.select("#maxCardinality span").text("*");
          }

      } else if (property.cardinality() !== undefined) {
          d3.select("#minCardinality").classed("hidden", true);
          d3.select("#maxCardinality").classed("hidden", true);
          d3.select("#infoCardinality").classed("hidden", false);
          d3.select("#infoCardinality span").text(property.cardinality());
      } else {
          d3.select("#infoCardinality").classed("hidden", true);
          d3.select("#minCardinality").classed("hidden", true);
          d3.select("#maxCardinality").classed("hidden", true);
      }

      if (property.labelForCurrentLanguage() == "mapping") {
          d3.select(d3.select("#domain").node().parentNode).classed("hidden", true);
          d3.select(d3.select("#range").node().parentNode).classed("hidden", true);
          d3.select(d3.select("#source").node().parentNode).classed("hidden", false);
          d3.select(d3.select("#target").node().parentNode).classed("hidden", false);
          //d3.select("#source").text(property.range().labelForCurrentLanguage())
          //d3.select("#target").text(property.domain().labelForCurrentLanguage())
          setIriLabel(d3.select("#source"), property.range().labelForCurrentLanguage());
          setIriLabel(d3.select("#target"), property.domain().labelForCurrentLanguage());
          d3.select(d3.select("#source").node().parentNode).selectAll(".wikiBox").remove()
          d3.select(d3.select("#source").node().parentNode).append("div").classed("wikiBox", true).append("a")
              .attr("href", "https://en.wikipedia.org/w/index.php?title=Special:Search&search=%22" + property.range().labelForCurrentLanguage() + "%22")
              .attr("title", "https://en.wikipedia.org/w/index.php?title=Special:Search&search=%22" + property.range().labelForCurrentLanguage() + "%22")
              .attr("target", "_blank")
              .text("W")
              .style("color", "black")

          if (property.range().annotations()) {
              var synonyms = [];
              d3.select(d3.select("#source").node().parentNode).selectAll("p").remove();

              for (i in property.range().annotations()) {
                  var name = property.range().annotations()[i][0].identifier
                  var value = property.range().annotations()[i][0].value
                  if (i.toLowerCase().search("synonym") !== -1) {
                      for (j = 0; j < property.range().annotations()[i].length; j++) {
                          if (property.range().annotations()[i][j].value.search("http://") === -1) {
                              synonyms.push(" " + property.range().annotations()[i][j].value)
                          }
                      }
                      if (synonyms.length > 0) {
                          d3.select(d3.select("#source").node().parentNode).append("p").text("Synonyms" + ":" + synonyms)
                      }


                  } else {
                      d3.select(d3.select("#source").node().parentNode).append("p").text(name + ": " + value)
                  }
              }
          }

          d3.select(d3.select("#target").node().parentNode).selectAll(".wikiBox").remove()
          d3.select(d3.select("#target").node().parentNode).append("div").classed("wikiBox", true).append("a")
              .attr("href", "https://en.wikipedia.org/w/index.php?title=Special:Search&search=%22" + property.domain().labelForCurrentLanguage() + "%22")
              .attr("title", "https://en.wikipedia.org/w/index.php?title=Special:Search&search=%22" + property.domain().labelForCurrentLanguage() + "%22")
              .attr("target", "_blank")
              .text("W")
              .style("color", "black")

          if (property.domain().annotations()) {
              var synonyms = [];
              d3.select(d3.select("#target").node().parentNode).selectAll("p").remove()
              for (i in property.domain().annotations()) {
                  var name = property.domain().annotations()[i][0].identifier
                  var value = property.domain().annotations()[i][0].value
                  if (i.toLowerCase().search("synonym") !== -1) {
                      for (j = 0; j < property.domain().annotations()[i].length; j++) {
                          for (j = 0; j < property.domain().annotations()[i].length; j++) {
                              if (property.domain().annotations()[i][j].value.search("http://") === -1) {
                                  synonyms.push(" " + property.domain().annotations()[i][j].value)
                              }
                          }
                      }
                      if (synonyms.length > 0) {
                          d3.select(d3.select("#target").node().parentNode).append("p").text("Synonyms" + ":" + synonyms)
                      }

                  } else {
                      d3.select(d3.select("#target").node().parentNode).append("p").text(name + ": " + value)
                  }
              }
          }


      } else {
          d3.select(d3.select("#source").node().parentNode).classed("hidden", true);
          d3.select(d3.select("#target").node().parentNode).classed("hidden", true);
          d3.select(d3.select("#domain").node().parentNode).classed("hidden", false);
          d3.select(d3.select("#range").node().parentNode).classed("hidden", false);
          //d3.select("#domain").text(property.domain().labelForCurrentLanguage())
          //d3.select("#range").text(property.range().labelForCurrentLanguage())
          setIriLabel(d3.select("#domain"), property.domain().labelForCurrentLanguage());
          setIriLabel(d3.select("#range"), property.range().labelForCurrentLanguage());
      }

      displayAttributes(property.attributes(), d3.select("#propAttributes"));

      setTextAndVisibility(d3.select("#propDescription"), property.descriptionForCurrentLanguage());
      setTextAndVisibility(d3.select("#propComment"), property.commentForCurrentLanguage());

      listAnnotations(d3.select("#propertySelectionInformation"), property.annotations(), property);
  }

  function showPropertyInformations() {
      setSelectionInformationVisibility(false, true, false);
  }

  function setIri(element, iri) {
      var parent = d3.select(element.node().parentNode);

      if (iri) {
          element.selectAll("*").remove();
          tag = element.text(iri)
          parent.classed("hidden", false);
      } else {
          parent.classed("hidden", true);

          tag = element.append("span");

      }
      tag.text(iri);
  }

  function setIriLabel(element, name, iri) {
      var parent = d3.select(element.node().parentNode);

      if (name) {
          element.selectAll("*").remove();
          appendIriLabel(element, name, iri);
          parent.classed("hidden", false);
      } else {
          parent.classed("hidden", true);
      }
  }

  function appendIriLabel(element, name, iri) {
      var tag;

      if (iri) {
          tag = element.append("a")
              .attr("href", iri)
              .attr("title", iri)
              .attr("target", "_blank");
      } else {
          tag = element.append("span");
      }
      tag.text(name);
  }

  function displayAttributes(attributes, textSpan) {
      var spanParent = d3.select(textSpan.node().parentNode);

      if (attributes && attributes.length > 0) {
          // Remove redundant redundant attributes for sidebar
          removeElementFromArray("object", attributes);
          removeElementFromArray("datatype", attributes);
          removeElementFromArray("rdf", attributes);
      }

      if (attributes && attributes.length > 0) {
          textSpan.text(attributes.join(", "));

          spanParent.classed("hidden", false);
      } else {
          spanParent.classed("hidden", true);
      }
  }

  function removeElementFromArray(element, array) {
      var index = array.indexOf(element);
      if (index > -1) {
          array.splice(index, 1);
      }
  }

  function displayNodeInformation(node) {
      showClassInformations();
      setIriLabel(d3.select("#name"), node.labelForCurrentLanguage());
      setIriLabel(d3.select("#iriNode"), node.iri());

      /* Equivalent stuff. */
      var equivalentIriSpan = d3.select("#classEquivUri");
      listNodeArray(equivalentIriSpan, node.equivalents());

      d3.select("#typeNode").text(node.type());
      listNodeArray(d3.select("#individuals"), node.individuals());

      /* Disjoint stuff. */
      var disjointNodes = d3.select("#disjointNodes");
      var disjointNodesParent = d3.select(disjointNodes.node().parentNode);

      if (node.disjointWith() !== undefined) {
          disjointNodes.selectAll("*").remove();

          node.disjointWith().forEach(function(element, index) {
              if (index > 0) {
                  disjointNodes.append("span").text(", ");
              }
              appendIriLabel(disjointNodes, element.labelForCurrentLanguage());
          });

          disjointNodesParent.classed("hidden", false);
      } else {
          disjointNodesParent.classed("hidden", true);
      }

      if (node.attributes().includes("external")) {
          node.attributes().splice(node.attributes().indexOf("external"), 1)
      }
      displayAttributes(node.attributes(), d3.select("#classAttributes"));

      setTextAndVisibility(d3.select("#nodeDescription"), node.descriptionForCurrentLanguage());
      setTextAndVisibility(d3.select("#nodeComment"), node.commentForCurrentLanguage());

      listAnnotations(d3.select("#classSelectionInformation"), node.annotations());
  }

  function showClassInformations() {
      setSelectionInformationVisibility(true, false, false);
  }

  function listNodeArray(textSpan, nodes) {
      var spanParent = d3.select(textSpan.node().parentNode);

      if (nodes && nodes.length) {
          textSpan.selectAll("*").remove();
          nodes.forEach(function(element, index) {
              if (index > 0) {
                  textSpan.append("span").text(", ");
              }
              appendIriLabel(textSpan, element.labelForCurrentLanguage());
          });

          spanParent.classed("hidden", false);
      } else {
          spanParent.classed("hidden", true);
      }
  }

  function setTextAndVisibility(label, value) {
      var parentNode = d3.select(label.node().parentNode);
      var hasValue = !!value;
      if (value) {
          label.text(value);
      }
      parentNode.classed("hidden", !hasValue);
  }

  /** Collapsible Sidebar functions; **/

  sidebar.showSidebar = function(val, init) {
      // make val to bool
      if (val === 1) {
          visibleSidebar = true;
          collapseButton.node().innerHTML = ">";
          detailArea.classed("hidden", true);
          if (init === true) {
              detailArea.classed("hidden", !visibleSidebar);
              graphArea.style("width", "78%");
              graphArea.style("-webkit-animation-name", "none");

              menuArea.style("width", "78%");
              menuArea.style("-webkit-animation-name", "none");

              d3.select("#WarningErrorMessagesContainer").style("width", "78%");
              d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-name", "none");
          } else {
              graphArea.style("width", "78%");
              graphArea.style("-webkit-animation-name", "sbCollapseAnimation");
              graphArea.style("-webkit-animation-duration", "0.5s");

              menuArea.style("width", "78%");
              menuArea.style("-webkit-animation-name", "sbCollapseAnimation");
              menuArea.style("-webkit-animation-duration", "0.5s");

              d3.select("#WarningErrorMessagesContainer").style("width", "78%");
              d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-name", "warn_ExpandRightBarAnimation");
              d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-duration", "0.5s");
          }
          graph.options().width(window.innerWidth - (window.innerWidth * 0.22));
          graph.options().navigationMenu().updateScrollButtonVisibility();
      }
      if (val === 0) {
          visibleSidebar = false;
          detailArea.classed("hidden", true);

          collapseButton.node().innerHTML = "<";
          // adjust the layout
          if (init === true) {
              graphArea.style("width", "100%");
              graphArea.style("-webkit-animation-name", "none");

              menuArea.style("width", "100%");
              menuArea.style("-webkit-animation-name", "none");

              d3.select("#WarningErrorMessagesContainer").style("width", "100%");
              d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-name", "none");
          } else {
              graphArea.style("width", "100%");
              graphArea.style("-webkit-animation-name", "sbExpandAnimation");
              graphArea.style("-webkit-animation-duration", "0.5s");

              menuArea.style("width", "100%");
              menuArea.style("-webkit-animation-name", "sbExpandAnimation");
              menuArea.style("-webkit-animation-duration", "0.5s");

              d3.select("#WarningErrorMessagesContainer").style("width", "100%");
              d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-name", "warn_CollapseRightBarAnimation");
              d3.select("#WarningErrorMessagesContainer").style("-webkit-animation-duration", "0.5s");

          }
          graph.options().width(window.innerWidth);
          graph.updateCanvasContainerSize();
          graph.options().navigationMenu().updateScrollButtonVisibility();
      }
  };

  sidebar.isSidebarVisible = function() {
      return visibleSidebar;
  };

  sidebar.updateSideBarVis = function(init) {
      var vis = sidebar.getSidebarVisibility();
      sidebar.showSidebar(parseInt(vis), init);
  };

  sidebar.getSidebarVisibility = function() {
      var isHidden = detailArea.classed("hidden");
      if (isHidden === false) return String(1);
      if (isHidden === true) return String(0);
  };

  sidebar.initSideBarAnimation = function() {
      graphArea.node().addEventListener("animationend", function() {
          detailArea.classed("hidden", !visibleSidebar);
          graph.updateCanvasContainerSize();
          graph.options().navigationMenu().updateScrollButtonVisibility();
      });
  };

  sidebar.setup = function() {
      setupCollapsing();
      sidebar.initSideBarAnimation();

      collapseButton.on("click", function() {
          graph.options().navigationMenu().hideAllMenus();
          var settingValue = parseInt(sidebar.getSidebarVisibility());
          if (settingValue === 1) sidebar.showSidebar(0);
          else sidebar.showSidebar(1);
      });

      d3.select("#newTitle")
          .on("change", function() {
              graph.options().addOrUpdateGeneralObjectEntry("title", d3.select("#newTitle").node().value);
          })
          .on("keydown", function() {
              d3.event.stopPropagation();
              if (d3.event.keyCode === 13) {
                  d3.event.preventDefault();
                  graph.options().addOrUpdateGeneralObjectEntry("title", d3.select("#newTitle").node().value);
              }
          });
  };


  sidebar.updateShowedInformation = function() {
      var editMode = graph.editorMode();
      d3.select("#generalDetails").classed("hidden", editMode);
      d3.select("#generalDetailsEdit").classed("hidden", !editMode);

      // store the meta information in graph.options()

      // todo: update edit meta info
      graph.options().editSidebar().updateGeneralOntologyInfo();

      // todo: update showed meta info;
      graph.options().sidebar().updateGeneralOntologyInfo();

  };

  sidebar.updateGeneralOntologyInfo = function() {
      // get it from graph.options
      var generalMetaObj = graph.options().getGeneralMetaObject();
      var preferredLanguage = graph && graph.language ? graph.language() : null;
      if (generalMetaObj.hasOwnProperty("title")) {
          // title has language to it -.-
          if (typeof generalMetaObj.title === "object") {
              d3.select("#newTitle").node().value = languageTools.textInLanguage(generalMetaObj.title, preferredLanguage);

          } else {
              d3.select("#newTitle").node().value = languageTools.textInLanguage(generalMetaObj.title, preferredLanguage);

          }

      }
      if (generalMetaObj.hasOwnProperty("iri")) d3.select("#about").node().innerHTML = generalMetaObj.iri;
      if (generalMetaObj.hasOwnProperty("iri")) d3.select("#about").node().href = generalMetaObj.iri;
      if (generalMetaObj.hasOwnProperty("version")) d3.select("#version").node().innerHTML = generalMetaObj.version;
      if (generalMetaObj.hasOwnProperty("author")) d3.select("#authors").node().innerHTML = generalMetaObj.author;
      if (generalMetaObj.hasOwnProperty("source")) d3.select("#source_name").node().innerHTML = generalMetaObj.source;
      if (generalMetaObj.hasOwnProperty("target")) d3.select("#target_name").node().innerHTML = generalMetaObj.target;
      // this could also be an object >>
      if (generalMetaObj.hasOwnProperty("description")) {
          if (typeof generalMetaObj.description === "object") {
              d3.select("#description").node().innerHTML = languageTools.textInLanguage(generalMetaObj.description, preferredLanguage);
          } else {
              d3.select("#description").node().innerHTML = generalMetaObj.description;
          }
      }
  };


  return sidebar;
};