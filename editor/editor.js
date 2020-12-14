
var menuButtonClass = "menu-button";

const graphConsts = {
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

var MIN_TABLE_CELL_WIDTH = 50;

const tableClasses = {
  myTable : "myTable",
  myCell : "myCell",
  columnHeader : "column-header-cell", //ch
  rowHeader : "row-header-input", //rh
  innerCell : "inner-cell",
  inputCellDiv : "cell-div", //myCellDiv
  inputColumnHeaderDiv : "column-header-div",
  noselectCell : "noselect",
  inactiveCell : "inactive-cell", //tc
  selectedHeaderInput : "selected-header-input",
  incorrectCell : "incorrect-cell", //incorrect
  deleteButton : "delete-button-cell", //deleteButton
  addButton : "add-button-cell" //addButton
}
var activeQuestionDiv;
var SELECTED_SVG_ELEMENT;

function initialise(id, type) {
  //questionDiv == wp !
  //var questionDiv = document.getElementById(id); // v ISe uz bude existovat div s id
  if (!window.jQuery_new) {
    jQuery_new = $;
  }
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
  tableButton.addEventListener("click", function() { clickTable(questionDiv)} );

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
  hintContentDiv.setAttribute("class", "hint-content-div");
  hideElem(hintContentDiv);
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

  initGraph(questionDiv);
  initTableDiv(questionDiv);

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
  
  questionDiv.invisibleText = d3.select(questionDiv)
    .append("svg").attr("visibility", "hidden")
    .append("text").attr("visibility", "hidden").classed("mock-text", true).text("none");

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

function initInitialState(questionDiv) {
  var initialData = {
    id: generateId(questionDiv),
    x: 100,
    y: 100,
    initial: true,
    accepting: false,
    new: false
  };
  addState(questionDiv, initialData);
  repositionInitArrow(questionDiv.graphDiv, initialData);
}

// ------------------------------------------------------
// GRAPH functions
// ------------------------------------------------------

var zoom = d3.zoom()
  //.translateExtent([[0, 0], [800, 500]])
  .scaleExtent([0.3, 10]).on("zoom", svgZoomed);

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

document.addEventListener('keydown', windowKeyDown);

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
  
  //TODO: init selection of multiple elements???
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
      if (targetState.id == sourceState.id) {
        toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);
        temporaryEdgePath.attr("d", getNewSelfloopDefinition(sourceState.x, sourceState.y, mouseX, mouseY, temporaryEdgePath.node()));
      }
      else { // snap to state
        temporaryEdgePath.attr( "d", getStraightPathDefinition(sourceState.x, sourceState.y, targetState.x, targetState.y));
      }
      graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", false);
      repositionMarker(graphDiv.svg.svgGroup.temporaryEdgeG);
    }
    //mouse is not hovering above any state
    else { 
      graphDiv.svg.svgGroup.temporaryEdgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", true);
      temporaryEdgePath.attr("d", getStraightPathDefinition(sourceState.x, sourceState.y, mouseX, mouseY));
    }
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

//dragging
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

function stateDragend(event, d) {}

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
      repositionEdgeRect(d3.select(this).select("rect"), tx, ty);
      repositionEdgeText(d3.select(this).select("text"), tx, ty + 5);
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

      repositionEdgeRect(d3.select(this).select("rect"), tx, ty);
      repositionEdgeText(d3.select(this).select("text"), tx, ty + 5);
      repositionMarker(d3.select(this));
    });

}

function edgeDragstart(event, d) {
  var graphDiv = d3.select(this).node().parentGraphDiv;

  graphDiv.graphState.mouseDownEdge = d;
  toggleEdgeSelection(d3.select(this), graphDiv, event, d);
  toggleFullnameVisibitity(graphDiv.svg.svgGroup.stateFullnameRect);
  hideElem(graphDiv.stateContextMenuDiv);
  hideElem(graphDiv.edgeContextMenuDiv);
}

function edgeDragmove(event, d) {
  var edgeG = d3.select(this);
  //var graphDiv = edgeG.node().parentGraphDiv;
  var oldPathDefinition = edgeG.select("." + graphConsts.edgePathClass).attr("d");

  edgeG
    .select("." + graphConsts.edgePathClass)
    .attr("d", repositionPathCurve(d, event.x, event.y, oldPathDefinition));

  var coords = getEdgeRectPosition(edgeG.select("." + graphConsts.edgePathClass).attr("d"), d.source == d.target);

  repositionEdgeRect(edgeG.select("rect"), coords.tx, coords.ty);
  repositionEdgeText(edgeG.select("text"), coords.tx, coords.ty + 5);
  repositionMarker(edgeG);
}

function edgeDragend(event, d) {
}

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

function updateEdgeRectAndTextPosition(questionDiv, edgesSelection) {
  edgesSelection
    .each( function(ed) {
      var rectS = d3.select(this).select("rect");
      var textS = d3.select(this).select("text");

      rectS.attr("width", calculateEdgeRectWidth(questionDiv, textS.text()));

      var dAttr = d3.select(this).select("." + graphConsts.edgePathClass).attr("d");
      var coords = getEdgeRectPosition(dAttr, ed.source == ed.target);

      repositionEdgeRect(rectS, coords.tx, coords.ty);
      repositionEdgeText(textS, coords.tx, coords.ty + 5);
    });
}

// STATE
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
      
      if (d.id != d3.select(this).select("text").text()) {
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
      return d.id;
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
      if (getEdgeGroupNode(graphDiv.parentNode, graphState.mouseDownState.id, graphState.mouseOverState.id) != null) {
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
    });

  hideInitArrow(questionDiv.graphDiv);
  
}

function renameState(questionDiv, stateData, newTitle = null) {
  if( newTitle == null) {
    newTitle = promptNewStateName(renameStatePrompt, stateData, questionDiv.statesData);
  }
  if (newTitle == null) return;

  //update data
  questionDiv.statesData
    .filter(function (d) {
      return d.id == stateData.id;
    })
    .map(function (d) {
      d.id = newTitle;
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
    .call(dragEdge);

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
  updateEdgeRectAndTextPosition(questionDiv, newEdge);

  updateEdgeGroups(questionDiv.graphDiv.svg.svgGroup);
}

function toggleEdgeSelection(edgeGroup, graphDiv, event, d) {
  removeSelectionFromState(graphDiv);
  if (graphDiv.graphState.selectedEdge != d) {
    removeSelectionFromEdge(graphDiv);
    graphDiv.graphState.selectedEdge = d;
    SELECTED_SVG_ELEMENT = edgeGroup;
    edgeGroup.classed(graphConsts.selectedClass, true);
  }
}

function renameEdge(questionDiv, edgeData, symbols = null) {
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

  updateEdgeRectAndTextPosition(questionDiv, edgeGroup);
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

// ------------------------------------------------------
// TABLE functions
// ------------------------------------------------------
function createTable(questionDiv) {
  var table = document.createElement("table");
  table.setAttribute("class", tableClasses.myTable);
  table.selectedCell = null;
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
      if (! table.symbols.includes(symb)) table.symbols.push(symb);
    });
  });

  table.states.sort();
  table.symbols.sort();

  //create first row = consisting of 2 inactive cells
  var row1 = table.insertRow(table.rows.length); // -1 ?
  insertInactiveCell(row1, 0);
  insertInactiveCell(row1, 1);

  var row2 = table.insertRow(table.rows.length);
  insertInactiveCell(row2, 0);
  var cell = insertInactiveCell(row2, 1);
  addResizable(table, cell);

  // filling out columns' headers from symbols and delete buttons above them
  table.symbols.forEach(symb => {
    insertColumnDeleteButton(table, row1);
    insertColumnHeader(row2, symb);
  });
  insertColumnAddButton(table, row1);

  // filling out rows' headers (states' titles)
  table.states.forEach(stateTitle => {
    var row = table.insertRow(table.rows.length);
    insertRowDeleteButton(table, row);
    var headerValue = "";
    if (table.initState == stateTitle) {
      if (table.exitStates.includes(stateTitle)) {
        headerValue += '↔';
      }
      else {
        headerValue += '→';
      }
    }
    else if (table.exitStates.includes(stateTitle)) {
      headerValue += "←";
    }
    headerValue += stateTitle;
    insertRowHeader(row, headerValue);

    for (var j = 0; j < table.symbols.length; j++) {
      insertInnerCell(table, row);
    }
    
  });
  insertRowAddButton(table);

  // filling transitions
  questionDiv.edgesData.forEach(ed => {
    var row = table.rows[table.states.indexOf(ed.source.id) + 2];

    ed.symbols.split(",").forEach(symb => {
      var cell = row.cells[table.symbols.indexOf(symb) + 2];

      if (questionDiv.type == "DFA") {
        cell.myDiv.value = ed.target.id;
      }
      else if (questionDiv.type == "NFA" || questionDiv.type == "EFA") {
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
    });
  });

  questionDiv.tableDiv.removeChild(oldTable);
  questionDiv.tableDiv.removeChild(questionDiv.tableDiv.alertText);
  questionDiv.tableDiv.appendChild(questionDiv.tableDiv.alertText);

  /*
  if (jeProhlizeciStranka()) {
    jQuery_new(table).find("input").prop("disabled", true).addClass("mydisabled");
  }
  */
}

function insertColumnAddButton(table, row) {
  var cell = insertCellWithDiv(row, null, [tableClasses.addButton,tableClasses.noselectCell], null, "+");
  //cell.table = table;
  cell.addEventListener("click", function() { 
    insertColumn(table);
  });
}

function insertColumnDeleteButton(table, row) {
  var cell = insertCellWithDiv(row, null, 
    [tableClasses.deleteButton, tableClasses.noselectCell],
    null, "x");

  cell.addEventListener("click", () => deleteColumn(table, cell.cellIndex));
}

function insertRowAddButton(table) {
  var newRow = table.insertRow(table.rows.length);
  var cell = insertCellWithDiv(newRow, 0, [tableClasses.addButton, tableClasses.noselectCell], null, "+");
  cell.addEventListener("click", function (e) {
    insertRow(table);
  })
}

function insertRowDeleteButton(table, row) {
  var cell = insertCellWithDiv(row, 0, 
    [tableClasses.deleteButton, tableClasses.noselectCell], null, "x");

  cell.addEventListener("click", function() { deleteRow(table, cell.parentNode.rowIndex); });
}

function insertInnerCell(table, row) {
  var cell = insertCell(row, row.cells.length, [tableClasses.myCell]);

  var value = table.questionDiv.type == "NFA" ? "{}" : "";
  var input = createInput([tableClasses.inputCellDiv], value, value,
    table.rows[1].cells[cell.cellIndex].style.minWidth);

  input.addEventListener("click", (e) => cellClickHandler(e, table));
  input.addEventListener("input", (e) => tableCellChanged(e, table, input));
  input.addEventListener("focusout", (e) => tableCellChangedFinal(e, table, input));

  var regex;
  if (table.questionDiv.type == "NFA")
    regex = /[a-zA-Z0-9{},]/;
  else
    regex = /[a-zA-Z0-9\-]/;

  input.addEventListener("keypress", function (e) { cellKeypressHandler(e, regex); });

  cell.myDiv = input;
  cell.appendChild(input);
}

function insertRowHeader(row, name) {
  var cell = insertCell(row, row.cells.length, [
    //tableClasses.myCell,
    "row-header-cell"
  ]);
  var table = getParentByType("table", cell);
  var input = createInput([tableClasses.inputCellDiv, tableClasses.rowHeader], 
    name, name, table.rows[1].cells[cell.cellIndex].style.minWidth);

  input.defaultClass = tableClasses.rowHeader; // whhy>?

  input.addEventListener("click", tableHeaderCellClick);
  input.addEventListener("input", (e) => tableRhChanged(e, table, input));
  input.addEventListener("focusout", (e) => tableRhChangedFinal(e, table, input));
  input.addEventListener("keypress", function(event) {
    cellKeypressHandler(event, stateSyntax());
  });

  cell.myDiv = input;
  cell.appendChild(input);
}

function insertColumnHeader(row, symbol) {
  var cell = insertCell(row, row.cells.length, 
    [
      //tableClasses.myCell, 
      tableClasses.columnHeader], 
      MIN_TABLE_CELL_WIDTH);

  var table = getParentByType("table", cell);
  var input = createInput([tableClasses.inputColumnHeaderDiv], symbol, symbol, MIN_TABLE_CELL_WIDTH);
  addResizable(table, cell);

  input.addEventListener("click", cellClickHandler);
  input.addEventListener("input", (e) => tableChChanged(e, table, input));
  input.addEventListener("focusout", tableChChangedFinal);
  
  var regex = table.questionDiv.type == "EFA" ?  tableEFATransitionSyntax() : DFATransitionSyntax();
  input.addEventListener("keypress", function(e) {
    cellKeypressHandler(e, regex);
  });

  cell.myDiv = input;
  cell.appendChild(input);
}

function insertRow(table, title) {
  if (table.locked) {
    return;
  }
  if (title == null) {
    title = generateId(table.parentNode.parentNode);
  }
  deselectCell(table);
  table.rows[table.rows.length - 1].deleteCell(0);
  insertRowDeleteButton(table, table.rows[table.rows.length - 1]);
  insertRowHeader(table.rows[table.rows.length - 1], title);

  for (i = 2; i < table.rows[0].cells.length - 1; i++) {
			insertInnerCell(table, table.rows[table.rows.length - 1]);
  }
  insertRowAddButton(table);

  // create state in graph
  var data = newStateData(table.questionDiv, title, 0, 0, false, false, true);
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

//DELETE
function deleteRow(table, rowIndex) {
  if (table.locked) return;

  var stateId = table.rows[rowIndex].cells[1].myDiv.value;
  stateId = removePrefix(stateId);
  table.states.splice(table.states.indexOf(stateId), 1);
  //delete state in graph (& from data)
  var data = getStateDataById(table.questionDiv, stateId);
  deleteState(table.questionDiv, data);

  for (i = 2; i < table.rows.length - 1; i++) {
    for (j = 2; j < table.rows[i].cells.length; j++) {
      var value = table.rows[i].cells[j].myDiv.value;
      if (table.questionDiv.type == "NFA" || table.questionDiv.type == "EFA") {
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
  for (i = 0; i < table.rows.length - 1; i++) {
    table.rows[i].deleteCell(index); //deleteCell() automaticky posunie vsetky cells dolava
  }
}

/* INPUT CHANGES */
function tableChChanged(e, table, input) {
  var symbol = input.value;
  //if (symbol == "\e") symbol = "ε"; 
  var type = table.questionDiv.type;

  if (
    (type == "EFA" && incorrectEFATransitionSyntax(symbol)) ||
    (type != "EFA" && ( incorrectDFATransitionSyntax(symbol) || symbol == "ε" )) ) 
  {
    d3.select(input).classed(tableClasses.incorrectCell, true);
    var err;
    if (type == "EFA") {
      err = tableErrors.EFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX;
    }
    else {
      err = tableErrors.NFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX;
    }
    activateAlertMode(table, err);
  }
  else if (tableColumnSymbolAlreadyExists(table, input, symbol)) {
    d3.select(input).classed(tableClasses.incorrectCell, true);
    activateAlertMode(table, tableErrors.DUPLICIT_TRANSITION_SYMBOL, input);
  }
  else{
    d3.select(input).classed(tableClasses.incorrectCell, false);
    if (table.locked) {
      hideElem(table.alertStatus);
      unlockTable(table);
    }
  }
}

function tableChChangedFinal() { }

function tableRhChanged(e, table, input) {
  var currentValue = removePrefix(input.value);
  var rowIndex = input.parentNode.parentNode.rowIndex;

  if (incorrectStateSyntax(currentValue)) {
    d3.select(input).classed(tableClasses.incorrectCell, true);
    activateAlertMode(table, tableErrors.INCORRECT_STATE_SYNTAX, input);
  }
  else if (tableStateAlreadyExists(table, input, currentValue)) {
    d3.select(input).classed(tableClasses.incorrectCell, true);
    activateAlertMode(table, tableErrors.DUPLICIT_STATE_NAME, input);
  }
  else {
    d3.select(input).classed(tableClasses.incorrectCell, false);
    if (table.locked) {
      unlockTable(table);
      hideElem(table.alertStatus);
    } 
    //TODO: toggling initial / accepting (1094)
  }
}

function tableRhChangedFinal(e, table, input) {
  if (jQuery_new(input).hasClass(tableClasses.incorrectCell) == false && !table.locked) {
    if (input.prevValue == input.value) return;

    var prevName = removePrefix(input.prevValue);
    var newName = removePrefix(input.value);
    
    table.states.splice(table.states.indexOf(prevName), 1);
    table.states.push(newName);

    //rename state in graph
    renameState(table.questionDiv, getStateDataById(table.questionDiv, prevName), newName);

    var d = getStateDataById(table.questionDiv, newName);

    var initial = false, accepting = false;
    if (input.value[0] == '↔') {
      initial = accepting = true;
    }
    else if (input.value[0] == '←') {
      initial = false;
      accepting = true;
    }
    else if (input.value[0] == '→') {
      initial = true;
      accepting = false;
    }
    if (initial) {
      setNewStateAsInitial(table.questionDiv, d);
    }
    else {
      setInitStateAsNotInitial(table.questionDiv);
    }
    if (accepting != d.accepting) {
      toggleAcceptingState(d, getStateGroupById(table.questionDiv, d.id));
    }

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
          if (table.questionDiv.type == "NFA" || table.questionDiv.type == "EFA") {
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
  if (!(table.parentNode.type == "NFA" && incorrectTableNFATransitionsSyntax(input.value))
    || (table.questionDiv.type == "DFA" && incorrectTableDFATransitionsSyntax(input.value))
  ) {
    d3.select(input).classed(tableClasses.incorrectCell, false);
    if (table.locked) {
      table.questionDiv.tableDiv.alertText.innerHTML == "";
      hideElem(table.questionDiv.tableDiv.alertText);
      unlockTable();
    }
  }
}

function tableCellChangedFinal(e, table, input) { }

//dorobit
function tableHeaderCellClick(evt) {
  var cell = evt.target;
  //var table = cell.parentElement.parentElement.parentElement.parentElement;
  var table = getParentByType("table", cell);
  if (!table.locked && table.selectedCell != cell) {
    selectDifferentCell(table, cell);

    //HOME
    //disable/enable init and accepting buttons
  }
}

/* HELPER FUNCTIONS */
function insertCell(row, index, classlist, width = null) {
  var cell = row.insertCell(index);
  var cellS = d3.select(cell);
  classlist.forEach(c => { cellS.classed(c, true); });

  if (width != null) {
    cell.style.minWidth = width;
  }
  return cell;
}

function createInput(classlist, value, prevValue, width = MIN_TABLE_CELL_WIDTH) {
  var input = document.createElement("input");
  if (value != null) {
    input.value = value;
  }
  if (prevValue != null) {
    input.prevValue = prevValue;
  }
  if (width != null) {
    input.style.width = width;
  }
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
  cellClasslist.forEach(c => {
    cellS.classed(c, true);
  });

  var div = document.createElement("div");
  if (divClasslist != null) {
    var d = d3.select(div);
    divClasslist.forEach(dc => { 
      d.classed(dc, true);
    });
  }

  cell.appendChild(div);
  return cell;
}

function insertInactiveCell(row, index) {
  var classes = [
    //tableClasses.myCell, 
    tableClasses.inactiveCell, 
    tableClasses.noselectCell
  ];
  return insertCellWithDiv(row, index, classes, 
    [
     // tableClasses.inactiveCell
    ]);
}




function cellClickHandler(event) {
  var cell = event.target;
  //var table = cell.parentElement.parentElement.parentElement.parentElement;
  var table = getParentByType("table", cell);
  if (!table.locked) {
    deselectCell(table);
  }
}

function cellKeypressHandler(event, regex) {
  var code = event.keyCode || event.which;
  if (code == 13) {
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
  if (table.selectedCell != null) {
    var div = table.selectedCell;
    d3.select(div).classed(tableClasses.selectedHeaderInput, false);
    //jQuery_new(div).switchClass();
    table.selectedCell = null;
  }
  
  /*
  table.wp.tableTab.buttonInit.disabled = true;
	table.wp.tableTab.buttonEnd.style.borderStyle = "outset";
  table.wp.tableTab.buttonEnd.disabled = true;
  */
}



function selectDifferentCell(table, newCell) {
  var prev;
  if (table.selectedCell) {
    prev = d3.select(table.selectedCell);
  }
  if (prev) {
    prev.classed(tableClasses.selectedHeaderInput, false);
    prev.classed(tableClasses.rowHeader, true);
  }
  var next = d3.select(newCell);
  next.classed(tableClasses.selectedHeaderInput, true);
  next.classed(tableClasses.rowHeader, false);

  table.selectedCell = newCell;
}

//FIX
function addResizable(table, cell) {
  jQuery_new(cell).resizable({
		handles: 'e',
		resize: function() 
		{
			if (parseInt(this.style.width) >= MIN_TABLE_CELL_WIDTH) 
			{
        this.style.minWidth = this.style.width;
        var ci = this.cellIndex;
				//zmenenie sirky vsetkych cells v stlpci
        for (var i = 1; i < table.rows.length - 1; i++) {
          var t = getParentByType("table", this);
          t.rows[i].cells[ci].myDiv.style.width = this.style.width;
        }
			}
		},
  });
  cell.style.minWidth = MIN_TABLE_CELL_WIDTH;
}

function lockTable(table, exceptionInput) {
  for (var i = 1; i < table.rows.length - 1; i++) {
		for (var j = 1; j < table.rows[i].cells.length; j++) {
			if (table.rows[i].cells[j].myDiv == exceptionInput) {
        continue;
      }
			jQuery_new(table.rows[i].cells[j].myDiv).prop('readonly', true);
		}
	}
	table.locked = true;
}

function unlockTable(table) {
	for (var i = 1; i < table.rows.length - 1; i++)
	{
		for (var j = 1; j < table.rows[i].cells.length; j++)
		{
			jQuery_new(table.rows[i].cells[j].myDiv).prop('readonly', false);
		}
	}
	table.locked = false;
}

function tableStateAlreadyExists(table, input, value) {
  var ri = input.parentNode.parentNode.rowIndex;
  for (var i =2; i < table.rows.length - 1; i++) {
    if (i != ri && value == removePrefix(table.rows[i].cells[1].myDiv.value)) {
      return true;
    }
  }
  return false;
}

function tableColumnSymbolAlreadyExists(table, input, symbol) {
  var ci = input.parentNode.cellIndex;

  for (var i = 2; i < table.rows.length; i++) {
    if (i != ci && symbol == table.rows[1].cells[i].myDiv.value) {
      return true;
    }
  }
  return false;
}

function findSymbol(table) {
  var symbol, symbprefix = "";
  var k = 'a'.charCodeAt(0);
  do
  {
    if (k > 'z'.charCodeAt(0))
    {
      symbprefix += "a";
      k = 'a'.charCodeAt(0);
    }
    symbol = symbprefix + String.fromCharCode(k);
    k++;
  }
  while (table.symbols.indexOf(symbol) != -1)
  
  return symbol;
}

function getParentByType(type, child) {
  /*
  try {
    var parent = child.parentNode;

    while (parent != null || parent.nodeName != "body") {
      if (parent.nodeName.toLowerCase() == type) {
        return parent;
      }
      parent = parent.parentNode;
    }
  }
  catch(e) { 
    console.log(e.message);
   }
  return null;  
  */
 return child.parentNode.parentNode.parentNode;
}

function removePrefix(stateId) {
  var first = stateId.charAt(0);
	if (first == '→' || first == '←' || first == '↔') {
    stateId = stateId.substring(1, stateId.length);
  }
  return stateId;
}

function setAlert(table, error, tableLocked = true) {
  table.alertStatus.innerHTML = error;
  if (tableLocked) {
    table.alertStatus.innerHTML += " " + tableErrors.TABLE_LOCKED;
  }
}

function activateAlertMode(table, error, exc) {
  setAlert(table, error, true);
  showElem(table.alertStatus);
  lockTable(table, exc);
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

  else if (questionDiv.type == "NFA" || questionDiv.type == "EFA") {
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
    for (let [key, value] of  transitions.entries()) {
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
  result += "#";
  questionDiv.statesData.forEach(function (d) {
    result += "{id:" + d.id 
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

  mergedEdges.forEach(function(e) { 
    if (!getEdgeGroupNode(questionDiv, e.from, e.to)) {
      addEdge(
        questionDiv, 
        getStateGroupById(questionDiv, from).data(),
        getStateGroupById(questionDiv, to).data(), 
        e.symbol);
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


// ------------------------------------------------------
// utils
// ------------------------------------------------------

// HTML ELEMENTS UTILS
function hideElem(element) {
  element.style.display = "none";
}

function showElem(element, inline = false) {
  if (inline) {
    element.style.display = "inline-block";
  }
  else {
    element.style.display = "block";
  }
}

function clickGraph(questionDiv) {
  //prejst vsetky stavy 
  //a ak stav nie je inicialny && nie je akceptujuci && nema ziadne prechody z neho aj do neho tak vymazat
  hideElem(questionDiv.textArea);
  hideElem(questionDiv.tableDiv);
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
  hideElem(questionDiv.graphDiv);
  hideElem(questionDiv.hintDiv);
  hideElem(questionDiv.textArea);
  if (questionDiv.lastEdited == "text") {
    //updateDataFromText(questionDiv);
    
  }
  createTableFromData(questionDiv);
  showElem(questionDiv.tableDiv);
}

function clickText(questionDiv) {
  hideElem(questionDiv.graphDiv);
  hideElem(questionDiv.hintDiv);
  hideElem(questionDiv.tableDiv);

  generateTextFromData(questionDiv);
  showElem(questionDiv.textArea);
  questionDiv.lastEdited = "text";
}

function clickHintButton(questionDiv) {
  var hintContentDiv = questionDiv.hintDiv.contentDiv;
  //hintContentDiv.classList.toggle("slide-Active");
  if (hintContentDiv.style.display == "none") {
    showElem(hintContentDiv, true);
    questionDiv.hintDiv.hintButton.innerText = hintLabel + " 🡡";
  }
  else {
    hideElem(hintContentDiv);
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

function printData(collection) {
  collection.forEach(function (dataItem) {
    console.log(dataItem);
  });
}

// editor utils
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
  rect.FullnameText.text(d.id);
  var w = rect.FullnameText.node().getComputedTextLength() + 8;
  rect.attr("width", w);
  rect.FullnameText.attr("x", d.x - w/2 + 3.5).attr("y", d.y + graphConsts.nodeRadius + 19.5);
  rect.attr("x", d.x - w/2 ).attr("y", d.y + (graphConsts.nodeRadius + 2));
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
        (stateData.x - graphConsts.nodeRadius - 5) +
        "," +
        stateData.y
    );
}

function repositionEdgeRect(rect, x, y) {
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

function hideEdge(edgeG){
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
  svg.svgGroup.selectAll("." + graphConsts.stateGroupClass).on(".drag", null);
  svg.svgGroup.selectAll("." + graphConsts.edgeGroupClass).on(".drag", null);
  svg.on(".zoom", null);
}

function enableAllDragging(svg) {
  svg.svgGroup.selectAll("." + graphConsts.stateGroupClass).call(dragState);
  svg.svgGroup.selectAll("." + graphConsts.edgeGroupClass).call(dragEdge);
  svg.call(zoom).on("dblclick.zoom", null);
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

function getEdgeGroupNode(questionDiv, sourceTitle, targetTitle) {
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

function newStateData(questionDiv, id, x, y, initial, accepting, isNew = false) {
  return {
    id: id != null ? id : generateId(questionDiv),
    x: x,
    y: y,
    initial: initial,
    accepting: accepting,
    isNew : isNew
  }
}

function getSvgTextLength(wp, string) {
  wp.textNode.text(string);
  return wp.textNode.node().getComputedTextLength() + 8;
}

function generateId(questionDiv) {
  return "S" + (++questionDiv.graphDiv.stateIdCounter);
}

function stateIdIsUnique(statesData, d, newId) {
  for (var i = 0; i < statesData.length; i++) {
    if (statesData[i].id == newId && statesData[i] != d) {
      return false;
    }
  }
  return true;
}

function promptNewStateName(promptText, d, statesData) {
  var incorrect;
  var result = prompt(promptText, d.id);

  if (result == null) return null;

  do {
    incorrect = false;
    if (!stateIdIsUnique(statesData, d, result)) {
      result = prompt(stateNameAlreadyExistsPrompt + " " + promptText, d.id);
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

function deleteSymbolFromAllEdges(questionDiv, symbol) {
  var toDelete = [];

  questionDiv.edgesData.forEach(ed => {
    if (ed.symbols == symbol) {
      toDelete.push(ed);
    }
    else {
      var symbolsArray = ed.symbols.split(',');
      symbolsArray.splice(symbolsArray.indexOf(symbol), 1);
      renameEdge(questionDiv, ed, symbolsArray.join(","));
    }
  });

  toDelete.forEach(ed => {
    deleteEdge(questionDiv, ed);
  });
}

function calculateEdgeRectWidth(questionDiv, text) {
  questionDiv.invisibleText.text(text);
  return questionDiv.invisibleText.node().getComputedTextLength() + 8;
}
// -------------------------------------------------------------------------------
// syntax 
// -------------------------------------------------------------------------------
function stateSyntax()
{
	return /^[a-zA-Z0-9]+$/;
}

function incorrectStateSyntax(val) {
  return !(stateSyntax().test(val));
}

function graphTransitionsSyntax()
{
	return /^(([a-zA-Z0-9]+)|(ε)|(\\e))(,(([a-zA-Z0-9]+)|(ε)|(\\e)))*$/;
}

function incorrectGraphTransitionsSyntax(val)
{
	return (!graphTransitionsSyntax().test(val))
}

function DFATransitionSyntax()
{
	return /^[a-zA-Z0-9]+$/;
}

function tableEFATransitionSyntax()
{
	return /^ε$|^\\$|^[a-zA-Z0-9]+$/;
}

function tableNFATransitionsSyntax()
{
	return /^\{\}$|^\{[a-zA-Z0-9]+(,[a-zA-Z0-9]+)*\}$/;
}

function incorrectTableNFATransitionsSyntax(val)
{
	return (!tableNFATransitionsSyntax().test(val))
}

function EFATransitionSyntax()
{
	return /^ε$|^\\e$|^[a-zA-Z0-9]+$/;
}

function incorrectEFATransitionSyntax(val)
{
	return (!EFATransitionSyntax().test(val))
}

function DFATransitionSyntax()
{
	return /^[a-zA-Z0-9]+$/;
}

function incorrectDFATransitionSyntax(val)
{
	return (!DFATransitionSyntax().test(val))
}