
var menuButtonClass = "menu-button";

var graphConsts = {
  selectedClass: "selected",
  mouseOverClass: "mouse-over-node",
  stateGroupClass: "state-group",
  stateTextClass: "state-text",
  stateInvalidConnectionClass: "invalid-connection",
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
var activeQuestionDiv;
var SELECTED_SVG_ELEMENT;

// -------------
// language, to be imported
// -------------
var graphMenuButton = "Graf";
var textMenuButton = "Text";
var tableMenuButton = "Tabuľka";
var hintLabel = "Nápoveda";
var addTransitionPrompt = "Zadajte symboly prechodu:";
var renameStatePrompt = "Zadajte názov stavu:";
var stateNameAlreadyExistsPrompt = "Chyba: Takto pojmenovaný stav již existuje! ";
var edgeAlreadyExistsAlert = "Prechod medzi týmito stavmi už existuje. Ak chcete pridať prechod pod nejakým symbolom, upravte symboly existujúceho prechodu.";
//state context menu
var addTransitionText = "Pridať prechod";
var renameStateText = "Premenovať";
var deleteStateText = "Odstrániť";
var setAsInitialText = "Nastaviť ako počiatočný";
var setStateAsAcceptingText = "Akceptujúci stav";

var renameEdgeText = "Upravit symboly prechodu";

var hints = {
  HINT_ADD_STATE : "<b>pridanie noveho stavu:</b> double click na platno",
  HINT_ADD_TRANSITION : "<b>pridanie noveho prechodu:</b> SHIFT + tahat stav",
  HINT_SELECT_ELEMENT : "<b>vybratie stavu/prechodu:</b> click stav/prechod",
  HINT_UNSELECT_ELEMENT : "<b>zrusenie vybratia stavu/prechodu:</b> click na platno",
  HINT_DELETE_ELEMENT : "<b>vymazanie stavu/prechodu:</b> right click -> \"" + deleteStateText + "\", alebo click na stav/prechod + del / backspace",
  HINT_RENAME_ELEMENT : "<b>premenovanie stavu/prechodu:</b> right click",
  HINT_TOGGLE_INITIAL_STATE : "<b>oznacenie stavu ako inicialneho:</b> right click -> \"" + setAsInitialText + "\"",
  HINT_TOGGLE_ACCEPTING_STATE : "<b>oznacenie a odznacenie stavu ako akceptujuceho:</b> double click na stav"
}

function importLanguage() {}

function initialise(id, type) {
  importLanguage();

  //questionDiv == wp !
  //var questionDiv = document.getElementById(id); // v ISe uz bude existovat div s id

  var questionDiv = document.createElement("div");
  questionDiv.setAttribute("class", "tab-content edit-active"); // delete later | prohlizeciStranke => disabled
  questionDiv.setAttribute("id", id);
  questionDiv.type = type;
  questionDiv.lastEdited = null;

  questionDiv.statesData = [];
  questionDiv.edgesData = [];

  //create menu BUTTONS
  var graphButton = document.createElement("button");
  graphButton.innerText = graphMenuButton;
  graphButton.setAttribute("class", menuButtonClass);
  graphButton.addEventListener("click", function() { clickGraph(questionDiv)} ); //will it work????

  var textButton = document.createElement("button");
  textButton.innerText = textMenuButton;
  textButton.setAttribute("class", menuButtonClass);
  textButton.addEventListener("click", function() { clickText(questionDiv)} );

  var tableButton = document.createElement("button");
  tableButton.innerText = tableMenuButton;
  tableButton.setAttribute("class", menuButtonClass);
  //tableButton.addEventListener("click", function() { clickTable(questionDiv)} );

  questionDiv.appendChild(graphButton);
  questionDiv.appendChild(textButton);
  questionDiv.appendChild(tableButton);

  //HINT
  var hintDiv = document.createElement("div");
  hintDiv.setAttribute("class", "hintDiv");
  
  var hintButton = document.createElement("button");
  hintButton.setAttribute("class", "hintButton");
  hintButton.innerText = hintLabel + " 🡣";
  hintButton.addEventListener("click", function() {clickHintButton(questionDiv);});

  var hintContentDiv = document.createElement("div");
  hintContentDiv.setAttribute("class", "hint-content-div slide-Inactive");
  hintDiv.appendChild(hintButton);
  hintDiv.appendChild(hintContentDiv);
  hintDiv.contentDiv = hintContentDiv;
  hintDiv.hintButton = hintButton;

  setupHints(hintContentDiv);

  var graphDiv = document.createElement("div");
  graphDiv.setAttribute("class", "graphDiv");

  //var textArea = document.getElementById("......"); - v ISe
  var textArea = document.createElement("textarea");
  textArea.setAttribute("class", "textArea");

  //TODO : tableDiv

  questionDiv.appendChild(hintDiv);
  questionDiv.hintDiv = hintDiv;

  questionDiv.appendChild(graphDiv);
  questionDiv.graphDiv = graphDiv;

  questionDiv.appendChild(textArea);
  questionDiv.textArea = textArea;

  //questionDiv.appendChild(tableDiv);
  //questionDiv.tableDiv = tableDiv;

  document.body.appendChild(questionDiv);

  createStateContextMenu(questionDiv);
  createEdgeContextMenu(questionDiv);
  initGraph(questionDiv);

  //document.getElementsByClassName("form").on("submit", function () { generateTextFromData(questionDiv); });
}

function initToolbox() {
  var toolbox = svg.append("g")
    .attr("class", "toolbox");

  toolbox.append("rect")
    .attr("x", 8)
    .attr("y", 3 + 5)
    .attr("rx" , 5)
    .attr("class", "toolbox-rect");
  
  createToolboxButton(toolbox, 15+5, 18+ 5, "icons/zoom-in.png")
    .on("click", zoomIn);
  createToolboxButton(toolbox, 55+5, 18+ 5, "icons/reset-zoom.png")
    .on("click", resetZoom);
  createToolboxButton(toolbox, 95+5, 18+ 5, "icons/zoom-out.png")
    .on("click", zoomOut);
}

function initGraph(questionDiv) {
  questionDiv.graphDiv.graphState = {
    selectedState: null,
    selectedEdge: null,
    mouseOverState: null,
    mouseDownState: null,
    mouseDownEdge: null,
    justDragged: false,
    justScaleTransGraph: false,
    lastKeyDown: -1,
    creatingEdge: false,
    selectedText: null,
  };

  var svg = d3
    .select(questionDiv.graphDiv)
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .on("mousemove", svgMousemove)
    .on("click", rectClick)
    .on("focus", function() {
      activeQuestionDiv = questionDiv;
      if (document.activeElement) {
        //console.log("active elements is svg " +  questionDiv.getAttribute("id"));
      }
      //console.log("svg " + questionDiv.getAttribute("id") + " has focus==");
    });

  questionDiv.graphDiv.svg = svg;
  questionDiv.textNode = svg.append("text");
  questionDiv.textNode.text("aaa");
  
  var rect = svg
    .append("rect")
    .attr("class", "svg-rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .on("contextmenu", rectClick)
    .on("dblclick", rectDblclick);

  rect.node().parentGraphDiv = questionDiv.graphDiv;
  svg.rect = rect;

  svg.call(zoom).on("dblclick.zoom", null);

  var defs = svg.append("svg:defs");

  defs
    .append("svg:marker")
    .attr("id", "end-arrow")
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
    .attr("id", "temporary-arrow-end")
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
  var temporaryEdgeG = svgGroup.append("g").attr("id", "temporary edge group");
  svgGroup.temporaryEdgeG = temporaryEdgeG;

  temporaryEdgeG
    .append("svg:path")
    .attr("class", graphConsts.edgePathClass + " dragline hidden")
    .attr("d", "M0,0L0,0")
    .style("marker-end", "url(#temporary-arrow-end)");

    //MARKER ???
  temporaryEdgeG
    .append("svg:path")
    .classed(graphConsts.edgeMarkerClass, true)
    .attr("marker-end", "url(#end-arrow)");
  
  //init-arrow
  svgGroup.initArrow = svgGroup
    .append("svg:path")
    .attr("class", graphConsts.edgePathClass + " init-arrow")
    .style("marker-end", "url(#temporary-arrow-end)");

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

  /*
  d3.select(window)
    .on("keydown", function(event, d) {
      windowKeyDown(event, d);
    })
    .on("keyup", function() {
      windowKeyUp(questionDiv.graphDiv.graphState);} 
    );*/


  //initToolbox();
}

function initInitialState(questionDiv) {
  var initialData = {
    id: questionDiv.graphDiv.stateIdCounter,
    title: "S0",
    x: 100,
    y: 150,
    initial: true,
    accepting: false,
  };
  addState(questionDiv, initialData);
  repositionInitArrow(questionDiv.graphDiv, initialData);
}

var zoom = d3.zoom()
  //.translateExtent([[0, 0], [800, 500]])
  .scaleExtent([0.3, 10]).on("zoom", svgZoomed);

var dragPath = d3
  .drag()
  .on("start", pathDragstart)
  .on("drag", pathDragmove)
  .on("end", pathDragend);


var dragState = d3
  .drag()
  .on("start", stateDragstart)
  .on("drag", stateDragmove)
  .on("end", stateDragend);

document.addEventListener('keydown', windowKeyDown);

function rectClick(event, d) {
  event.preventDefault();
  var graphDiv;
  if (d3.select(this).node().tagName == "svg") {
    graphDiv = d3.select(this).node().parentNode;
  }
  else {
    graphDiv = d3.select(this).node().parentGraphDiv;
  }

  removeSelectionFromState(graphDiv);
  removeSelectionFromEdge(graphDiv);

  hideElem(graphDiv.stateContextMenuDiv);
  hideElem(graphDiv.edgeContextMenuDiv);

  hideEdge(graphDiv.svg.svgGroup.temporaryEdgeG);
  if (graphDiv.graphState.creatingEdge) {
    graphDiv.graphState.creatingEdge = false;
    enableAllDragging(graphDiv.svg);
  }
  
  //TODO: init selection of multiple elements
}

function rectDblclick(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  var coords = getCoordinates(d3.pointer(event), graphDiv.svg.svgGroup);

  //if we clicked on other svg elements do nothing
  if (event.srcElement.tagName == "rect") {
    addState(graphDiv.parentNode, newStateData(graphDiv.parentNode, null, coords.x, coords.y, false, false));
  }
}

function svgMousemove(event, data) {
  var graphDiv = d3.select(this).node().parentNode;

  if (graphDiv.graphState.creatingEdge) {
    var temporaryEdgePath = graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgePathClass);
    temporaryEdgePath.classed("hidden", false);

    var targetState = graphDiv.graphState.mouseOverState;
    var sourceState = graphDiv.graphState.mouseDownState;
    var mouseX = d3.pointer(event, graphDiv.svg.svgGroup.node())[0];
    var mouseY = d3.pointer(event, graphDiv.svg.svgGroup.node())[1];

    //if mouse is hovering over some state
    if (graphDiv.graphState.mouseOverState) {
      /*if (getEdgeGroupNode(graphDiv.parentNode, sourceState.title, targetState.title) != null) {
        getStateGroupById(graphDiv.parentNode, targetState.id).node().InvalidEdge = true;
      }*/
      //self-loop  
      if (targetState.id == sourceState.id) {
        toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);
        temporaryEdgePath.attr("d", getNewSelfloopDefinition(sourceState.x, sourceState.y, mouseX, mouseY, temporaryEdgePath.node()));
      }
      else { // snap to state
        temporaryEdgePath.attr(
          "d", getStraightPathDefinition(sourceState.x, sourceState.y, targetState.x, targetState.y));
      }
      graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", false);
      repositionMarker(graphDiv.svg.svgGroup.temporaryEdgeG);
    }
    //not hovering above any state
    else { 
      graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", true);
      temporaryEdgePath.attr("d", getStraightPathDefinition(sourceState.x, sourceState.y, mouseX, mouseY));
    }

  }
}

function windowKeyDown(event) {
  // SELECTED_SVG_ELEMENT is alaways either a stateGroup or an edgeGroup
  // both have .node().graphDiv.questionDiv to which they belong

  if (SELECTED_SVG_ELEMENT == null) {
    return;
  }

  var graphDiv = SELECTED_SVG_ELEMENT.node().parentGraphDiv;
  var questionDiv = graphDiv.parentNode;
  var data = SELECTED_SVG_ELEMENT.data()[0];

  if (graphDiv.style.display == "none") {
    return;
  }

  if (event.keyCode == graphConsts.DELETE_KEY) {
    // if selected element is state
    if (SELECTED_SVG_ELEMENT.node().classList.contains(graphConsts.stateGroupClass)) {
      deleteState(questionDiv, data);
      graphDiv.graphState.selectedState = null;
    }
    // if selected element is edge
    else {
      deleteEdge(questionDiv, data);
      graphDiv.graphState.selectedEdge = null;
    }
    SELECTED_SVG_ELEMENT = null;
  }
}


// zoom {& drag svg}
function svgZoomed({ transform }) {
  var questionDiv = activeQuestionDiv;
  //console.log("id" + questionDiv.getAttribute("id"));
  hideElem(activeQuestionDiv.graphDiv.stateContextMenuDiv);
  questionDiv.graphDiv.svg.svgGroup.attr("transform", transform);
  removeSelectionFromState(questionDiv.graphDiv);
  removeSelectionFromEdge(questionDiv.graphDiv);
}

function resetZoom() {
  svg.transition().call(zoom.scaleTo, 1);
}

function zoomIn(){
  svg.transition().call(zoom.scaleBy, 1.3);
}

function zoomOut(){
  svg.transition().call(zoom.scaleBy, 0.7);
}


//state dragging
function stateDragstart(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  graphDiv.graphState.justDragged = false;

  toggleStateSelection(d3.select(this), graphDiv, d);
  hideElem(graphDiv.stateContextMenuDiv);
  hideElem(graphDiv.edgeContextMenuDiv);
}

function stateDragmove(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;
  toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);

  graphDiv.graphState.justDragged = true;

  d.x = event.x;
  d.y = event.y;
  d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");

  if (d.initial) { 
    repositionInitArrow(graphDiv, d); 
  }

  updateOutgoingEdges(graphDiv.svg.svgGroup.edgeGroups, d);
  updateIncommingEdges(graphDiv.svg.svgGroup.edgeGroups, d); 
}

function stateDragend(event, d) { }


function hideEdge(edgeG){
  edgeG.select("." + graphConsts.edgePathClass).classed("hidden", true);
  edgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", true);
}

function hideInitArrow(graphDiv) {
  d3.select(graphDiv)
    .select(".init-arrow")
    .classed("hidden", true);
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
        (stateData.x - graphConsts.nodeRadius - 5) +
        "," +
        stateData.y
    );
}



function updateOutgoingEdges(edgeGroups, stateData) {
  edgeGroups
    .filter(function (edgeData) { 
      return edgeData.source.id === stateData.id; 
    })
    .each( function(edgeData, index) {
      var tx, ty, newDef;
      if (edgeData.source == edgeData.target) {
        var def = "M " + stateData.x + " " + stateData.y + " C "
				+ cubicControlPoints(stateData.x, stateData.y, edgeData.angle)
                + " " + stateData.x +" " + stateData.y;
        var s = def.split(" ");
        var tx = (+s[4] + +s[6] + +s[1]) / 3;
        var ty = (+s[5] + +s[7] + +s[2]) / 3;
        newDef = def;        
      }
      else {
        var str = d3.select(this).select("." + graphConsts.edgePathClass).attr("d").split(" ");
        str[1] = stateData.x;
        str[2] = stateData.y;
  
        str[4] = ((+str[1] + (+str[6]))/2) + edgeData.dx;
        str[5] = ((+str[2] + (+str[7]))/2) + edgeData.dy;
  
        tx = (+str[4] + (+((+str[1] + (+str[6]))/2)))/2;
        ty = (+str[5] + (+((+str[2] + (+str[7]))/2)))/2;
  
        newDef = str.join(" ");
      }
      d3.select(this).select("." + graphConsts.edgePathClass).attr("d", newDef);
      moveEdgeRect(d3.select(this).select("rect"), tx, ty);
      moveEdgeText(d3.select(this).select("text"), tx, ty + 5);
      repositionMarker(d3.select(this));
    });

}

function updateIncommingEdges(edgeGroups, stateData) {
  edgeGroups
    .filter(function (edgeData) { 
      return edgeData.target.id === stateData.id && edgeData.source != edgeData.target; 
    })
    .each( function(edgeData, index) {
      var str = d3.select(this).select("." + graphConsts.edgePathClass).attr("d").split(" ");

      str[6] = stateData.x;
      str[7] = stateData.y;

      str[4] = ((+str[1] + (+str[6]))/2) + edgeData.dx;
      str[5] = ((+str[2] + (+str[7]))/2) + edgeData.dy;

      var tx = (+str[4] + (+((+str[1] + (+str[6]))/2)))/2;
      var ty = (+str[5] + (+((+str[2] + (+str[7]))/2)))/2;

      d3.select(this).select("." + graphConsts.edgePathClass).attr("d", str.join(" "));

      moveEdgeRect(d3.select(this).select("rect"), tx, ty);
      moveEdgeText(d3.select(this).select("text"), tx, ty + 5);
      repositionMarker(d3.select(this));
    });

}

function moveEdgeRect(rect, x, y) {
  if (x != -1)
	{
		var w = rect.attr("width");
		rect.attr("x", x - (w / 2));
	}
	if (y != -1)
	{
		var h = rect.attr("height");
		rect.attr("y", y - (h / 2));
	}
}

function moveEdgeText(text, x, y) {
  text
    .attr("x", x)
    .attr("y", y);
}

function getEdgeRectPosition(pathDefinitinAttribute, isSelfloop) {
    var str = pathDefinitinAttribute.split(" "), tx, ty;
  
    if (isSelfloop) {
        tx = (+str[4] + +str[6] + +str[1]) / 3;
        ty = (+str[5] + +str[7] + +str[2]) / 3;
    }
    else {
        tx = (+str[4] + (+((+str[1] + (+str[6]))/2)))/2;
        ty = (+str[5] + (+((+str[2] + (+str[7]))/2)))/2;
    }
    return {tx, ty};
}

//path dragging
function pathDragstart(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;

  graphDiv.graphState.mouseDownEdge = d;
  toggleEdgeSelection(d3.select(this), graphDiv, event, d);
  toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);
  hideElem(graphDiv.stateContextMenuDiv);
  hideElem(graphDiv.edgeContextMenuDiv);
}

function pathDragmove(event, d) {
  var edgeG = d3.select(this);
  var graphDiv = edgeG.node().parentGraphDiv;
  var oldPathDefinition = edgeG.select("." + graphConsts.edgePathClass).attr("d");

  edgeG
    .select("." + graphConsts.edgePathClass)
    .attr("d", repositionPathCurve(d, event.x, event.y, oldPathDefinition));

  var coords = getEdgeRectPosition(edgeG.select("." + graphConsts.edgePathClass).attr("d"), d.source == d.target);

  moveEdgeRect(edgeG.select("rect"), coords.tx, coords.ty);
  moveEdgeText(edgeG.select("text"), coords.tx, coords.ty + 5);
  repositionMarker(edgeG);
}

function pathDragend(event, d) {
}


function addEdge(questionDiv, from, to, symbols) {
  var temporaryEdgePath = questionDiv.graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgePathClass);

  var newEdgeData = {
    id: questionDiv.graphDiv.edgeIdCounter,
    source: from,
    target: to,
    symbols: symbols,
    dx : 0,
    dy: 0,
    angle: 0
  };
  if (from == to) {
    newEdgeData.angle = temporaryEdgePath.node().angle;
  }
  questionDiv.graphDiv.edgeIdCounter++;
  questionDiv.edgesData.push(newEdgeData);

  //??? necessary ???
  questionDiv.graphDiv.svg.svgGroup.edgeGroups.data(questionDiv.edgesData, function (d) {
    return String(d.source.id) + "+" + String(d.target.id);
  });

  var newEdge = questionDiv.graphDiv.svg.svgGroup.edgeGroups
    .data(questionDiv.edgesData)
    .enter()
    .append("g")
    .classed(graphConsts.edgeGroupClass, true);

  newEdge.node().parentGraphDiv = questionDiv.graphDiv;

  //if (!jeProhlizecistranka()) {}
  newEdge
    .on("contextmenu", function(event, d) {
      event.preventDefault();
      hideElem(questionDiv.graphDiv.stateContextMenuDiv);
      toggleEdgeSelection(d3.select(this), questionDiv.graphDiv, event, d);
      setContextMenuPosition(questionDiv.graphDiv.edgeContextMenuDiv, event.pageY, event.pageX);
      showElem(questionDiv.graphDiv.edgeContextMenuDiv);
    })
    .on("mouseover", function (event, d) {
      d3.select(this).classed(graphConsts.mouseOverClass, true);
    })
    .on("mouseout", function () {
      d3.select(this).classed(graphConsts.mouseOverClass, false);
    })
    .call(dragPath);

  newEdge
    .append("svg:path")
    .classed(graphConsts.edgePathClass, true)
    .attr("d", function () {
      return from == to ? temporaryEdgePath.attr("d") : getStraightPathDefinition(from.x, from.y, to.x, to.y);
    });

  newEdge
    .append("svg:path")
    .classed(graphConsts.edgeMarkerClass, true)
    .attr("marker-end", "url(#end-arrow)");

  var rect = newEdge
    .append("rect")
    .classed(graphConsts.edgeRectClass, true)
    .attr("rx", 5)
    .attr("height", 20);

  var text = newEdge
    .append("text")
    .classed(graphConsts.edgeTextClass, true)
    .text(function (d) { return d.symbols; })
    .attr("text-anchor", "middle");
  
  repositionMarker(newEdge);
  updateEdgeRectAndText(questionDiv, newEdge);

  updateEdgeGroups(questionDiv.graphDiv.svg.svgGroup);
}

function updateEdgeRectAndText(questionDiv, edgesSelection) {
  edgesSelection
    .each( function(ed) {
      var rect = d3.select(this).select("rect");
      var text = d3.select(this).select("text");

      rect.attr("width", text.node().getComputedTextLength() + 8);

      var dAttr = d3.select(this).select("." + graphConsts.edgePathClass).attr("d");
      var coords = getEdgeRectPosition(dAttr, ed.source == ed.target);

      moveEdgeRect(rect, coords.tx, coords.ty);
      moveEdgeText(text, coords.tx, coords.ty + 5);
    });
}

//path repositioning functions used when dragging path
function repositionPathCurve(edgeData, mouseX, mouseY, oldPathDefinition) {
  if (edgeData.source == edgeData.target) {
    var str = oldPathDefinition.split(" ");
    return getNewSelfloopDefinition(str[1], str[2], mouseX, mouseY, edgeData);
  }
  else {
    return getNewPathDefinition(edgeData.id, mouseX, mouseY, oldPathDefinition, edgeData); 
  }
}

function getNewPathDefinition(edgeID, mouseX, mouseY, pathD, edgeData) {
  var str = pathD.split(" ");

  var dx = 2*( mouseX-( ( +str[1] + (+str[6] ) ) / 2) );
  var dy = 2*( mouseY-( ( +str[2] + (+str[7] ) ) / 2) );
  str[4] = ( ( +str[1] + ( +str[6] ) ) / 2 ) + dx;
  str[5] = ( ( +str[2] + ( +str[7] ) ) / 2 ) + dy;

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
  edge.angle = calculateAngle(x1, y1, x2, y2);

  return "M " + x1 + " " + y1 + " C "
    + cubicControlPoints(x1, y1, edge.angle)
    + " " + x1 + " " + y1;
}

function calculateAngle(x1, y1, x2, y2) {
  var distance = distBetween(x1, y1, x2, y2), angle;
  if (distance == 0) {
    dist = 0.001; 
  }

  if (x1 == x2 && y1 == y2) { 
    angle = 1.57;
  } else {
    angle = Math.acos( (x2 - x1) / distance);
  }
  
  if (y1 < y2) {
    angle = -angle;
  }
  return angle;
}

function getStraightPathDefinition(x1, y1, x2, y2) {
  return "M " + x1 + " " + y1 + " Q " +
    midpoint(x1, x2) +  " " +
    midpoint(y1, y2) +  " " + 
    x2 + " " + y2 ;
}

// STATE functions
function addState(questionDiv, stateData) {
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

/*
  if (!jeProhlizeciStranka()) {
    addStateEvents(newState, questionDiv.graphDiv);
  }
  */
  addStateEvents(newState, questionDiv.graphDiv);
  addStateSvg(newState);
  updateStateGroups(questionDiv.graphDiv.svg.svgGroup);
}

function addStateEvents(state, graphDiv) {
  state
    .call(dragState)
    .on("dblclick", function(event, d) {
      toggleAcceptingState(d, d3.select(this));
    })
    .on("mouseover", function (event, d) {
      graphDiv.graphState.mouseOverState = d;
      d3.select(this).classed(graphConsts.mouseOverClass, true);
      /*
      if (d3.select(this).node().InvalidEdge == true) { 
        d3.select(this).classed(graphConsts.stateInvalidConnectionClass, true);
      }
      else {
        d3.select(this).node().InvalidConnection = false;
        d3.select(this).classed(graphConsts.mouseOverClass, true);
      }*/
      
      if (d.title != d3.select(this).select("text").text()) {
        showFullname(graphDiv.svg.svgGroup.stateFullnameRect, d);
      }

    })
    .on("mouseout", function () {
      toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);
      graphDiv.graphState.mouseOverState = null;
      d3.select(this).classed(graphConsts.mouseOverClass, false);
      //d3.select(this).classed(graphConsts.stateInvalidConnectionClass, false);

    })
    .on("contextmenu", function(event, d) {
      event.preventDefault();
      hideElem(graphDiv.edgeContextMenuDiv);
      toggleStateSelection(d3.select(this), graphDiv, d);
      setContextMenuPosition(graphDiv.stateContextMenuDiv, event.pageY, event.pageX);
      showElem(graphDiv.stateContextMenuDiv);
    })
    .on("click", function(event, d) {
      stateClick(event, d, graphDiv, d3.select(this).node());
    });
}

function addStateSvg(newStateGroup) {
  newStateGroup
    .classed(graphConsts.stateGroupClass, true)
    .attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  newStateGroup
    .append("circle")
    .attr("r", graphConsts.nodeRadius)
    .attr("stroke-width", graphConsts.nodeStrokeWidth);

  newStateGroup
    .append("text")
    .classed(graphConsts.stateTextClass, true)
    .text(function (d) {
      return "S" + d.id;
    })
    .attr("text-anchor", "middle")
    .attr("y", 7);
}

function stateClick(event, d, graphDiv, groupNode) {
  var graphState = graphDiv.graphState;

  
  var dblclick = false;
  //console.log("clickedOnce:" + groupNode.clickedOnce);
  if (groupNode.clickedOnce) {
    var timeDiff = event.timeStamp  - groupNode.clickTimer;
    if (timeDiff < 300) {
      //console.log("time diff:" + timeDiff);
      //dont trigger creating edge
      dblclick = true;
    }
    groupNode.clickedOnce = false;
  }
  else {
    groupNode.clickedOnce = true;
    groupNode.clickTimer = event.timeStamp;
  }
  if (graphState.justDragged) {
    return; 
  }
  event.stopPropagation();
  
  if (graphState.creatingEdge && !dblclick) { //already creating edge
    if (graphState.mouseDownState && graphState.mouseOverState) {
      if (getEdgeGroupNode(graphDiv.parentNode, graphState.mouseDownState.title, graphState.mouseOverState.title) != null) {
        alert(edgeAlreadyExistsAlert);
      }
      else {
        var transitionSymbols = getNewEdgeSymbols(addTransitionPrompt);
        if (transitionSymbols != null) {
          addEdge(graphDiv.parentNode, graphState.mouseDownState, graphState.mouseOverState, transitionSymbols);
        }
        removeSelectionFromState(graphDiv);
      }
      
    } 
    graphState.creatingEdge = false;
    graphState.mouseDownState = null;
    hideEdge(graphDiv.svg.svgGroup.temporaryEdgeG);
    enableAllDragging(graphDiv.svg);
  }
  else if (!dblclick){ //starting to create an edge
    graphState.mouseDownState = d;
    graphState.creatingEdge = true;
    disableAllDragging(graphDiv.svg);
  }
}

function repositionTemporaryEdgeToState(stateData) {
  temporaryEdgePath
      .classed("hidden", false)
      .attr("d", "M" + stateData.x + "," + stateData.y + "L" + stateData.x + "," + stateData.y);
}

function toggleStateSelection(stateGroup, graphDiv, d) {
  removeSelectionFromEdge(graphDiv);

  if (graphDiv.graphState.selectedState != d) { // another state was selected
    removeSelectionFromState(graphDiv); 
    graphDiv.graphState.selectedState = d;
    SELECTED_SVG_ELEMENT = stateGroup;
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
      .attr("r", graphConsts.nodeRadius - 4)
      .attr("stroke", "black")
      .attr("stroke-width", graphConsts.nodeStrokeWidth)
      .attr("fill", "transparent");

      stateG.select("text").raise();
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
  
  repositionInitArrow(questionDiv.graphDiv, stateData);
}

function setInitStateAsNotInitial(questionDiv) {
  questionDiv.statesData
    .filter(function (d) {
      return d.initial = true;
    })
    .map(function(d) {
      d.initial = false;
    })
}

function renameState(questionDiv, stateData) {
  var newTitle = getNewStateName(renameStatePrompt, stateData, questionDiv.statesData);
  if (newTitle == null) return;

  //update data
  questionDiv.statesData
    .filter(function (d) {
      return d.id == stateData.id;
    })
    .map(function (d) {
      d.title = newTitle;
    });

  //update svg text
  questionDiv.graphDiv.svg.svgGroup.stateGroups
    .filter(function(d) {
      return d.id == stateData.id;
    })
    .select("." + graphConsts.stateTextClass)
    .text( function() {
      return cropTitleIfTooLong(newTitle);
    });
}

// - state delete functions
function deleteState(questionDiv, stateData) {
  if (stateData.initial == true) {
    hideInitArrow(questionDiv.graphDiv);
  }
  //console.log(document.activeElement);
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
  //delete the SVG
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


// EDGE functions
function toggleEdgeSelection(edgeGroup, graphDiv, event, d) {
  removeSelectionFromState(graphDiv);
  if (graphDiv.graphState.selectedEdge != d) {
    removeSelectionFromEdge(graphDiv);
    graphDiv.graphState.selectedEdge = d;
    SELECTED_SVG_ELEMENT = edgeGroup;
    edgeGroup.classed(graphConsts.selectedClass, true);
  }
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
//(questionDiv, questionDiv.graphDiv.graphState.selectedEdge
function renameEdge(questionDiv, edgeData, symbols = null) {
  console.log("renameEdge symbols arg:" +  symbols);
  if (symbols == null) {
    symbols = getNewEdgeSymbols(addTransitionPrompt, edgeData.symbols);
  }

  if (symbols == null) return;

  questionDiv.edgesData
    .filter(function (ed) {
      return ed.id == edgeData.id;
    })
    .map (function (ed) {
      ed.symbols = symbols;
    });
  
  var edgeGroup = getEdgeGroupById(questionDiv, edgeData.id);

  edgeGroup
    .select("text")
    .text(function (d) { 
      return symbols; 
    });
  
  updateEdgeRectAndText(questionDiv, edgeGroup);
}

// - edge delete functions
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



function updateEdgeGroups(svgGroup) {
  svgGroup.edgeGroups = svgGroup.select(".edges").selectAll("g");
}

function updateStateGroups(svgGroup) {
  svgGroup.stateGroups = svgGroup.select(".states").selectAll("g");
}

function disableAllDragging(svg) {
  svg.svgGroup.selectAll("." + graphConsts.stateGroupClass).on(".drag", null);
  svg.svgGroup.selectAll("." + graphConsts.edgeGroupClass).on(".drag", null);
  svg.on(".zoom", null);
}

function enableAllDragging(svg) {
  svg.svgGroup.selectAll("." + graphConsts.stateGroupClass).call(dragState);
  svg.svgGroup.selectAll("." + graphConsts.edgeGroupClass).call(dragPath);
  svg.call(zoom).on("dblclick.zoom", null);
}

//CONTEXT MENUs
function setContextMenuPosition(menu, top, left){
  menu.style.top = top + "px";
  menu.style.left = left + "px";
}

function createContextMenuButton(innerText) {
  var button = document.createElement("button");
  button.setAttribute("class", "context-menu-button");
  button.innerText = innerText;
  return button;
}

// State CONTEXT MENU + handlers
function createStateContextMenu(questionDiv) {
  var stateContextMenuDiv = document.createElement("div");
  stateContextMenuDiv.setAttribute("class", "context-menu");

  var a = createContextMenuButton( renameStateText);
  a.addEventListener("click", function() {renameStateHandler(questionDiv); } );
  stateContextMenuDiv.appendChild(a);

  var b = createContextMenuButton( deleteStateText);
  b.addEventListener("click", function() { deleteStateHandler(questionDiv) });
  stateContextMenuDiv.appendChild(b);

  var c = createContextMenuButton( setAsInitialText);
  c.addEventListener("click", function(e) { e.stopPropagation(); setStateAsInitialHandler(e, questionDiv); } );
  stateContextMenuDiv.appendChild(c);

  var d = createContextMenuButton( setStateAsAcceptingText);
  d.addEventListener("click", function() { toggleAcceptingStateHandler(questionDiv); });
  stateContextMenuDiv.appendChild(d);

  questionDiv.graphDiv.appendChild(stateContextMenuDiv);
  questionDiv.graphDiv.stateContextMenuDiv = stateContextMenuDiv;
}

function deleteStateHandler(questionDiv) {
  deleteState(questionDiv, questionDiv.graphDiv.graphState.selectedState);
  hideElem(questionDiv.graphDiv.stateContextMenuDiv);
}

function renameStateHandler(questionDiv){
  renameState(questionDiv, questionDiv.graphDiv.graphState.selectedState)
  hideElem(questionDiv.graphDiv.stateContextMenuDiv);
}

function setStateAsInitialHandler(event, questionDiv) {
  //event.stopPropagation();
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
  
  //TODO
  var rename = createContextMenuButton(renameEdgeText);
  rename.addEventListener("click", function() {
    renameEdgeHandler(questionDiv);
  })
  edgeContextMenuDiv.appendChild(rename);

  var deleteB = createContextMenuButton(deleteStateText);
  deleteB.addEventListener("click", function() {
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
  renameEdge(questionDiv, questionDiv.graphDiv.graphState.selectedEdge);
  hideElem(questionDiv.graphDiv.edgeContextMenuDiv);
}


// HTML ELEMENTS UTILS --------------------------------------------------------------------------------------------------------------------------

function hideElem(element) {
  element.style.display = "none";
}

function showElem(element) {
  element.style.display = "block";
}

function clickGraph(questionDiv) {
  //prejst vsetky stavy 
  //a ak stav nie je inicialny && nie je akceptujuci && nema ziadne prechody z neho aj do neho tak vymazat
  hideElem(questionDiv.textArea);
  //generateGraphFromText()??;

  if (questionDiv.lastEdited == "text") {
    //updateDataFromText(questionDiv);
    mergeEdges(questionDiv);
  }
  //updateGraph(questionDiv);
  showElem(questionDiv.graphDiv);
  showElem(questionDiv.hintDiv);
}

function clickTable(questionDiv) {
  if (questionDiv.lastEdited == "text") {
    updateDataFromText(questionDiv);
  }
  
}

function clickText(questionDiv) {
  hideElem(questionDiv.graphDiv);
  hideElem(questionDiv.hintDiv);
  //hideElem(questionDiv.tableDiv);
  generateTextFromData(questionDiv);
  showElem(questionDiv.textArea);
  questionDiv.lastEdited = "text";
}

function clickHintButton(questionDiv) {
  var hintContentDiv = questionDiv.hintDiv.contentDiv;
  hintContentDiv.classList.toggle("slide-Active");
  if (hintContentDiv.classList.contains("slide-Active")) {
    questionDiv.hintDiv.hintButton.innerText = hintLabel + " 🡡";
  }
  else {
    questionDiv.hintDiv.hintButton.innerText = hintLabel + " 🡣";
  }
}

function setupHints(div) {
  for (const property in hints) {
    div.appendChild( createParagraph(hints[property]) );
  }
}

function createParagraph(string) {
  var p = document.createElement("P");
  p.setAttribute("class", "hint-paragraph");
  p.innerHTML = string;
  return p;
}

function createToolboxButton(g, x, y, src) {
  return g.append("svg:image")
    .attr("x", x)
    .attr("y", y)
    .attr("href", src)
    .attr("width", 35)
    .attr("height", 37)
    .attr("class", "toolbox-button")
    ;
}


// ------------------------------------------------------
// Updating functions
// ------------------------------------------------------

function generateTextFromData(questionDiv) {
  var result = "";
  var acceptingStates = [];

  questionDiv.statesData.forEach(function (state) {
    if (state.initial) {
      result += "init=" + state.title + " ";
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
        result += "(" + edge.source.title + "," + symbol + ")=" + edge.target.title + " ";
      });
    });
  }

  else if (questionDiv.type == "NFA" || questionDiv.type == "EFA") {
    var transitions = new Map();

    questionDiv.edgesData.forEach(function (edge) {
      edge.symbols.split(",").forEach((symbol) => {
        var s = symbol;
        if (s == "ε") { 
          s = "\\e"; 
        }
        if (!transitions.has("(" + edge.source.title + "," + s + ")")) {
          transitions.set("(" + edge.source.title + "," + s + ")", []);
        }
        var val = transitions.get("(" + edge.source.title + "," + s + ")");
        val.push(edge.target.title);
        transitions.set("(" + edge.source.title + "," + s + ")", val);
      });
    });
    for (let [key, value] of  transitions.entries()) {
      result += key + "={" + value + "} ";
    }
  }

  if (acceptingStates.length > 0) {
    result += "final={";
    for (var i = 0; i < acceptingStates.length; i++) {
      result += acceptingStates[i].title;
      if (i < acceptingStates.length - 1) {
        result += ",";
      }
    }
    result += "}";
  }
  
  //position data
  result += "#";
  questionDiv.statesData.forEach(function (d) {
    result += "{id:" + d.id 
      + ",title:" + d.title 
      + ",x:" + d.x
      + ",y:" + d.y
      + ",initial:" + d.initial
      + ",accepting:" + d.accepting + '};';
  });
  result += "-";
  questionDiv.edgesData.forEach(function (d) {
      result += "{id:" + d.id 
      + ",sourceId:" + d.source.id
      + ",targetId:" + d.target.id 
      + ",symbols:" + d.symbols 
      + ",dx:" + d.dx
      + ",dy:" + d.dy
      + ",angle:" + d.angle + '};';
  });

  questionDiv.textArea.value = result;
}

/*
parsuje text z textArea a upravi podla neho states&edges data
!! momentalne predpoklada ze text je syntakticky spravny !!
old editor: ^init=[a-zA-Z0-9]+$ => nefungoval ked neboli medzery medzi str
*/
function updateDataFromText(questionDiv){
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
            edgesPresent.add({from: state1, to: state2, symbol: sym});
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
        matches.forEach(element => {
          var state1 = element.substring(1, element.indexOf(","));
          var sym = element.substring(element.indexOf(",") + 1, element.indexOf(")"));
          if (sym == "\\e")
            sym = "ε";
          var states2 = element.substring(element.indexOf("=") + 2, element.length - 1).split(",");
          
          statesPresent.add(state1);
          states2.forEach(element => {
            statesPresent.add(element);
            edgesPresent.add({from: state1, to: element, symbol: sym});
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
    var state = getStateGroupByTitle(questionDiv, titleOfInitState);
    if (state == null) {
      var newData = newStateData(questionDiv, stateTitle, 0,0,false,false);
      newData.accepting = finalStates.includes(stateTitle);
      newData.initial = stateTitle == titleOfInitState;
      statesToCreate.add(newData);
    }
  });

  statesToCreate.forEach(sd => {
    addState(questionDiv, sd);
  });

  var currentStates = questionDiv.statesData; // uz by mali byt updatenute (pridane nove stavy)
  currentStates.forEach(data => {
    if (!statesPresent.includes(data.title)) {
      deleteState(questionDiv, data);
    }
    else {
      if (data.title == titleOfInitState && !data.initial) {
        setNewStateAsInitial(questionDiv, data);
      }

      if ((!finalStates.includes(data.title) && data.accepting == true)
        || (finalStates.includes(data.title) && data.accepting == false)) {
        toggleAcceptingState(data, getStateGroupById(data.id));
      }
    }
  });

  // updating edges
  //TODO: merge multiple egdes with same source&target into one edge  !!
  //  -> purpose: so there exists only ONE edge between source and target

  mergedEdges.forEach(function(e) { 
    if (!getEdgeGroupNode(questionDiv, e.from, e.to)) {
      addEdge(
        questionDiv, 
        getStateGroupByTitle(questionDiv, from).data(),
        getStateGroupByTitle(questionDiv, to).data(), 
        e.symbol);
    }
  });

  var oldEdges = questionDiv.edgesData;
  oldEdges.forEach(ed => {
    var key = ed.source.title + "," + ed.target.title;
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
    if (!mergedEdges.has(ed.source.title + "," + ed.target.title)) {
      mergedEdges.set(ed.source.title + "," + ed.target.title, ed.id);
      //console.log("key=" + ed.source.title + "," + ed.target.title + " : value=" + mergedEdges.get(ed.source.title + "," + ed.target.title));
    }
    else {
      var motherEdgeData = getEdgeDataById(questionDiv, mergedEdges.get(ed.source.title + "," + ed.target.title));
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


// ------------------------------------------------------
// utils
// ------------------------------------------------------

function printData(array) {
  array.forEach(function (dataItem) {
    console.log(dataItem);
  });
}

function midpoint(x1, x2) {
  return (x1 + x2) / 2;
}

function distBetween(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2));
}

function getCoordinates(oldXy, svgGroup) {
  var transform = d3.zoomTransform(svgGroup.node());
  var newXy = transform.invert(oldXy);

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

function repositionMarker(edgeGroup)
{
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

function cropTitleIfTooLong(title) {
  if (title.length > 6) {
    return title.slice(0, 5).concat("...");
  }
  return title;
}

function toggleFullnameVisibitity(rect, visible = false){
  rect.style("visibility", function () { return visible == true ? "visible" : "hidden"; });
  rect.FullnameText.style("visibility", function () { return visible == true ? "visible" : "hidden"; });
}

//reposition function?? aj pre edge rect/text napr.
function showFullname(rect, d) {
  toggleFullnameVisibitity(rect, true);
  rect.FullnameText.text(d.title);
  var w = rect.FullnameText.node().getComputedTextLength() + 8;
  rect.attr("width", w);
  rect.FullnameText.attr("x", d.x - w/2 + 3.5).attr("y", d.y + graphConsts.nodeRadius + 19.5);
  rect.attr("x", d.x - w/2 ).attr("y", d.y + (graphConsts.nodeRadius + 2));
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

function getStateGroupByTitle(questionDiv, title) {
  return questionDiv.graphDiv.svg.svgGroup.stateGroups
    .filter(function (d) { return d.title == title; });
}

function getEdgeGroupNode(questionDiv, sourceTitle, targetTitle) {
  var res = null;

  questionDiv.graphDiv.svg.svgGroup.edgeGroups
    .each(function (d) {
      if (d.source.title == sourceTitle && d.target.title == targetTitle) {
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

//unused?
function getEdgeDataById(questionDiv, id) {
  for (let i = 0; i < questionDiv.edgesData.length; i++) {
    const data = questionDiv.edgesData[i];
    if (data.id == id) {
      return data;
    }
  }
  return null;
}

function newStateData(questionDiv, title, x, y, initial, accepting) {
  return {
    id: ++questionDiv.graphDiv.stateIdCounter, // ..++ ?
    title: title != null ? title : "S" + questionDiv.graphDiv.stateIdCounter,
    x: x,
    y: y,
    initial: initial,
    accepting: accepting,
  }
}

function getSvgTextLength(wp, string) {
  wp.textNode.text(string);
  return wp.textNode.node().getComputedTextLength() + 8;
}

//syntax
function graphTransitionsSyntax()
{
	return /^(([a-zA-Z0-9]+)|(ε)|(\\e))(,(([a-zA-Z0-9]+)|(ε)|(\\e)))*$/;
}

function incorrectGraphTransitionsSyntax(val)
{
	return (!graphTransitionsSyntax().test(val))
}

function stateNameIsValid(statesData, id, name) {
  for (var i = 0; i < statesData.length; i++) {
    if (statesData[i].id != id && statesData[i].title == name) {
      return false;
    }
  }
  return true;
}

function getNewStateName(promptText, d, statesData) {

  var incorrect;
  var result = prompt(promptText, d.title);

  if (result == null) return null;

  do {
    incorrect = false;
    if (!stateNameIsValid(statesData, d.id, result)) {
      result = prompt(stateNameAlreadyExistsPrompt + " " + promptText, d.title);
      incorrect = true;
    }
  }
  while (incorrect == true && result != null);

  return result;
}

function getNewEdgeSymbols(promptText, prevSymbols = null) {
  var result;
  if (prevSymbols == null) {
    result = prompt(promptText);
  }
  else {
    result = prompt(promptText, prevSymbols);
  }
  if (result == null) return null;

  var incorrect;

  do {
    incorrect = false;
    var symbols = result.split(",");
    symbols = symbols.filter(function(item, pos) {return symbols.indexOf(item) == pos;});
    symbols.forEach(function(item, i) { if (item == "\\e") symbols[i] = "ε"; });
    result = symbols.toString();

    if (result == "") {
      result = prompt("Chyba: Nelze přidat prázdný přechod! " + promptText, result);
      incorrect = true;
    }
    if (!incorrect) { //if incorrect != false
      if (incorrectGraphTransitionsSyntax(result))
			{
				result = prompt("Chyba: Nevyhovující syntax! " + promptText, result);
				incorrect = true;
			}
    }
  }
  while (incorrect && result != null);
  return result;
}