var questionDiv;
var graphDiv;
var hintDiv;
var textArea;
var stateContextMenuDiv, edgeContextMenuDiv;

//graph
var graphState,
  graphConsts,
  svg,
  svgGroup,
  stateGroups,
  edgeGroups,
  stateIdCounter = 0;
var temporaryEdgePath,
  temporaryEdgeG,
  zoom,
  edgeIdCounter = 0;
var stateG, edgeG;

var statesData = [];
var edgesData = [];

var type = "DFA";

// -------------
// language
// -------------
var graphMenuButton = "Graf";
var textMenuButton = "Text";
var tableMenuButton = "Tabuľka";
var hintLabel = "Nápoveda";
var addTransitionPrompt = "Zadajte symboly prechodu:";
var renameStatePrompt = "Zadajte názov stavu:";

//state context menu
var addTransitionText = "Pridať prechod";
var renameStateText = "Premenovať";
var deleteStateText = "Odstrániť";
var setAsInitialText = "Nastaviť ako počiatočný";

var hints = {
  HINT_ADD_STATE : "<b>pridanie noveho stavu:</b> double click na platno",
  HINT_ADD_TRANSITION : "<b>pridanie noveho prechodu:</b> SHIFT + tahat stav",
  HINT_SELECT_ELEMENT : "<b>vybratie stavu/prechodu:</b> click stav/prechod",
  HINT_UNSELECT_ELEMENT : "<b>zrusenie vybratia stavu/prechodu:</b> click na platno",
  HINT_DELETE_ELEMENT : "<b>vymazanie stavu/prechodu:</b> right click -> \"" + deleteStateText + "\", alebo click na stav/prechod + del / backspace",
  HINT_RENAME_ELEMENT : "<b>premenovanie stavu/prechodu:</b> right click -> \"" + renameStateText + "\"",
  HINT_TOGGLE_INITIAL_STATE : "<b>oznacenie stavu ako inicialneho:</b> right click -> \"" + setAsInitialText + "\"",
  HINT_TOGGLE_ACCEPTING_STATE : "<b>oznacenie a odznacenie stavu ako akceptujuceho:</b> double click na stav"
}

function initialise(id, type) {
  //var wp = document.getElementById(id); // v ISe uz bude existovat div s id
  questionDiv = document.createElement("div");
  questionDiv.setAttribute("class", "tab-content edit-active"); // delete later | prohlizeciStranke => disabled
  questionDiv.setAttribute("id", id);
  questionDiv.type = type;

  //create menu BUTTONS
  var graphButton = document.createElement("button");
  graphButton.innerText = graphMenuButton;
  graphButton.setAttribute("class", "menu-button");
  graphButton.addEventListener("click", clickGraph);

  var textButton = document.createElement("button");
  textButton.innerText = textMenuButton;
  textButton.setAttribute("class", "menu-button");
  textButton.addEventListener("click", clickText);

  var tableButton = document.createElement("button");
  tableButton.innerText = tableMenuButton;
  tableButton.setAttribute("class", "menu-button");
  //tableButton.addEventListener("click", ______ );

  questionDiv.appendChild(graphButton);
  questionDiv.appendChild(textButton);
  questionDiv.appendChild(tableButton);

  //HINT
  hintDiv = document.createElement("div");
  hintDiv.setAttribute("id", "hintDiv");
  var hintButton = document.createElement("button");
  hintButton.setAttribute("id", "hintButton");
  hintButton.innerText = hintLabel + " 🡣";
  hintButton.addEventListener("click", clickHintButton);

  var hintContentDiv = document.createElement("div");
  hintContentDiv.setAttribute("id", "hintContentDiv");
  hintContentDiv.setAttribute("class", "slide-Inactive");
  hintDiv.appendChild(hintButton);
  hintDiv.appendChild(hintContentDiv);

  setupHints(hintContentDiv);

  graphDiv = document.createElement("div");
  graphDiv.setAttribute("id", "graphDiv");

  textArea = document.createElement("textarea");
  textArea.setAttribute("id", "textArea");

  questionDiv.appendChild(hintDiv);
  questionDiv.appendChild(graphDiv);
  questionDiv.appendChild(textArea);

  document.body.appendChild(questionDiv);

  //statesData = [{ id: 0, title: "S0", x: 100, y: 100, initial: true, accepting: false }];
  createStateContextMenu();
  createEdgeContextMenu();
  initGraph();
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

function initGraph() {
  graphState = {
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

  graphConsts = {
    selectedClass: "selected",
    connectClass: "connect-node",
    stateGroupClass: "state-group",
    stateTextClass: "state-text",
    edgeGroupClass: "edge-group",
    edgePathClass: "edge-path",
    edgeMarkerClass: "edge-marker-path",
    edgeRectClass: "edge-rect",
    edgeTextClass: "edge-text",
    graphClass: "graph",
    activeEditId: "active-editing",
    BACKSPACE_KEY: 8,
    DELETE_KEY: 46,
    ENTER_KEY: 13,
    nodeRadius: 30,
    nodeStrokeWidth: 2.1,
  };

  svg = d3
    .select("#graphDiv")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%");

  svg
    .append("rect")
    .attr("id", "svg-rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .on("click contextmenu", rectClick)
    .on("dblclick", rectDblclick);

  zoom = d3.zoom().scaleExtent([0.3, 10]).on("zoom", svgZoomed);

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
  

  svgGroup = svg.append("svg:g").classed("graph-svg-group", true);

  //"temporary" path when creating edges
  temporaryEdgeG = svgGroup.append("g").attr("id", "temporary edge group");

  temporaryEdgePath = temporaryEdgeG
    .append("svg:path")
    .attr("class", graphConsts.edgePathClass + " dragline hidden")
    .attr("d", "M0,0L0,0")
    .style("marker-end", "url(#temporary-arrow-end)");

    //MARKER ???
  temporaryEdgeG
    .append("svg:path")
    .classed(graphConsts.edgeMarkerClass, true)
    //.attr("marker-end", "url(#Triangle" + aLine.parentSvg.divId + ')')
    .attr("marker-end", "url(#end-arrow)");
  
    //init-arrow
  svgGroup
    .append("svg:path")
    .attr("class", graphConsts.edgePathClass + " init-arrow")
    .style("marker-end", "url(#temporary-arrow-end)");

  svgGroup.append("svg:g").classed("edges", true);
  svgGroup.append("svg:g").classed("states", true);

  stateGroups = svgGroup
    .select(".states")
    .selectAll("g")
    .data(statesData)
    .enter()
    .append("g")
    .classed(graphConsts.stateGroupClass, true);

  edgeGroups = svgGroup
    .select(".edges")
    .selectAll("g")
    .data(edgesData)
    .enter()
    .append("g")
    .classed(graphConsts.edgeGroupClass, true);

  initInitialState();

  d3.select(window).on("keydown", windowKeyDown).on("keyup", windowKeyUp);

  initToolbox();
}

function initInitialState() {
  var initialData = {
    id: stateIdCounter,
    title: "S0",
    x: 100,
    y: 150,
    initial: true,
    accepting: false,
  };
  addState(100, 100, initialData);
  repositionInitArrow(initialData);
}

var dragPath = d3
  .drag()
  .on("start", pathDragstart)
  .on("drag", pathDragmove)
  .on("end", pathDragend);

var dragState = d3
  .drag()
  .clickDistance(10)
  .on("start", stateDragstart)
  .on("drag", stateDragmove)
  .on("end", stateDragend);

function rectClick(event, d) {
  event.preventDefault();
  removeSelectionFromState();
  removeSelectionFromEdge();

  hideElem(stateContextMenuDiv);
  hideElem(edgeContextMenuDiv)
  //TODO: init selection of multiple elements
}

function rectDblclick(event, d) {
  //if we clicked on other svg elements do nothing
  var coords = getCoordinates(d3.pointer(event));
  if (event.srcElement.tagName == "rect") {
    addState(coords.x, coords.y);
  }
}

function windowKeyDown(event, d) {
  if (graphDiv.style.display == "none") {
    return;
  } 
  // make sure repeated key presses don't register for each keydown
  if (graphState.lastKeyDown !== -1) {
    return;
  }
  graphState.lastKeyDown = event.keyCode;

  if (
    event.keyCode == graphConsts.BACKSPACE_KEY ||
    event.keyCode == graphConsts.DELETE_KEY
  ) {
    if (graphState.selectedState) {
      deleteState(graphState.selectedState);
      graphState.selectedState = null;
    } else if (graphState.selectedEdge) {
      deleteEdge(graphState.selectedEdge);
      graphState.selectedEdge = null;
    }
  }
}

function windowKeyUp() {
  graphState.lastKeyDown = -1;
}

// zoom {& drag svg}
function svgZoomed({ transform }) {
  hideElem(stateContextMenuDiv);
  svgGroup.attr("transform", transform);
  removeSelectionFromState();
  removeSelectionFromEdge();
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

function updateEdgeGroups() {
  edgeGroups = svgGroup.select(".edges").selectAll("g");
}

function updateStateGroups() {
  stateGroups = svgGroup.select(".states").selectAll("g");
}

//state dragging
function stateDragstart(event, d) {
  graphState.mouseDownState = d;
  toggleStateSelection(d3.select(this), event, d);
  hideElem(stateContextMenuDiv);
  hideElem(edgeContextMenuDiv);
}

function stateDragmove(event, d) {
  graphState.justDragged = true;

  //creating new edge
  if (graphState.creatingEdge) {
    var connecting_node = d3.select("." + graphConsts.connectClass);
    
    if (connecting_node.size() > 0) { //if mouse is hovering over some state
      if (connecting_node.data()[0].id == d.id) { //self-loop
        temporaryEdgePath.attr("d", getNewSelfloopDefinition(d.x, d.y, d.x, d.y, d));
      }
      else {
        temporaryEdgePath.attr(
          "d", getStraightPathDefinition(d.x, d.y, 
            connecting_node.data()[0].x ,connecting_node.data()[0].y) );
      }
      temporaryEdgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", false);
      repositionMarker(temporaryEdgeG);
      
    } else { //not hovering above any state
      temporaryEdgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", true);

      temporaryEdgePath.attr(
        "d", getStraightPathDefinition(d.x, d.y, 
          d3.pointer(event, svgGroup.node())[0] ,d3.pointer(event, svgGroup.node())[1])
      );
    }
  }
  //dragging state
  else {
    d.x = event.x;
    d.y = event.y;
    d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");

    if (d.initial) { repositionInitArrow(d); }

    updateOutgoingEdges(d);
    updateIncommingEdges(d);
   }
  
}

function stateDragend(event, d) {
  temporaryEdgePath.classed("hidden", true);
  temporaryEdgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", true);

  //creating new edge
  if ( graphState.creatingEdge && graphState.mouseDownState && graphState.mouseOverState) {

    //TODO checking syntax
    var transitionSymbols = checkEdgeSymbolsValidity(addTransitionPrompt);
    if (transitionSymbols != null) {
      addEdge(graphState.mouseDownState, graphState.mouseOverState, transitionSymbols);
    }
    removeSelectionFromState();
    graphState.lastKeyDown = -1;
  } 

  graphState.creatingEdge = false;
  graphState.mouseDownState = null;
}

function repositionInitArrow(stateData) {
  d3.select(".init-arrow").attr(
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

function updateOutgoingEdges(stateData) {
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

function updateIncommingEdges(stateData) {
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
  graphState.mouseDownEdge = d;
  toggleEdgeSelection(d3.select(this), event, d);
  hideElem(stateContextMenuDiv);
  hideElem(edgeContextMenuDiv);
}

function pathDragmove(event, d) {
  var edgeG = d3.select(this);
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


function addEdge(from, to, symbols) {
  var newEdgeData = {
    id: edgeIdCounter,
    source: from,
    target: to,
    symbols: symbols,
    dx : 0,
    dy: 0,
    angle: 0
  };
  edgeIdCounter++;
  edgesData.push(newEdgeData);

  //??? necessary ???
  edgeGroups.data(edgesData, function (d) {
    return String(d.source.id) + "+" + String(d.target.id);
  });

  var newEdge = edgeGroups
    .data(edgesData)
    .enter()
    .append("g")
    .classed(graphConsts.edgeGroupClass, true)
    .attr("id", function (d) {
      return d.id;
    });

  //events
  //if (!jeProhlizecistranka()) {}
  newEdge
    .on("contextmenu", function(event, d) {
      event.preventDefault();
      hideElem(stateContextMenuDiv);
      toggleEdgeSelection(d3.select(this), event, d);
      setContextMenuPosition(edgeContextMenuDiv, event.y, event.x);
      showElem(edgeContextMenuDiv);
    })
    .call(dragPath);

  newEdge
    .append("svg:path")
    //.style("marker-end", "url(#end-arrow)")
    .classed(graphConsts.edgePathClass, true)
    .attr("d", function (d) {
      if (d.source.id == d.target.id) {
        return getNewSelfloopDefinition(d.source.x, d.source.y, d.source.x, d.source.y, d);
      }
      else {
        return getStraightPathDefinition(d.source.x, d.source.y, d.target.x, d.target.y);
      }
    });

  newEdge
    .append("svg:path")
    .classed(graphConsts.edgeMarkerClass, true)
    //.attr("marker-end", "url(#Triangle" + aLine.parentSvg.divId + ')')
    .attr("marker-end", "url(#end-arrow)");

  newEdge
    .append("rect")
    .classed(graphConsts.edgeRectClass, true)
    .attr("rx", 5)
    .attr("height", 20);

  newEdge
    .append("text")
    .classed(graphConsts.edgeTextClass, true)
    .text(function (d) { return d.symbols; })
    .attr("text-anchor", "middle");
  
  repositionMarker(newEdge);
  updateEdgeRectAndText(newEdge);

  updateEdgeGroups();
}

function updateEdgeRectAndText(edgesSelection) {
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

//path repositioning functions
function repositionPathCurve(edgeData, mouseX, mouseY, oldPathDefinition) {
  if (edgeData.source == edgeData.target) {
    var str = oldPathDefinition.split(" ");
    return getNewSelfloopDefinition(str[1], str[2], mouseX, mouseY, edgeData);
  }
  else {
    return getNewPathDefinition(edgeData.id, mouseX, mouseY, oldPathDefinition, edgeData); 
  }
}

//move path (drag)
function getNewPathDefinition(edgeID, mouseX, mouseY, pathD, edgeData) {
  //M100 250 Q250 250 400 250
  
  var str = pathD.split(" ");

  var dx = 2*( mouseX-( ( +str[1] + (+str[6] ) ) / 2) );
  var dy = 2*( mouseY-( ( +str[2] + (+str[7] ) ) / 2) );
  str[4] = ( ( +str[1] + ( +str[6] ) ) / 2 ) + dx;
  str[5] = ( ( +str[2] + ( +str[7] ) ) / 2 ) + dy;

  //update dx, dy data
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

function getNewSelfloopDefinition(x1, y1, x2, y2, edgeData) {
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
  edgeData.angle = angle;

  return "M " + x1 + " " + y1 + " C "
    + cubicControlPoints(x1, y1, angle)
    + " " + x1 + " " + y1;
}

function getStraightPathDefinition(x1, y1, x2, y2) {
  return "M " + x1 + " " + y1 + " Q " +
    midpoint(x1, x2) +  " " +
    midpoint(y1, y2) +  " " + 
    x2 + " " + y2 ;
}

// STATE functions
function addState(x, y, data = null) {
  if (data == null) {
    data = {
      id: stateIdCounter,
      title: "S" + stateIdCounter,
      x: x,
      y: y,
      initial: false,
      accepting: false,
    };
  }
  stateIdCounter++;
  statesData.push(data);

  stateGroups.data(statesData, function (d) {
    return d.id;
  });

  var newStateSelection = stateGroups.data(statesData).enter().append("g");

  //event handlers
  //if (!jeProhlizecistranka()) {}
  newStateSelection
    .on("dblclick", toggleAcceptingState)
    .on("mouseover", function (event, d) {
      graphState.mouseOverState = d;
      d3.select(this).classed(graphConsts.connectClass, true);
    })
    .on("mouseout", function (d) {
      graphState.mouseOverState = null;
      d3.select(this).classed(graphConsts.connectClass, false);
    })
    .on("mousedown", stateMouseDown)
    .on("contextmenu", function(event, d) {
      event.preventDefault();
      hideElem(edgeContextMenuDiv);
      toggleStateSelection(d3.select(this), event, d);
      setContextMenuPosition(stateContextMenuDiv, event.y, event.x);
      showElem(stateContextMenuDiv);
    })
    .call(dragState);

  //add svg elements
  addStateSvg(newStateSelection);

  updateStateGroups();
}

function addStateSvg(newStates) {
  newStates
    .classed(graphConsts.stateGroupClass, true)
    .attr("id", function (d) {
      return d.id;
    })
    .attr("transform", function (d) {
      return "translate(" + d.x + "," + d.y + ")";
    });

  newStates
    .append("circle")
    .attr("r", graphConsts.nodeRadius)
    .attr("stroke-width", graphConsts.nodeStrokeWidth);

  newStates
    .append("text")
    .classed(graphConsts.stateTextClass, true)
    .text(function (d) {
      return "S" + d.id;
    })
    .attr("text-anchor", "middle")
    .attr("y", 7);
}

function stateMouseDown(event, d) {
  if (event.shiftKey) {
    graphState.creatingEdge = true;
    
    temporaryEdgePath
      .classed("hidden", false)
      .attr("d", "M" + d.x + "," + d.y + "L" + d.x + "," + d.y); // nastav ju do stredu stavu
  }
}

function toggleStateSelection(selection, event, d) {
  removeSelectionFromEdge();

  if (graphState.selectedState != d) { // another state was selected
    removeSelectionFromState(); 
    graphState.selectedState = d;
    selection.classed(graphConsts.selectedClass, true);
  }
  /*
  else { // this was selected
    removeSelectionFromState();
  }*/
}

function toggleAcceptingState(event, stateData) {
  if (stateData.accepting) {
    d3.select(this).select(".accepting-circle").remove();
  } else {
    d3.select(this)
      .append("circle")
      .attr("class", "accepting-circle")
      .attr("r", graphConsts.nodeRadius - 4)
      .attr("stroke", "black")
      .attr("stroke-width", graphConsts.nodeStrokeWidth)
      .attr("fill", "transparent");

    d3.select(this).select("text").raise();
  }
  stateData.accepting = !stateData.accepting;
}

function setNewStateAsInitial(stateData) {
  setInitStateAsNotInitial();

  statesData
    .filter(function (d) {
      return d.id == stateData.id;
    })
    .map(function (d) {
      d.initial = true;
    });
  
  repositionInitArrow(stateData);
}

function setInitStateAsNotInitial() {
  statesData
    .filter(function (d) {
      return d.initial = true;
    })
    .map(function(d) {
      d.initial = false;
    })
}

function renameState(stateData) {
  var newTitle = checkStateTitleValidity(renameStatePrompt, stateData.title);
  
  //update data
  statesData
    .filter(function (d) {
      return d.id == stateData.id;
    })
    .map(function (d) {
      if (newTitle != null) {
        d.title = newTitle;
      }
    });

  //update svg text
  stateGroups
    .filter(function(d) {
      return d.id == stateData.id;
    })
    .select("." + graphConsts.stateTextClass)
    .text( function() {
      // TODO funkcia - ak je dlhsi tak Abc....
      return newTitle;
    });
}

// - state delete functions
function deleteState(stateData) {
  deleteStateSvg(stateData);
  deleteStateEdges(stateData);
  deleteStateData(stateData);
  updateStateGroups();
}

function deleteStateData(stateData) {
  statesData.splice(statesData.indexOf(stateData), 1);
}

function deleteStateSvg(stateData) {
  svgGroup
    .select(".states")
    .selectAll("g")
    .filter(function (d) {
      return d.id == stateData.id;
    })
    .remove();
}

function deleteStateEdges(stateData) {
  //delete the SVG
  edgeGroups
    .filter(function (ed) {
      return ed.source == stateData || ed.target == stateData;
    })
    .remove();

  //delete data
  edgesData
    .filter(function (ed) {
      return ed.source == stateData || ed.target == stateData;
    })
    .map(function (ed) {
      edgesData.splice(edgesData.indexOf(ed), 1);
    });

  updateEdgeGroups();
}


// EDGE functions
function toggleEdgeSelection(selection, event, d) {
  removeSelectionFromState();
  if (graphState.selectedEdge != d) {
    removeSelectionFromEdge();
    graphState.selectedEdge = d;
    selection.classed(graphConsts.selectedClass, true);
  }/*
  else { // this was selected
    removeSelectionFromEdge();
  }*/
}

function removeSelectionFromState() {
  if (graphState.selectedState == null) {
    return;
  }
  stateGroups
    .filter(function (stateData) {
      return stateData.id === graphState.selectedState.id;
    })
    .classed(graphConsts.selectedClass, false);
  graphState.selectedState = null;
}

function removeSelectionFromEdge() {
  if (graphState.selectedEdge == null) {
    return;
  }
  edgeGroups
    .filter(function (edgeData) {
      return edgeData.id === graphState.selectedEdge.id;
    })
    .classed(graphConsts.selectedClass, false);
  graphState.selectedEdge = null;
}

function renameEdge(edgeData) {
  var newSymbols = checkEdgeSymbolsValidity(addTransitionPrompt, edgeData.symbols);

  if (newSymbols == null) return;
  edgesData
    .filter(function (ed) {
      return ed.id == edgeData.id;
    })
    .map (function (ed) {
      ed.symbols = newSymbols;
    });
  
  var s = edgeGroups
    .filter(function(ed) {
      return ed.id == edgeData.id;
    });

  s
    .select("text")
    .text(function (d) { 
      return newSymbols; 
    });
  
  updateEdgeRectAndText(s);
}

// - edge delete functions
function deleteEdge(edgeData) {
  deleteEdgeSvg(edgeData);
  updateEdgeGroups();
  deleteEdgeData(edgeData);
}

function deleteEdgeSvg(edgeData) {
  svgGroup
    .select(".edges")
    .selectAll("g")
    .filter(function (ed) {
      return ed.id == edgeData.id;
    })
    .remove();
}

function deleteEdgeData(edgeData) {
  edgesData.splice(edgesData.indexOf(edgeData), 1);
}

// HTML ELEMENTS UTILS
function hideElem(element) {
  element.style.display = "none";
}

function showElem(element) {
  element.style.display = "block";
}

function clickGraph() {
  hideElem(textArea);
  //generateGraphFromText()??;
  showElem(graphDiv);
  showElem(hintDiv);
}

function clickText() {
  hideElem(graphDiv);
  hideElem(hintDiv);
  generateTextFromData();
  showElem(textArea);
}

function clickHintButton() {
  var hintContentDiv = document.getElementById("hintContentDiv");
  hintContentDiv.classList.toggle("slide-Active");
  if (hintContentDiv.classList.contains("slide-Active")) {
    document.getElementById("hintButton").innerText = hintLabel + " 🡡";
  }
  else {
    document.getElementById("hintButton").innerText = hintLabel + " 🡣";
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

/* Updating functions ------------------------------------------ */
function generateTextFromData() {
  var result = "";
  var acceptingStates = [];

  statesData.forEach(function (state) {
    if (state.initial) {
      result += "init=" + state.title + " ";
    }
    if (state.accepting) {
      acceptingStates.push(state);
    }
  });

  edgesData.forEach(function (edge) {
    if (type === "DFA") {
      edge.symbols.split(",").forEach((symbol) => {
        if (symbol == "ε") {
          symbol = "\\e";
        }
        result +=
          "(" +
          edge.source.title +
          "," +
          symbol +
          ")=" +
          edge.target.title +
          " ";
      });
    } else if (type === "NFA") {
    }
  });

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
  

  //data
  result += "#";
  statesData.forEach(function (d) {
    result += "{id:" + d.id 
      + ",title:" + d.title 
      + ",x:" + d.x
      + ",y:" + d.y
      + ",initial:" + d.initial
      + ",accepting:" + d.accepting + '};';
  });
  result += "-";
  edgesData.forEach(function (d) {
      result += "{id:" + d.id 
      + ",sourceId:" + d.source.id
      + ",targetId:" + d.target.id 
      + ",symbols:" + d.symbols 
      + ",dx:" + d.dx
      + ",dy:" + d.dy
      + ",angle:" + d.angle + '};';
  });

  textArea.innerText = result;

  //return result;
}

function setContextMenuPosition(menu, top, left){
  menu.style.top = top + "px";
  menu.style.left = left + "px";
}

function createContextMenuButton(innerText, func) {
  var button = document.createElement("button");
  button.setAttribute("class", "context-menu-button");
  button.innerText = innerText;
  button.addEventListener("click", func);
  return button;
}

// State CONTEXT MENU + handlers
function createStateContextMenu() {
  stateContextMenuDiv = document.createElement("div");
  stateContextMenuDiv.setAttribute("id", "stateContextMenuDiv");
  stateContextMenuDiv.setAttribute("class", "context-menu");

  /*
  var addConnectionButton = document.createElement("button");
  addConnectionButton.setAttribute("id", "addConnectionButton");
  addConnectionButton.innerText = addTransitionText;
  addConnectionButton.addEventListener("click", addTransitionHandler);
  stateMenuDiv.appendChild(addConnectionButton); */

  stateContextMenuDiv.appendChild(createContextMenuButton( renameStateText, renameStateHandler) );
  stateContextMenuDiv.appendChild(createContextMenuButton( deleteStateText, deleteStateHandler) );
  stateContextMenuDiv.appendChild(createContextMenuButton( setAsInitialText, setStateAsInitialHandler) );
  graphDiv.appendChild(stateContextMenuDiv);
}

function deleteStateHandler() {
  deleteState(graphState.selectedState);
  hideElem(stateContextMenuDiv);
}

function renameStateHandler(){
  renameState(graphState.selectedState)
  hideElem(stateContextMenuDiv);
}

function setStateAsInitialHandler() {
  setNewStateAsInitial(graphState.selectedState)
  hideElem(stateContextMenuDiv);
}

// Edge CONTEXT MENU + handlers
function createEdgeContextMenu() {
  edgeContextMenuDiv = document.createElement("div");
  edgeContextMenuDiv.setAttribute("id", "edgeContextMenuDiv"); // potrebne?
  edgeContextMenuDiv.setAttribute("class", "context-menu");
  
  edgeContextMenuDiv.appendChild(createContextMenuButton(renameStateText, renameEdgeHandler));
  edgeContextMenuDiv.appendChild(createContextMenuButton(deleteStateText, deleteEdgeHandler));

  graphDiv.appendChild(edgeContextMenuDiv);
}

function deleteEdgeHandler() {
  deleteEdge(graphState.selectedEdge);
  hideElem(edgeContextMenuDiv);
}

function renameEdgeHandler() {
  renameEdge(graphState.selectedEdge);
  hideElem(edgeContextMenuDiv);
}

// validity check functions
function checkStateTitleValidity(promptText, prevTitle) {

  // do ... while ...
  var result = prompt(promptText, prevTitle);
  
  return result;
}

function checkEdgeSymbolsValidity(promptText, prevSymbols = null) {
  // check if moze existovat prechod podla zadania (DFA), ci uz nie je prechod s tym istym pismenkom atd
  // validity check vo DO-WHILE cykle
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

// utils
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

function getCoordinates(oldXy) {
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

//syntax
function graphTransitionsSyntax()
{
	return /^(([a-zA-Z0-9]+)|(ε)|(\\e))(,(([a-zA-Z0-9]+)|(ε)|(\\e)))*$/;
}

function incorrectGraphTransitionsSyntax(val)
{
	return (!graphTransitionsSyntax().test(val))
}