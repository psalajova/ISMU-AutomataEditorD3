/* ------------------------------ Initialization ------------------------------ */

setupLanguage();

var editor_init, upload;

if (typeof editor_init !== 'function') {
  var otazky = {};

  var onl = window.onload || function () { };
  window.onload = function () {
    onl();
    var textAreas = document.getElementsByTagName('textarea');
    for (var n in otazky) {
      var txa = textAreas[n];
      if (otazky[n] != null) {
        var div = document.createElement("div");
        div.setAttribute("id", otazky[n]);
        txa.parentNode.insertBefore(div, txa.nextSibling);
        initialise(div, txa);
      }
    }
    window.scrollTo(0, 0);
  }
  editor_init = function (type) {
    var d = new Date();
    var id = type + "-" + d.getTime();
    otazky[document.getElementsByTagName('textarea').length] = id;
  };
  upload = function () { editor_init(null); };
}

const MENU_BUTTON = "menu-button";
const CONTEXT_MENU = "context-menu";
const GRAPH_DIV = "graphDiv";
const QUESTION_DIV = "editor-content";

const graphConsts = {
  selected: "selected",
  mouseOver: "mouse-over-node",
  stateGroup: "state-group",
  stateMainCircle: "state-main-circle",
  stateAccCircle: "accepting-circle",
  stateElem: "stateEl",
  edgeElem: "edgeEl",
  edgeGroup: "edge-group",
  edgePath: "edge-path",
  edgeMarker: "edge-marker-path",
  emptyGraph: "empty-graph",
  nodeRadius: 30
};

const tableClasses = {
  myTable: "myTable",
  myCell: "myCell",
  columnHeader: "column-header-cell",
  rowHeader: "row-header-input",
  innerCell: "inner-cell",
  inputCellDiv: "cell-input",
  inputColumnHeaderDiv: "column-header-input",
  noselectCell: "noselect",
  inactiveCell: "inactive-cell",
  selectedHeaderInput: "selected-header-input",
  incorrectCell: "incorrect-cell",
  deleteButton: "delete-button-cell",
  addButton: "add-button-cell",
  controlButton: "control-button"
}

var SELECTED_ELEM_GROUP, params, zoom, dragEdge, dragState, dragInitArrow, maxZoomout = 0.5;

const graphStateEnum = Object.freeze({
  "default": 0,
  "creatingEdge": 1,
  "namingEdge": 2,
  "renamingEdge": 3,
  "renamingState": 4,
  "mergingEdge": 5,
  "empty": 6
});

const elemOrigin = Object.freeze(
  {
    "default": 0,
    "fromTable": 1,
    "fromExisting": 2
  });

function setupLanguage() {
  var lang = document.documentElement.lang;
  if (!lang) {
    lang = "cs";
  }
  var src = "//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/" + lang.toUpperCase() + ".js";
  document.write("\<script src=\"" + src + "\"type='text/javascript'><\/script>");
}

function initialise(div, textArea) {
  div.setAttribute("class", QUESTION_DIV);
  var type = div.getAttribute("id").substring(0, 3);
  div.type = type;

  if (!textArea) { //only for local testing
    textArea = document.createElement("textarea");
    div.appendChild(textArea);
  }
  div.textArea = textArea;

  if (typeIsRegOrGram(type)) {
    initSyntaxCheck(div.id);
  }
  else {
    initialiseEditor(div);
    reversePopulateGraph(div, textArea.value);
    $(textArea).prop('readonly', true);
    if (isEmpty(div) && !jeProhlizeciStranka_new()) {
      //initEmptyGraphState(div);
      initEmptyGraphState(div);
    }
  }
}

function initialiseEditor(questionDiv) {
  questionDiv.lastEdited = "graph";
  questionDiv.statesData = [];
  questionDiv.edgesData = [];

  var ruler = document.getElementById("ruler");
  if (!ruler) {
    ruler = document.createElement("span");
    ruler.setAttribute("id", "ruler");
  }
  var tableRuler = document.getElementById("table-ruler");
  if (!tableRuler) {
    tableRuler = document.createElement("span");
    tableRuler.innerHTML = "x";
    tableRuler.setAttribute("id", "table-ruler");
  }
  questionDiv.parentNode.insertBefore(ruler, questionDiv.nextSibling);
  questionDiv.parentNode.insertBefore(tableRuler, questionDiv.nextSibling);

  //create menu BUTTONS

  var graphButton = createButton(graphMenuButton, MENU_BUTTON);
  graphButton.addEventListener("click", function () { clickGraph(questionDiv) });

  var textButton = createButton(textMenuButton, MENU_BUTTON);
  textButton.addEventListener("click", function () { clickText(questionDiv) });

  var tableButton = createButton(tableMenuButton, MENU_BUTTON);
  tableButton.addEventListener("click", function () { clickTable(questionDiv) });

  questionDiv.appendChild(graphButton);
  questionDiv.appendChild(tableButton);
  questionDiv.appendChild(textButton);

  //HINT
  var hintDiv = document.createElement("div");
  hintDiv.setAttribute("class", "hintDiv");

  var hintButton = createButton(hintLabel, "hintButton");
  hintButton.style.marginBottom = "7px";
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
  graphDiv.setAttribute("class", GRAPH_DIV);
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
  initRenameError(questionDiv);

  initGraph(questionDiv);
  initTableDiv(questionDiv);

  hideElem(questionDiv.textArea);
  questionDiv.appendChild(questionDiv.textArea); //moves the existing textarea into div

  questionDiv.graphDiv.lastHeight = questionDiv.graphDiv.offsetHeight;
  questionDiv.graphDiv.lastWidth = questionDiv.graphDiv.offsetWidth;
}

/* function initTest_unused(type) {
  for (let i = 0; i < document.scripts.length; i++) {
    const s = document.scripts[i];
    if (s.src.includes("edisdsfsd.js")) {
      break;
    }
  }

  document.write("\<script src=\"https://ajax.googleapis.com/ajax/libs/d3js/6.2.0/d3.min.js\">\<\/script>");
  document.write("\<script src=\"//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/jquery-ui.js\">\<\/script>");
  document.write("\<script src=\"//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/editor2.js\">\<\/script>");
  document.write("\<style type=\"text/css\">@import \"//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/jquery-ui.css\";\<\/style>");
  document.write("\<style type=\"text/css\">@import \"//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/editorStyle.css\";\<\/style>");
} */

function initGraph(questionDiv) {
  questionDiv.graphDiv.graphState = {
    selectedState: null,
    selectedEdge: null,
    initialState: null,
    mouseOverState: null,
    lastSourceState: null,
    lastTargetState: null,
    currentState: graphStateEnum.default
  };

  params = {
    width: questionDiv.graphDiv.offsetWidth,
    height: questionDiv.graphDiv.offsetHeight
    /*     width: 700,
        height: 700 */
  };

  zoom = d3.zoom()
    .scaleExtent([maxZoomout, 3])
    .translateExtent([[-(params.width), -(params.height)], [params.width, params.height]])
    .on("start", svgZoomStart)
    .on("zoom", svgZoomed);

  dragEdge = d3
    .drag()
    .on("start", edgeDragstart)
    .on("drag", edgeDragmove)
    .on("end", edgeDragend);


  dragState = d3
    .drag()
    .on("start", stateDragstart)
    .on("drag", stateDragmove)
    .on("end", stateDragend);

  dragInitArrow = d3.drag().on("drag", function (event) {
    var arrow = d3.select(this).node();
    var s = arrow.questionDiv.graphDiv.graphState.initialState;
    arrow.angle = calculateAngle(s.x, s.y, event.x, event.y);
    d3.select(this).attr("d", "M " + s.x + " " + s.y
      + " C " + cubicControlPoints(s.x, s.y, arrow.angle, 90, 2000)
      + " " + s.x + " " + s.y);
  });

  var svg = d3
    .select(questionDiv.graphDiv)
    .append("svg")
    .classed("main-svg", true)
    .attr("width", "100%")
    .attr("height", "100%");

  questionDiv.graphDiv.svg = svg;

  var rect = svg
    .append("rect")
    .attr("class", "svg-rect")
    .attr("width", "100%")
    .attr("height", "100%");

  rect.node().parentGraphDiv = questionDiv.graphDiv;
  rect.node().clickTimer = 0;
  svg.rect = rect;

  initStartText(questionDiv);

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

  svg.call(zoom).on("dblclick.zoom", null);
  svgGroup.attr("transform", "translate(0,0) scale(1)");

  svg.svgGroup = svgGroup;

  //"temporary" path when creating edges
  var temporaryEdgeG = svgGroup.append("g").classed("temp-edge-group", true);
  svgGroup.temporaryEdgeG = temporaryEdgeG;

  temporaryEdgeG
    .append("svg:path")
    .attr("class", graphConsts.edgePath + " dragline hidden")
    .attr("d", "M0,0L0,0")
    .style("marker-end", "url(#temporary-arrow-end" + questionDiv.getAttribute("id") + ")");

  temporaryEdgeG
    .append("svg:path")
    .classed(graphConsts.edgeMarker, true)
    .attr("marker-end", "url(#end-arrow" + questionDiv.getAttribute("id") + ")");

  //init-arrow
  var initArrow = svgGroup
    .append("svg:path")
    .attr("class", graphConsts.edgePath + " init-arrow")
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
    .classed(graphConsts.stateGroup, true);

  svgGroup.edgeGroups = svgGroup
    .select(".edges")
    .selectAll("g")
    .data(questionDiv.edgesData)
    .enter()
    .append("g")
    .classed(graphConsts.edgeGroup, true);

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

  resetZoom(svg);

  if (!jeProhlizeciStranka_new()) {
    svg.on("mousemove", svgMousemove)
      .on("click", svgRectClick)
      .on("contextmenu", svgRectContextmenu);

    rect.on("contextmenu", svgRectContextmenu)
      .on("dblclick", svgRectDblclick);

    initArrow.call(dragInitArrow);
  }
}

// text shown when there's no states = graph is empty
function initStartText(div) {
  div.initText = div.graphDiv.svg
    .append("text")
    .classed("initial-text", true)
    .text(emptyGraphText)
    .attr("x", (params.width - visualLength(emptyGraphText)) / 2)
    .attr("y", (params.height - visualHeight(emptyGraphText)) / 2)
    .style("visibility", "hidden")
    .on("dblclick", function (event) {
      endEmptyGraphState(div);
      var p = getPointWithoutTransform(d3.pointer(event), div.graphDiv.svg.svgGroup);
      initInitialState(div, p.x, p.y);
    });
}

function initTableDiv(questionDiv) {
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

function initInitialState(questionDiv, x, y) {
  /*   var x = -(params.width /2) + 100;
    var y = -(params.height/2) + 100; */
  var initialData = newStateData(questionDiv, null, x, y, true, false);
  addState(questionDiv, initialData);
  repositionInitArrow(questionDiv.graphDiv, initialData, 3.14);
  questionDiv.graphDiv.graphState.initialState = initialData;
}

function initRenameError(questionDiv) {
  var errorParagraph = document.createElement("p");
  errorParagraph.setAttribute("class", "rename-error-p");
  hideElem(errorParagraph);
  questionDiv.graphDiv.appendChild(errorParagraph);
  questionDiv.graphDiv.renameError = errorParagraph;
}

function initSyntaxCheck(id) {
  var div = document.getElementById(id);

  var errDiv = document.createElement("div");
  errDiv.setAttribute("id", id + "-error");
  errDiv.setAttribute("class", "alert alert-info");
  errDiv.setAttribute("title", syntaxDivTitle);

  var errIcon = document.createElement("div");
  errIcon.setAttribute("id", id + "-i");

  var errText = document.createElement("div");
  errText.setAttribute("id", id + "-error-text");
  errText.innerHTML = syntaxDefaultText;

  errDiv.appendChild(errIcon);
  errDiv.appendChild(errText);

  div.appendChild(errDiv);
  div.errDiv = errDiv;

  if (jeProhlizeciStranka_new() || !typeIsRegOrGram(div.type)) {
    hideElem(errDiv);
  }

  eval("registerElem(id, " + div.type + "Parser.parse" + ", div.textArea)");
}

function initEmptyGraphState(div) {
  div.graphDiv.svg.select(".initial-text").style("visibility", "visible");
  div.graphDiv.svg.rect.classed("empty", true);
  div.graphDiv.graphState.currentState = graphStateEnum.empty;
  disableAllDragging(div.graphDiv.svg);
}

function endEmptyGraphState(div) {
  div.graphDiv.svg.select(".initial-text").style("visibility", "hidden");
  div.graphDiv.svg.rect.classed("empty", false);
  div.graphDiv.graphState.currentState = graphStateEnum.default;
  enableAllDragging(div.graphDiv.svg);
}

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

    if (SELECTED_ELEM_GROUP.node().classList.contains(graphConsts.stateElem)) { // if selected element is state
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
  var graphDiv = findParentWithClass(event.srcElement, GRAPH_DIV);
  var isState = cl.contains(graphConsts.stateElem); //cl.contains("state-text") || cl.contains("state-main-circle") || cl.contains("accepting-circle");
  var isEdge = cl.contains(graphConsts.edgeElem) || cl.contains("edge-path"); //cl.contains("edge-rect") || cl.contains("edge-path") || cl.contains("edge-text");
  var currentState = graphDiv.graphState.currentState;

  if (currentState == graphStateEnum.empty) {
    //return;
  }

  //so we can select edge
  else if (isEdge && currentState == graphStateEnum.default) {
    return;
  }
  else if (isState && (currentState == graphStateEnum.creatingEdge || graphStateEnum.renamingState)) {
    return;
  }

  //when naming new edge and merging edges, we click on the second state, and we dont want to cancel its SELECTION !
  else if (currentState == graphStateEnum.namingEdge && isState) {

    return;
  }
  else if (currentState == graphStateEnum.mergingEdge && isState) {
    return;
  }
  else {
    deselectAll();
  }


  //TODO: init selection of multiple elements???
}

function svgRectContextmenu(event) {
  event.preventDefault();
  var cl = event.srcElement.classList;
  var graphDiv = findParentWithClass(event.srcElement, GRAPH_DIV);
  var isState = cl.contains(graphConsts.stateElem);
  var isEdge = cl.contains(graphConsts.edgeElem);
  var elem;

  if (graphDiv.graphState.currentState == graphStateEnum.empty) return;

  if (isState) {
    elem = graphDiv.stateContextMenuDiv;
    if (graphDiv.graphState.currentState == graphStateEnum.renamingState) {
      return;
    }
  }
  else if (isEdge) { //when edge editing is active its ok to right click into input
    elem = graphDiv.edgeContextMenuDiv;
    if (graphDiv.graphState.currentState == graphStateEnum.renamingEdge ||
      graphDiv.graphState.currentState == graphStateEnum.namingEdge ||
      graphDiv.graphState.currentState == graphStateEnum.mergingEdge) {
      return;
    }
  }
  /*   if (isState || isEdge) {
      if (graphIsInRenamingState(graphDiv.graphState.currentState)) {
        endRenaming(graphDiv.parentNode);
      }
      else if (graphDiv.graphState.currentState == graphStateEnum.creatingEdge) {
        deselectAll();
      }
    } */
  else {
    deselectAll();
    elem = graphDiv.addStateContextMenu;
  }
  setElemPosition(elem, d3.pointer(event)[1], d3.pointer(event)[0]);
  showElem(elem);
}

function svgRectDblclick(event, d) {
  //if we clicked on other svg elements do nothing
  if (event.srcElement.tagName == "rect") {
    var graphDiv = d3.select(this).node().parentGraphDiv;
    var p = getPointWithoutTransform(d3.pointer(event), graphDiv.svg.svgGroup);

    if (graphDiv.graphState.currentState != graphStateEnum.empty) {
      addState(graphDiv.parentNode, newStateData(graphDiv.parentNode, null, p.x, p.y, false, false));
    }
    else {
      endEmptyGraphState(graphDiv.parentNode);
      initInitialState(graphDiv.parentNode, p.x, p.y);
    }
  }
}

function svgMousemove(event, data) {
  var graphDiv = d3.select(this).node().parentNode;

  if (graphDiv.graphState.currentState == graphStateEnum.creatingEdge) {
    initCreatingTransition(event, graphDiv);
  }
}

function initCreatingTransition(event, graphDiv) {
  var temporaryEdgePath = graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgePath);
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
    graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgeMarker).classed("hidden", false);
    repositionMarker(graphDiv.svg.svgGroup.temporaryEdgeG);
  }
  //mouse is not hovering above any state
  else {
    graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgeMarker).classed("hidden", true);
    temporaryEdgePath.attr("d", getStraightPathDefinition(sourceState.x, sourceState.y, mouseX, mouseY));
  }
  disableAllDragging(graphDiv.svg)
}


/* ------------------------------ zoom & dragging ------------------------------ */

function svgZoomStart(e) {
  var graphDiv = findParentWithClass(e.sourceEvent.srcElement, GRAPH_DIV);
  if (graphDiv) {
    deselectAll(graphDiv.parentNode.getAttribute("id"));
    hideAllContextMenus(graphDiv.parentNode);
  }
}

function svgZoomed(e) {
  var graphDiv = findParentWithClass(e.sourceEvent.srcElement, GRAPH_DIV);
  if (graphDiv && graphDiv.svg) {
    graphDiv.svg.svgGroup.attr("transform", e.transform); //transform = {k:1, x:0, y:0}
    graphDiv.k = e.transform.k;
  }
}

function resetZoom(svg) {
  var t = d3.zoomIdentity;

  //set the view into the middle of the workspace
  t.x = params.width / 2;
  t.y = params.height / 2;

  //reset zoom
  t.k = 1;
  svg.svgGroup.attr("transform", t);
}

function stateDragstart(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  deselectAll(graphDiv.parentNode.getAttribute("id"));
  graphDiv.svg.svgGroup.temporaryEdgeG.classed(graphConsts.selected, false);
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

  var scale = d3.zoomTransform(graphDiv.svg.svgGroup.node()).k;

  var p = applyTransformationToPoint([event.x, event.y], graphDiv.svg.svgGroup);
  if (p.x < (params.width - graphConsts.nodeRadius) && p.x >= graphConsts.nodeRadius) {
    d.x = event.x;
  }
  if (p.y < (params.height - graphConsts.nodeRadius) && p.y >= graphConsts.nodeRadius) {
    d.y = event.y;
  }

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
        //initRenaming(qD, graphStateEnum.mergingEdge, edge.symbols, edgeAlreadyExistsAlert);
        initRenaming(qD, graphStateEnum.mergingEdge, edge.symbols);
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

  if (!jeProhlizeciStranka_new()) {
    generateTextFromData(graphDiv.parentNode);
  }
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
        var str = d3.select(this).select("." + graphConsts.edgePath).attr("d").split(" ");
        str[1] = stateData.x;
        str[2] = stateData.y;

        str[4] = ((+str[1] + (+str[6])) / 2) + edgeData.dx;
        str[5] = ((+str[2] + (+str[7])) / 2) + edgeData.dy;

        tx = (+str[4] + (+((+str[1] + (+str[6])) / 2))) / 2;
        ty = (+str[5] + (+((+str[2] + (+str[7])) / 2))) / 2;

        newDef = str.join(" ");
      }
      d3.select(this).select("." + graphConsts.edgePath).attr("d", newDef);
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
      var str = d3.select(this).select("." + graphConsts.edgePath).attr("d").split(" ");

      str[6] = stateData.x;
      str[7] = stateData.y;

      str[4] = ((+str[1] + (+str[6])) / 2) + edgeData.dx;
      str[5] = ((+str[2] + (+str[7])) / 2) + edgeData.dy;

      var tx = (+str[4] + (+((+str[1] + (+str[6])) / 2))) / 2;
      var ty = (+str[5] + (+((+str[2] + (+str[7])) / 2))) / 2;

      d3.select(this).select("." + graphConsts.edgePath).attr("d", str.join(" "));

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
  var oldPathDefinition = edgeG.select("." + graphConsts.edgePath).attr("d");

  edgeG
    .select("." + graphConsts.edgePath)
    .attr("d", repositionPathCurve(d, event.x, event.y, oldPathDefinition));

  var coords = getEdgeInputPosition(edgeG.select("." + graphConsts.edgePath).attr("d"), d.source == d.target);

  repositionEdgeInput(edgeG.select("foreignObject"), coords.tx, coords.ty);
  repositionMarker(edgeG);
}

function edgeDragend(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  if (!jeProhlizeciStranka_new()) {
    generateTextFromData(graphDiv.parentNode);
  }
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
      var dAttr = d3.select(this).select("." + graphConsts.edgePath).attr("d");
      var coords = getEdgeInputPosition(dAttr, ed.source == ed.target);

      repositionEdgeInput(fo, coords.tx, coords.ty);
    });
}

function repositionEdgeInput(foreignObject, x, y) {
  var input = foreignObject.select("input");
  if (x != -1) {
    var w = parseInt((input.node().style.width).substring(0, input.node().style.width.length - 2));
    foreignObject.attr("x", x - (w / 2));
    input.attr("x", x - (w / 2));
  }
  if (y != -1) {
    var h = 27;
    foreignObject.attr("y", y - (h / 2));
    input.attr("y", y - (h / 2));
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
      d3.select(this).classed(graphConsts.mouseOver, true);

      if (d.id != d3.select(this).select("input").node().value) {
        showFullname(graphDiv.svg.svgGroup.stateFullnameRect, d);
      }
    })
    .on("mouseout", function () {
      toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);
      graphDiv.graphState.mouseOverState = null;
      d3.select(this).classed(graphConsts.mouseOver, false);
    })
    .on("contextmenu", function (event, data) {
      //renaming this => do nothing
      if (graphDiv.graphState.currentState == graphStateEnum.renamingState
        && graphDiv.graphState.selectedState == data) {
        return;
      }
      if (graphIsInRenamingState(graphDiv.graphState.currentState)) {
        endRenaming(graphDiv.parentNode);
        return;
      }

      deselectAll(graphDiv.parentNode.getAttribute("id"));
      hideAllExtras(graphDiv);
      //hideAllContextMenus(graphDiv.parentNode);
      toggleStateSelection(d3.select(this), graphDiv, data);

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
    });
}

function addStateSvg(newState, graphDiv) {
  newState
    .classed(graphConsts.stateGroup, true)
    .classed(graphConsts.stateElem, true)
    .attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  newState
    .append("circle")
    .classed(graphConsts.stateMainCircle, true)
    .classed(graphConsts.stateElem, true)
    .attr("r", graphConsts.nodeRadius);

  var input = newState
    .append("foreignObject")
    .classed(graphConsts.stateElem, true)
    .attr("x", -24)
    .attr("y", -12)
    .attr("height", 23)
    .attr("width", 50)
    .append("xhtml:input")
    .classed("stateInput", true)
    .classed(graphConsts.stateElem, true)
    .on("keyup", function (e, d) {
      if (d3.select(this).node().getAttribute("readonly") == "readonly") return;
      var validSymbols = checkStateNameValidity(graphDiv.parentNode, d, d3.select(this).node().value);
      d3.select(this).node().correct = validSymbols.result;
      if (e.keyCode == 13 && graphDiv.graphState.currentState == graphStateEnum.renamingState) {
        e.preventDefault();
        tryToRenameState(graphDiv.parentNode, graphDiv.graphState.selectedState, d3.select(this).node().value);
      }
    })
    .on("keydown", function (e, d) {
      if (d3.select(this).node().getAttribute("readonly") == "readonly") return;
      if (e.keyCode == 13) {
        e.preventDefault();
      }
    })
    .on("blur", function (e, d) {
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
      graphDiv.graphState.currentState = graphStateEnum.default;
      enableAllDragging(graphDiv.svg);
    });


  disableInput(input.node());
  input.node().correct = false;
  if (origin == elemOrigin.fromExisting || origin == elemOrigin.fromTable) {
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
    stateGroup.classed(graphConsts.selected, true);
  }
}

function toggleAcceptingState(questionDiv, stateData, stateG) {
  if (stateData.accepting) {
    stateG.select("." + graphConsts.stateAccCircle).remove();
  } else {
    addAcceptingCircle(stateG);
  }
  stateData.accepting = !stateData.accepting;

  if (!jeProhlizeciStranka_new()) {
    generateTextFromData(questionDiv);
  }
}

function addAcceptingCircle(stateG) {
  stateG
    .append("circle")
    .classed(graphConsts.stateAccCircle, true)
    .classed(graphConsts.stateElem, true)
    .attr("r", graphConsts.nodeRadius - 3.5);
  stateG.select("foreignObject").raise();
}

function setNewStateAsInitial(questionDiv, stateData) {
  setInitStateAsNotInitial(questionDiv);

  questionDiv.statesData
    .filter(function (d) { return d.id == stateData.id; })
    .map(function (d) { d.initial = true; });

  questionDiv.graphDiv.graphState.initialState = stateData;
  repositionInitArrow(questionDiv.graphDiv, stateData, 3.14);

  if (!jeProhlizeciStranka_new()) {
    generateTextFromData(questionDiv);
  }
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

  if (!jeProhlizeciStranka_new()) {
    generateTextFromData(questionDiv);
  }
}

function deleteState(questionDiv, stateData) {
  if (stateData.initial == true) {
    hideInitArrow(questionDiv.graphDiv);
  }
  deleteStateSvg(questionDiv.graphDiv.svg.svgGroup, stateData);
  deleteStateEdges(questionDiv, stateData);
  deleteStateData(questionDiv, stateData);
  updateStateGroups(questionDiv.graphDiv.svg.svgGroup);

  if (!jeProhlizeciStranka_new()) {
    generateTextFromData(questionDiv);
    if (isEmpty(questionDiv)) {
      resetZoom(questionDiv.graphDiv.svg);
      resetStateIds(questionDiv);
      initEmptyGraphState(questionDiv);
    }
  }
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

/* ------------------------------ transition (edge) functions ------------------------------ */

function addEdge(questionDiv, edgeData, origin = elemOrigin.default) {
  var temporaryEdgePath = questionDiv.graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgePath);

  if (edgeData.source == edgeData.target && origin == elemOrigin.default) {
    edgeData.angle = temporaryEdgePath.node().angle;
  }
  questionDiv.edgesData.push(edgeData);

  var newEdge = questionDiv.graphDiv.svg.svgGroup.edgeGroups
    .data(questionDiv.edgesData).enter().append("g").classed(graphConsts.edgeGroup, true);

  newEdge.node().parentGraphDiv = questionDiv.graphDiv;


  addEdgeSvg(questionDiv, newEdge, origin, temporaryEdgePath.attr("d"));

  repositionMarker(newEdge);
  updateEdgeInputPosition(questionDiv, newEdge);
  updateEdgeGroups(questionDiv.graphDiv.svg.svgGroup);


  if (!jeProhlizeciStranka_new()) {
    addEdgeEvents(questionDiv, newEdge, origin);
    generateTextFromData(questionDiv);
  }

  return newEdge;
}

function addEdgeEvents(questionDiv, edge, origin) {
  edge
    .call(dragEdge)
    .on("mouseover", function () {
      d3.select(this).classed(graphConsts.mouseOver, true);
    })
    .on("mouseout", function () {
      d3.select(this).classed(graphConsts.mouseOver, false);
    })
    .on("dblclick", function (event, d) {
      if (questionDiv.graphDiv.graphState.selectedEdge == d) {
        initRenaming(questionDiv, graphStateEnum.renamingEdge, questionDiv.graphDiv.graphState.selectedEdge.symbols);
      }
    })
    .on("contextmenu", function (event, d) {
      event.preventDefault();

      if (questionDiv.graphDiv.graphState.currentState == graphStateEnum.renamingEdge) {
        //endRenaming(questionDiv);
        return;
      }

      deselectAll(questionDiv.getAttribute("id"));
      hideAllContextMenus(questionDiv);
      toggleEdgeSelection(d3.select(this), questionDiv.graphDiv);
    });
}

function addEdgeSvg(questionDiv, newEdge, origin, tempEdgeDef) {
  newEdge
    .append("svg:path")
    .classed(graphConsts.edgePath, true)
    .classed(graphConsts.edgeElem, true)
    .attr("d", function (d) {
      if (origin == elemOrigin.fromExisting) {
        return d.source != d.target ? reverseCalculateEdge(d.source, d.target, d.dx, d.dy) : calculateSelfloop(d.source.x, d.source.y, d.angle);
      }
      if (d.source == d.target) {
        if (origin == elemOrigin.fromTable) {
          d.angle = 1.55;
          return calculateSelfloop(d.source.x, d.source.y, d.angle);
        }
        return tempEdgeDef;
      }
      return getStraightPathDefinition(d.source.x, d.source.y, d.target.x, d.target.y);
    });

  newEdge
    .append("svg:path")
    .classed(graphConsts.edgeMarker, true)
    .classed(graphConsts.edgeElem, true)
    .attr("marker-end", "url(#end-arrow" + questionDiv.getAttribute("id") + ")");

  var fo = newEdge
    .append("foreignObject")
    .classed(graphConsts.edgeElem, true)
    .attr("height", 29)
    .attr("width", 50);

  var input = fo
    .append("xhtml:input")
    .classed("edgeInput", true)
    .classed(graphConsts.edgeElem, true)
    .on("click", function (e) {
      e.preventDefault();
      e.stopPropagation(); //aby sa to nebilo s oznacovanim edge
    })
    .on("keydown", function (e, d) {
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
    .on("keyup", function (e, d) {
      var input = d3.select(this).node();
      if (input.getAttribute("readonly") != "readonly") {
        var validSymbols = checkEdgeValidity(questionDiv, d.id, d.source, input.value);
        input.correct = validSymbols.result;
      }

    })
    .on("blur", function (e, d) {
      getEdgeGroupById(questionDiv, d.id).classed("activeRenaming", false);
      var input = d3.select(this).node();
      disableInput(input);


      if (input.correct == false) {
        if (questionDiv.graphDiv.graphState.currentState == graphStateEnum.namingEdge) {
          deleteEdge(questionDiv, d);
          deselectAll();
        }
        else if (questionDiv.graphDiv.graphState.currentState == graphStateEnum.namingEdge ||
          questionDiv.graphDiv.graphState.currentState == graphStateEnum.mergingEdge ||
          questionDiv.graphDiv.graphState.currentState == graphStateEnum.renamingEdge) {
          setEdgeInput(input, d.symbols);
          setEdgeInputWidth(input);
          updateEdgeInputPosition(questionDiv, getEdgeGroupById(questionDiv, d.id));
        }
      }
      else {
        renameEdge(questionDiv, d, input.value);
      }
      questionDiv.graphDiv.graphState.currentState = graphStateEnum.default;
      hideElem(questionDiv.graphDiv.renameError);
      enableAllDragging(questionDiv.graphDiv.svg);
    });


  input.node().correct = false;


  setEdgeInput(input.node(), newEdge.datum().symbols);
  if (origin == elemOrigin.default && questionDiv.type == "EFA") {
    setEdgeInput(input.node(), epsSymbol);
    input.node().correct = true;
  }
  setEdgeInputWidth(input.node(), 50);
  if (origin == elemOrigin.fromExisting || origin == elemOrigin.fromTable) {
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
    edgeGroup.classed(graphConsts.selected, true);
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
  if (!jeProhlizeciStranka_new()) {
    generateTextFromData(questionDiv);
  }
}

function deleteEdge(questionDiv, edgeData) {
  deleteEdgeSvg(questionDiv.graphDiv.svg.svgGroup, edgeData);
  updateEdgeGroups(questionDiv.graphDiv.svg.svgGroup);
  deleteEdgeData(questionDiv.edgesData, edgeData);
  if (!jeProhlizeciStranka_new()) {
    generateTextFromData(questionDiv);
  }
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
  var validityCheck = checkEdgeValidity(questionDiv, edgeData.id, edgeData.source, newSymbols);
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

/* ------------------------------ NEW STATE CONTEXT MENU ------------------------------ */

function createAddStateMenu(questionDiv) {
  var div = document.createElement("div");
  div.setAttribute("class", CONTEXT_MENU);

  var button = createContextMenuButton(addStateText);
  button.addEventListener("click", function (e) {
    var y = e.clientY - questionDiv.graphDiv.svg.node().getBoundingClientRect().y;
    var x = e.clientX - questionDiv.graphDiv.svg.node().getBoundingClientRect().x;
    var coords = getPointWithoutTransform([x, y], questionDiv.graphDiv.svg.svgGroup);

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
  stateContextMenuDiv.setAttribute("class", CONTEXT_MENU);

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

  elemG.node().classList.add("activeRenaming");
  input = elemG.select("input").node();
  enableInput(input);

  input.focus();

  input.selectionStart = input.selectionEnd = 10000; //set caret position to end
  disableAllDragging(questionDiv.graphDiv.svg);
  questionDiv.graphDiv.svg.svgGroup.selectAll("." + graphConsts.stateGroup).on(".drag", null);

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
  var bcr, x, y;
  if (state == graphStateEnum.renamingState) {
    //bcr = activeElemG.select("." + graphConsts.stateMainCircle).node().getBoundingClientRect();
    //x = bcr.x + 6*k + window.scrollX;
    //y = bcr.y + window.scrollY + (graphConsts.nodeRadius + 23)*k;
    var p = applyTransformationToPoint([activeElemG.datum().x, activeElemG.datum().y + 13], activeElemG);
    x = p.x;
    y = p.y;
  }
  else {
    /*     bcr = activeElemG.select("input").node().getBoundingClientRect();
        x = bcr.x + window.scrollX;
        y = bcr.y + window.scrollY + 30*k; */
    var input = activeElemG.select("input");
    var inputWidth = parseInt((input.node().style.width).substring(0, input.node().style.width.length - 2));

    var t = getEdgeInputPosition(
      activeElemG.select("." + graphConsts.edgePath).attr("d"),
      activeElemG.datum().source == activeElemG.datum().target);

    var p = applyTransformationToPoint([t.tx - inputWidth / 2, t.ty + 16], activeElemG);
    x = p.x;
    y = p.y;

  }
  //
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

  var del = createContextMenuButton(deleteEdgeText);
  del.addEventListener("click", function () {
    deleteEdgeHandler(questionDiv);
  })

  edgeContextMenuDiv.appendChild(del);

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
    edgeGroup.select("." + graphConsts.edgePath),
    edgeGroup.select("." + graphConsts.edgeMarker),
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
    .classed(graphConsts.selected, false);
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
    .classed(graphConsts.selected, false);
  graphDiv.graphState.selectedEdge = null;
}


/* ------------------------------ Updating functions ------------------------------ */

function generateTextFromData(questionDiv) {
  var result;
  if (questionDiv.statesData.length === 0 && questionDiv.edgesData.length === 0) {
    result = "";
  }
  else {
    result = generateQuestionResult(questionDiv);
  }

  //questionDiv.textArea.value = result;
  questionDiv.textArea.innerText = result;
  $(questionDiv.textArea).trigger("change");
}

function generateQuestionResult(questionDiv) {
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
    for (let i = 0; i < questionDiv.edgesData.length; i++) {
      const edge = questionDiv.edgesData[i];
      if (!(checkEdgeValidity(questionDiv, edge.id, edge.source, edge.symbols).result)) continue;

      edge.symbols.split(",").forEach((symbol) => {
        if (symbol == epsSymbol) {
          symbol = "\\e";
        }
        result += "(" + edge.source.id + "," + symbol + ")=" + edge.target.id + " ";
      });
    }
  }
  else if (typeIsNondeterministic(questionDiv.type)) {
    var transitions = new Map();

    for (let i = 0; i < questionDiv.edgesData.length; i++) {
      const edge = questionDiv.edgesData[i];
      if (!(checkEdgeValidity(questionDiv, edge.id, edge.source, edge.symbols).result)) continue;

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
    }

    for (let [key, value] of transitions.entries()) {
      result += key + "={" + value + "} ";
    }
  }

  result += "final={";
  if (acceptingStates.length > 0) {
    for (var i = 0; i < acceptingStates.length; i++) {
      result += acceptingStates[i].id;
      if (i < acceptingStates.length - 1) {
        result += ",";
      }
    }
  }
  result += "}";

  //position data
  result += " ##";
  result += "states";
  questionDiv.statesData.forEach(function (d) {
    result += "@" + d.id
      + ";" + d.x.toFixed(2)
      + ";" + d.y.toFixed(2)
      + ";" + (d.initial ? 1 : 0)
      + ";" + (d.accepting ? 1 : 0);

  });
  result += "edges";
  questionDiv.edgesData.forEach(function (d) {
    result += "@" //+ d.id
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
  return result;
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
  if (!dataString || dataString == "") return;

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
      if (checkEdgeValidity(questionDiv, data.id, data.source, symbols).result) {
        addEdge(questionDiv, data, elemOrigin.fromExisting);
      }
    }
  }
  //TODO parse init arrow angle
}

/* ------------------------------ HTML elements utils ------------------------------ */

function hideElem(element) {
  element.style.display = "none";
}

function showElem(element, inline = false) {
  if (!element) return;

  if (inline) {
    element.style.display = "inline-block";
  }
  else {
    element.style.display = "block";
  }
}

function hideAllContextMenus(questionDiv) {
  hideElem(questionDiv.graphDiv.stateContextMenuDiv);
  hideElem(questionDiv.graphDiv.edgeContextMenuDiv);
  hideElem(questionDiv.graphDiv.addStateContextMenu);
}

function clickGraph(questionDiv) {
  hideElem(questionDiv.textArea);
  hideElem(questionDiv.tableDiv);

  showElem(questionDiv.graphDiv);
  showElem(questionDiv.hintDiv);

  if (!jeProhlizeciStranka_new()) {
    deselectAll();
  }
  questionDiv.lastEdited = "graph"
}

function clickTable(questionDiv) {
  if (!jeProhlizeciStranka_new()) {
    deselectAll();
  }
  if (questionDiv.lastEdited == "table") {
    return;
  }
  if (questionDiv.lastEdited == "graph") {
    updateSvgDimensions(questionDiv);
  }
  hideElem(questionDiv.graphDiv);
  hideElem(questionDiv.hintDiv);
  hideElem(questionDiv.textArea);

  createTableFromData(questionDiv);
  showElem(questionDiv.tableDiv);
  questionDiv.lastEdited = "table";
}

function clickText(questionDiv) {
  if (!jeProhlizeciStranka_new()) {
    deselectAll();
  }
  hideElem(questionDiv.graphDiv);
  hideElem(questionDiv.hintDiv);
  hideElem(questionDiv.tableDiv);

  showElem(questionDiv.textArea);
  questionDiv.lastEdited = "text";
}

function clickHintButton(questionDiv) {
  var hintContentDiv = questionDiv.hintDiv.contentDiv;
  if (!jeProhlizeciStranka_new()) deselectAll();
  if (hintContentDiv.style.display == "none") {
    showElem(hintContentDiv, true);
  }
  else {
    hideElem(hintContentDiv);
  }
}

function setupHints(div) {
  for (const property in hints) {
    div.appendChild(createParagraph(hints[property]));
  }
}

function createParagraph(string) {
  var p = document.createElement("P");
  p.setAttribute("class", "hint-paragraph");
  p.innerHTML = "• " + string;
  return p;
}

function createButton(text, className) {
  var b = document.createElement('input');
  b.type = 'button';
  b.value = text;
  b.style.marginLeft = "0px";
  b.style.minHeight = "36px";
  b.style.minWidth = "60px"
  b.style.marginRight = "5px";
  b.style.marginTop = "7px";
  b.setAttribute("class", className);
  return b;
}

function createContextMenuButton(innerText) {
  var b = createButton(innerText, "context-menu-button");
  b.style.width = "100%";
  b.style.marginTop = "3px";
  b.style.marginBottom = "3px";
  b.style.marginLeft = "0px";
  b.style.marginRight = "0px";
  return b;
}

function findParentWithClass(childNode, parentClass) {
  var parent = null, found = 0;
  try {
    parent = childNode.parentNode;
    while (found == 0 && (parent != null || parent.nodeName != "body")) {
      if (parent.classList.contains(parentClass)) {
        found = 1;
      } else {
        parent = parent.parentNode;
      }
    }
  }
  catch (e) { }
  return parent;
}

function disableInput(input) {
  input.setAttribute("readonly", "readonly");
}

function enableInput(input) {
  input.removeAttribute("readonly");
}

function visualLength(val) {
  var ruler = document.getElementById("ruler");
  ruler.innerHTML = val;
  return ruler.offsetWidth;
}

function visualHeight(val) {
  var ruler = document.getElementById("ruler");
  ruler.innerHTML = val;
  return ruler.offsetHeight;
}

function tableVisualLength(val) {
  var ruler = document.getElementById("table-ruler");
  ruler.innerHTML = val;
  return ruler.offsetWidth;
}

function showRenameError(msg, questionDiv) {
  var p = questionDiv.graphDiv.renameError;
  p.innerHTML = msg;
  showElem(p);
}

function setElemPosition(elem, top, left) {
  elem.style.top = top + "px";
  elem.style.left = left + "px";
}


/* ------------------------------ Graph - Edge utils ------------------------------ */

function setEdgeInput(input, value) {
  input.setAttribute("value", value);
  input.value = value;
}

function setEdgeInputWidth(input, len = null) {
  if (len == null) {
    len = visualLength(input.value);
    len += 0; //padding
  }
  if (len < 15) len = 15;

  d3.select(input.parentNode).attr("width", len + 8);
  input.style.width = (len) + "px";
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

function reverseCalculateEdge(source, target, dx, dy) {
  var s1 = source;
  var s2 = target;

  var c1 = ((s1.x + s2.x) / 2) + dx;
  var c2 = ((s1.y + s2.y) / 2) + dy;

  return "M " + s1.x + " " + s1.y + " Q " + c1 + " " + c2 + " " + s2.x + " " + s2.y;
}

/**
* Function to determine if state already has another outgoing edge with symbol (used in DFA)
* @param {*} questionDiv 
* @param {*} edgeId 
* @param {*} stateId 
* @param {*} symbols 
*/
function transitionWithSymbolExists(questionDiv, edgeId, stateId, symbols) {
  for (let i = 0; i < questionDiv.edgesData.length; i++) {
    const ed = questionDiv.edgesData[i];
    if (ed.source.id === stateId && (edgeId == null || (edgeId != null && edgeId != ed.id))) {
      if (intersects(ed.symbols.split(","), symbols.split(","))) {
        return true;
      }
    }
  }
  return false;
}

function hideEdge(edgeG) {
  edgeG.select("." + graphConsts.edgePath).classed("hidden", true);
  edgeG.select("." + graphConsts.edgeMarker).classed("hidden", true);
}

function repositionTemporaryEdgeToState(stateData) {
  temporaryEdgePath
    .classed("hidden", false)
    .attr("d", "M" + stateData.x + "," + stateData.y + "L" + stateData.x + "," + stateData.y);
}

function checkEdgeValidity(questionDiv, edgeId, sourceStateData, symbols) {
  var err = "", valid = true;
  var expectedSyntax = questionDiv.type == "EFA" ? expectedEFASyntax : expectedDFASyntax;

  if (symbols == null || symbols == "") {
    err = errors.emptyTransition;
    valid = false;
  }
  else if (incorrectGraphTransitionsSyntax(questionDiv.type, symbols)) {
    err = INVALID_SYNTAX_ERROR + "<br>" + expectedSyntax;
    valid = false;
  }
  else if (questionDiv.type == "DFA") {
    if (edgeId != null && transitionWithSymbolExists(questionDiv, edgeId, sourceStateData.id, symbols)
      || edgeId == null && transitionWithSymbolExists(questionDiv, null, sourceStateData.id, symbols)) {
      err = DFAInvalidTransition;
      valid = false;
    }
  }
  else if (symbols.length > 300) {
    err = errors.transitionSymbolsTooLong;
    valid = false;
  }
  return { result: valid, errMessage: err };
}


/* ------------------------------ Graph - State utils ------------------------------ */

function setStateInputValue(input, value) {
  input.realValue = value;
  var cropped = getCroppedTitle(input);
  input.setAttribute("value", cropped);
  input.value = cropped;
}

function getCroppedTitle(input) {
  var title = input.realValue;
  var shortened = false;
  var padding = 10;

  while (visualLength(title) >= (graphConsts.nodeRadius * 2) - padding) {
    title = title.substring(0, title.length - 1); //orezanie o 1 pismenko
    shortened = true;
  }
  if (shortened) {
    title = title.substring(0, title.length - 1).concat("..");
  }
  return title;
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

function toggleFullnameVisibitity(rect, visible = false) {
  rect.style("visibility", function () { return visible == true ? "visible" : "hidden"; });
  rect.FullnameText.style("visibility", function () { return visible == true ? "visible" : "hidden"; });
}

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

function checkStateNameValidity(questionDiv, stateData, newId) {
  var err = "";
  var valid = false;

  if (!newId) {
    err = errors.emptyState;
  }
  else if (!stateIdIsUnique(questionDiv.statesData, stateData, newId)) {
    err = stateNameAlreadyExists;
  }
  else if (incorrectStateSyntax(newId)) {
    err = errors.incorrectStateSyntax;
  }
  else if (newId.length > 50) {
    err = errors.stateNameTooLong;
  }
  else {
    valid = true;
  }
  return {
    result: valid,
    errMessage: err
  };
}

/* ------------------------------ Graph - State placement functions ------------------------------ */

function findStatePlacement(questionDiv, newStateData) {
  var states = questionDiv.statesData;
  //var edges = questionDiv.edgesData;


  var baseX = -(questionDiv.graphDiv.lastWidth / 2) + 100;
  var baseY = -(questionDiv.graphDiv.lastHeight / 2) + 100;
  var x = baseX;
  var y = baseY;
  var mult = 5;

  while (invalidStatePosition(states, newStateData)) {
    x += graphConsts.nodeRadius * mult;
    if (x > questionDiv.graphDiv.lastWidth) {
      x = baseX; // posunutie x na zaciatok riadku
      y += graphConsts.nodeRadius * mult; //posunutie dolu
    }
    if (y + graphConsts.nodeRadius + 100 > questionDiv.graphDiv.lastHeight) {
      questionDiv.graphDiv.style.height = y + graphConsts.nodeRadius + 100;
    }
    newStateData.x = x;
    newStateData.y = y;
  }
  newStateData.isNew = false;
  return newStateData;
}

function invalidStatePosition(states, state) {
  for (var i = 0; i < states.length; i++) {
    if (state.id == states[i].id) {
      continue;
    }
    if ((Math.abs(states[i].x - state.x) < graphConsts.nodeRadius * 2)
      && (Math.abs(states[i].y - state.y) < graphConsts.nodeRadius * 2)) {
      return true;
    }
  }
  return false;
}


/* ------------------------------ General Graph related utils ------------------------------ */

function isEmpty(div) {
  return div.statesData.length === 0 && div.edgesData.length === 0;
}

function typeIsNondeterministic(type) {
  return type == "NFA" || type == "EFA";
}

function typeIsRegOrGram(type) {
  return type == "GRA" || type == "REG";
}

function graphIsInRenamingState(state) {
  return state == graphStateEnum.renamingState ||
    state == graphStateEnum.renamingEdge ||
    state == graphStateEnum.namingEdge ||
    state == graphStateEnum.mergingEdge;
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

function resetStateIds(questionDiv) {
  questionDiv.graphDiv.stateIdCounter = 0;
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

function updateEdgeGroups(svgGroup) {
  svgGroup.edgeGroups = svgGroup.select(".edges").selectAll("g");
}

function updateStateGroups(svgGroup) {
  svgGroup.stateGroups = svgGroup.select(".states").selectAll("g");
}

function updateSvgDimensions(questionDiv) {
  questionDiv.graphDiv.lastHeight = questionDiv.graphDiv.offsetHeight;
  questionDiv.graphDiv.lastWidth = questionDiv.graphDiv.offsetWidth;
}

function disableAllDragging(svg) {
  var dragState2 = d3.drag()
    .on("start", stateDragstart)
    .on("end", stateDragend);
  svg.svgGroup.selectAll("." + graphConsts.stateGroup).call(dragState2);
  svg.svgGroup.selectAll("." + graphConsts.edgeGroup).on(".drag", null);
  svg.on(".zoom", null);
}

function enableAllDragging(svg) {
  if (!jeProhlizeciStranka_new()) {
    svg.svgGroup.selectAll("." + graphConsts.stateGroup).call(dragState);
    svg.svgGroup.selectAll("." + graphConsts.edgeGroup).call(dragEdge);
    svg.call(zoom).on("dblclick.zoom", null);
  }
}

function deselectAll(exceptionId = null) {
  var questions = document.querySelectorAll("." + QUESTION_DIV);
  d3.selectAll(questions)
    .selectAll("." + GRAPH_DIV)
    .each(function () {
      var graphDiv = d3.select(this).node();
      if (graphDiv.parentNode.getAttribute("id") != exceptionId) {

        //if current selected element is not in this graphDiv
        if (SELECTED_ELEM_GROUP && SELECTED_ELEM_GROUP.node().parentGraphDiv == graphDiv) {
          SELECTED_ELEM_GROUP.select("input").node().blur();
        }

        if (graphDiv.graphState.currentState != graphStateEnum.empty) {
          graphDiv.graphState.currentState = graphStateEnum.default;
        }
        graphDiv.graphState.lastTargetState = null;

        removeSelectionFromState(graphDiv);
        removeSelectionFromEdge(graphDiv);
        hideAllContextMenus(graphDiv.parentNode);
        hideElem(graphDiv.renameError);
        hideEdge(graphDiv.svg.svgGroup.temporaryEdgeG);

        //graphDiv.svg.svgGroup.temporaryEdgeG.classed(graphConsts.selectedClass, false);
        enableAllDragging(graphDiv.svg);
      }
    });
}

function hideAllExtras(graphDiv) {
  hideAllContextMenus(graphDiv.parentNode);
  hideElem(graphDiv.renameError);
  hideEdge(graphDiv.svg.svgGroup.temporaryEdgeG);
}


/* ------------------------------ Graph - getters ------------------------------ */

function getStateDataById(questionDiv, id) {
  return getElemById(questionDiv.statesData, id);
}

function getEdgeDataById(questionDiv, id) {
  return getElemById(questionDiv.edgesData, id);
}

function getElemById(array, id) {
  for (let i = 0; i < array.length; i++) {
    const data = array[i];
    if (data.id == id) return data;
  }
  return null;
}

function getStateGroupById(questionDiv, id) {
  var res = null;
  questionDiv.graphDiv.svg.svgGroup.stateGroups
    .each(function (d) { if (d.id == id) res = d3.select(this); });
  return res;
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

function getEdgeGroupById(questionDiv, id) {
  return questionDiv.graphDiv.svg.svgGroup.edgeGroups
    .filter(function (d) {
      return d.id == id;
    });
}


/* ------------------------------ Math utils ------------------------------ */

function calculateSelfloop(x, y, angle) {
  return "M " + x + " " + y
    + " C " + cubicControlPoints(x, y, angle)
    + " " + x + " " + y;
}

function closestPointOnCircle(x, y, circleX, circleY) {
  var dx = x - circleX;
  var dy = y - circleY;
  var scale = Math.sqrt(dx * dx + dy * dy);
  return {
    x: (circleX + dx * (graphConsts.nodeRadius + 4) / scale),
    y: (circleY + dy * (graphConsts.nodeRadius + 4) / scale),
  };
}

/**
* 
* @param {*} x 
* @param {*} y 
* @param {*} d 
* @param {*} mult  how long the self loop will be
* @param {*} div   wideness of loop - the lesser the wider
*/
function cubicControlPoints(x, y, d, mult = 110, div = 6) {
  var x1 = (+x + (Math.cos(d + Math.PI / div) * mult)).toFixed(3);
  var y1 = (+y - (Math.sin(d + Math.PI / div) * mult)).toFixed(3);
  var x2 = (+x + (Math.cos(d - Math.PI / div) * mult)).toFixed(3);
  var y2 = (+y - (Math.sin(d - Math.PI / div) * mult)).toFixed(3);

  return x1 + " " + y1 + " " + x2 + " " + y2;
}

function midpoint(x1, x2) {
  return (x1 + x2) / 2;
}

function distBetween(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
}

function getPointWithoutTransform(oldXy, selection) {
  var transform = d3.zoomTransform(selection.node());
  var res = transform.invert(oldXy);

  return {
    x: res[0],
    y: res[1],
  };
}

function applyTransformationToPoint(point, selection) {
  var transform = d3.zoomTransform(selection.node());
  var res = transform.apply(point);

  return {
    x: res[0],
    y: res[1],
  };
}


/* ------------------------------ Basic utils ------------------------------ */

function replaceEpsilon(array) {
  return array.toString().replace(/\\e/g, epsSymbol);
}

function intersects(array1, array2) {
  for (let i = 0; i < array1.length; i++) {
    if (array2.includes(array1[i])) {
      return true;
    }
  }
  return false;
}

function removeDuplicates(array) {
  return array.filter(function (item, pos) {
    return item != '' && array.indexOf(item) == pos;
  });
}


/* ------------------------------ Table ------------------------------ */
const STATE_INDEX = 2;
var MIN_TABLE_CELL_WIDTH = "50px";
var MIN_STATE_WIDTH = "50px";

function createTable(questionDiv) {
  var table = document.createElement("table");
  table.setAttribute("class", tableClasses.myTable);
  table.style.width = "0";
  table.selectedCellInput = null;
  table.selectedInitDiv = null;
  table.questionDiv = questionDiv;
  table.alertStatus = questionDiv.tableDiv.alertText;
  questionDiv.tableDiv.table = table;
  questionDiv.tableDiv.appendChild(table);
  return table;
}

function createTableFromData(questionDiv) {
  var oldTable = questionDiv.tableDiv.table;
  var table = createTable(questionDiv);

  table.states = [], table.exitStates = [], table.symbols = [];
  table.initState = null;

  questionDiv.statesData.forEach(d => {
    table.states.push(d.id);
    if (d.initial) {
      table.initState = d.id;
    }
    if (d.accepting) {
      table.exitStates.push(d.id);
    }
  });

  questionDiv.edgesData.forEach(d => {
    d.symbols.split(',').forEach(symb => {
      if (!table.symbols.includes(symb)) table.symbols.push(symb);
    });
  });

  //table.states.sort();
  table.symbols.sort();

  MIN_STATE_WIDTH = findLongestTitle(table.states) + "px";
  //create first row = consisting of 3 inactive cells
  var row1 = table.insertRow(table.rows.length); // -1 ?
  insertInactiveCell(row1, 0);
  insertInactiveCell(row1, 1);
  insertInactiveCell(row1, 2);

  //create second row - "symbols" row
  var row2 = table.insertRow(table.rows.length);
  insertInactiveCell(row2, 0);
  insertInactiveCell(row2, 1);
  var cell = insertInactiveCell(row2, 2);
  
  cell.style.width = MIN_STATE_WIDTH;
  addResizable(table, cell);

  var maxColWidth = findLongestTitle(table.symbols) - 10;

  // filling out columns' headers from symbols and delete buttons above them
  table.symbols.forEach(symb => {
    insertColumnDeleteButton(table, row1);
    insertColumnHeader(row2, symb, maxColWidth);
  });
  insertColumnAddButton(table, row1);

  // filling out rows' headers (states' titles)
  table.states.forEach(stateTitle => {
    var row = table.insertRow(table.rows.length);
    insertRowDeleteButton(table, row);

    var arrCell = insertArrows(table, row, row.cells.length);

    insertRowHeader(row, stateTitle, MIN_STATE_WIDTH);

    if (table.initState == stateTitle) {
      $(arrCell.initArrow).addClass("selected-arrow");
      table.selectedInitDiv = arrCell.initArrow;
    }
    if (table.exitStates.includes(stateTitle)) {
      $(arrCell.accArrow).addClass("selected-arrow");
    }

    for (var j = 0; j < table.symbols.length; j++) {
      insertInnerCell(table, row);
    }
  });
  insertRowAddButton(table);

  // filling transitions
  questionDiv.edgesData.forEach(ed => {
    var row = table.rows[table.states.indexOf(ed.source.id) + 2];

    ed.symbols.split(",").forEach(symb => {
      var cell = row.cells[table.symbols.indexOf(symb) + 3];

      if (questionDiv.type == "DFA") {
        cell.myDiv.value = ed.target.id;
      }
      else if (typeIsNondeterministic(questionDiv.type)) {
        var result = cell.myDiv.value.replace(/{|}/g, "");
        if (result == "") {
          result = ed.target.id
        }
        else {
          result = result.split(",").sort().join(",");
          result += "," + ed.target.id;
        }
        cell.myDiv.value = "{" + result + "}";
      }
      cell.myDiv.prevValue = cell.myDiv.value;
      
      maxColWidth = Math.max(maxColWidth, tableVisualLength(cell.myDiv.value));
    });
  });

  resetInnerCellSizes(table, maxColWidth + 10 + "px");

  questionDiv.tableDiv.removeChild(oldTable);
  questionDiv.tableDiv.removeChild(questionDiv.tableDiv.alertText);
  questionDiv.tableDiv.appendChild(questionDiv.tableDiv.alertText);

  if (jeProhlizeciStranka_new()) {
    $(table).find("input").prop("disabled", true).addClass("mydisabled");
  }
}

function insertArrows(table, row, index) {
  var cell = insertCell(row, index, ["arrow-td"], "40px");
  cell.style.minWidth = "40px";

  var initArr = document.createElement("div");
  $(initArr).prop("class", "top-arrow base-arrow");
  $(initArr).prop("title", tableInitialButtonName);
  initArr.innerHTML = initSymbol;


  var accArr = document.createElement("div");
  $(accArr).prop("class", "bottom-arrow base-arrow");
  $(accArr).prop("title", tableAcceptingButtonName);
  accArr.innerHTML = accSymbol;

  if (!jeProhlizeciStranka_new()) {
    $(initArr).click(() => setInitDiv(table, initArr));
    $(accArr).click(() => toggleAccArrow(accArr));
  }

  cell.initArrow = initArr;
  cell.accArrow = accArr;

  cell.appendChild(initArr);
  cell.appendChild(accArr);

  return cell;
}

function insertColumnAddButton(table, row) {
  var cell = insertCellWithDiv(row, null, [tableClasses.addButton, tableClasses.noselectCell], null, addSymbol);
  if (!jeProhlizeciStranka_new()) {
    $(cell).prop("title", tableAddSymbolHover);
    cell.addEventListener("click", () => insertColumn(table));
  }
}

function insertColumnDeleteButton(table, row) {
  var cell = insertCellWithDiv(row, null,
    [tableClasses.deleteButton, tableClasses.noselectCell], null, delSymbol);


  if (!jeProhlizeciStranka_new()) {
    $(cell).prop("title", tableDelSymbolHover);
    cell.addEventListener("click", () => deleteColumn(table, cell.cellIndex));
  }
}

function insertRowAddButton(table) {
  var newRow = table.insertRow(table.rows.length);
  var cell = insertCellWithDiv(newRow, 0, [tableClasses.addButton, tableClasses.noselectCell], null, addSymbol);

  if (!jeProhlizeciStranka_new()) {
    $(cell).prop("title", tableAddRowHover);
    cell.addEventListener("click", function (e) { insertRow(table); });
  }
}

function insertRowDeleteButton(table, row) {
  var cell = insertCellWithDiv(row, 0,
    [tableClasses.deleteButton, tableClasses.noselectCell], null, delSymbol);

  if (!jeProhlizeciStranka_new()) {
    $(cell).prop("title", tableDelRowHover);
    cell.addEventListener("click", function () { deleteRow(table, cell.parentNode.rowIndex); });
  }
}

function insertInnerCell(table, row) {
  var cell = insertCell(row, row.cells.length, [tableClasses.myCell]);

  var value = typeIsNondeterministic(table.questionDiv.type) ? "{}" : "";
  var input = createInput([tableClasses.inputCellDiv], value, value,
    table.rows[1].cells[cell.cellIndex].style.minWidth);

  input.addEventListener("click", (e) => inputClickHandler(e, table));
  input.addEventListener("input", (e) => tableCellChanged(e, table, input));
  input.addEventListener("focusout", (e) => tableCellChangedFinal(e, table, input));

  var regex = typeIsNondeterministic(table.questionDiv.type) ? /[a-zA-Z0-9{},]/ : /[a-zA-Z0-9\-]/;

  input.addEventListener("keypress", function (e) { cellKeypressHandler(e, regex); });

  cell.myDiv = input;
  cell.appendChild(input);
  return cell;
}

function insertRowHeader(row, name, width) {
  var cell = insertCell(row, row.cells.length, ["row-header-cell"], width);
  var table = findParentWithClass(cell, tableClasses.myTable);
  var input = createInput([tableClasses.inputCellDiv, tableClasses.rowHeader], name, name, width);
  input.defaultClass = tableClasses.rowHeader;

  $(input).click(() => tableHeaderCellClick(table, input));
  $(input).on("input", (e) => tableRhChanged(e, table));
  $(input).focusout((e) => tableRhChangedFinal(e, table, input));
  $(input).keypress((e) => cellKeypressHandler(e, stateSyntax()));

  cell.myDiv = input;
  cell.appendChild(input);
  return cell;
}

function insertColumnHeader(row, symbol, width) {
  var cell = insertCell(row, row.cells.length, [tableClasses.columnHeader], width);
  var table = findParentWithClass(cell, tableClasses.myTable);
  var input = createInput([tableClasses.inputColumnHeaderDiv, tableClasses.inputCellDiv], symbol, symbol, width);

  cell.myDiv = input;

  addResizable(table, cell);
  cell.appendChild(input);

  input.addEventListener("click", (e) => inputClickHandler(e));
  input.addEventListener("input", (e) => tableChChanged(e, table, input));
  input.addEventListener("focusout", (e) => tableChChangedFinal(e, table, input));

  var regex = table.questionDiv.type == "EFA" ? tableEFATransitionSyntax() : DFATableTransitionSymbolsSyntax();
  input.addEventListener("keypress", function (e) {
    cellKeypressHandler(e, regex);
  });
}

function insertRow(table, title) {
  if (table.locked) {
    return;
  }
  //if this is a first state to be created in editor
  if (isEmpty(table.questionDiv) && table.questionDiv.graphDiv.graphState.currentState == graphStateEnum.empty) {
    endEmptyGraphState(table.questionDiv);
  }
  if (title == null) {
    title = generateStateId(table.parentNode.parentNode);
  }
  deselectCell(table);
  table.rows[table.rows.length - 1].deleteCell(0);
  insertRowDeleteButton(table, table.rows[table.rows.length - 1]);
  insertArrows(table, table.rows[table.rows.length - 1], 1);

  insertRowHeader(table.rows[table.rows.length - 1], title, table.rows[1].cells[STATE_INDEX].style.width);

  for (i = STATE_INDEX + 1; i < table.rows[0].cells.length - 1; i++) {
    var cell = insertInnerCell(table, table.rows[table.rows.length - 1]);

    var cellAbove = table.rows[table.rows.length - 2].cells[i];
    var w = cellAbove.style.width;
    if (!w) w = MIN_TABLE_CELL_WIDTH;
    cell.style.width        = w;
    cell.myDiv.style.width  = w;
  }
  insertRowAddButton(table);

  // create state in graph
  var data = newStateData(table.questionDiv, title, -(params.width / 2) + 100, -(params.height / 2) + 100, false, false, true);
  addState(table.questionDiv, data);
}

function insertColumn(table, symb = null) {
  if (table.locked) {
    return;
  }
  deselectCell(table);
  table.rows[0].deleteCell(table.rows[0].cells.length - 1);
  insertColumnDeleteButton(table, table.rows[0]);
  insertColumnAddButton(table, table.rows[0]);

  if (!symb) {
    symb = findSymbol(table);
  }
  table.symbols.push(symb);
  insertColumnHeader(table.rows[1], symb);

  for (var i = 2; i < table.rows.length - 1; i++) {
    insertInnerCell(table, table.rows[i]);
  }
}

function deleteRow(table, rowIndex) {
  if (table.locked) return;

  var stateId = table.rows[rowIndex].cells[STATE_INDEX].myDiv.value;
  table.states.splice(table.states.indexOf(stateId), 1);
  //delete state in graph (& from data)
  var data = getStateDataById(table.questionDiv, stateId);
  deleteState(table.questionDiv, data);

  for (i = STATE_INDEX; i < table.rows.length - 1; i++) { //for each row
    for (j = 3; j < table.rows[i].cells.length; j++) { //for each column
      var value = table.rows[i].cells[j].myDiv.value;
      if (typeIsNondeterministic(table.questionDiv.type)) {
        value = value.replace(/{|}/g, "");
        var stateIds = value.split(",");
        var index = stateIds.indexOf(stateId);
        if (index != -1) {
          stateIds.splice(index, 1);
          value = "{" + stateIds.toString() + "}";
          table.rows[i].cells[j].myDiv.value = value;
          table.rows[i].cells[j].myDiv.prevValue = value;
        }
      }
      else { //DFA
        if (stateId == value) {
          table.rows[i].cells[j].myDiv.value = "";
          table.rows[i].cells[j].myDiv.prevValue = "";
        }
      }
    }
  }
  table.deleteRow(rowIndex);
}

function deleteColumn(table, index) {
  if (table.locked) return;
  var symbol = table.rows[1].cells[index].myDiv.value;
  table.symbols.splice(table.symbols.indexOf(symbol), 1);
  deleteSymbolFromAllEdges(table.questionDiv, symbol);

  // Delete table column
  for (var i = 0; i < table.rows.length - 1; i++) {
    table.rows[i].deleteCell(index); //deleteCell() automaticky posunie vsetky cells dolava
  }
}

function setInitDiv(table, div) {
  if (!table.locked) {
    deselectCell(table);
  }
  if (table.selectedInitDiv == div) {
    unselectInitDiv(table);
    setInitStateAsNotInitial(table.questionDiv);
    return;
  }
  if (table.selectedInitDiv != null) {
    unselectInitDiv(table);
  }
  $(div).addClass("selected-arrow");
  table.selectedInitDiv = div;

  //edit state in graph
  var stateId = table.rows[div.parentNode.parentNode.rowIndex].cells[STATE_INDEX].myDiv.value;
  var data = getStateDataById(table.questionDiv, stateId);
  setNewStateAsInitial(table.questionDiv, data);
}

function unselectInitDiv(table) {
  $(table.selectedInitDiv).removeClass("selected-arrow");
  table.selectedInitDiv = null;
}

function toggleAccArrow(div) {
  var table = findParentWithClass(div, tableClasses.myTable);
  if (!table.locked) {
    deselectCell(table);
  }
  $(div).toggleClass("selected-arrow");

  var stateId = table.rows[div.parentNode.parentNode.rowIndex].cells[STATE_INDEX].myDiv.value;

  //edit state in graph
  var stateG = getStateGroupById(table.questionDiv, stateId);
  toggleAcceptingState(table.questionDiv, stateG.datum(), stateG);
}

/*
  table header cells (symbols of transition) on change
*/
function tableChChanged(e, table, input) {
  var value = input.value;
  var type = table.questionDiv.type;

  if (value == "\\e") {
    input.value = epsSymbol
    value = epsSymbol
  }

  if (incorrectTableColumnHeaderSyntax(type, value)) {

    $(input).addClass(tableClasses.incorrectCell);
    var err;
    if (type == "EFA") {
      err = errors.EFA_incorrectTransitionSymbol;
    }
    else {
      err = errors.NFA_incorrectTransitionSymbol;
    }
    activateAlertMode(table, err, input);
  }
  else if (tableColumnSymbolAlreadyExists(table, input, value)) {
    $(input).addClass(tableClasses.incorrectCell);
    activateAlertMode(table, errors.duplicitTransitionSymbol, input);
  }
  else {
    $(input).removeClass(tableClasses.incorrectCell);
    if (table.locked) {
      hideElem(table.alertStatus);
      unlockTable(table);
    }
  }
}

function tableChChangedFinal(_, table, input) {
  if ($(input).hasClass(tableClasses.incorrectCell) || table.locked) {
    return;
  }
  var prevName = input.prevValue;
  var newName = input.value;
  if (table.questionDiv.type == "EFA" && newName == "\\e") {
    input.value = epsSymbol;
    newName = input.value;
  }

  table.symbols.splice(table.symbols.indexOf(prevName), 1);
  table.symbols.push(newName);

  if (prevName != newName) {
    // Rename the symbol in graph
    table.questionDiv.edgesData.forEach(ed => {
      if (ed.symbols == prevName) {
        renameEdge(table.questionDiv, ed, newName);
      }
      else {
        var syms = ed.symbols.split(',');
        syms[syms.indexOf(prevName)] = newName;
        renameEdge(table.questionDiv, ed, syms.join(','));
      }
    });
    input.prevValue = input.value;
  }
}

function tableRhChanged(e, table) {
  var input = e.target;
  var stateName = input.value;
  //var rowIndex = input.parentNode.parentNode.rowIndex;

  if (incorrectStateSyntax(stateName)) {
    d3.select(input).classed(tableClasses.incorrectCell, true);
    activateAlertMode(table, errors.incorrectStateSyntax, input);
  }
  else if (tableStateAlreadyExists(table, input, stateName)) {
    d3.select(input).classed(tableClasses.incorrectCell, true);
    activateAlertMode(table, errors.duplicitState, input);
  }
  else {
    d3.select(input).classed(tableClasses.incorrectCell, false);
    if (table.locked) {
      unlockTable(table);
      hideElem(table.alertStatus);
    }
  }
}

function tableRhChangedFinal(e, table, input) {
  if ($(input).hasClass(tableClasses.incorrectCell) == false && !table.locked) {
    if (input.prevValue == input.value) return;

    var prevName = input.prevValue;
    var newName = input.value;

    table.states.splice(table.states.indexOf(prevName), 1);
    table.states.push(newName);

    //update state in graph
    renameState(table.questionDiv, getStateDataById(table.questionDiv, prevName), newName);

    // Traverse all transitions cells in table and change the name
    for (var i = 2; i < table.rows.length - 1; i++) {
      for (var j = 2; j < table.rows[i].cells.length; j++) {
        var val = table.rows[i].cells[j].myDiv.value;
        val = val.replace(/{|}/g, "");
        var vals = val.split(",");
        var index = vals.indexOf(prevName);
        if (index != -1) {
          vals[index] = newName;
          val = vals.toString();
          if (typeIsNondeterministic(table.questionDiv.type)) {
            table.rows[i].cells[j].myDiv.value = "{" + val + "}";
          }
          else if (table.questionDiv.type == "DFA") {
            table.rows[i].cells[j].myDiv.value = val;
          }
          table.rows[i].cells[j].myDiv.prevValue = table.rows[i].cells[j].myDiv.value;
        }
      }
    }
    input.prevValue = input.value;
  }
}

function tableCellChanged(_, table, input) {
  if (!(table.parentNode.type == "NFA" && tableIncorrectNfaEfaInnerCellSyntax(input.value))
    || (table.questionDiv.type == "DFA" && incorrectTableDFATransitionsSyntax(input.value))
  ) {
    d3.select(input).classed(tableClasses.incorrectCell, false);
    if (table.locked) {
      table.questionDiv.tableDiv.alertText.innerHTML == "";
      hideElem(table.questionDiv.tableDiv.alertText);
      unlockTable(table);
    }
  }
}

function tableCellChangedFinal(e, table, input) {
  var questionDiv = table.questionDiv;
  var type = questionDiv.type;

  if (incorrectTableInnerCellSyntax(type, input.value)) {
    d3.select(input).classed(tableClasses.incorrectCell, true);

    var err = errors.innerCellIncorrectSyntaxBase + " ";
    if (type == "DFA") {
      err += errors.DFAInnerCellSyntax;
    }
    else {
      err += errors.NFAInnerCellSyntax
    }
    activateAlertMode(table, err, input);
  }
  else {
    var prevName = input.prevValue;
    var newName = input.value;
    if (typeIsNondeterministic(type)) { // odstranenie {}
      prevName = prevName.substring(1, prevName.length - 1);
      newName = newName.substring(1, newName.length - 1);
    }
    var sourceStateId = table.rows[input.parentNode.parentNode.rowIndex].cells[STATE_INDEX].myDiv.value;
    var symbol = table.rows[1].cells[input.parentNode.cellIndex].myDiv.prevValue;
    var prevStates = prevName.split(",");
    var newStates = newName.split(",");
    newStates = removeDuplicates(newStates);

    //vymaze edges ktore uz nemaju pismenko, pripadne vymaze pismeno z transition
    for (let i = 0; i < prevStates.length; i++) {
      if (newStates.indexOf(prevStates[i]) == -1) {
        var edgeData = getEdgeDataByStates(questionDiv, sourceStateId, prevStates[i]);
        if (edgeData != null) {
          var trs = edgeData.symbols.split(',');
          if (trs.length <= 1) {
            deleteEdge(questionDiv, edgeData);
          }
          else {
            trs.splice(trs.indexOf(symbol), 1);
            renameEdge(questionDiv, edgeData, trs.join(','));
          }
        }
      }
    }
    if (newStates.length == 1 && newStates[0] == "") {
      newStates = [];
    }

    for (let i = 0; i < newStates.length; i++) {
      //ak predtym stav s tymto nazvom bol v cell == nenastala v nom zmena
      if (prevStates.indexOf(newStates[i]) != -1) continue;

      //ak NEEXISTUJE v grafe stav s danym nazvom
      if (getStateDataById(questionDiv, newStates[i]) == null) {
        var addRowBool = true;
        for (var j = 2; j < table.rows.length - 1; j++) { //skontrolovanie, ze sa nazov tohto stavu nenachadza v inom riadku tabulky
          if (table.rows[j].cells[STATE_INDEX].myDiv.value == newStates[i]) {
            addRowBool = false;
            break;
          }
        }
        if (addRowBool) {
          insertRow(table, newStates[i]);
        }
        else {
          addState(questionDiv, newStateData(questionDiv, newStates[i], 100, 100, false, false, true));
        }
        addEdge(questionDiv, newEdgeData(questionDiv, sourceStateId, newStates[i], symbol), elemOrigin.fromTable);
      }
      else {
        var edgeData = getEdgeDataByStates(questionDiv, sourceStateId, newStates[i]);
        if (edgeData != null) {
          var trs = edgeData.symbols.split(",");
          if (trs.indexOf(symbol) == -1) {
            trs.push(symbol);
            renameEdge(questionDiv, edgeData, trs.join(','));
          }
        }
        else {
          addEdge(questionDiv, newEdgeData(questionDiv, sourceStateId, newStates[i], symbol), elemOrigin.fromTable);
        }
      }
    }
    //vytvaranie novych transitions
    //pripadne pridavanie pismiek do existujucich
    var x = newStates.toString();
    if (typeIsNondeterministic(type)) {
      x = "{" + x + "}";
    }
    input.value = input.prevValue = x;
  }
}

function tableHeaderCellClick(table, input) {
  if (!table.locked && table.selectedCellInput != input) {
    selectDifferentRowHeaderCell(table, input);
    //disableControlButtons(table.parentNode, false);
  }
}


/* ------------------------------ Table helper functions ------------------------------ */

function activateAlertMode(table, error, exc) {
  setAlert(table, error, true);
  showElem(table.alertStatus);
  lockTable(table, exc);
}

function setAlert(table, error, tableLocked = true) {
  table.alertStatus.innerHTML = error;
  if (tableLocked) {
    table.alertStatus.innerHTML += " " + errors.tableLocked;
  }
}

function disableControlButtons(tableDiv, disable = true) {
  tableDiv.buttonInit.disabled = disable;
  tableDiv.buttonAcc.disabled = disable;
}

function lockButtons(questionDiv, val = null) {
  d3.select(questionDiv).selectAll("." + MENU_BUTTON).attr("disabled", val);
}

function lockTable(table, exceptionInput) {
  for (var i = 1; i < table.rows.length - 1; i++) {
    for (var j = 1; j < table.rows[i].cells.length; j++) {
      if (table.rows[i].cells[j].myDiv == exceptionInput) {
        continue;
      }
      $(table.rows[i].cells[j].myDiv).prop('readonly', true);
    }
  }
  table.locked = true;
  lockButtons(table.questionDiv, true);
}

function unlockTable(table) {
  for (var i = 1; i < table.rows.length - 1; i++) {
    for (var j = 1; j < table.rows[i].cells.length; j++) {
      $(table.rows[i].cells[j].myDiv).prop('readonly', false);
    }
  }
  table.locked = false;
  lockButtons(table.questionDiv);
}

function findSymbol(table) {
  var symbol, symbprefix = "";
  var k = 'a'.charCodeAt(0);
  do {
    if (k > 'z'.charCodeAt(0)) {
      symbprefix += "a";
      k = 'a'.charCodeAt(0);
    }
    symbol = symbprefix + String.fromCharCode(k);
    k++;
  }
  while (table.symbols.indexOf(symbol) != -1)

  return symbol;
}

function tableStateAlreadyExists(table, input, value) {
  var ri = input.parentNode.parentNode.rowIndex;
  for (var i = 2; i < table.rows.length - 1; i++) {
    if (i != ri && value == table.rows[i].cells[STATE_INDEX].myDiv.value) {
      return true;
    }
  }
  return false;
}

function tableColumnSymbolAlreadyExists(table, input, symbol) {
  var ci = input.parentNode.cellIndex;

  for (var i = 2; i < table.rows[1].cells.length; i++) {
    if (i != ci && symbol == table.rows[1].cells[i].myDiv.value) {
      return true;
    }
  }
  return false;
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

function insertCell(row, index, classlist, width = null) {
  var cell = row.insertCell(index);
  var cellS = d3.select(cell);
  classlist.forEach(c => { cellS.classed(c, true); });

  if (width != null) {
    cell.style.width = width;
    cell.style.minWidth = MIN_TABLE_CELL_WIDTH;
  }
  return cell;
}

function createInput(classlist, value, prevValue, width = MIN_TABLE_CELL_WIDTH) {
  var input = document.createElement("input");
  input.value = value;
  input.prevValue = prevValue;
  if (width != null) {
    input.style.minWidth = MIN_TABLE_CELL_WIDTH;
    input.style.width = width;
  }
  input.style.margin = "0em";
  var sel = d3.select(input);
  classlist.forEach(c => {
    sel.classed(c, true);
  });
  return input;
}

function insertCellWithDiv(row, index, cellClasslist, divClasslist, innerHtml = "") {
  var cell = index == null ? row.insertCell(row.cells.length) : row.insertCell(index);
  cell.innerHTML = innerHtml;

  var cellS = d3.select(cell);
  cellClasslist.forEach(c => { cellS.classed(c, true); });

  var div = document.createElement("div");
  if (divClasslist != null) {
    var d = d3.select(div);
    divClasslist.forEach(dc => { d.classed(dc, true); });
  }

  cell.myDiv = div;
  cell.appendChild(div);
  return cell;
}

function insertInactiveCell(row, index) {
  var classes = [
    tableClasses.myCell,
    tableClasses.inactiveCell,
    tableClasses.noselectCell
  ];
  return insertCellWithDiv(row, index, classes, [ ]);
}

function inputClickHandler(event) {
  var input = event.target;
  var table = input.parentNode.parentNode.parentNode.parentNode;
  if (!table.locked) {
    deselectCell(table);
  }
}

function cellKeypressHandler(event, regex) {
  var code = event.keyCode || event.which;
  if (code == 13) {
    event.preventDefault();
    event.target.blur();
    return false;
  }
  var kc = event.charCode;
  if (kc == 0) {
    return true;
  }
  var txt = String.fromCharCode(kc);
  if (!txt.match(regex)) {
    return false;
  }
}

function deselectCell(table) {
  if (table.selectedCellInput != null) {
    var input = table.selectedCellInput;
    d3.select(input).classed(tableClasses.selectedHeaderInput, false);
    d3.select(input).classed(tableClasses.rowHeader, true);
    table.selectedCellInput = null;
  }
}

function selectDifferentRowHeaderCell(table, input) {
  var prev;
  if (table.selectedCellInput != null) {
    prev = d3.select(table.selectedCellInput);
  }
  if (prev != null) {
    prev.classed(tableClasses.selectedHeaderInput, false);
    prev.classed(tableClasses.rowHeader, true);
  }
  var next = d3.select(input);
  next.classed(tableClasses.selectedHeaderInput, true);
  next.classed(tableClasses.rowHeader, false);

  table.selectedCellInput = input;
}

function addResizable(table, cell) {
  $(cell).resizable({
    handles: 'e',
    resize: function () {
      var minSize = MIN_TABLE_CELL_WIDTH.substring(0, 2);
      if (parseInt(this.style.width) >= parseInt(minSize)) {
        this.style.minWidth = this.style.width;
        var ci = this.cellIndex;

        //zmena sirky vsetkych cells v stlpci
        //var t = findParentWithClass(this, tableClasses.myTable);
        for (var i = 1; i < table.rows.length - 1; i++) {
          table.rows[i].cells[ci].style.width = this.style.width;
          table.rows[i].cells[ci].myDiv.style.width = this.style.width;
        }
      }
    },
  });
  cell.style.minWidth = MIN_TABLE_CELL_WIDTH;
}

function resetInnerCellSizes(table, maxCellWidth) {
  for (var i = 1; i < table.rows.length - 1; i++) {
    for (var j = 3; j < table.rows[i].cells.length; j++) {
      table.rows[i].cells[j].style.width = maxCellWidth;
      table.rows[i].cells[j].myDiv.style.width = maxCellWidth;
    }
  }
}

function findLongestTitle(array) {
  var max = 0;
  var padding = 10;

  array.forEach(title => {
    max = Math.max(max, tableVisualLength(title));
  });
  return max + padding;
}

/* ------------------------------ Syntax functions ------------------------------ */

var stateNameSyntax = "^[a-zA-Z0-9]+$";

function stateSyntax() {
  return new RegExp(stateNameSyntax);
}

function incorrectStateSyntax(val) {
  return !(stateSyntax().test(val));
}

function graphTransitionsSyntax() {
  return new RegExp("^(([a-zA-Z0-9])|(\"[a-zA-Z0-9]+\"))(,((\"[a-zA-Z0-9]+\")|([a-zA-Z0-9])))*$");
}

function graphEFATransitionSyntax() {
  return new RegExp("^(([a-zA-Z0-9])|(\"[a-zA-Z0-9]+\")|(ε)|(\\e))(,(([a-zA-Z0-9])|(\"[a-zA-Z0-9]+\")|(ε)|(\\e)))*$");
}

function incorrectGraphTransitionsSyntax(type, value) {
  return ((type == "DFA" || type == "NFA") && !graphTransitionsSyntax().test(value)) ||
    (type == "EFA" && !graphEFATransitionSyntax().test(value));
}

function tableEFATransitionSyntax() {
  return new RegExp("^[a-zA-Z0-9]$|^\"[a-zA-Z0-9]+\"$");
}

function tableNfaEfaInnerCellSyntax() {
  return new RegExp("^{}$|^{[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*}$");
}

function tableIncorrectNfaEfaInnerCellSyntax(val) {
  return (!tableNfaEfaInnerCellSyntax().test(val))
}

function EFATransitionSyntax() {
  return new RegExp("^ε$|^\\e$|^[a-zA-Z0-9]$|^\"[a-zA-Z0-9]+\"$");
}

function incorrectTableEFATransitionSyntax(val) {
  return (!EFATransitionSyntax().test(val))
}

function NFATransitionSyntax() {
  return new RegExp("^[a-zA-Z0-9]$|^\"[a-zA-Z0-9]+\"$");
}

function incorrectTableNFATransitionSyntax(value) {
  return !NFATransitionSyntax().test(value);
}

function DFATableTransitionSymbolsSyntax() {
  return new RegExp("^[a-zA-Z0-9]$|^\"[a-zA-Z0-9]+\"$");
}

function incorrectTableDFATransitionSyntax(val) {
  return (!DFATableTransitionSymbolsSyntax().test(val))
}

function tableDFAInnerCellSyntax() {
  return new RegExp("^$|^[a-zA-Z0-9]+$");
}

function tableIncorrectDFAInnerCellSyntax(val) {
  return (!tableDFAInnerCellSyntax().test(val))
}

function incorrectTableInnerCellSyntax(type, value) {
  return (type == "DFA" && tableIncorrectDFAInnerCellSyntax(value)) ||
    (typeIsNondeterministic(type) && tableIncorrectNfaEfaInnerCellSyntax(value));
}

function incorrectTableColumnHeaderSyntax(type, value) {
  return (type == "DFA" && incorrectTableDFATransitionSyntax(value) ||
    (type == "EFA" && incorrectTableEFATransitionSyntax(value)) ||
    (type == "NFA" && incorrectTableNFATransitionSyntax(value))
  );
}


/* ------------------------------ IS helper functions ------------------------------ */

/* -FUNCTION--------------------------------------------------------------------
Author:			Radim Cebis, modified by Patricia Salajova
Function:		register(id, func)
Param elem:		element (textArea)
Usage:			registers func to element with correct question ID
----------------------------------------------------------------------------- */
function registerElem(id, func, elem) {
  // when we are in inspection mode, we do not want the syntax check to work
  if (jeProhlizeciStranka_new()) {
    if (document.getElementById(id + "-error"))
      document.getElementById(id + "-error").setAttribute("hidden", '');
    return;
  }

  function test(evt) {
    if (!evt) var evt = window.event;
    var input = (evt.target) ? evt.target : evt.srcElement;

    var result = func(input.value);
    if (elem.value == "") {
      document.getElementById(id + "-error").className = "alert alert-info";
      document.getElementById(id + "-i").className = "";
      document.getElementById(id + "-error-text").innerHTML = "Zde se zobrazuje nápověda syntaxe.";
    }
    else {
      if (result.error_string != "")
        document.getElementById(id + "-error-text").innerHTML = htmlentities(result.error_string);
      else
        document.getElementById(id + "-error-text").innerHTML = "Syntax je korektní.";

      if (result.error == 2) {
        document.getElementById(id + "-error").className = "alert alert-danger";
        document.getElementById(id + "-i").className = "glyphicon glyphicon-remove";
      }
      else if (result.error == 1) {
        document.getElementById(id + "-error").className = "alert alert-warning";
        document.getElementById(id + "-i").className = "glyphicon glyphicon-warning-sign";
      }
      else {
        document.getElementById(id + "-error").className = "alert alert-success";
        document.getElementById(id + "-i").className = "glyphicon glyphicon-ok";
      }
    }
  }
  addEvent(elem, 'change', test);
  addEvent(elem, 'keyup', test);
  addEvent(elem, 'focus', test);
  addEvent(elem, 'blur', test);
  addEvent(elem, 'mouseup', test);
  elem.focus();
  elem.blur();
  scroll(0, 0);
}


function jeProhlizeciStranka_new() {
  var sp = document.getElementById("app_name");
  if (sp && (sp.innerText.includes("– prohlídka") || sp.innerText.includes("– browse"))) {
    return true;
  }

  var all = document.getElementsByClassName("drobecek_app");
  for (let i = 0; i < all.length; i++) {
    if (all[i].innerHTML == "Prohlídka" || all[i].innerHTML == "Browse") {
      return true;
    }
  }
  return false;
}
