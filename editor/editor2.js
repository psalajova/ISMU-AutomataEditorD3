var menuButtonClass = "menu-button";
var contextMenuClass = "context-menu";
var GRAPH_DIV_CLASS = "graphDiv";
var QUESTION_DIV_CLASS = "question-content";

const graphConsts = {
  selectedClass: "selected",
  mouseOverClass: "mouse-over-node",
  stateGroupClass: "state-group",
  stateTextClass: "state-text",
  stateMainCircle: "state-main-circle",
  stateAccCircle: "accepting-circle",
  stateElClass: "stateEl",
  edgeElClass: "edgeEl",
  edgeGroupClass: "edge-group",
  edgePathClass: "edge-path",
  edgeMarkerClass: "edge-marker-path",
  edgeForeignObjectClass: "edge-foreign-bject",
  graphClass: "graph",
  nodeRadius: 30,
  nodeStrokeWidth: 2.1
};

const tableClasses = {
  myTable: "myTable",
  myCell: "myCell",
  columnHeader: "column-header-cell", //ch {td}
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

function setupLanguage() {
  var lang = document.documentElement.lang;
  if (!lang) {
    lang = "cs";
  }
  var path = "\"//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/"+ lang.toUpperCase() +".js\"";
  document.write("\<script src=" + path + "type='text/javascript'>\<\/script>");
}

function initialise(id, textArea) {
  var div = document.getElementById(id);
  div.setAttribute("class", QUESTION_DIV_CLASS);
  div.setAttribute("id", id);
  div.type = div.dataset.type;

  //var textArea = initialiseTextArea(div);
  if (!textArea) { //only for local testing!
    console.log("creating textArea");
    textArea = document.createElement("textarea");
  }
  div.appendChild(textArea); //moves the existing textarea into div
  div.textArea = textArea;

  if (!isRegOrGram(div.type)){
    initialiseEditor(div);
  }

  if (jeProhlizeciStranka_new()){
    textArea.disabled = true;
    if (!isRegOrGram(div.type)) {
      reversePopulateGraph(div, textArea.innerText);
    }
  }
  else {
    //setupSyntaxCheck(div.id);
  }

  $('form').submit(function() {
    console.log("*****submitting");
    generateTextFromData(div);
    $(textArea).addClass("editor-submitted");
  });
}

function initialise_test(div, textArea) {
  div.setAttribute("class", QUESTION_DIV_CLASS);
  var type = div.getAttribute("id").substring(0, 3);
  div.type = type; 

  if (!textArea) { //only for local testing!
    textArea = document.createElement("textarea");
  }
  div.textArea = textArea;

  if (!isRegOrGram(type)) {
    initialiseEditor(div);
    $(textArea).prop('readonly', true);
    reversePopulateGraph(div, textArea.value);
    if (div.statesData.length == 0 && div.edgesData.length == 0) {
      initInitialState(div);
    }
  }
}

function initialiseEditor(questionDiv) {
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
  graphDiv.setAttribute("class", GRAPH_DIV_CLASS);
  graphDiv.k = 1;

  var tableDiv = document.createElement("div");
  tableDiv.setAttribute("class", "tableDiv");

  questionDiv.appendChild(hintDiv);
  questionDiv.hintDiv = hintDiv;

  questionDiv.appendChild(graphDiv);
  questionDiv.graphDiv = graphDiv;

  questionDiv.appendChild(tableDiv);
  questionDiv.tableDiv = tableDiv;

  createStateContextMenu(questionDiv);
  createEdgeContextMenu(questionDiv);
  createAddStateMenu(questionDiv);
  initRenameDiv(questionDiv);

  initialiseGraph(questionDiv);
  initialiseTableDiv(questionDiv);

  hideElem(questionDiv.textArea);
  questionDiv.appendChild(questionDiv.textArea); //moves the existing textarea into div

  questionDiv.graphDiv.lastHeight = questionDiv.graphDiv.offsetHeight;
  questionDiv.graphDiv.lastWidth = questionDiv.graphDiv.offsetWidth;
}

function initialiseGraph(questionDiv) {
  questionDiv.graphDiv.graphState = {
    selectedState: null,
    selectedEdge: null,
    initialState: null,
    mouseOverState: null,
    lastSourceState: null,
    lastTargetState: null,
    currentState: graphStateEnum.default
  };

  var svg = d3
    .select(questionDiv.graphDiv)
    .append("svg")
    .classed("main-svg", true)
    .attr("width", "100%")
    .attr("height", "100%")

  questionDiv.graphDiv.svg = svg;

  var rect = svg
    .append("rect")
    .attr("class", "svg-rect")
    .attr("width", "100%")
    .attr("height", "100%");
    
  rect.node().parentGraphDiv = questionDiv.graphDiv;
  rect.node().clickTimer = 0;
  svg.rect = rect;

  svg.call(zoom).on("dblclick.zoom", null);

  var defs = svg.append("svg:defs");

  //arrow marker for edges that is VISIBLE
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

  //arrow marker for init arrow
  defs
    .append("svg:marker")
    .attr("id", "init-arrow-end" + questionDiv.getAttribute("id"))
    .attr("viewBox", "0 0 10 10")
    .attr("refY", "5")
    .attr("refX", 32)
    .attr("markerWidth", 4)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M 0 0 L 10 5 L 0 10 z")
    .attr("fill", "black");

  var svgGroup = svg.append("svg:g").classed("graph-svg-group", true);
  svg.svgGroup = svgGroup;

  //"temporary" path when creating edges
  //TODO ID!!???
  var temporaryEdgeG = svgGroup.append("g").classed("temp-edge-group", true);
  svgGroup.temporaryEdgeG = temporaryEdgeG;

  temporaryEdgeG
    .append("svg:path")
    .attr("class", graphConsts.edgePathClass + " dragline hidden")
    .attr("d", "M0,0L0,0")
    .style("marker-end", "url(#temporary-arrow-end" + questionDiv.getAttribute("id") + ")");

  temporaryEdgeG
    .append("svg:path")
    .classed(graphConsts.edgeMarkerClass, true)
    .attr("marker-end", "url(#end-arrow" + questionDiv.getAttribute("id") + ")");

  //init-arrow
  var initArrow = svgGroup
    .append("svg:path")
    .attr("class", graphConsts.edgePathClass + " init-arrow")
    .style("marker-end", "url(#init-arrow-end" + questionDiv.getAttribute("id") + ")");
  
  svgGroup.initArrow = initArrow;
  initArrow.node().questionDiv = questionDiv;
  initArrow.node().angle = 3.14;

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

  if (!jeProhlizeciStranka_new()) {
    svg.on("mousemove", svgMousemove)
      .on("click", svgRectClick)
      .on("contextmenu", svgRectContextmenu);

    rect.on("contextmenu", svgRectContextmenu)
      .on("dblclick", svgRectDblclick);

    initArrow.call(dragInitArrow)
  }
}

function initialiseTableDiv(questionDiv) {
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

/* function initialiseTextArea(div) {
  var res = null;
  res = getTextArea(div.id, "_e_a_1");
  if (!res) {
    res = document.createElement("textarea");
    div.appendChild(res);
  }
  return res;
} */

function initInitialState(questionDiv) {
  var initialData = newStateData(questionDiv, null, 100, 100, true, false);
  addState(questionDiv, initialData);
  repositionInitArrow(questionDiv.graphDiv, initialData, 3.14);
  questionDiv.graphDiv.graphState.initialState = initialData;
}

function initRenameDiv(questionDiv) {
  var errorParagraph = document.createElement("p");
  errorParagraph.setAttribute("class", "rename-error-p");
  hideElem(errorParagraph);
  questionDiv.graphDiv.appendChild(errorParagraph);
  questionDiv.graphDiv.renameError = errorParagraph;
}


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
  var arrow =  d3.select(this).node();
  var s = arrow.questionDiv.graphDiv.graphState.initialState;
  arrow.angle = calculateAngle(s.x, s.y, event.x, event.y);
  d3.select(this).attr("d", "M " + s.x + " " + s.y
        + " C " + cubicControlPoints(s.x, s.y, arrow.angle, 90, 2000)
        + " " + s.x + " " + s.y);
});


document.addEventListener('keyup', windowKeyUp);

/**
 * SELECTED_ELEM_GROUP is alaways either a stateGroup or an edgeGroup
 * both have .node().graphDiv.questionDiv to which they belong
 * @param {*} event 
 */
function windowKeyUp(event) {
  if (SELECTED_ELEM_GROUP == null || jeProhlizeciStranka_new()) {
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
   
    if (SELECTED_ELEM_GROUP.node().classList.contains(graphConsts.stateElClass)) { // if selected element is state
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
  var graphDiv = findParentWithClass(event.srcElement, GRAPH_DIV_CLASS);
  var isState = cl.contains(graphConsts.stateElClass); //cl.contains("state-text") || cl.contains("state-main-circle") || cl.contains("accepting-circle");
  var isEdge = cl.contains(graphConsts.edgeElClass); //cl.contains("edge-rect") || cl.contains("edge-path") || cl.contains("edge-text");
  var currentState = graphDiv.graphState.currentState;

  //so we can select edge
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
  deselectAll();

  //TODO: init selection of multiple elements???
}

function svgRectContextmenu(event) {
  event.preventDefault();
  var cl = event.srcElement.classList;
  var graphDiv = findParentWithClass(event.srcElement, GRAPH_DIV_CLASS);
  var isState = cl.contains(graphConsts.stateElClass);
  var isEdge = cl.contains(graphConsts.edgeElClass);

  if (isState || isEdge) {
    if (graphIsInRenamingState(graphDiv.graphState.currentState)) {
      endRenaming(graphDiv.parentNode);
    }
    else if (graphDiv.graphState.currentState == graphStateEnum.creatingEdge) {
      deselectAll();
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
    newSymbols = epsSymbol;
  }
  
  var input = edgeG.select("input").node();
  var validityCheck = checkEdgeSymbolsValidity(questionDiv, edgeData.id, edgeData.source, newSymbols);
  if (!validityCheck.result) {
    showRenameError(validityCheck.errMessage, questionDiv);
    input.correct = false;
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
  }
  else {
    input.correct = true;
    input.blur();
  }

}


/* ------------------------------ zoom & dragging ------------------------------ */
function svgZoomStart(e) {
  var graphDiv = findParentWithClass(e.sourceEvent.srcElement, GRAPH_DIV_CLASS);
  if (graphDiv) {
    deselectAll(graphDiv.parentNode.getAttribute("id"));
    hideAllContextMenus(graphDiv.parentNode);
  }
}

function svgZoomed(e) {
  var graphDiv = findParentWithClass(e.sourceEvent.srcElement, GRAPH_DIV_CLASS);
  if (graphDiv) {
    graphDiv.svg.svgGroup.attr("transform", e.transform); //transform = {k:1, x:0, y:0}
    graphDiv.k = e.transform.k;
  }
}

function resetZoom() {
  svg.transition().call(zoom.scaleTo, 1);
}

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
    repositionInitArrow(graphDiv, d, graphDiv.svg.svgGroup.initArrow.node().angle);
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
  var edgeG = d3.select(this);
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
      var fo = d3.select(this).select("foreignObject");
      var dAttr = d3.select(this).select("." + graphConsts.edgePathClass).attr("d");
      var coords = getEdgeInputPosition(dAttr, ed.source == ed.target);

      repositionEdgeInput(fo, coords.tx, coords.ty);
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


/* ------------------------------ state functions ------------------------------ */

function addState(questionDiv, stateData) {
  if (stateData.isNew) {
    stateData = findStatePlacement(questionDiv, stateData);
  }
  questionDiv.statesData.push(stateData);

  var newState = questionDiv.graphDiv.svg.svgGroup.stateGroups
    .data(questionDiv.statesData).enter().append("g");

  newState.node().parentGraphDiv = questionDiv.graphDiv;
  newState.node().clickTimer = 0;
  newState.node().clickedOnce = false;

  addStateSvg(newState, questionDiv.graphDiv);
  updateStateGroups(questionDiv.graphDiv.svg.svgGroup);
  
  if (!jeProhlizeciStranka_new()) {
    addStateEvents(newState, questionDiv.graphDiv);
    generateTextFromData(questionDiv);
  }
}

function addStateEvents(state, graphDiv) {
  state
    .call(dragState)
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
        graphDiv.acceptingButton.value = setStateAsNonAcceptingText;
      }
      else {
        graphDiv.acceptingButton.value = setStateAsAcceptingText;
      }
      showElem(graphDiv.stateContextMenuDiv);
    });
}

function addStateSvg(newState, graphDiv) {
  newState
    .classed(graphConsts.stateGroupClass, true)
    .classed(graphConsts.stateElClass, true)
    .attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  newState
    .append("circle")
    .classed(graphConsts.stateMainCircle, true)
    .classed(graphConsts.stateElClass, true)
    .attr("r", graphConsts.nodeRadius)
    .attr("stroke-width", graphConsts.nodeStrokeWidth);

  var input = newState
    .append("foreignObject")
    .classed(graphConsts.stateElClass, true)
    .attr("x", -24)
    .attr("y", -12)
    .attr("height", 23)
    .attr("width", 50)
    .append("xhtml:input")
    .classed("stateInput", true)
    .classed(graphConsts.stateElClass, true)
    .on("keyup", function(e, d) {
      if (d3.select(this).node().getAttribute("readonly") == "readonly") return;
      var validSymbols = checkStateNameValidity(graphDiv.parentNode, d, d3.select(this).node().value);
      d3.select(this).node().correct = validSymbols.result;
      if (e.keyCode == 13 && graphDiv.graphState.currentState == graphStateEnum.renamingState) {
        e.preventDefault();
        tryToRenameState(graphDiv.parentNode, graphDiv.graphState.selectedState, d3.select(this).node().value);
      }
    })
    .on("keydown", function(e,d) {
      if (d3.select(this).node().getAttribute("readonly") == "readonly") return;
      if (e.keyCode == 13) {
        e.preventDefault();
      }
    })
    .on("blur", function(e, d) {
      getStateGroupById(graphDiv.parentNode, d.id).classed("activeRenaming", false);
      var input = d3.select(this).node();
      if (input.getAttribute("readonly") == "readonly") return;
      if (input.correct == false) {
        if (graphDiv.graphState.currentState == graphStateEnum.renamingState) {
          setStateInputValue(input, d.id);
        }
      }
      else {
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

function toggleStateSelection(stateGroup, graphDiv, d) {
  removeSelectionFromEdge(graphDiv);

  if (graphDiv.graphState.selectedState != d) { // another state was selected
    removeSelectionFromState(graphDiv);
    graphDiv.graphState.selectedState = d;
    SELECTED_ELEM_GROUP = stateGroup;
    stateGroup.classed(graphConsts.selectedClass, true);
  }
}

function toggleAcceptingState(questionDiv, stateData, stateG) {
  if (stateData.accepting) {
    stateG.select("." + graphConsts.stateAccCircle).remove();
  } else {
    addAcceptingCircle(stateG);
  }
  stateData.accepting = !stateData.accepting;
  generateTextFromData(questionDiv);
}

function addAcceptingCircle(stateG) {
  stateG
    .append("circle")
    .classed(graphConsts.stateAccCircle, true)
    .classed(graphConsts.stateElClass, true)
    .attr("r", graphConsts.nodeRadius - 3.5);
  //TODO parameter namiesto stringu
  stateG.select("foreignObject").raise();
}

function setNewStateAsInitial(questionDiv, stateData) {
  setInitStateAsNotInitial(questionDiv);

  questionDiv.statesData
    .filter(function (d) { return d.id == stateData.id; })
    .map(function (d) { d.initial = true; });
  
  questionDiv.graphDiv.graphState.initialState = stateData;
  repositionInitArrow(questionDiv.graphDiv, stateData, 3.14);
  generateTextFromData(questionDiv);
}

function setInitStateAsNotInitial(questionDiv) {
  questionDiv.statesData
    .filter(function (d) { return d.initial == true; })
    .map(function (d) { d.initial = false; });

  hideInitArrow(questionDiv.graphDiv);
}

function renameState(questionDiv, stateData, newTitle) {
  questionDiv.statesData
    .filter(function (d) { return d.id == stateData.id; })
    .map(function (d) { d.id = newTitle; });

  setStateInputValue(getStateGroupById(questionDiv, stateData.id).select(".stateInput").node(), newTitle);
  generateTextFromData(questionDiv);
}

function deleteState(questionDiv, stateData) {
  if (stateData.initial == true) {
    hideInitArrow(questionDiv.graphDiv);
  }
  deleteStateSvg(questionDiv.graphDiv.svg.svgGroup, stateData);
  deleteStateEdges(questionDiv, stateData);
  deleteStateData(questionDiv, stateData);
  updateStateGroups(questionDiv.graphDiv.svg.svgGroup);
  generateTextFromData(questionDiv);
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


/* ------------------------------ transition (edge) functions ------------------------------ */

function addEdge(questionDiv, edgeData, origin = elementOrigin.default) {
  var temporaryEdgePath = questionDiv.graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgePathClass);

  if (edgeData.source == edgeData.target && origin == elementOrigin.default) {
    edgeData.angle = temporaryEdgePath.node().angle;
  }
  questionDiv.edgesData.push(edgeData);

  var newEdge = questionDiv.graphDiv.svg.svgGroup.edgeGroups
    .data(questionDiv.edgesData).enter().append("g").classed(graphConsts.edgeGroupClass, true);

  newEdge.node().parentGraphDiv = questionDiv.graphDiv;


  addEdgeSvg(questionDiv, newEdge, origin, temporaryEdgePath.attr("d"));

  repositionMarker(newEdge);
  updateEdgeInputPosition(questionDiv, newEdge);
  updateEdgeGroups(questionDiv.graphDiv.svg.svgGroup);


  if (!jeProhlizeciStranka_new()) {
    addEdgeEvents(questionDiv, newEdge, origin);
    if (checkEdgeSymbolsValidity(questionDiv, edgeData.id, edgeData.source, edgeData.symbols).result) {
      generateTextFromData(questionDiv);
    }
  }
  
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
    .classed(graphConsts.edgeElClass, true)
    .attr("d", function (d) {
      if (origin == elementOrigin.fromExisting) {
        return d.source != d.target ? reverseCalculateEdge(d.source, d.target, d.dx, d.dy) : calculateSelfloop(d.source.x, d.source.y, d.angle);
      }
      if (d.source == d.target) {
        if (origin == elementOrigin.fromTable) {
          d.angle = 1.55;
          return calculateSelfloop(d.source.x, d.source.y, d.angle);
        }
        return tempEdgeDef;
      }
      return getStraightPathDefinition(d.source.x, d.source.y, d.target.x, d.target.y);
    });

  newEdge
    .append("svg:path")
    .classed(graphConsts.edgeMarkerClass, true)
    .classed(graphConsts.edgeElClass, true)
    .attr("marker-end", "url(#end-arrow" + questionDiv.getAttribute("id") + ")");
  
  var fo = newEdge
    .append("foreignObject")
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
    })
    .on("keydown", function(e,d) {
      var input = d3.select(this).node();
      if (input.getAttribute("readonly") == "readonly") return;

      var len = visualLength(input.value); 
      var w = parseInt((input.style.width).substring(0, input.style.width.length - 2));
      if (w && (w - len) < 20) {
        setEdgeInputWidth(input, len + 50);
        updateEdgeInputPosition(questionDiv, getEdgeGroupById(questionDiv, d.id));
      }

      if (e.keyCode == 13) {
        e.preventDefault();
        tryToRenameEdge(questionDiv, d, input.value);
      }
    })
    .on("keyup", function(e ,d) {
      var input = d3.select(this).node();
      if (input.getAttribute("readonly") != "readonly") {
        var validSymbols = checkEdgeSymbolsValidity(questionDiv, d.id, d.source, input.value);
        input.correct = validSymbols.result;
      }

    })
    .on("blur", function(e,d){  
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


  setEdgeInput(input.node(), newEdge.datum().symbols);
  if (origin == elementOrigin.default && questionDiv.type == "EFA") {
    setEdgeInput(input.node(), epsSymbol);
    input.node().correct = true;
  }
  setEdgeInputWidth(input.node(), 50);
  if (origin == elementOrigin.fromExisting || origin == elementOrigin.fromTable) {
    setEdgeInputWidth(input.node());
    disableInput(input.node());
    input.node().correct = true;
  }
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
  generateTextFromData(questionDiv);
}

function deleteEdge(questionDiv, edgeData) {
  deleteEdgeSvg(questionDiv.graphDiv.svg.svgGroup, edgeData);
  updateEdgeGroups(questionDiv.graphDiv.svg.svgGroup);
  deleteEdgeData(questionDiv.edgesData, edgeData);
  generateTextFromData(questionDiv);
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


/* ------------------------------ State CONTEXT MENU + handlers ------------------------------ */

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
    elemG.select("input").node().value = elemG.datum().id;
  }
  else {
    elemG = getEdgeGroupById(questionDiv, questionDiv.graphDiv.graphState.selectedEdge.id);
  }

  elemG.node().classList.add("activeRenaming");//.classed("activeRenaming", true);
  input = elemG.select("input").node();
  enableInput(input);
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
  toggleAcceptingState(questionDiv, d, getStateGroupById(questionDiv, d.id));
  hideElem(questionDiv.graphDiv.stateContextMenuDiv);
}


/* ------------------------------ Edge CONTEXT MENU + handlers ------------------------------ */

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

function repositionInitArrow(graphDiv, stateData, angle) {
  var arrow = graphDiv.svg.svgGroup.initArrow;
  
  arrow
    .classed("hidden", false) //if it was hidden after deleting previous initial state, show it
    .attr("d",
      "M " + stateData.x + " " + stateData.y
      + " C " + cubicControlPoints(stateData.x, stateData.y, angle, 90, 2000)
      + " " + stateData.x + " " + stateData.y
    );

  arrow.node().angle = angle;
}

function hideInitArrow(graphDiv) {
  d3.select(graphDiv)
    .select(".init-arrow")
    .classed("hidden", true);
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

/* ------------------------------ Updating functions ------------------------------ */
function generateTextFromData(questionDiv) {
  var result = "";
  var initState;
  var acceptingStates = [];

  questionDiv.statesData.forEach(function (state) {
    if (state.initial) {
      initState = state;
      result += "init=" + state.id + " ";
    }
    if (state.accepting) {
      acceptingStates.push(state);
    }
  });

  if (questionDiv.type == "DFA") {
    questionDiv.edgesData.forEach(function (edge) {
      edge.symbols.split(",").forEach((symbol) => {
        if (symbol == epsSymbol) {
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
        if (s == epsSymbol) {
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
  result += " ##";
  result += "states";
  questionDiv.statesData.forEach(function (d) {
      result += "@" + d.id
      + ";" + d.x
      + ";" + d.y
      + ";" + (d.initial ? 1 : 0)
      + ";" + (d.accepting ? 1 : 0);
      
  });
  result += "edges";
  questionDiv.edgesData.forEach(function (d) {
      result +=  "@" //+ d.id
      + d.source.id
      + ";" + d.target.id
      + ";" + d.symbols
      + ";" + d.dx.toFixed(2)
      + ";" + d.dy.toFixed(2)
      + ";" + d.angle.toFixed(3);
  });
  if (initState) {
    result += "@initAngle:" + questionDiv.graphDiv.svg.svgGroup.initArrow.node().angle.toFixed(3);
  }
  //questionDiv.textArea.value = result;
  questionDiv.textArea.innerText = result;
  $(questionDiv.textArea).trigger("change");
}

//TODO better validity checks
/* 
  state regex
  @{stateIdRegex};{x};{y};{initial 1/0};{accepting 1/0}
  @([a-zA-Z0-9]+);-?\d+;-?\d+;(1|0);(1|0)  

  edge regex
  @{stateIdRegex};{stateIdRegex};{edgeSymbolsRegex};{dx};{dy};{angle}

  @{stateIdRegex};{stateIdRegex};{edgeSymbolsRegex};-?\d+;-?\d+;-?\d+(\.\d+)?
  */
function reversePopulateGraph(questionDiv, dataString) {
  if (!dataString) return;

  var splitted = dataString.split("##states");
  var data = splitted[1].split("edges");
  var states = data[0];
  var edges = data[1];
  if (states != null && states != "") {
    states = states.split("@");
    for (var d of states) {
      var stateParts = d.split(';');
      if (stateParts.length != 5) continue;
      var id = stateParts[0];
      var x = parseInt(stateParts[1]);
      var y = parseInt(stateParts[2]);
      var initial = stateParts[3] == "1";
      var accepting = stateParts[4] == "1";
      var data = newStateData(questionDiv, id, x, y, initial, accepting, true);
      addState(questionDiv, data);

      if (initial) {
        setNewStateAsInitial(questionDiv, data);
      }
      if (accepting) {
        addAcceptingCircle(getStateGroupById(questionDiv, data.id));
      }
    }
    
  }
  if (edges != null && edges != "") {
    edges = edges.split('@');
    for (var d of edges) {
      var edgeData = d.split(';');
      if (edgeData.length != 6) continue;
      
      var sourceId = edgeData[0];
      var targetId = edgeData[1];
      var symbols = edgeData[2];
      var dx = parseFloat(edgeData[3]);
      var dy = parseFloat(edgeData[4]);
      var angle = parseFloat(edgeData[5]);

      var data = newEdgeData(questionDiv, sourceId, targetId, symbols, dx, dy, angle);
      addEdge(questionDiv, data, elementOrigin.fromExisting);
    }
  }
  //TODO parse init arrow angle
}

function setupSyntaxCheck(id) {
  var div = document.getElementById(id);

  var errDiv = document.createElement("div");
  errDiv.setAttribute("id", id + "-error");
  errDiv.setAttribute("class", "alert alert-info");
  errDiv.setAttribute("title", syntaxDivTitle);

  var errIcon = document.createElement("div");
  errIcon.setAttribute("id", id + "-i");

  var errText = document.createElement("div");
  errText.setAttribute("id", id + "-error-text");
  errText.innerHTML = syntaxTextDefault;

  errDiv.appendChild(errIcon);
  errDiv.appendChild(errText);

  div.appendChild(errDiv);
  div.errDiv = errDiv;

  if (jeProhlizeciStranka_new() || !isRegOrGram(div.dataset.type)) {
    hideElem(errDiv);
  }

  eval("registerElem(id, " + div.dataset.type + "Parser.parse" + ", div.textArea)");
}