var menuButtonClass = "menu-button";
var contextMenuClass = "context-menu";

const graphConsts = {
  selectedClass: "selected",
  mouseOverClass: "mouse-over-node",
  stateGroupClass: "state-group",
  stateTextClass: "state-text",
  stateMainCircle: "state-main-circle",
  stateInvalidConnectionClass: "invalid-connection",
  edgeElClass: "edgeEl",
  edgeGroupClass: "edge-group",
  edgePathClass: "edge-path",
  edgeMarkerClass: "edge-marker-path",
  edgeRectClass: "edge-rect",
  edgeTextClass: "edge-text",
  graphClass: "graph",
  DELETE_KEY: 46,
  //ENTER_KEY: 13,
  nodeRadius: 30,
  nodeStrokeWidth: 2.1,
};

var MIN_TABLE_CELL_WIDTH = "50px";

const tableClasses = {
  myTable: "myTable",
  myCell: "myCell",
  columnHeader: "column-header-cell", //ch
  rowHeader: "row-header-input", //rh
  innerCell: "inner-cell",
  inputCellDiv: "cell-input", //myCellDiv
  inputColumnHeaderDiv: "column-header-input",
  noselectCell: "noselect",
  inactiveCell: "inactive-cell", //tc
  selectedHeaderInput: "selected-header-input",
  incorrectCell: "incorrect-cell", //incorrect
  deleteButton: "delete-button-cell", //deleteButton
  addButton: "add-button-cell", //addButton
  controlButton: "control-button"
}
var activeQuestionDiv;
var SELECTED_ELEM_GROUP;

const graphStateEnum = Object.freeze({"default": 0, "creatingEdge": 1, "namingEdge": 2, "renamingEdge": 3, "renamingState" : 4, "mergingEdge": 5 });
const elementOrigin = Object.freeze({"default": 0, "fromTable": 1, "fromExisting" : 2});

function setFocusedElement() {
  var focused = document.activeElement;
  document.getElementById("focused").innerText = focused.tagName;
}

function initialise(id, type) {
  //questionDiv == wp !
  //var questionDiv = document.getElementById(id); // v ISe uz bude existovat div s id
  if (!window.jQuery_new) {
    jQuery_new = $;
  }

  //document.addEventListener("focus", setFocusedElement, true);

  var questionDiv = document.createElement("div");
  questionDiv.setAttribute("class", "tab-content edit-active"); // delete later | prohlizeciStranke => disabled
  questionDiv.setAttribute("id", id);
  questionDiv.type = type;
  questionDiv.lastEdited = "graph";

  questionDiv.statesData = [];
  questionDiv.edgesData = [];


  //create menu BUTTONS
  
  var graphButton = createButton(graphMenuButton, menuButtonClass);
  graphButton.addEventListener("click", function () { clickGraph(questionDiv) });

  var textButton = createButton(textMenuButton, menuButtonClass);
  textButton.addEventListener("click", function () { clickText(questionDiv) });

  var tableButton = createButton(tableMenuButton, menuButtonClass);
  tableButton.addEventListener("click", function () { clickTable(questionDiv) });

  questionDiv.appendChild(graphButton);
  questionDiv.appendChild(tableButton);
  questionDiv.appendChild(textButton);

  //HINT
  var hintDiv = document.createElement("div");
  hintDiv.setAttribute("class", "hintDiv");

  var hintButton = createButton(hintLabel + " 🡣", "hintButton");
  hintButton.addEventListener("click", function () { clickHintButton(questionDiv); });

  var hintContentDiv = document.createElement("div");
  hintContentDiv.setAttribute("class", "hint-content-div");
  hideElem(hintContentDiv);
  hintDiv.appendChild(hintButton);
  hintDiv.appendChild(hintContentDiv);
  hintDiv.contentDiv = hintContentDiv;
  hintDiv.hintButton = hintButton;

  setupHints(hintContentDiv);

  var graphDiv = document.createElement("div");
  graphDiv.setAttribute("class", "graphDiv");
  graphDiv.k = 1;
  //$( "#resizable" ).resizable();

  //var textArea = document.getElementById("......"); - v ISe
  var textArea = document.createElement("textarea");
  textArea.setAttribute("class", "textArea");

  var tableDiv = document.createElement("div");
  tableDiv.setAttribute("class", "tableDiv");

  questionDiv.appendChild(hintDiv);
  questionDiv.hintDiv = hintDiv;

  questionDiv.appendChild(graphDiv);
  questionDiv.graphDiv = graphDiv;

  questionDiv.appendChild(textArea);
  questionDiv.textArea = textArea;

  questionDiv.appendChild(tableDiv);
  questionDiv.tableDiv = tableDiv;

  document.body.appendChild(questionDiv);

  createStateContextMenu(questionDiv);
  createEdgeContextMenu(questionDiv);
  createAddStateMenu(questionDiv);
  initRenameDiv(questionDiv);

  initGraph(questionDiv);
  initTableDiv(questionDiv);

  questionDiv.graphDiv.lastHeight = questionDiv.graphDiv.offsetHeight;
  questionDiv.graphDiv.lastWidth = questionDiv.graphDiv.offsetWidth;

  //document.getElementsByClassName("form").on("submit", function () { generateTextFromData(questionDiv); });
}

function initToolbox() {
  var toolbox = svg.append("g")
    .attr("class", "toolbox");

  toolbox.append("rect")
    .attr("x", 8)
    .attr("y", 3 + 5)
    .attr("rx", 5)
    .attr("class", "toolbox-rect");

  createToolboxButton(toolbox, 15 + 5, 18 + 5, "icons/zoom-in.png")
    .on("click", zoomIn);
  createToolboxButton(toolbox, 55 + 5, 18 + 5, "icons/reset-zoom.png")
    .on("click", resetZoom);
  createToolboxButton(toolbox, 95 + 5, 18 + 5, "icons/zoom-out.png")
    .on("click", zoomOut);
}

function initGraph(questionDiv) {
  questionDiv.graphDiv.graphState = {
    selectedState: null,
    selectedEdge: null,
    initialState: null,
    mouseOverState: null,
    lastSourceState: null,
    lastTargetState: null,
    mouseDownEdge: null,
    justScaleTransGraph: false,
    lastKeyDown: -1,
    creatingEdge: false,
    renaming: false,
    namingEdge: false,
    selectedText: null,
    currentState: graphStateEnum.default
  };

  var svg = d3
    .select(questionDiv.graphDiv)
    .append("svg")
    .classed("main-svg", true)
    .attr("width", "100%")
    .attr("height", "100%")
    .on("mousemove", svgMousemove)
    .on("click", svgRectClick)
    .on("contextmenu", svgRectContextmenu)
  ;

  questionDiv.graphDiv.svg = svg;
  questionDiv.textNode = svg.append("text");
  questionDiv.textNode.text("aaa");

  var rect = svg
    .append("rect")
    .attr("class", "svg-rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .on("contextmenu", svgRectContextmenu)
    .on("dblclick", svgRectDblclick);

  rect.node().parentGraphDiv = questionDiv.graphDiv;
  rect.node().clickTimer = 0;
  svg.rect = rect;

  svg.call(zoom).on("dblclick.zoom", null);

  var defs = svg.append("svg:defs");

  defs
    .append("svg:marker")
    .attr("id", "end-arrow" + questionDiv.getAttribute("id"))
    .classed("end-arrow", true)
    .attr("viewBox", "0 0 10 10")
    .attr("refY", "5")
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
    .attr('markerUnits', 'strokeWidth')
    .append("svg:path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .attr("fill", "black");


  defs
    .append("svg:marker")
    .attr("id", "temporary-arrow-end" + questionDiv.getAttribute("id"))
    .classed("defs-arrow-end", true)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 7)
    .attr("markerWidth", 3.5)
    .attr("markerHeight", 3.5)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");


  var svgGroup = svg.append("svg:g").classed("graph-svg-group", true);
  svg.svgGroup = svgGroup;

  //"temporary" path when creating edges
  //TODO ID!!
  var temporaryEdgeG = svgGroup.append("g").classed("temp-edge-group", true);
  svgGroup.temporaryEdgeG = temporaryEdgeG;

  temporaryEdgeG
    .append("svg:path")
    .attr("class", graphConsts.edgePathClass + " dragline hidden")
    .attr("d", "M0,0L0,0")
    .style("marker-end", "url(#temporary-arrow-end" + questionDiv.getAttribute("id") + ")");

  //MARKER ???
  temporaryEdgeG
    .append("svg:path")
    .classed(graphConsts.edgeMarkerClass, true)
    .attr("marker-end", "url(#end-arrow" + questionDiv.getAttribute("id") + ")");

  //init-arrow
  var initArrow = svgGroup
    .append("svg:path")
    .attr("class", graphConsts.edgePathClass + " init-arrow")
    .style("marker-end", "url(#temporary-arrow-end" + questionDiv.getAttribute("id") + ")")
    //.call(dragInitArrow)
    ;

  svgGroup.initArrow = initArrow;
  initArrow.node().questionDiv = questionDiv;

  svgGroup.append("svg:g").classed("edges", true);
  svgGroup.append("svg:g").classed("states", true);

  svgGroup.stateGroups = svgGroup
    .select(".states")
    .selectAll("g")
    .data(questionDiv.statesData)
    .enter()
    .append("g")
    .classed(graphConsts.stateGroupClass, true);

  svgGroup.edgeGroups = svgGroup
    .select(".edges")
    .selectAll("g")
    .data(questionDiv.edgesData)
    .enter()
    .append("g")
    .classed(graphConsts.edgeGroupClass, true);

  //on hover rect + full state text
  svgGroup.stateFullnameRect = svgGroup
    .append("rect")
    .attr("rx", 3)
    .attr("height", 25)
    .classed("state-fullname-rect", true)
    .style("visibility", "hidden");

  svgGroup.stateFullnameRect.FullnameText = svgGroup
    .append("text")
    .classed("state-fullname-text", true)
    .style("visibility", "hidden");

  questionDiv.graphDiv.stateIdCounter = 0;
  questionDiv.graphDiv.edgeIdCounter = 0;
  initInitialState(questionDiv);
}

function initTableDiv(questionDiv) {
  createTableControlButtons(questionDiv);
  disableControlButtons(questionDiv.tableDiv);
  createTable(questionDiv);

  //error alert paragraph
  var alertP = document.createElement("p");
  alertP.setAttribute("class", "alert alert-danger");
  hideElem(alertP);
  questionDiv.tableDiv.alertText = alertP;
  questionDiv.tableDiv.appendChild(alertP);
}

function createButton(text, className) {
  var button = document.createElement("button");
  button.innerText = text;
  button.setAttribute("class", className);
  return button;
}

function createTableControlButtons(questionDiv) {
  var button = createButton(tableInitialButtonName, tableClasses.controlButton);
  button.addEventListener("click", () => tableInitialOnClick(questionDiv.tableDiv));
  questionDiv.tableDiv.appendChild(button);
  questionDiv.tableDiv.buttonInit = button;

  var button = createButton(tableAcceptingButtonName, tableClasses.controlButton);
  button.addEventListener("click", () => tableAcceptingOnClick(questionDiv.tableDiv));
  questionDiv.tableDiv.appendChild(button);
  questionDiv.tableDiv.buttonAcc = button;
}

function initInitialState(questionDiv) {
  var initialData = newStateData(questionDiv, null, 100, 100, true, false);
  addState(questionDiv, initialData);
  repositionInitArrow(questionDiv.graphDiv, initialData);
  //TODO - necessary??
  questionDiv.graphDiv.graphState.initialState = initialData;
}

function initRenameDiv(questionDiv) {
  var errorParagraph = document.createElement("p");
  errorParagraph.setAttribute("class", "rename-error-p");
  hideElem(errorParagraph);

  questionDiv.graphDiv.appendChild(errorParagraph);
  questionDiv.graphDiv.renameError = errorParagraph;
}


// ------------------------------------------------------
// GRAPH functions
// ------------------------------------------------------

var zoom = d3.zoom()
  //.extent([[0, 0], [500, 500]])
  //.translateExtent([[0,0],[500, 500]])
  .scaleExtent([0.3, 10])
  .on("start", svgZoomStart)
  .on("zoom", svgZoomed);

var dragEdge = d3
  .drag()
  .on("start", edgeDragstart)
  .on("drag", edgeDragmove)
  .on("end", edgeDragend);


var dragState = d3
  .drag()
  .on("start", stateDragstart)
  .on("drag", stateDragmove)
  .on("end", stateDragend);

var dragInitArrow = d3.drag().on("drag", function(event) {
  var initialState = d3.select(this).node().questionDiv.graphDiv.graphState.initialState;

  var cp = closestPointOnCircle(event.x, event.y, initialState.x, initialState.y);
  d3.select(this)
    .attr("d",
      "M" +
      event.x +
      "," +
      event.y +
      "L" +
      cp.x  +
      "," +
      cp.y
    );

});


document.addEventListener('keyup', windowKeyUp);

function windowKeyUp(event) {
  // SELECTED_ELEM_GROUP is alaways either a stateGroup or an edgeGroup
  // both have .node().graphDiv.questionDiv to which they belong

  if (SELECTED_ELEM_GROUP == null) {
    return;
  }

  var graphDiv = SELECTED_ELEM_GROUP.node().parentGraphDiv;
  var questionDiv = graphDiv.parentNode;
  var data = SELECTED_ELEM_GROUP.datum();

  if (graphDiv.style.display == "none") {
    return;
  }

  if (event.key.toLowerCase() == "escape") {
    if (SELECTED_ELEM_GROUP.classed("activeRenaming")) {
      SELECTED_ELEM_GROUP.select("input").node().blur();
      deselectAll();
    }
  }
  if (event.key.toLowerCase() == "delete") {
    if (SELECTED_ELEM_GROUP.classed("activeRenaming")) return;
   
    if (SELECTED_ELEM_GROUP.node().classList.contains("stateEl")) { // if selected element is state
      deleteState(questionDiv, data);
      graphDiv.graphState.selectedState = null;
    }
    else { // if selected element is edge
      deleteEdge(questionDiv, data);
      graphDiv.graphState.selectedEdge = null;
    }

    graphDiv.graphState.currentState = graphStateEnum.default;
    hideEdge(graphDiv.svg.svgGroup.temporaryEdgeG);
    SELECTED_ELEM_GROUP = null;
    enableAllDragging(graphDiv.svg);
  }
}

function svgRectClick(event) {
  event.preventDefault();
  var cl = event.srcElement.classList;
  var graphDiv;
  //var isState = cl.contains("state-text") || cl.contains("state-main-circle") || cl.contains("accepting-circle");
  var isState = cl.contains("stateEl");
  var isEdge = cl.contains("edgeEl");//cl.contains("edge-rect") || cl.contains("edge-path") || cl.contains("edge-text");
  if (cl.contains("stateInput") || cl.contains("edgeInput")) {
    graphDiv = event.srcElement.parentNode.ownerSVGElement.parentNode;
  }
  else {
    graphDiv = cl.contains("main-svg") ? event.srcElement.parentNode : event.srcElement.ownerSVGElement.parentNode;
  }
  var currentState = graphDiv.graphState.currentState;

  //so we can select edge
  //if (isEdge && (currentState == graphStateEnum.default || currentState == graphStateEnum.namingEdge) ) {
  if (isEdge && currentState == graphStateEnum.default ) {
    return;
  }
  if (isState && currentState == graphStateEnum.creatingEdge) {
    return;
  }

  //when naming new edge and merging edges, we click on the second state, and we dont want to cancel its SELECTION !
  if (currentState == graphStateEnum.namingEdge && isState) {
    return;
  }
  if (currentState == graphStateEnum.mergingEdge && isState) {
    return;
  }
  //console.log("click, deselectingAll");
  deselectAll();

  //TODO: init selection of multiple elements???
}

function svgRectContextmenu(event) {
  event.preventDefault();
  var cl = event.srcElement.classList;
  //TODO
  var graphDiv;
  if (cl.contains("stateInput") || cl.contains("edgeInput")) {
    graphDiv = event.srcElement.parentNode.ownerSVGElement.parentNode;
  }
  else {
    graphDiv = cl.contains("main-svg") ? event.srcElement.parentNode : event.srcElement.ownerSVGElement.parentNode;
  }
  
  var isState = cl.contains("stateEl");
  var isEdge = cl.contains("edge-path") || cl.contains("edge-rect") || cl.contains("edge-text") || cl.contains("foreignObject") || cl.contains("edgeInput");


  if (isState || isEdge) {
    if (graphIsInRenamingState(graphDiv.graphState.currentState)) {
      endRenaming(graphDiv.parentNode);
      return;
    }
    if (graphDiv.graphState.currentState == graphStateEnum.creatingEdge) {
      deselectAll();
      return;
    }
  }
  else if (!isState && !isEdge) {
    deselectAll();
    setElemPosition(graphDiv.addStateContextMenu, event.pageY, event.pageX);
    showElem(graphDiv.addStateContextMenu);
  }
}

function svgRectDblclick(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  var coords = getCoordinates(d3.pointer(event), graphDiv.svg.svgGroup);

  //console.log(d3.select(this).node().clickedTwice);
/*   if (d3.select(this).node().clickedTwice) {

  } */
  //if we clicked on other svg elements do nothing
  if (event.srcElement.tagName == "rect") {
    addState(graphDiv.parentNode, newStateData(graphDiv.parentNode, null, coords.x, coords.y, false, false));
  }
}

function svgMousemove(event, data) {
  var graphDiv = d3.select(this).node().parentNode;

  if (graphDiv.graphState.currentState == graphStateEnum.creatingEdge) {
    initCreatingTransition(event, graphDiv);
  }
}

function initCreatingTransition(event, graphDiv) {
  var temporaryEdgePath = graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgePathClass);
  temporaryEdgePath.classed("hidden", false);

  var targetState = graphDiv.graphState.mouseOverState;
  var sourceState = graphDiv.graphState.lastSourceState;
  var mouseX = d3.pointer(event, graphDiv.svg.svgGroup.node())[0];
  var mouseY = d3.pointer(event, graphDiv.svg.svgGroup.node())[1];

  //if mouse is hovering over some state
  if (graphDiv.graphState.mouseOverState) {
    if (targetState.id == sourceState.id) {
      toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);
      temporaryEdgePath.attr("d", getNewSelfloopDefinition(sourceState.x, sourceState.y, mouseX, mouseY, temporaryEdgePath.node()));
    }
    else { // snap to state
      temporaryEdgePath.attr("d", getStraightPathDefinition(sourceState.x, sourceState.y, targetState.x, targetState.y));
    }
    graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", false);
    repositionMarker(graphDiv.svg.svgGroup.temporaryEdgeG);
  }
  //mouse is not hovering above any state
  else {
    graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", true);
    temporaryEdgePath.attr("d", getStraightPathDefinition(sourceState.x, sourceState.y, mouseX, mouseY));
  }
  disableAllDragging(graphDiv.svg)
}


//TODO
function tryToRenameEdge(questionDiv, edgeData, newSymbols, prompt = null) {
  var div = questionDiv.graphDiv;
  var edgeG = getEdgeGroupById(questionDiv, edgeData.id);
  setRenameErrorPosition(div.graphState.currentState, div.renameError, edgeG, div.k);

  if (prompt != null) {
    showRenameError(prompt, questionDiv);
  }

  newSymbols = replaceEpsilon(removeDuplicates(newSymbols.split(",")));
  if (questionDiv.type == "EFA" && newSymbols == "") {
    newSymbols = "ε";
  }
  
  var input = edgeG.select("input").node();
  var validityCheck = checkEdgeSymbolsValidity(questionDiv, edgeData.id, edgeData.source, newSymbols);
  if (!validityCheck.result) {
    showRenameError(validityCheck.errMessage, questionDiv);
    input.correct = false;
    input.select();
  }
  else {
    input.correct = true;
    renameEdge(questionDiv, edgeData, newSymbols);
    input.blur();
    deselectAll();
  }
}

function tryToRenameState(questionDiv, stateData, newId, prompt = null) {
  if (prompt != null) {
    showRenameError(prompt, questionDiv);
  }
  var input = getStateGroupById(questionDiv, stateData.id).select(".stateInput").node();

  var validityCheck = checkStateNameValidity(questionDiv, stateData, newId);
  if (!validityCheck.result) {
    showRenameError(validityCheck.errMessage, questionDiv);
    input.correct = false;
    input.select();
  }
  else {
    input.correct = true;
    //renameState(questionDiv, stateData, newId);
    input.blur();
    //deselectAll();
  }

}

function checkStateNameValidity(questionDiv, stateData, newId) {
  var err = "";
  var valid = true;

  if (!newId) {
    err = errors.EMPTY_STATE_NAME;
    valid = false;
  }

  else if (!stateIdIsUnique(questionDiv.statesData, stateData, newId)) {
    err = stateNameAlreadyExistsPrompt;
    valid = false;
  }

  else if (incorrectStateSyntax(newId)) {
    err = errors.INCORRECT_STATE_SYNTAX;
    valid = false;
  }

  return {
    result : valid,
    errMessage : err
  };
}

function checkEdgeSymbolsValidity(questionDiv, edgeId, sourceStateData, symbols) {
  var err = "", valid = true;

  //TODO
  var correctSyntax = questionDiv.type == "EFA" ? "Očekávané řetězce znaků z {a-z,A-Z,0-9,\\e,ε} oddělené čárkami." : "Očekávané řetězce znaků z {a-z,A-Z,0-9} oddělené čárkami." ;

  if (symbols == null || symbols == "") {
    err = errors.EMPTY_TRANSITION;
    valid = false;
  }
  else if (incorrectGraphTransitionsSyntax(questionDiv.type, symbols)) {
    err = INVALID_SYNTAX_ERROR + "<br>" + correctSyntax;
    valid = false;
  }
  else if (questionDiv.type == "DFA") {
    if (edgeId != null && transitionWithSymbolExists(questionDiv, edgeId, sourceStateData.id, symbols) 
      || edgeId == null && transitionWithSymbolExists(questionDiv, null, sourceStateData.id, symbols)) {
        err = DFA_invalid_transition;
        valid = false;
    }
  }


  /*
  if (newSymbols.length > 300) {
    err = "Prekrocena maximalna dlzka symbolov prechodu (300)!";
    valid = false;
  }*/

  return { result: valid, errMessage : err };
}






function svgZoomStart(e) {
  //TODO
  //deselectAll(except this!!!!);
}
// zoom {& drag svg}
function svgZoomed(e) {
  //TODO srcElement can be also state/edge etc, so fix getting graphDiv from that
 var rect = e.sourceEvent.srcElement;
 var graphDiv = rect.parentGraphDiv;
 graphDiv.svg.svgGroup.attr("transform", e.transform);
 graphDiv.k = e.transform.k;
 //console.log(e.transform);
 //transform = {k:1, x:0, y:0}
/*  console.log(e.s1ourceEvent.srcElement);
 console.log(e.transform); */
}

function resetZoom() {
  svg.transition().call(zoom.scaleTo, 1);
}

function zoomIn() {
  svg.transition().call(zoom.scaleBy, 1.3);
}

function zoomOut() {
  svg.transition().call(zoom.scaleBy, 0.7);
}

//dragging
function stateDragstart(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  deselectAll(graphDiv.parentNode.getAttribute("id"));
  graphDiv.svg.svgGroup.temporaryEdgeG.classed(graphConsts.selectedClass, false);
  var node = d3.select(this).node();

  node.clickTimer = event.sourceEvent.timeStamp;
  node.startX = event.x;
  node.startY = event.y;

  hideAllContextMenus(graphDiv.parentNode);

  if (graphIsInRenamingState(graphDiv.graphState.currentState)) {
    endRenaming(graphDiv.parentNode);
    hideEdge(graphDiv.svg.svgGroup.temporaryEdgeG);
  }

  toggleStateSelection(d3.select(this), graphDiv, d);
}

function stateDragmove(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);

  d.x = event.x;
  d.y = event.y;
  d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");

  if (d.initial) {
    repositionInitArrow(graphDiv, d);
  }

  updateOutgoingEdges(graphDiv.svg.svgGroup.edgeGroups, d);
  updateIncommingEdges(graphDiv.svg.svgGroup.edgeGroups, d);
}

function stateDragend(event, d) {
  event.stopPropagation;

  var groupNode = d3.select(this).node();
  var graphDiv = groupNode.parentGraphDiv;
  var qD = graphDiv.parentNode;
  var graphState = graphDiv.graphState;
  var distance = distBetween(groupNode.startX, groupNode.startY, event.x, event.y);

  var diff = event.sourceEvent.timeStamp - groupNode.clickTimer;

  if (graphState.currentState == graphStateEnum.creatingEdge && diff < 400 && distance < 2) {
    if (graphState.lastSourceState && graphState.mouseOverState) {
      var edge = getEdgeDataByStates(qD, graphState.lastSourceState.id, graphState.mouseOverState.id);
      graphState.lastTargetState = graphState.mouseOverState;

      hideEdge(graphDiv.svg.svgGroup.temporaryEdgeG);
      if (edge != null) { //edge already exists between the two states
        toggleEdgeSelection(getEdgeGroupById(qD, edge.id), graphDiv);
        initRenaming(qD, graphStateEnum.mergingEdge, edge.symbols, edgeAlreadyExistsAlert);
      }
      else { //adding new edge
        removeSelectionFromState(graphDiv);
        var data = newEdgeData(qD, graphState.lastSourceState.id, graphState.lastTargetState.id, "");
        var edge = addEdge(qD, data);
        toggleEdgeSelection(edge, graphDiv);
        initRenaming(qD, graphStateEnum.namingEdge, "");
      }
    }
  }
  else if (graphState.currentState != graphStateEnum.creatingEdge && diff > 1 && distance < 3) { //starting to create an edge
    graphState.lastSourceState = d;
    graphState.currentState = graphStateEnum.creatingEdge;
    initCreatingTransition(event, graphDiv);
  }
  generateTextFromData(graphDiv.parentNode);
}

function updateOutgoingEdges(edgeGroups, stateData) {
  edgeGroups
    .filter(function (edgeData) {
      return edgeData.source.id === stateData.id;
    })
    .each(function (edgeData, index) {
      var tx, ty, newDef;
      if (edgeData.source == edgeData.target) {
        var def = "M " + stateData.x + " " + stateData.y + " C "
          + cubicControlPoints(stateData.x, stateData.y, edgeData.angle)
          + " " + stateData.x + " " + stateData.y;
        var s = def.split(" ");
        var tx = (+s[4] + +s[6] + +s[1]) / 3;
        var ty = (+s[5] + +s[7] + +s[2]) / 3;
        newDef = def;
      }
      else {
        var str = d3.select(this).select("." + graphConsts.edgePathClass).attr("d").split(" ");
        str[1] = stateData.x;
        str[2] = stateData.y;

        str[4] = ((+str[1] + (+str[6])) / 2) + edgeData.dx;
        str[5] = ((+str[2] + (+str[7])) / 2) + edgeData.dy;

        tx = (+str[4] + (+((+str[1] + (+str[6])) / 2))) / 2;
        ty = (+str[5] + (+((+str[2] + (+str[7])) / 2))) / 2;

        newDef = str.join(" ");
      }
      d3.select(this).select("." + graphConsts.edgePathClass).attr("d", newDef);
      repositionEdgeInput(d3.select(this).select("foreignObject"), tx, ty);
      repositionMarker(d3.select(this));
    });

}

function updateIncommingEdges(edgeGroups, stateData) {
  edgeGroups
    .filter(function (edgeData) {
      return edgeData.target.id === stateData.id && edgeData.source != edgeData.target;
    })
    .each(function (edgeData, index) {
      var str = d3.select(this).select("." + graphConsts.edgePathClass).attr("d").split(" ");

      str[6] = stateData.x;
      str[7] = stateData.y;

      str[4] = ((+str[1] + (+str[6])) / 2) + edgeData.dx;
      str[5] = ((+str[2] + (+str[7])) / 2) + edgeData.dy;

      var tx = (+str[4] + (+((+str[1] + (+str[6])) / 2))) / 2;
      var ty = (+str[5] + (+((+str[2] + (+str[7])) / 2))) / 2;

      d3.select(this).select("." + graphConsts.edgePathClass).attr("d", str.join(" "));

      repositionEdgeInput(d3.select(this).select("foreignObject"), tx, ty);
      repositionMarker(d3.select(this));
    });

}

function edgeDragstart(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  deselectAll(graphDiv.parentNode.getAttribute("id"));

  if (graphIsInRenamingState(graphDiv.graphState.currentState) && !d3.select(this).classed("activeRenaming")) {
    endRenaming(graphDiv.parentNode);
  }

  toggleEdgeSelection(d3.select(this), graphDiv); 
  toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);

  hideAllContextMenus(graphDiv.parentNode);
  hideElem(graphDiv.renameError);


}

function edgeDragmove(event, d) {
  //console.log("edge dragmove");
  var edgeG = d3.select(this);
  //var graphDiv = edgeG.node().parentGraphDiv;
  var oldPathDefinition = edgeG.select("." + graphConsts.edgePathClass).attr("d");

  edgeG
    .select("." + graphConsts.edgePathClass)
    .attr("d", repositionPathCurve(d, event.x, event.y, oldPathDefinition));

  var coords = getEdgeInputPosition(edgeG.select("." + graphConsts.edgePathClass).attr("d"), d.source == d.target);

  repositionEdgeInput(edgeG.select("foreignObject"), coords.tx, coords.ty);
  repositionMarker(edgeG);
}

function edgeDragend(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  generateTextFromData(graphDiv.parentNode);
}

function repositionPathCurve(edgeData, mouseX, mouseY, oldPathDefinition) {
  if (edgeData.source.id == edgeData.target.id) {
    var str = oldPathDefinition.split(" ");
    return getNewSelfloopDefinition(str[1], str[2], mouseX, mouseY, edgeData);
  }
  else {
    return getNewPathDefinition(edgeData.id, mouseX, mouseY, oldPathDefinition, edgeData);
  }
}

function getNewPathDefinition(edgeID, mouseX, mouseY, pathD, edgeData) {
  var str = pathD.split(" ");

  var dx = 2 * (mouseX - ((+str[1] + (+str[6])) / 2));
  var dy = 2 * (mouseY - ((+str[2] + (+str[7])) / 2));
  str[4] = ((+str[1] + (+str[6])) / 2) + dx;
  str[5] = ((+str[2] + (+str[7])) / 2) + dy;

  edgeData.dx = dx;
  edgeData.dy = dy;
  /*
  edgesData
    .filter(function (d) {
      return d.id == edgeID;
    })
    .map(function (d) {
      d.dx = dx;
      d.dy = dy;
    });*/

  return str.join(" ");
}

function getNewSelfloopDefinition(x1, y1, x2, y2, edge) {
  if (edge != null) {
    edge.angle = calculateAngle(x1, y1, x2, y2);
    return "M " + x1 + " " + y1 + " C "
      + cubicControlPoints(x1, y1, edge.angle)
      + " " + x1 + " " + y1;
  }
  return calculateSelfloop(x1, y1, calculateAngle(x1, y1, x2, y2));
}

function calculateAngle(x1, y1, x2, y2) {
  var distance = distBetween(x1, y1, x2, y2), angle;
  if (distance == 0) {
    dist = 0.001;
  }

  if (x1 == x2 && y1 == y2) {
    angle = 1.57;
  } else {
    angle = Math.acos((x2 - x1) / distance);
  }

  if (y1 < y2) {
    angle = -angle;
  }
  return angle;
}

function getStraightPathDefinition(x1, y1, x2, y2) {
  return "M " + x1 + " " + y1 + " Q " +
    midpoint(x1, x2) + " " +
    midpoint(y1, y2) + " " +
    x2 + " " + y2;
}

function updateEdgeInputPosition(questionDiv, edgesSelection) {
  edgesSelection
    .each(function (ed) {
      //var rectS = d3.select(this).select("rect");
      //var textS = d3.select(this).select("text");
      var fo = d3.select(this).select("foreignObject");
      //var input = fo.select("input").node();
      
      //rectS.attr("width", calculateEdgeRectWidth(questionDiv, textS.text()));

      var dAttr = d3.select(this).select("." + graphConsts.edgePathClass).attr("d");
      var coords = getEdgeInputPosition(dAttr, ed.source == ed.target);

      repositionEdgeInput(fo, coords.tx, coords.ty);
      //repositionEdgeRect(rectS, coords.tx, coords.ty);
      //repositionEdgeText(textS, coords.tx, coords.ty + 5);
    });
}

function repositionEdgeInput(foreignObject, x, y){
  var input = foreignObject.select("input");
  if (x != -1) {
    var w = parseInt((input.node().style.width).substring(0, input.node().style.width.length - 2));
    foreignObject.attr("x", x - (w/2));
    input.attr("x", x - (w/2));
  }
  if (y != -1) {
    var h = 27;
    foreignObject.attr("y", y - (h/2));
    input.attr("y", y - (h/2));
  }
}

// STATE
function addState(questionDiv, stateData) {
  if (stateData.isNew) {
    stateData = findStatePlacement(questionDiv, stateData);
  }
  questionDiv.statesData.push(stateData);

  questionDiv.graphDiv.svg.svgGroup.stateGroups.data(questionDiv.statesData, function (d) {
    return d.id;
  });

  var newState = questionDiv.graphDiv.svg.svgGroup.stateGroups
    .data(questionDiv.statesData).enter().append("g");

  newState.node().parentGraphDiv = questionDiv.graphDiv;
  newState.node().clickTimer = 0;
  newState.node().clickedOnce = false;
  //newState.node().InvalidConnection = false;

  
  if (!jeProhlizeciStranka()) {
    addStateEvents(newState, questionDiv.graphDiv);
  }
  addStateSvg(newState, questionDiv.graphDiv);
  updateStateGroups(questionDiv.graphDiv.svg.svgGroup);
  generateTextFromData(questionDiv);
}

function addStateEvents(state, graphDiv) {
  state
    .call(dragState)
    //.on("dblclick", function (event, d) { toggleAcceptingState(d, d3.select(this)); })
    .on("mouseover", function (event, d) {
      graphDiv.graphState.mouseOverState = d;
      d3.select(this).classed(graphConsts.mouseOverClass, true);

      if (d.id != d3.select(this).select("input").node().value) {
        showFullname(graphDiv.svg.svgGroup.stateFullnameRect, d);
      }
    })
    .on("mouseout", function () {
      toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);
      graphDiv.graphState.mouseOverState = null;
      d3.select(this).classed(graphConsts.mouseOverClass, false);
    })
    .on("contextmenu", function (event, data) {
      event.preventDefault();

      if (graphIsInRenamingState(graphDiv.graphState.currentState)) {
        endRenaming(graphDiv.parentNode);
        return;
      }
      
      deselectAll(graphDiv.parentNode.getAttribute("id"));
      hideElem(graphDiv.edgeContextMenuDiv);
      hideElem(graphDiv.addStateContextMenu);
      toggleStateSelection(d3.select(this), graphDiv, data);
      setElemPosition(graphDiv.stateContextMenuDiv, event.pageY, event.pageX);

      if (data.initial) {
        hideElem(graphDiv.initialButton);
      }
      else {
        showElem(graphDiv.initialButton, true);
      }
      if (data.accepting) {
        graphDiv.acceptingButton.innerText = setStateAsNonAcceptingText;
      }
      else {
        graphDiv.acceptingButton.innerText = setStateAsAcceptingText;
      }
      showElem(graphDiv.stateContextMenuDiv);
    })
    //.on("click", function (event) { stateClick(graphDiv.parentNode.getAttribute("id")); } )
    ;
}

function addStateSvg(newState, graphDiv) {
  newState
    .classed(graphConsts.stateGroupClass, true)
    .classed("stateEl", true)
    .attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  newState
    .append("circle")
    .classed(graphConsts.stateMainCircle, true)
    .classed("stateEl", true)
    .attr("r", graphConsts.nodeRadius)
    .attr("stroke-width", graphConsts.nodeStrokeWidth);

  var input = newState
    .append("foreignObject")
    .classed("foreignObject", true)
    .classed("stateEl", true)
    .attr("x", -25)
    .attr("y", -12)
    .attr("height", 23)
    .attr("width", 50)
    .append("xhtml:input")
    .classed("stateInput", true)
    .classed("stateEl", true)
    .on("keyup", function(e, d) {
      
      if (d3.select(this).node().getAttribute("readonly") == "readonly") return;
      var validSymbols = checkStateNameValidity(graphDiv.parentNode, d, d3.select(this).node().value);
      d3.select(this).node().correct = validSymbols.result;
      if (e.keyCode == 13 && graphDiv.graphState.currentState == graphStateEnum.renamingState) {
        tryToRenameState(graphDiv.parentNode, graphDiv.graphState.selectedState, d3.select(this).node().value);
      }
    })
    .on("blur", function(e, d){
      getStateGroupById(graphDiv.parentNode, d.id).classed("activeRenaming", false);
      console.log("blurring state");
      var input = d3.select(this).node();
      if (input.getAttribute("readonly") == "readonly") return;
      if (input.correct == false) {
        if (graphDiv.graphState.currentState == graphStateEnum.renamingState) {
          setStateInputValue(input, d.id);
        }
      }
      else if (input.value != input.realValue) {
        renameState(graphDiv.parentNode, d, input.value);
      }
      disableInput(input);
      hideElem(graphDiv.renameError);
    });
  

  disableInput(input.node());
  input.node().correct = false;
  if (origin == elementOrigin.fromExisting || origin == elementOrigin.fromTable) {
    input.node().correct = true;
  }
  input.node().realValue = newState.datum().id;
  setStateInputValue(input.node(), newState.datum().id);
}

function stateClick(questionDivId) {
  deselectAll(questionDivId);
  //console.log("stateClick");
  //event.stopPropagation();
}

function toggleStateSelection(stateGroup, graphDiv, d) {
  removeSelectionFromEdge(graphDiv);

  if (graphDiv.graphState.selectedState != d) { // another state was selected
    removeSelectionFromState(graphDiv);
    graphDiv.graphState.selectedState = d;
    SELECTED_ELEM_GROUP = stateGroup;
    stateGroup.classed(graphConsts.selectedClass, true);
  }
}

function toggleAcceptingState(stateData, stateG) {
  if (stateData.accepting) {
    stateG.select(".accepting-circle").remove();
  } else {
    stateG
      .append("circle")
      .attr("class", "accepting-circle")
      .classed("stateEl", true)
      .attr("r", graphConsts.nodeRadius - 4)
      .attr("stroke", "black")
      .attr("stroke-width", graphConsts.nodeStrokeWidth)
      .attr("fill", "transparent");

      //TODO parameter namiesto stringu
    stateG.select(".foreignObject").raise();
  }
  stateData.accepting = !stateData.accepting;
}

function setNewStateAsInitial(questionDiv, stateData) {
  setInitStateAsNotInitial(questionDiv);

  questionDiv.statesData
    .filter(function (d) {
      return d.id == stateData.id;
    })
    .map(function (d) {
      d.initial = true;
    });
  
  questionDiv.graphDiv.graphState.initialState = stateData;
  

  repositionInitArrow(questionDiv.graphDiv, stateData);
}

function setInitStateAsNotInitial(questionDiv) {
  questionDiv.statesData
    .filter(function (d) {
      return d.initial == true;
    })
    .map(function (d) {
      d.initial = false;
    });

  hideInitArrow(questionDiv.graphDiv);
}

function renameState(questionDiv, stateData, newTitle) {
  questionDiv.statesData
    .filter(function (d) { return d.id == stateData.id; })
    .map(function (d) { d.id = newTitle; });

  setStateInputValue(getStateGroupById(questionDiv, stateData.id).select(".stateInput").node(), newTitle);
}

function deleteState(questionDiv, stateData) {
  if (stateData.initial == true) {
    hideInitArrow(questionDiv.graphDiv);
  }
  deleteStateSvg(questionDiv.graphDiv.svg.svgGroup, stateData);
  deleteStateEdges(questionDiv, stateData);
  deleteStateData(questionDiv, stateData);
  updateStateGroups(questionDiv.graphDiv.svg.svgGroup);
}

function deleteStateData(questionDiv, stateData) {
  questionDiv.statesData.splice(questionDiv.statesData.indexOf(stateData), 1);
}

function deleteStateSvg(svgGroup, stateData) {
  svgGroup
    .select(".states")
    .selectAll("g")
    .filter(function (d) {
      return d.id == stateData.id;
    })
    .remove();
}

function deleteStateEdges(questionDiv, stateData) {
  //delete edges' SVG
  questionDiv.graphDiv.svg.svgGroup.edgeGroups
    .filter(function (ed) {
      return ed.source == stateData || ed.target == stateData;
    })
    .remove();

  //delete data
  questionDiv.edgesData
    .filter(function (ed) {
      return ed.source == stateData || ed.target == stateData;
    })
    .map(function (ed) {
      questionDiv.edgesData.splice(questionDiv.edgesData.indexOf(ed), 1);
    });

  updateEdgeGroups(questionDiv.graphDiv.svg.svgGroup);
}

// EDGE
function addEdge(questionDiv, edgeData, origin = elementOrigin.default) {
  var temporaryEdgePath = questionDiv.graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgePathClass);

  if (edgeData.source == edgeData.target && origin == elementOrigin.default) {
    edgeData.angle = temporaryEdgePath.node().angle;
  }
  questionDiv.edgesData.push(edgeData);

  var newEdge = questionDiv.graphDiv.svg.svgGroup.edgeGroups
    .data(questionDiv.edgesData).enter().append("g").classed(graphConsts.edgeGroupClass, true);

  newEdge.node().parentGraphDiv = questionDiv.graphDiv;

  if (!jeProhlizeciStranka()) {
    addEdgeEvents(questionDiv, newEdge, origin);
  }
  addEdgeSvg(questionDiv, newEdge, origin, temporaryEdgePath.attr("d"));

  repositionMarker(newEdge);
  updateEdgeInputPosition(questionDiv, newEdge);
  updateEdgeGroups(questionDiv.graphDiv.svg.svgGroup);

  generateTextFromData(questionDiv);
  return newEdge;
}

function addEdgeEvents(questionDiv, edge, origin) {
  edge
    .call(dragEdge)
    .on("mouseover", function () {
      d3.select(this).classed(graphConsts.mouseOverClass, true);
    })
    .on("mouseout", function () {
      d3.select(this).classed(graphConsts.mouseOverClass, false);
    })
    .on("contextmenu", function (event, d) {
      event.preventDefault();

      if (questionDiv.graphDiv.graphState.currentState == graphStateEnum.renamingEdge) {
        endRenaming(questionDiv);
        return;
      }
      
      deselectAll(questionDiv.getAttribute("id"));
      //hideElem(questionDiv.graphDiv.stateContextMenuDiv);
      hideAllContextMenus(questionDiv);
      toggleEdgeSelection(d3.select(this), questionDiv.graphDiv);
      setElemPosition(questionDiv.graphDiv.edgeContextMenuDiv, event.pageY, event.pageX);
      showElem(questionDiv.graphDiv.edgeContextMenuDiv);
    });    
}

function addEdgeSvg(questionDiv, newEdge, origin, tempEdgeDef) {
  newEdge
    .append("svg:path")
    .classed(graphConsts.edgePathClass, true)
    .attr("d", function (d) {
      if (origin == elementOrigin.fromExisting) {
        return d.source != d.target ? reverseCalculateEdge(d.source, d.target, d.dx, d.dy) : calculateSelfloop(d.source.x, d.source.y, d.angle);
      }
      if (d.source == d.target) {
        return origin == elementOrigin.fromTable ? getNewSelfloopDefinition(d.source.x, d.source.y, d.target.x, d.target.y,) : tempEdgeDef;
      }
      return getStraightPathDefinition(d.source.x, d.source.y, d.target.x, d.target.y);
    });

  newEdge
    .append("svg:path")
    .classed(graphConsts.edgeMarkerClass, true)
    .attr("marker-end", "url(#end-arrow" + questionDiv.getAttribute("id") + ")");
  
  var fo = newEdge
    .append("foreignObject")
    .classed("foreignObject", true)
    .classed(graphConsts.edgeElClass, true)
    .attr("height", 29)
    .attr("width", 50);

  var input = fo
    .append("xhtml:input")
    .classed("edgeInput", true)
    .classed(graphConsts.edgeElClass, true)
    .on("click", function(e) {
      e.preventDefault();
      e.stopPropagation(); //aby sa to nebilo s oznacovanim edge
      console.log("click");
    })
    .on("keydown", function(e,d) {
      var input = d3.select(this).node();
      if (input.getAttribute("readonly") == "readonly") return;

      var len = visualLength(input.value); 
      var w = parseInt((input.style.width).substring(0, input.style.width.length - 2));
      if (w && (w - len) < 20) {
        setEdgeInputWidth(input, len + 50);
      }      

      if (e.keyCode == 13) {
        tryToRenameEdge(questionDiv, d, input.value);
      }
    })
    .on("keyup", function(e ,d) {
      console.log("curr state: "+ questionDiv.graphDiv.graphState.currentState);
      var input = d3.select(this).node();
      if (input.getAttribute("readonly") != "readonly") {
        var validSymbols = checkEdgeSymbolsValidity(questionDiv, d.id, d.source, input.value);
        input.correct = validSymbols.result;
      }
    })
    .on("blur", function(e,d){
      //console.log("blur");    
      getEdgeGroupById(questionDiv, d.id).classed("activeRenaming", false);

      disableInput(d3.select(this).node());

      if (d3.select(this).node().correct == false) {
        if (questionDiv.graphDiv.graphState.currentState == graphStateEnum.namingEdge) {
          deleteEdge(questionDiv, d);
        }
        else if (questionDiv.graphDiv.graphState.currentState == graphStateEnum.mergingEdge ||
          questionDiv.graphDiv.graphState.currentState == graphStateEnum.renamingEdge) {
            setEdgeInput(d3.select(this).node(), d.symbols);
            setEdgeInputWidth(d3.select(this).node());
            updateEdgeInputPosition(questionDiv, getEdgeGroupById(questionDiv, d.id));
        }
      }
      else{
        renameEdge(questionDiv, d, d3.select(this).node().value);
      }
      hideElem(questionDiv.graphDiv.renameError);
    });

  
  input.node().correct = false;
  if (origin == elementOrigin.fromExisting || origin == elementOrigin.fromTable) {
    disableInput(input.node());
    input.node().correct = true;
  }

  setEdgeInput(input.node(), newEdge.datum().symbols);
  if (origin == elementOrigin.default && questionDiv.type == "EFA") {
    setEdgeInput(input.node(), 'ε');
    input.node().correct = true;
  }
  setEdgeInputWidth(input.node(), 50);
}

function toggleEdgeSelection(edgeGroup, graphDiv) {
  removeSelectionFromState(graphDiv);

  //edgeGroup.datum() == data binded with element
  if (graphDiv.graphState.selectedEdge != edgeGroup.datum()) {
    removeSelectionFromEdge(graphDiv);
    graphDiv.graphState.selectedEdge = edgeGroup.datum();
    SELECTED_ELEM_GROUP = edgeGroup;
    edgeGroup.classed(graphConsts.selectedClass, true);
  }
}

function renameEdge(questionDiv, edgeData, symbols) {
  questionDiv.edgesData
    .filter(function (ed) { return ed.id == edgeData.id; })
    .map(function (ed) { ed.symbols = symbols; });

  var edgeGroup = getEdgeGroupById(questionDiv, edgeData.id);
  var input = edgeGroup.select("input").node();
  setEdgeInput(input, symbols);
  setEdgeInputWidth(input);
  updateEdgeInputPosition(questionDiv, edgeGroup);
}

function deleteEdge(questionDiv, edgeData) {
  deleteEdgeSvg(questionDiv.graphDiv.svg.svgGroup, edgeData);
  updateEdgeGroups(questionDiv.graphDiv.svg.svgGroup);
  deleteEdgeData(questionDiv.edgesData, edgeData);
}

function deleteEdgeSvg(svgGroup, edgeData) {
  svgGroup
    .select(".edges")
    .selectAll("g")
    .filter(function (ed) {
      return ed.id == edgeData.id;
    })
    .remove();
}

function deleteEdgeData(edgesData, edgeData) {
  edgesData.splice(edgesData.indexOf(edgeData), 1);
}

//CONTEXT MENUs
function setElemPosition(elem, top, left) {
  elem.style.top = top + "px";
  elem.style.left = left + "px";
}

function createContextMenuButton(innerText) {
  var button = document.createElement("button");
  button.setAttribute("class", "context-menu-button");
  button.innerText = innerText;
  return button;
}

function createAddStateMenu(questionDiv) {
  var div = document.createElement("div");
  div.setAttribute("class", contextMenuClass);

  var button = createContextMenuButton("+ Pridat stav");
  button.addEventListener("click", function(e) {
    var y = e.clientY - questionDiv.graphDiv.svg.node().getBoundingClientRect().y;
    var x = e.clientX - questionDiv.graphDiv.svg.node().getBoundingClientRect().x;
    var coords = getCoordinates([x, y], questionDiv.graphDiv.svg.svgGroup);

    addState(questionDiv, newStateData(questionDiv, null, coords.x, coords.y, false, false));
    hideElem(div);
  });
  div.appendChild(button);
  questionDiv.graphDiv.appendChild(div);
  questionDiv.graphDiv.addStateContextMenu = div;
}

// State CONTEXT MENU + handlers
function createStateContextMenu(questionDiv) {
  var stateContextMenuDiv = document.createElement("div");
  stateContextMenuDiv.setAttribute("class", contextMenuClass);

  var a = createContextMenuButton(renameStateText);
  a.addEventListener("click", function () { renameStateHandler(questionDiv); });
  stateContextMenuDiv.appendChild(a);

  var b = createContextMenuButton(deleteStateText);
  b.addEventListener("click", function () { deleteStateHandler(questionDiv) });
  stateContextMenuDiv.appendChild(b);

  var d = createContextMenuButton(setStateAsAcceptingText);
  d.addEventListener("click", function () { toggleAcceptingStateHandler(questionDiv); });
  stateContextMenuDiv.appendChild(d);
  questionDiv.graphDiv.acceptingButton = d;
  
  var c = createContextMenuButton(setAsInitialText);
  c.addEventListener("click", function () { setStateAsInitialHandler(questionDiv); });
  stateContextMenuDiv.appendChild(c);
  questionDiv.graphDiv.initialButton = c;

  questionDiv.graphDiv.appendChild(stateContextMenuDiv);
  questionDiv.graphDiv.stateContextMenuDiv = stateContextMenuDiv;
}

function deleteStateHandler(questionDiv) {
  deleteState(questionDiv, questionDiv.graphDiv.graphState.selectedState);
  hideElem(questionDiv.graphDiv.stateContextMenuDiv);
}

function renameStateHandler(questionDiv) {
  hideElem(questionDiv.graphDiv.stateContextMenuDiv);

  initRenaming(
    questionDiv, 
    graphStateEnum.renamingState, 
    questionDiv.graphDiv.graphState.selectedState.id);
}

function initRenaming(questionDiv, state, defaultValue, errMsg = null) {
  questionDiv.graphDiv.graphState.currentState = state;

  var input, elemG;
  if (state == graphStateEnum.renamingState) {
    elemG = getStateGroupById(questionDiv, defaultValue);
  }
  else {
    elemG = getEdgeGroupById(questionDiv, questionDiv.graphDiv.graphState.selectedEdge.id);
  }

  elemG.node().classList.add("activeRenaming");//.classed("activeRenaming", true);
  input = elemG.select("input").node();
  enableInput(input);
  input.select();
  input.focus();

  setRenameErrorPosition(state, questionDiv.graphDiv.renameError, elemG, questionDiv.graphDiv.k);
  errMsg != null ? showRenameError(errMsg, questionDiv) : hideElem(questionDiv.graphDiv.renameError);
}

function endRenaming(questionDiv) {
  if (SELECTED_ELEM_GROUP) {
    SELECTED_ELEM_GROUP.select("input").node().blur();
  }
  questionDiv.graphDiv.graphState.currentState = graphStateEnum.default;
  hideElem(questionDiv.graphDiv.renameError);
  enableAllDragging(questionDiv.graphDiv.svg);
}

function setRenameErrorPosition(state, errDiv, activeElemG, k) {
  var bcr, x,y;
  if (state == graphStateEnum.renamingState) {
    bcr = activeElemG.select("." + graphConsts.stateMainCircle).node().getBoundingClientRect();
    x = bcr.x + 6*k + window.scrollX;
    y = bcr.y + window.scrollY + (graphConsts.nodeRadius + 23)*k;
  }
  else {
    bcr = activeElemG.select("input").node().getBoundingClientRect();
    x = bcr.x + window.scrollX;
    y = bcr.y + window.scrollY + 30*k;
  }
  setElemPosition(errDiv, y, x);
}

function setStateAsInitialHandler(questionDiv) {
  setNewStateAsInitial(questionDiv, questionDiv.graphDiv.graphState.selectedState);
  hideElem(questionDiv.graphDiv.stateContextMenuDiv);
}

function toggleAcceptingStateHandler(questionDiv) {
  var d = questionDiv.graphDiv.graphState.selectedState;
  toggleAcceptingState(d, getStateGroupById(questionDiv, d.id));
  hideElem(questionDiv.graphDiv.stateContextMenuDiv);
}

// Edge CONTEXT MENU + handlers
function createEdgeContextMenu(questionDiv) {
  var edgeContextMenuDiv = document.createElement("div");
  edgeContextMenuDiv.setAttribute("class", "context-menu");

  var rename = createContextMenuButton(renameEdgeText);
  rename.addEventListener("click", function () {
    renameEdgeHandler(questionDiv);
  })
  edgeContextMenuDiv.appendChild(rename);

  var deleteB = createContextMenuButton(deleteStateText);
  deleteB.addEventListener("click", function () {
    deleteEdgeHandler(questionDiv);
  })
  edgeContextMenuDiv.appendChild(rename);
  edgeContextMenuDiv.appendChild(deleteB);

  questionDiv.graphDiv.appendChild(edgeContextMenuDiv);
  questionDiv.graphDiv.edgeContextMenuDiv = edgeContextMenuDiv;
}

function deleteEdgeHandler(questionDiv) {
  deleteEdge(questionDiv, questionDiv.graphDiv.graphState.selectedEdge);
  hideElem(questionDiv.graphDiv.edgeContextMenuDiv);
}

function renameEdgeHandler(questionDiv) {
  hideElem(questionDiv.graphDiv.edgeContextMenuDiv);
  initRenaming(questionDiv, graphStateEnum.renamingEdge, questionDiv.graphDiv.graphState.selectedEdge.symbols);
}

// ------------------------------------------------------
// Updating functions
// ------------------------------------------------------

function generateTextFromData(questionDiv) {
  var result = "";
  var acceptingStates = [];

  questionDiv.statesData.forEach(function (state) {
    if (state.initial) {
      result += "init=" + state.id + " ";
    }
    if (state.accepting) {
      acceptingStates.push(state);
    }
  });

  if (questionDiv.type == "DFA") {
    questionDiv.edgesData.forEach(function (edge) {
      edge.symbols.split(",").forEach((symbol) => {
        if (symbol == "ε") {
          symbol = "\\e";
        }
        result += "(" + edge.source.id + "," + symbol + ")=" + edge.target.id + " ";
      });
    });
  }

  else if (typeIsNondeterministic(questionDiv.type)) {
    var transitions = new Map();

    questionDiv.edgesData.forEach(function (edge) {
      edge.symbols.split(",").forEach((symbol) => {
        var s = symbol;
        if (s == "ε") {
          s = "\\e";
        }
        if (!transitions.has("(" + edge.source.id + "," + s + ")")) {
          transitions.set("(" + edge.source.id + "," + s + ")", []);
        }
        var val = transitions.get("(" + edge.source.id + "," + s + ")");
        val.push(edge.target.id);
        transitions.set("(" + edge.source.id + "," + s + ")", val);
      });
    });
    for (let [key, value] of transitions.entries()) {
      result += key + "={" + value + "} ";
    }
  }

  if (acceptingStates.length > 0) {
    result += "final={";
    for (var i = 0; i < acceptingStates.length; i++) {
      result += acceptingStates[i].id;
      if (i < acceptingStates.length - 1) {
        result += ",";
      }
    }
    result += "}";
  }

  //position data
  result += "##states##";
  questionDiv.statesData.forEach(function (d) {
/*     result += "{id:" + d.id
      + ",x:" + d.x
      + ",y:" + d.y
      + ",initial:" + d.initial
      + ",accepting:" + d.accepting + '};'; */
      result += "@" + d.id
      + ";" + d.x
      + ";" + d.y
      + ";" + d.initial
      + ";" + d.accepting;
  });
  result += "##edges##";
  questionDiv.edgesData.forEach(function (d) {
/*     result += "{id:" + d.id
      + ",sourceId:" + d.source.id
      + ",targetId:" + d.target.id
      + ",symbols:" + d.symbols
      + ",dx:" + d.dx
      + ",dy:" + d.dy
      + ",angle:" + d.angle + '};'; */
      result +=  "@" //+ d.id
      + ";" + d.source.id
      + ";" + d.target.id
      + ";" + d.symbols
      + ";" + d.dx
      + ";" + d.dy
      + ";" + d.angle.toFixed(2);
  });

  questionDiv.textArea.value = result;
  //parseStateInfo(questionDiv, result);
}

//TODO
function parseStateInfo(questionDiv, string) {
  var splitted = string.split("##states##");
  var data = splitted[1].split("##edges##");
  var states = data[0];
  var edges = data[1];
  if (states != null && states != "") {
    states = states.split("@");
    if (states.length >= 1) {
      for (var d of states) {
        var stateParts = d.split(';');
        if (stateParts.length != 5) continue;
        var id = stateParts[0];
        var x = parseInt(stateParts[1]);
        var y = parseInt(stateParts[2]);
        var initial = stateParts[3] == "true";
        var accepting = stateParts[4] == "true";
        var data = newStateData(questionDiv, id, x, y, initial, accepting, true);
        //addState(questionDiv, data);
      }
    }
  }
  if (edges != null && edges != "") {
    edges = edges.split('@');
    if (edges.length >= 1) {
      for (var d of edges) {
        var edgeData = d.split(';');
        if (edgeData.length != 5) continue;
        
        var sourceId = edgeData[0];
        var targetId = edgeData[1];
        var symbols = edgeData[2];
        var dx = parseInt(edgeData[3]);
        var dy = parseInt(edgeData[4]);
        var angle = parseFloat(edgeData[5]);

        var data = newEdgeData(questionDiv, sourceId, targetId, symbols, dx, dy, angle);
        //addEdge(questionDiv, data, true);
      }
    }
  }


}

/*
parsuje text z textArea a upravi podla neho states&edges data
!! momentalne predpoklada ze text je syntakticky spravny !!
old editor: ^init=[a-zA-Z0-9]+$ => nefungoval ked neboli medzery medzi str
*/
function updateDataFromText(questionDiv) {
  var values = questionDiv.textArea.value.split("#")[0].split(/\n | /g);
  var statesPresent = new Set();
  var edgesPresent = new Set();
  var finalStates = new Set();
  var titleOfInitState;

  values.forEach(str => {
    if (new RegExp("init=[a-zA-Z0-9]+").test(str)) {
      titleOfInitState = str.substring(5, str.length);
    }
    else if (new RegExp("final={[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*}").test(str)) {
      str.substring(7, str.length - 1).split(',').forEach(sTitle => {
        finalStates.add(sTitle);
        statesPresent.add(sTitle);
      });
    }
    else {
      var matches = [];
      if (questionDiv.type == "DFA") {
        matches = str.match(/\([a-zA-Z0-9]+,[a-zA-Z0-9]+\)=[a-zA-Z0-9]+/g);
        if (matches != null) {
          matches.forEach(element => {
            var state1 = element.substring(1, element.indexOf(","));
            var sym = element.substring(element.indexOf(",") + 1, element.indexOf(")"));
            var state2 = element.substring(element.indexOf("=") + 1, element.length);

            statesPresent.add(state1);
            statesPresent.add(state2);
            edgesPresent.add({ from: state1, to: state2, symbol: sym });
          });
        }
      }
      else {
        if (questionDiv.type == "NFA") {
          matches = str.match(/\([a-zA-Z0-9]+,[a-zA-Z0-9]+\)={[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*}/g);
        }
        else if (questionDiv.type == "EFA") {
          matches = str.match(/\([a-zA-Z0-9]+,(([a-zA-Z0-9])+|(\\e))\)={[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*}/g);
        }
        //matches moze byt null! osetrit
        matches.forEach(element => {
          var state1 = element.substring(1, element.indexOf(","));
          var sym = element.substring(element.indexOf(",") + 1, element.indexOf(")"));
          if (sym == "\\e")
            sym = "ε";
          var states2 = element.substring(element.indexOf("=") + 2, element.length - 1).split(",");

          statesPresent.add(state1);
          states2.forEach(element => {
            statesPresent.add(element);
            edgesPresent.add({ from: state1, to: element, symbol: sym });
          });
        });
      }
    }
  });

  //merging edges together
  var mergedEdges = new Map();
  edgesPresent.forEach(edge => {
    if (!mergedEdges.has(edge.from + "," + edge.to)) {
      mergedEdges.set(edge.from + "," + edge.to, edge.symbol);
    }
    else {
      var val = mergedEdges.get(edge.from + "," + edge.to);
      val += "," + edge.symbol;
      mergedEdges.set(edge.from + "," + edge.to, val);
    }
  });


  //updating states
  var statesToCreate = [];
  statesPresent.forEach(stateTitle => {
    var state = getStateGroupById(questionDiv, titleOfInitState);
    if (state == null) {
      var newData = newStateData(questionDiv, stateTitle, 0, 0, false, false, true);
      newData.accepting = finalStates.includes(stateTitle);
      newData.initial = stateTitle == titleOfInitState;
      statesToCreate.add(newData);
    }
  });

  statesToCreate.forEach(sd => {
    addState(questionDiv, sd);
  });

  var currentStates = questionDiv.statesData; // uz by mali byt updatenute (pridane nove stavy)
  currentStates.forEach(d => {
    if (!statesPresent.has(d.id)) {
      deleteState(questionDiv, d);
    }
    else {
      if (d.id == titleOfInitState && !d.initial) {
        setNewStateAsInitial(questionDiv, d);
      }

      if ((!finalStates.has(d.id) && d.accepting == true)
        || (finalStates.has(d.id) && d.accepting == false)) {
        toggleAcceptingState(d, getStateGroupById(questionDiv, d.id));
      }
    }
  });

  // updating edges
  //TODO: merge multiple egdes with same source&target into one edge  !!
  //  -> purpose: so there exists only ONE edge between source and target

  mergedEdges.forEach(function (e) {
    if (!getEdgeNodeByStates(questionDiv, e.from, e.to)) {
      addEdge(
        questionDiv,
        newEdgeData(questionDiv, e.from, e.to, e.symbol))
    }
  });

  var oldEdges = questionDiv.edgesData;
  oldEdges.forEach(ed => {
    var key = ed.source.id + "," + ed.target.id;
    if (mergedEdges.has(key)) {
      renameEdge(questionDiv, ed, mergedEdges.get(key));
    }
    else {
      deleteEdge(questionDiv, ed);
    }
  });

}

function updateGraphFromData(questionDiv) {

}

function mergeEdges(questionDiv) {
  var oldEdges = questionDiv.edgesData;
  //map contains {"sourceTitle,targetTitle" : id} where <id> is id of first found edge with target and source 
  var mergedEdges = new Map();

  oldEdges.forEach(ed => {
    if (!mergedEdges.has(ed.source.id + "," + ed.target.id)) {
      mergedEdges.set(ed.source.id + "," + ed.target.id, ed.id);
      //console.log("key=" + ed.source.id + "," + ed.target.id + " : value=" + mergedEdges.get(ed.source.id + "," + ed.target.id));
    }
    else {
      var motherEdgeData = getEdgeDataById(questionDiv, mergedEdges.get(ed.source.id + "," + ed.target.id));
      var newSymbols = motherEdgeData.symbols + "," + ed.symbols;
      //duplicate symbols???
      renameEdge(questionDiv, motherEdgeData, newSymbols.split(',').sort().join(","));
      deleteEdge(questionDiv, ed);
    }
  });

}

function updateGraph(questionDiv) {
  //zobrat stare a nove data a poupravovat
}

// editor utils
function midpoint(x1, x2) {
  return (x1 + x2) / 2;
}

function distBetween(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

function getCoordinates(oldXy, svgGroup) {
  var transform = d3.zoomTransform(svgGroup.node());
  var newXy =  transform.invert(oldXy);

  return {
    x: newXy[0],
    y: newXy[1],
  };
}

function cubicControlPoints(x, y, d) {
  var mult = 110;
  var div = 6;

  var x1 = +x + (Math.cos(d + Math.PI / div) * mult);
  var y1 = +y - (Math.sin(d + Math.PI / div) * mult);
  var x2 = +x + (Math.cos(d - Math.PI / div) * mult);
  var y2 = +y - (Math.sin(d - Math.PI / div) * mult);

  return x1 + " " + y1 + " " + x2 + " " + y2;
}

function repositionMarker(edgeGroup) {
  repositionMarkerTo(
    edgeGroup.select("." + graphConsts.edgePathClass),
    edgeGroup.select("." + graphConsts.edgeMarkerClass),
    graphConsts.nodeRadius + 11); // distance
}

function repositionMarkerTo(path, markerPath, distance) {
  var pathLength = path.node().getTotalLength();
  var pathPoint = path.node().getPointAtLength(pathLength - distance);
  var pathPoint2 = path.node().getPointAtLength(pathLength - distance - 0.01);
  markerPath.attr("d", "M" + pathPoint2.x + " " + pathPoint2.y + " L " + pathPoint.x + " " + pathPoint.y);

}

function toggleFullnameVisibitity(rect, visible = false) {
  rect.style("visibility", function () { return visible == true ? "visible" : "hidden"; });
  rect.FullnameText.style("visibility", function () { return visible == true ? "visible" : "hidden"; });
}

//reposition function?? aj pre edge rect/text napr.
function showFullname(invisibleRect, d) {
  toggleFullnameVisibitity(invisibleRect, true);
  invisibleRect.FullnameText.text(d.id);
  var w = invisibleRect.FullnameText.node().getComputedTextLength() + 8;
  invisibleRect.attr("width", w);
  invisibleRect.FullnameText
    .attr("x", d.x - w / 2 + 3.5)
    .attr("y", d.y + graphConsts.nodeRadius + 19.5);
  invisibleRect
    .attr("x", d.x - w / 2)
    .attr("y", d.y + (graphConsts.nodeRadius + 2));
}

function getEdgeInputPosition(pathDefinitinAttribute, isSelfloop) {
  var str = pathDefinitinAttribute.split(" "), tx, ty;

  if (isSelfloop) {
    tx = (+str[4] + +str[6] + +str[1]) / 3;
    ty = (+str[5] + +str[7] + +str[2]) / 3;
  }
  else {
    tx = (+str[4] + (+((+str[1] + (+str[6])) / 2))) / 2;
    ty = (+str[5] + (+((+str[2] + (+str[7])) / 2))) / 2;
  }
  return { tx, ty };
}

function repositionTemporaryEdgeToState(stateData) {
  temporaryEdgePath
    .classed("hidden", false)
    .attr("d", "M" + stateData.x + "," + stateData.y + "L" + stateData.x + "," + stateData.y);
}

function repositionInitArrow(graphDiv, stateData) {
  d3.select(graphDiv)
    .select(".init-arrow")
    .classed("hidden", false) //if it was hidden after deleting previous initial state, show it
    .attr(
      "d",
      "M" +
      (stateData.x - graphConsts.nodeRadius * 2) +
      "," +
      stateData.y +
      "L" +
      (stateData.x - graphConsts.nodeRadius - 4) +
      "," +
      stateData.y
    );
}

function repositionEdgeRect(rect, x, y) {
  if (x != -1) {
    var w = rect.attr("width");
    rect.attr("x", x - (w / 2));
  }
  if (y != -1) {
    var h = rect.attr("height");
    rect.attr("y", y - (h / 2));
  }
}

function repositionEdgeText(text, x, y) {
  text
    .attr("x", x)
    .attr("y", y);
}

function hideInitArrow(graphDiv) {
  d3.select(graphDiv)
    .select(".init-arrow")
    .classed("hidden", true);
}

function hideEdge(edgeG) {
  edgeG.select("." + graphConsts.edgePathClass).classed("hidden", true);
  edgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", true);
}


function removeSelectionFromState(graphDiv) {
  if (graphDiv.graphState.selectedState == null) {
    return;
  }
  graphDiv.svg.svgGroup.stateGroups
    .filter(function (stateData) {
      return stateData.id === graphDiv.graphState.selectedState.id;
    })
    .classed(graphConsts.selectedClass, false);
  graphDiv.graphState.selectedState = null;
}

function removeSelectionFromEdge(graphDiv) {
  if (graphDiv.graphState.selectedEdge == null) {
    return;
  }
  graphDiv.svg.svgGroup.edgeGroups
    .filter(function (edgeData) {
      return edgeData.id === graphDiv.graphState.selectedEdge.id;
    })
    .classed(graphConsts.selectedClass, false);
  graphDiv.graphState.selectedEdge = null;
}

function updateEdgeGroups(svgGroup) {
  svgGroup.edgeGroups = svgGroup.select(".edges").selectAll("g");
}

function updateStateGroups(svgGroup) {
  svgGroup.stateGroups = svgGroup.select(".states").selectAll("g");
}

function disableAllDragging(svg) {
  var dragState2 = d3.drag()
    .on("start", stateDragstart)
    //.on("drag", stateDragmove)
    .on("end", stateDragend);
  svg.svgGroup.selectAll("." + graphConsts.stateGroupClass).call(dragState2);
  svg.svgGroup.selectAll("." + graphConsts.edgeGroupClass).on(".drag", null);
  svg.on(".zoom", null);
}

function enableAllDragging(svg) {
  svg.svgGroup.selectAll("." + graphConsts.stateGroupClass).call(dragState);
  svg.svgGroup.selectAll("." + graphConsts.edgeGroupClass).call(dragEdge);
  svg.call(zoom).on("dblclick.zoom", null);
}

//TODO fix ids
function deselectAll(exceptionId = null) {
  var x = document.querySelectorAll("." + "tab-content");
  d3.selectAll(x) //(".tab-content")
    .selectAll(".graphDiv")
    .each( function() {
      
      var graphDiv = d3.select(this).node();

      if (exceptionId != graphDiv.parentNode.getAttribute("id")) {

        graphDiv.graphState.currentState = graphStateEnum.default;

        graphDiv.graphState.lastTargetState = null;

        removeSelectionFromState(graphDiv);
        removeSelectionFromEdge(graphDiv);
      
        hideElem(graphDiv.stateContextMenuDiv);
        hideElem(graphDiv.edgeContextMenuDiv);
        hideElem(graphDiv.addStateContextMenu);
        //hideElem(graphDiv.renameInput);
        hideElem(graphDiv.renameError);
        hideEdge(graphDiv.svg.svgGroup.temporaryEdgeG);

        //if selected element is not in this graphDiv
        if (SELECTED_ELEM_GROUP && SELECTED_ELEM_GROUP.node().graphDiv == graphDiv) {
          SELECTED_ELEM_GROUP.select("input").node().blur();
        }
  
        graphDiv.svg.svgGroup.temporaryEdgeG.classed(graphConsts.selectedClass, false);
        enableAllDragging(graphDiv.svg);
      }
    });
}

//TODO : look ci sa neda niekde pouzit
function getStateGroupById(questionDiv, id) {
  var res = null;

  questionDiv.graphDiv.svg.svgGroup.stateGroups
    .each(function (d) {
      if (d.id == id) {
        res = d3.select(this);
      }
    });
  return res;
}

function getStateDataById(questionDiv, id) {
  for (let i = 0; i < questionDiv.statesData.length; i++) {
    const data = questionDiv.statesData[i];
    if (data.id == id) {
      return data;
    }
  }
  return null;
}

function getEdgeNodeByStates(questionDiv, sourceTitle, targetTitle) {
  var res = null;

  questionDiv.graphDiv.svg.svgGroup.edgeGroups
    .each(function (d) {
      if (d.source.id == sourceTitle && d.target.id == targetTitle) {
        res = d3.select(this).node();
      }
    });
  return res;
}

function getEdgeGroupById(questionDiv, id) {
  return questionDiv.graphDiv.svg.svgGroup.edgeGroups
    .filter(function (d) {
      return d.id == id;
    });
}

function getEdgeDataByStates(questionDiv, sourceTitle, targetTitle) {
  for (let i = 0; i < questionDiv.edgesData.length; i++) {
    const d = questionDiv.edgesData[i];
    if (d.source.id == sourceTitle && d.target.id == targetTitle) {
      return d;
    }
  }
  return null;
}

function getEdgeDataById(questionDiv, id) {
  for (let i = 0; i < questionDiv.edgesData.length; i++) {
    const data = questionDiv.edgesData[i];
    if (data.id == id) {
      return data;
    }
  }
  return null;
}

function transitionWithSymbolExists(questionDiv, edgeId, stateId, symbols) {
  
  var syms = symbols.split(",");
  for (let i = 0; i < questionDiv.edgesData.length; i++) {
    const ed = questionDiv.edgesData[i];

    if (ed.source.id == stateId && (edgeId == null || (edgeId != null && edgeId != ed.id))) {
        var edSyms = ed.symbols.split(",");
        if (intersects(edSyms, syms)) {
          return true;
        }
      }
    }
  return false;
}

function newStateData(questionDiv, id, x, y, initial, accepting, isNew = false) {
  return {
    id: id != null ? id : generateStateId(questionDiv),
    x: x,
    y: y,
    initial: initial,
    accepting: accepting,
    isNew: isNew
  }
}

function newEdgeData(questionDiv, sourceId, targetId, symbols, dx = 0, dy = 0, angle = 0) {
  return {
      id: generateEdgeId(questionDiv),
      source: getStateDataById(questionDiv, sourceId),
      target: getStateDataById(questionDiv, targetId),
      symbols: symbols,
      dx: dx,
      dy: dy,
      angle: angle
  }
}

function getSvgTextLength(wp, string) {
  wp.textNode.text(string);
  return wp.textNode.node().getComputedTextLength() + 8;
}

function generateStateId(questionDiv) {
  questionDiv.graphDiv.stateIdCounter++;
  var id = "s" + questionDiv.graphDiv.stateIdCounter;

  while (!stateIdIsUnique(questionDiv.statesData, null, id)) {
    questionDiv.graphDiv.stateIdCounter++;
    id = "s" + questionDiv.graphDiv.stateIdCounter;
  }
  return id;
}

function generateEdgeId(questionDiv) {
  return ++questionDiv.graphDiv.edgeIdCounter;
}

function stateIdIsUnique(statesData, stateData, newId) {
  for (var i = 0; i < statesData.length; i++) {
    if (statesData[i].id == newId) {
      if (stateData == null) {
        return false;
      }
      else if (stateData && statesData[i] != stateData) {
        return false;
      }
    }
  }
  return true;
}

function graphIsInRenamingState(state) {
  return state == graphStateEnum.renamingState ||
    state == graphStateEnum.renamingEdge ||
    state == graphStateEnum.namingEdge ||
    state == graphStateEnum.mergingEdge;
}

function replaceEpsilon(array) {
  return array.toString().replace(/\\e/g, 'ε');
}

function deleteSymbolFromAllEdges(questionDiv, symbol) {
  var edgesToDelete = [];

  questionDiv.edgesData.forEach(ed => {
    if (ed.symbols == symbol) {
      edgesToDelete.push(ed);
    }
    else {
      var symbolsArray = ed.symbols.split(',');
      if (symbolsArray.indexOf(symbol) != -1) {
        symbolsArray.splice(symbolsArray.indexOf(symbol), 1);
        renameEdge(questionDiv, ed, symbolsArray.join(","));
      }
    }
  });

  edgesToDelete.forEach(ed => {
    deleteEdge(questionDiv, ed);
  });
}

/* function calculateEdgeRectWidth(questionDiv, text) {
  questionDiv.invisibleText.text(text);
  return questionDiv.invisibleText.node().getComputedTextLength() + 8;
} */

function intersects(array1, array2) {
  for (let i = 0; i < array1.length; i++) {
    const item = array1[i];
    if (array2.includes(item)) {
      return true;
    }
  }
  return false;
}

function typeIsNondeterministic(type) {
  return type == "NFA" || type == "EFA";
}