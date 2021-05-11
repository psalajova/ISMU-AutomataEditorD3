const MENU_BUTTON = "menu-button";
const CONTEXT_MENU = "context-menu";
const GRAPH_DIV = "graphDiv";
const QUESTION_DIV = "editor-content";
const STATE_INDEX = 2;
const MIN_TABLE_CELL_WIDTH = "50px";

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

/**
 * Width and height of editor canvas.
 */
const params = {
  width: 900,
  height: 700
};

/**
 * States of editor in graph mode.
 */
const graphStateEnum = Object.freeze({
  "default": 0,
  "creatingEdge": 1,
  "namingEdge": 2,
  "renamingEdge": 3,
  "renamingState": 4,
  "mergingEdge": 5,
  "initial": 6 //when editor contains no states, is empty
});

/**
 * Enum to specify state and edge data origin.
 */
const elemOrigin = Object.freeze({
  "default": 0,     //created in graph mode
  "fromTable": 1,   //created in table mode
  "fromExisting": 2 //when recreating editor from existing data
});

var editor_init, upload, editorIdCount = 0;
var minStateWidth = "50px";
var SELECTED_ELEM_GROUP, maxZoomout = 0.5;

/* ------------------------------ Initialization ------------------------------ */

setupLanguage();

if (typeof editor_init !== 'function') {
  /*
    najprv sa iba generuju ids a napla sa otazky{} - robi sa editor_init(type)
    potom window.onload - zoberu sa vsetky textareas a postupne sa k nim vytvara div, initialise...
 */
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
        createEditor(div, txa);
      }
    }
  }
  editor_init = function (type) {
    var id = EditorUtils.generateEditorId(type);
    //if element with id already exists, generate a new id
    while (document.getElementById(id) != null) {
      id = EditorUtils.generateEditorId(type);
    }
    otazky[document.getElementsByTagName('textarea').length] = id;
  };
  upload = function () { editor_init(null); };
}

/**
 * Object holding all editors in document.
 */
const EditorManager = {
  editors: new Map(),

  addEditor: function (editor) {
    this.editors.set(editor.id, editor);
  },

  getEditor: function (id) {
    return this.editors.get(id);
  },

  /**
   * Deselects all editors' elements except the editor with id @param exceptionId.
   * Necessary, beacuse only one editor can have active elements at any given moment.
   * @param {String} exceptionId 
   */
  deselectAll: function (exceptionId = null) {
    for (let [id, editor] of this.editors) {
      if (id !== exceptionId && !EditorUtils.typeIsRegOrGram(editor.type)) {
        //TODO
        if (SELECTED_ELEM_GROUP && SELECTED_ELEM_GROUP.node().parentGraph == editor.Graph) {
          SELECTED_ELEM_GROUP.select("input").node().blur();
        }

        //if graph is in initial (empty) state we don't want to change it
        if (editor.Graph.graphState.currentState != graphStateEnum.initial) {
          editor.Graph.setCurrentState(graphStateEnum.default);

        }
        editor.Graph.graphState.lastTargetState = null;

        editor.Graph.removeSelectionFromState();
        editor.Graph.removeSelectionFromEdge();
        editor.Graph.hideAllContextMenus();
        HtmlUtils.hideElem(editor.Graph.renameError);
        EdgeUtils.hide(editor.Graph.temporaryEdgeG);

        editor.Graph.enableAllDragging();
      }
    }
  }
}

/**
 * Base class for one Automata Editor mode.
 */
class AutomataEditorMode {
  constructor(editorId, statesData, edgesData) {
    this.editorId = editorId;
    this.statesData = statesData;
    this.edgesData = edgesData;
  }

  getEditor() {
    return EditorManager.getEditor(this.editorId);
  }

  updateText() {
    this.getEditor().generateTextFromData();
  }

  getStateDataById(id) {
    return this.getElemById(this.statesData, id);
  }

  getEdgeDataById(id) {
    return this.getElemById(this.edgesData, id);
  }

  getEdgeDataByStates(sourceId, targetId) {
    for (let i = 0, j = this.edgesData.length; i < j; i++) {
      const d = this.edgesData[i];
      if (d.source.id == sourceId && d.target.id == targetId) {
        return d;
      }
    }
    return null;
  }

  /**
   * Gets a state or an edge by its id.
   * @param {Array}   array 
   * @param {String}  id 
   * @returns State or edge if id matches, null otherwise.
   */
  getElemById(array, id) {
    for (let i = 0; i < array.length; i++) {
      const data = array[i];
      if (data.id == id) return data;
    }
    return null;
  }

  getNewStateData(id, x, y, initial, accepting = false, isNew = false) {
    return {
      id: id != null ? id : this.getEditor().generateStateId(),
      x: x,
      y: y,
      initial: initial,
      accepting: accepting,
      isNew: isNew
    }
  }

  getNewEdgeData(sourceId, targetId, symbols, dx = 0, dy = 0, angle = 0) {
    return {
      id: this.getEditor().generateEdgeId(),
      source: this.getStateDataById(sourceId),
      target: this.getStateDataById(targetId),
      symbols: symbols,
      dx: dx,
      dy: dy,
      angle: angle
    }
  }

  initHintContent(content) {
    var div = document.createElement("div");
    div.setAttribute("class", "hint-content-div");
    this.setupHints(div, content);
    return div;
  }

  setupHints(div, hints) {
    for (const property in hints) {
      div.appendChild(HtmlUtils.createHintParagraph(hints[property]));
    }
  }

  clickHintButton(div) {
    if (!jeProhlizeciStranka_new()) EditorManager.deselectAll();
    if (!div.style.display || div.style.display == "none") {
      HtmlUtils.showElem(div);
    }
    else {
      HtmlUtils.hideElem(div);
    }
  }
}

/**
 * Represents Graph mode of Automata Editor.
 */
class GraphMode extends AutomataEditorMode {
  constructor(editorId, statesData, edgesData) {
    super(editorId, statesData, edgesData);
    this.stateGroups = [];
    this.edgeGroups = [];
    this.graphDiv = document.createElement("div");
    this.initHints();
    this.initialise();
  }

  initHints() {
    var hintDiv = document.createElement("div");
    hintDiv.setAttribute("class", "hintDiv");

    this.hintDiv = hintDiv;

    var graphHintButton = HtmlUtils.createButton(hintLabel, "hintButton");
    graphHintButton.style.marginBottom = "7px";
    $(graphHintButton).prop("title", hintTitle)

    var syntaxButton = HtmlUtils.createButton(syntaxLabel, "hintButton");
    syntaxButton.style.marginBottom = "7px";
    $(syntaxButton).prop("title", syntaxTitle);

    var graphHintsDiv = this.initHintContent(graphHints);
    var graphSyntaxDiv = this.initHintContent(graphSyntaxHints);

    HtmlUtils.appendChildren(hintDiv, [graphHintButton, syntaxButton, graphSyntaxDiv, graphHintsDiv]);

    graphHintButton.addEventListener("click", () => this.clickHintButton(graphHintsDiv));
    syntaxButton.addEventListener("click", () => this.clickHintButton(graphSyntaxDiv));

    this.getEditor().div.appendChild(hintDiv);
  }

  /**
   * Creates all HTML elements of Graph mode.
   */
  initialise() {
    this.graphDiv.setAttribute("class", GRAPH_DIV);

    this.graphState = {
      selectedState: null,
      selectedEdge: null,
      initialState: null,
      mouseOverState: null,
      lastSourceState: null,
      lastTargetState: null,
      currentState: graphStateEnum.default
    };

    this.zoom = d3.zoom()
      .scaleExtent([0.4, 3])
      .translateExtent([[-(params.width * 2), -(params.height * 2)],
      [params.width * 2, params.height * 2]])
      .on("start", (e) => this.svgZoomStart(e))
      .on("zoom", (e) => this.svgZoomed(e))
      .on("end", (e) => this.svgZoomEnd(e));

    this.dragEdge = d3
      .drag()
      .on("start", this.edgeDragstart)
      .on("drag", this.edgeDragmove)
      .on("end", this.edgeDragend);

    this.dragState = d3.drag()
      .on("start", this.stateDragstart)
      .on("drag", this.stateDragmove)
      .on("end", this.stateDragend);

    var g = this;
    this.dragInitArrow = d3.drag().on("drag", function (e) {
      var arrow = d3.select(this).node();
      var s = g.graphState.initialState;
      arrow.angle = EdgeUtils.calculateAngle(s.x, s.y, e.x, e.y);
      d3.select(this)
        .attr("d", "M " + s.x + " " + s.y
          + " C " + MathUtils.cubicControlPoints(s.x, s.y, arrow.angle, 90, 2000)
          + " " + s.x + " " + s.y);
    });

    var svg = d3
      .select(this.graphDiv)
      .append("svg")
      .classed("main-svg", true)
      .attr("width", "100%")
      .attr("height", "100%");

    this.svg = svg;

    var rect = svg
      .append("rect")
      .attr("class", "svg-rect")
      .attr("width", "100%")
      .attr("height", "100%");

    rect.node().clickTimer = 0;
    this.svg.rect = rect;

    var defs = svg.append("svg:defs");

    //arrow marker for edges that is VISIBLE
    defs
      .append("svg:marker")
      .attr("id", "end-arrow" + this.editorId)
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
      .attr("id", "temporary-arrow-end" + this.editorId)
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
      .attr("id", "init-arrow-end" + this.editorId)
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

    svg.call(this.zoom).on("dblclick.zoom", null);
    svgGroup.attr("transform", "translate(0,0) scale(1)");

    this.svgGroup = svgGroup;
    svg.svgGroup = svgGroup;

    //"temporary" path when creating edges
    var temporaryEdgeG = svgGroup.append("g").classed("temp-edge-group", true);
    svgGroup.temporaryEdgeG = temporaryEdgeG;
    this.temporaryEdgeG = temporaryEdgeG;

    temporaryEdgeG
      .append("svg:path")
      .attr("class", graphConsts.edgePath + " dragline hidden")
      .attr("d", "M0,0L0,0")
      .style("marker-end", "url(#temporary-arrow-end" + this.editorId + ")");

    temporaryEdgeG
      .append("svg:path")
      .classed(graphConsts.edgeMarker, true)
      .attr("marker-end", "url(#end-arrow" + this.editorId + ")");

    //init-arrow
    var initArrow = svgGroup
      .append("svg:path")
      .attr("class", graphConsts.edgePath + " init-arrow")
      .style("marker-end", "url(#init-arrow-end" + this.editorId + ")");

    svgGroup.initArrow = initArrow;
    initArrow.node().angle = 3.14;

    svgGroup.append("svg:g").classed("edges", true);
    svgGroup.append("svg:g").classed("states", true);

    svgGroup.stateGroups = svgGroup
      .select(".states")
      .selectAll("g")
      .data(this.statesData)
      .enter()
      .append("g")
      .classed(graphConsts.stateGroup, true);

    this.stateGroups = svgGroup.stateGroups;

    svgGroup.edgeGroups = svgGroup
      .select(".edges")
      .selectAll("g")
      .data(this.edgesData)
      .enter()
      .append("g")
      .classed(graphConsts.edgeGroup, true);

    this.edgeGroups = svgGroup.edgeGroups;

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

    this.createStateContextMenu();
    this.createEdgeContextMenu();
    this.createAddStateMenu();
    this.createRenameError();


    if (!jeProhlizeciStranka_new()) {
      this.zoom.scaleExtent([maxZoomout, 3])
        .translateExtent([[-(params.width), -(params.height)], [params.width, params.height]]);

      //add event listeners if page is not in inspection mode
      svg.on("mousemove", (e) => this.canvasOnMousemove(e))
        .on("click", (e) => this.canvasOnClick(e))
        .on("contextmenu", (e) => this.canvasOnContextmenu(e));

      rect.on("contextmenu", (e) => this.canvasOnContextmenu(e))
        .on("dblclick", (e) => this.canvasOnDblclick(e));

      initArrow.call(g.dragInitArrow);
    }
  }

  /**
   * Recreates automaton based on @param answer.
   * @param {String} answer String representing a finite automaton in syntax of IS evaluation service.
   */
  reconstruct(answer) {
    if (!answer || answer == "") return;

    //parse zoom/pan
    var tr = answer.substring(answer.length - 21);
    if (tr.length > 2 && tr.split(";").length == 3) {
      let s = tr.split(";");
      if (s && s.length == 3) {
        let t = EditorUtils.convertStringToTransform(s[0], s[1], s[2]);
        this.setTransform(t.k, t.x, t.y);
      }
    }

    var splitted = answer.split("##states");
    var data = splitted[1].split("edges");
    var states = data[0];
    var rest = data[1];
    var editor = this.getEditor();

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
        var data = this.getNewStateData(id, x, y, initial, accepting);
        this.createState(data);

        if (initial) {
          this.setNewStateAsInitial(data);
        }
        if (accepting) {
          this.addAcceptingCircle(this.getStateGroupById(data.id));
        }
      }
    }
    if (rest != null && rest != "") {
      rest = rest.split('@');
      for (var d of rest) {
        var edgeData = d.split(';');
        if (edgeData.length != 6) continue;

        var sourceId = edgeData[0];
        var targetId = edgeData[1];
        var symbols = edgeData[2];
        var dx = parseFloat(edgeData[3]);
        var dy = parseFloat(edgeData[4]);
        var angle = parseFloat(edgeData[5]);

        var data = this.getNewEdgeData(sourceId, targetId, symbols, dx, dy, angle);
        data = EdgeUtils.checkPathData(data);
        if (editor.checkEdgeSymbolsValidity(data.id, data.source, symbols).result) {
          this.createEdge(data, elemOrigin.fromExisting);
        }
      }
    }

    editor.TextClass.textArea.innerText = answer;

    /**
     * TODO:
     * parse init arrow angle
     * 
     * when syntax check is working and textarea is not readonly, 
     * take into consideration how will textarea with wrong syntax affect editor
     */
  }


  /* ------------------------------ components ------------------------------ */

  /**
   * Creates text shown when editor contains no states and transitions.
   */
  initStartText() {
    let w = this.graphDiv.offsetWidth;
    let h = this.graphDiv.offsetHeight;

    this.initText = this.svg
      .append("text")
      .classed("initial-text", true)
      .text(emptyGraphText)
      .attr("x", (w - HtmlUtils.visualLength(emptyGraphText)) / 2)
      .attr("y", (h - HtmlUtils.visualHeight(emptyGraphText)) / 2)
      .style("visibility", "hidden")
      .on("dblclick", (e) => {
        this.endEmptyState();
        var p = EditorUtils.getPointWithoutTransform(d3.pointer(e), this.svgGroup);
        this.initInitialState(p.x, p.y);
      });

  }

  createStateContextMenu() {
    var menu = document.createElement("div");
    menu.setAttribute("class", CONTEXT_MENU);

    var a = HtmlUtils.createContextMenuButton(renameStateText);
    a.addEventListener("click", () => this.renameStateHandler());

    var b = HtmlUtils.createContextMenuButton(deleteStateText);
    b.addEventListener("click", () => this.deleteStateHandler());

    var c = HtmlUtils.createContextMenuButton(setStateAsAcceptingText);
    c.addEventListener("click", () => this.toggleAcceptingStateHandler());

    var d = HtmlUtils.createContextMenuButton(setAsInitialText);
    d.addEventListener("click", () => this.setStateAsInitialHandler());

    HtmlUtils.appendChildren(menu, [a, b, c, d]);

    this.acceptingButton = c;
    this.initialButton = d;

    this.graphDiv.appendChild(menu);
    this.stateContextMenuDiv = menu;
  }

  createEdgeContextMenu() {
    let menu = document.createElement("div");
    menu.setAttribute("class", "context-menu");

    let renameButton = HtmlUtils.createContextMenuButton(renameEdgeText);
    renameButton.addEventListener("click", () => this.renameEdgeHandler());

    let deleteButton = HtmlUtils.createContextMenuButton(deleteEdgeText);
    deleteButton.addEventListener("click", () => this.deleteEdgeHandler());

    HtmlUtils.appendChildren(menu, [renameButton, deleteButton]);

    this.graphDiv.appendChild(menu);
    this.edgeContextMenuDiv = menu;
  }

  createAddStateMenu() {
    var menu = document.createElement("div");
    menu.setAttribute("class", CONTEXT_MENU);

    var button = HtmlUtils.createContextMenuButton(addStateText);
    button.addEventListener("click", (e) => {
      var y = e.clientY - this.svg.node().getBoundingClientRect().y;
      var x = e.clientX - this.svg.node().getBoundingClientRect().x;
      var coords = EditorUtils.getPointWithoutTransform([x, y], this.svgGroup);
      this.createState(this.getNewStateData(null, coords.x, coords.y, false, false));
      HtmlUtils.hideElem(menu);
    });

    menu.appendChild(button);
    this.graphDiv.appendChild(menu);
    this.addStateContextMenu = menu;
  }

  createRenameError() {
    var p = document.createElement("p");
    p.setAttribute("class", "rename-error-p");
    HtmlUtils.hideElem(p);
    this.graphDiv.appendChild(p);
    this.renameError = p;
  }

  /* ------------------------------ event handlers ------------------------------ */

  canvasOnClick(e) {
    e.preventDefault();
    var classes = e.target.classList;
    var isState = classes.contains(graphConsts.stateElem);
    var isEdge = classes.contains(graphConsts.edgeElem) || classes.contains("edge-path");
    var graphState = this.getCurrentState();

    if (graphState == graphStateEnum.initial) return;
    //so we can select edge
    if (isEdge && graphState == graphStateEnum.default) return;
    if (isState && (
      graphState == graphStateEnum.creatingEdge ||
      //so we can click into input when renaming state
      graphState == graphStateEnum.renamingState ||

      //when naming new edge and merging edges, we click on the second state, 
      //and we dont want to cancel the state's selection
      graphState == graphStateEnum.namingEdge ||
      graphState == graphStateEnum.mergingEdge)) {
      return;
    }
    EditorManager.deselectAll();
  }

  canvasOnDblclick(e) {
    if (e.target.tagName == "rect") {
      var p = EditorUtils.getPointWithoutTransform(d3.pointer(e), this.svgGroup);
      if (this.graphState.currentState != graphStateEnum.initial) {
        this.createState(this.getNewStateData(null, p.x, p.y, false, false));
      }
      else {
        this.endEmptyState();
        this.initInitialState(p.x, p.y);
      }
    }
  }

  canvasOnContextmenu(event) {
    event.preventDefault();
    var classes = event.target.classList;
    var isState = classes.contains(graphConsts.stateElem);
    var isEdge = classes.contains(graphConsts.edgeElem);
    var state = this.getCurrentState();
    var elem;

    if (state == graphStateEnum.initial) return;

    if (isState) {
      elem = this.stateContextMenuDiv;
      if (state == graphStateEnum.renamingState) return;
    }
    else if (isEdge) { //when edge editing is active its ok to right click into input
      elem = this.edgeContextMenuDiv;
      if (state == graphStateEnum.renamingEdge ||
        state == graphStateEnum.namingEdge ||
        state == graphStateEnum.mergingEdge) {
        return;
      }
    }
    else {
      EditorManager.deselectAll();
      elem = this.addStateContextMenu;
    }
    HtmlUtils.setElemPosition(elem, d3.pointer(event)[1], d3.pointer(event)[0]);
    HtmlUtils.showElem(elem);
  }

  canvasOnMousemove(e) {
    if (this.graphState.currentState == graphStateEnum.creatingEdge) {
      this.initCreatingTransition(e);
    }
  }

  /**
   * According to where mouse is pointing decides the shape of the new edge.
   * @param {MouseEvent} e 
   * @param {Boolean} hide 
   */
  initCreatingTransition(e, hide = false) {
    var path = this.temporaryEdgeG.select("." + graphConsts.edgePath);
    if (!hide) path.classed("hidden", false);

    var targetState = this.graphState.mouseOverState;
    var sourceState = this.graphState.lastSourceState;
    var mouseX = d3.pointer(e, this.svgGroup.node())[0];
    var mouseY = d3.pointer(e, this.svgGroup.node())[1];

    //if mouse is hovering over some state
    if (this.graphState.mouseOverState) {
      if (targetState.id == sourceState.id) {
        StateUtils.toggleFullNameVisibitity(this.svgGroup.stateFullnameRect);
        path.attr("d", EdgeUtils.getSelfloopDef(sourceState.x, sourceState.y, mouseX, mouseY, path.node()));
      }
      else { // snap to state
        path.attr("d", EdgeUtils.getStraightPathDef(sourceState.x, sourceState.y, targetState.x, targetState.y));
      }
      if (!hide) this.temporaryEdgeG.select("." + graphConsts.edgeMarker).classed("hidden", false);
      this.repositionMarker(this.temporaryEdgeG);
    }
    //mouse is not hovering above any state
    else {
      this.temporaryEdgeG.select("." + graphConsts.edgeMarker).classed("hidden", true);
      path.attr("d", EdgeUtils.getStraightPathDef(sourceState.x, sourceState.y, mouseX, mouseY));
    }
    this.disableAllDragging();
  }

  renameStateHandler() {
    HtmlUtils.hideElem(this.stateContextMenuDiv);
    this.startRenaming(graphStateEnum.renamingState, this.graphState.selectedState.id);
  }

  deleteStateHandler() {
    this.deleteState(this.graphState.selectedState);
    HtmlUtils.hideElem(this.stateContextMenuDiv);
  }

  setStateAsInitialHandler() {
    this.setNewStateAsInitial(this.graphState.selectedState);
    HtmlUtils.hideElem(this.stateContextMenuDiv);
  }

  toggleAcceptingStateHandler() {
    var d = this.graphState.selectedState;
    this.toggleAcceptingState(d, this.getStateGroupById(d.id));
    HtmlUtils.hideElem(this.stateContextMenuDiv);
  }

  deleteEdgeHandler() {
    this.deleteEdge(this.graphState.selectedEdge);
    HtmlUtils.hideElem(this.edgeContextMenuDiv);
  }

  renameEdgeHandler() {
    HtmlUtils.hideElem(this.edgeContextMenuDiv);
    this.startRenaming(graphStateEnum.renamingEdge, this.graphState.selectedEdge.symbols);
  }

  /* ------------------------------ pan & zoom ------------------------------ */

  svgZoomStart() {
    EditorManager.deselectAll(this.editorId);
    this.hideAllContextMenus();
  }

  svgZoomed(e) {
    this.svgGroup.attr("transform", e.transform);
  }

  svgZoomEnd() {
    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }

  setViewToMiddle() {
    this.setTransform(1, params.width / 2, params.height / 2);
  }

  setViewToState(div, x, y) {
    div.graphDiv.svg.transition().duration(1).call(
      div.zoom.transform,
      d3.zoomIdentity.translate(params.width / 2, params.height / 2)
        .scale(1)
        .translate(-x - (div.graphDiv.offsetWidth / 3), -y - (div.graphDiv.offsetHeight / 3))
    );
    generateQuestionResult(div);
  }

  setTransform(k, x, y) {
    this.svg.call(
      this.zoom.transform,
      d3.zoomIdentity.translate(x, y).scale(k)
    );
  }


  /* ------------------------------ methods for manipulating the whole graph ------------------------------ */

  /**
   * Sets graph into empty (initial) state.
   */
  initEmptyState() {
    this.svg.select(".initial-text").style("visibility", "visible");
    this.svg.rect.classed("empty", true);
    this.setCurrentState(graphStateEnum.initial);
    this.setViewToMiddle();
    this.disableAllDragging();
  }

  /**
   * Ends graph's empty (initial) state.
   */
  endEmptyState() {
    this.svg.select(".initial-text").style("visibility", "hidden");
    this.svg.rect.classed("empty", false);
    this.graphState.currentState = graphStateEnum.default;
  }

  hideInitArrow() {
    d3.select(this.graphDiv)
      .select(".init-arrow")
      .classed("hidden", true);
  }

  getCurrentState() {
    return this.graphState.currentState;
  }

  isRenamingState(state) {
    return state == graphStateEnum.renamingState ||
      state == graphStateEnum.renamingEdge ||
      state == graphStateEnum.namingEdge ||
      state == graphStateEnum.mergingEdge;
  }

  setCurrentState(state) {
    this.graphState.currentState = state;
  }

  hideAllContextMenus() {
    HtmlUtils.hideElem(this.stateContextMenuDiv);
    HtmlUtils.hideElem(this.edgeContextMenuDiv);
    HtmlUtils.hideElem(this.addStateContextMenu);
  }

  /**
   * Hides all context menus, the rename error message or an unfinished edge (while creating).
   */
  hideAllExtras() {
    this.hideAllContextMenus();
    HtmlUtils.hideElem(this.renameError);
    EdgeUtils.hide(this.temporaryEdgeG);
  }

  enableAllDragging() {
    if (!jeProhlizeciStranka_new()) {
      this.svgGroup.selectAll("." + graphConsts.stateGroup).call(this.dragState);
      this.svgGroup.selectAll("." + graphConsts.edgeGroup).call(this.dragEdge);
      this.svg.call(this.zoom).on("dblclick.zoom", null);
    }
  }

  disableAllDragging() {
    var limitedDrag = d3.drag()
      .on("start", this.stateDragstart)
      .on("end", this.stateDragend);

    this.svgGroup.selectAll("." + graphConsts.stateGroup).call(limitedDrag);
    this.svgGroup.selectAll("." + graphConsts.edgeGroup).on(".drag", null);
    this.svg.on(".zoom", null);
  }

  /**
   * Defines graph's behaviour when starting the renaming of state or edge.
   * @param {Number} graphState Graph state (type of graphStateEnum).
   * @param {String} stateId    State ID (when renaming a state).
   * @param {String} errMsg 
   */
  startRenaming(graphState, stateId, errMsg = null) {
    var input, elemG, isState;
    if (graphState == graphStateEnum.renamingState) {
      elemG = this.getStateGroupById(stateId);
      elemG.select("input").node().value = elemG.datum().id;
      isState = true;
    }
    else {
      elemG = this.getEdgeGroupById(this.graphState.selectedEdge.id);
    }

    elemG.node().classList.add("activeRenaming");
    input = elemG.select("input").node();
    HtmlUtils.removeReadonly(input);

    input.focus();

    input.selectionStart = input.selectionEnd = 10000; //set caret position to end
    this.disableAllDragging();
    this.svgGroup.selectAll("." + graphConsts.stateGroup).on(".drag", null);

    this.setCurrentState(graphState);
    if (isState) this.selectState(elemG);

    this.setRenameErrorPosition(graphState, elemG);
    errMsg != null ? this.showRenameError(errMsg) : HtmlUtils.hideElem(this.renameError);
  }

  endRenaming() {
    if (SELECTED_ELEM_GROUP) {
      SELECTED_ELEM_GROUP.select("input").node().blur();
    }
    this.setCurrentState(graphStateEnum.default);
    HtmlUtils.hideElem(this.renameError);
    this.enableAllDragging();
  }

  setRenameErrorPosition(graphState, activeElemG) {
    var x, y;
    if (graphState == graphStateEnum.renamingState) {
      var p = EditorUtils.applyTransformationToPoint([activeElemG.datum().x, activeElemG.datum().y + 13], activeElemG);
      x = p.x;
      y = p.y;
    }
    else {
      var input = activeElemG.select("input");
      var inputWidth = parseInt((input.node().style.width).substring(0, input.node().style.width.length - 2));

      var t = EdgeUtils.getInputPosition(
        activeElemG.select("." + graphConsts.edgePath).attr("d"),
        activeElemG.datum().source == activeElemG.datum().target);

      var p = EditorUtils.applyTransformationToPoint([t.tx - inputWidth / 2, t.ty + 16], activeElemG);
      x = p.x;
      y = p.y;
    }
    HtmlUtils.setElemPosition(this.renameError, y, x);
  }

  showRenameError(msg) {
    var p = this.renameError;
    p.innerHTML = msg;
    HtmlUtils.showElem(p);
  }


  /* ------------------------------ STATE ------------------------------ */
  createState(stateData, origin = elemOrigin.default) {
    if (stateData.isNew) {
      stateData = this.findStatePlacement(stateData);
    }
    this.statesData.push(stateData);

    var newStateG = this.stateGroups
      .data(this.statesData).enter().append("g");

    newStateG.node().parentGraph = this;
    newStateG.node().clickTimer = 0;
    newStateG.node().clickedOnce = false;
    this.addStateSvg(newStateG, origin);
    this.updateStateGroups();

    if (!jeProhlizeciStranka_new()) {
      this.addStateEvents(newStateG);
      this.updateText();
    }
  }

  addStateSvg(state, origin = elemOrigin.default) {
    state
      .classed(graphConsts.stateGroup, true)
      .classed(graphConsts.stateElem, true)
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    state
      .append("circle")
      .classed(graphConsts.stateMainCircle, true)
      .classed(graphConsts.stateElem, true)
      .attr("r", graphConsts.nodeRadius);

    var g = this;
    var input = state
      .append("foreignObject")
      .classed(graphConsts.stateElem, true)
      .attr("x", -24)
      .attr("y", -12)
      .attr("height", 23)
      .attr("width", 50)
      .append("xhtml:input")
      .classed("stateInput", true)
      .classed(graphConsts.stateElem, true);

    HtmlUtils.makeReadonly(input.node());
    input.node().correct = false;
    if (origin == elemOrigin.fromExisting || origin == elemOrigin.fromTable) {
      input.node().correct = true;
    }
    input.node().realValue = state.datum().id;
    StateUtils.setInputValue(input.node(), state.datum().id);
  }

  addStateEvents(state) {
    var g = this;
    state
      .call(g.dragState)
      .on("mouseover", function (_, d) {
        g.graphState.mouseOverState = d;
        d3.select(this).classed(graphConsts.mouseOver, true);

        if (d.id != d3.select(this).select("input").node().value) {
          StateUtils.showFullName(g.svgGroup.stateFullnameRect, d);
        }
      })
      .on("mouseout", function () {
        StateUtils.toggleFullNameVisibitity(g.svgGroup.stateFullnameRect);
        g.graphState.mouseOverState = null;
        d3.select(this).classed(graphConsts.mouseOver, false);
      })
      .on("contextmenu", function (_, data) {
        //renaming this => do nothing
        if (g.getCurrentState() == graphStateEnum.renamingState
          && g.graphState.selectedState == data) {
          return;
        }

        if (g.isRenamingState(g.getCurrentState())) {
          g.endRenaming();
          return;
        }

        EditorManager.deselectAll(g.editorId);
        g.setCurrentState(graphStateEnum.default);
        g.hideAllExtras();
        g.selectState(d3.select(this));

        //TODO separate function
        if (data.initial) {
          HtmlUtils.hideElem(g.initialButton);
        }
        else {
          HtmlUtils.showElem(g.initialButton, true);
        }
        if (data.accepting) {
          g.acceptingButton.value = setStateAsNonAcceptingText;
        }
        else {
          g.acceptingButton.value = setStateAsAcceptingText;
        }
      });

    state.select("input")
      .on("dblclick", function (_, d) {
        EditorManager.deselectAll(g.editorId);
        g.hideAllExtras();
        g.selectState(g.getStateGroupById(d.id));
        g.dblclickedState = true;
        g.startRenaming(graphStateEnum.renamingState, d.id);
      })
      .on("keyup", function (e, d) {
        if (d3.select(this).node().getAttribute("readonly") == "readonly") {
          return
        };
        var validSymbols = g.getEditor().checkStateNameValidity(d, d3.select(this).node().value);
        d3.select(this).node().correct = validSymbols.result;
        if (e.keyCode == 13 && g.getCurrentState() == graphStateEnum.renamingState) {
          e.preventDefault();
          g.tryToRenameState(g.graphState.selectedState, d3.select(this).node().value);
        }
      })
      .on("keydown", function (e, d) {
        if (d3.select(this).node().getAttribute("readonly") == "readonly") {
          return;
        }
        if (e.keyCode == 13) { //prevent 'enter' from submitting form
          e.preventDefault();
        }
      })
      .on("blur", function (e, d) {
        g.getStateGroupById(d.id).classed("activeRenaming", false);
        var input = d3.select(this).node();
        if (input.getAttribute("readonly") == "readonly") {
          return;
        }
        if (input.correct == false) {
          if (g.getCurrentState() == graphStateEnum.renamingState) {
            StateUtils.setInputValue(input, d.id);
          }
        }
        else {
          g.renameState(d, input.value);
        }
        HtmlUtils.makeReadonly(input);
        HtmlUtils.hideElem(g.renameError);
        g.setCurrentState(graphStateEnum.default);
        g.dblclickedState = false;
        g.enableAllDragging();
      });
  }

  initInitialState(x, y) {
    var initialData = this.getNewStateData(null, x, y, true, false);
    this.createState(initialData);
    this.repositionInitArrow(initialData, 3.14);
    this.graphState.initialState = initialData;
  }

  updateStateGroups() {
    this.stateGroups = this.svgGroup.select(".states").selectAll("g");
  }

  deleteState(stateData) {
    if (stateData.initial == true) {
      this.hideInitArrow();
      this.graphState.initialState = null;
    }
    this.deleteStateSvg(stateData.id);
    this.deleteStateEdges(stateData);
    this.deleteStateData(stateData);
    this.updateStateGroups();

    if (!jeProhlizeciStranka_new()) {
      this.updateText();
      var editor = this.getEditor();
      if (editor.isEmpty()) {
        editor.resetStateIds();
        this.initEmptyState();
      }
    }
  }

  tryToRenameState(stateData, newId, prompt = null) {
    if (prompt != null) {
      this.showRenameError(prompt);
    }
    var input = this.getStateGroupById(stateData.id).select(".stateInput").node();

    var validityCheck = this.getEditor().checkStateNameValidity(stateData, newId);
    if (!validityCheck.result) {
      this.showRenameError(validityCheck.errMessage);
      input.correct = false;
    }
    else {
      input.correct = true;
      input.blur();
    }
  }

  renameState(stateData, newId) {
    this.statesData
      .filter(function (d) { return d.id == stateData.id; })
      .map(function (d) { d.id = newId; });

    StateUtils.setInputValue(this.getStateGroupById(stateData.id).select(".stateInput").node(), newId);

    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }

  deleteStateSvg(stateId) {
    this.svgGroup
      .select(".states")
      .selectAll("g")
      .filter(function (d) {
        return d.id == stateId;
      })
      .remove();
  }

  deleteStateData(stateData) {
    this.statesData.splice(this.statesData.indexOf(stateData), 1);
  }

  deleteStateEdges(stateData) {
    //TODO prepisat pomocou state id??
    //delete edges' SVG
    this.edgeGroups
      .filter(function (ed) {
        return ed.source == stateData || ed.target == stateData;
      })
      .remove();

    //delete data
    var g = this;
    this.edgesData
      .filter(function (ed) {
        return ed.source == stateData || ed.target == stateData;
      })
      .map(function (ed) {
        g.deleteEdgeData(ed);
      });

    this.updateEdgeGroups();
  }

  setNewStateAsInitial(stateData) {
    this.setInitStateAsNotInitial();

    this.statesData
      .filter(function (d) { return d.id == stateData.id; })
      .map(function (d) { d.initial = true; });

    this.graphState.initialState = stateData;
    this.repositionInitArrow(stateData, 3.14);

    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }

  setInitStateAsNotInitial() {
    //TODO this.graphState.initial.initial = false ???
    this.statesData
      .filter(function (d) { return d.initial == true; })
      .map(function (d) { d.initial = false; });

    this.hideInitArrow();
  }

  toggleAcceptingState(stateData, stateG) {
    if (stateData.accepting) {
      stateG.select("." + graphConsts.stateAccCircle).remove();
    } else {
      this.addAcceptingCircle(stateG);
    }
    stateData.accepting = !stateData.accepting;

    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }

  addAcceptingCircle(stateG) {
    stateG
      .append("circle")
      .classed(graphConsts.stateAccCircle, true)
      .classed(graphConsts.stateElem, true)
      .attr("r", graphConsts.nodeRadius - 3.5);
    stateG.select("foreignObject").raise();
  }

  selectState(stateGroup) {
    this.removeSelectionFromEdge();

    if (this.graphState.selectedState != stateGroup.datum()) { // another state was selected
      this.removeSelectionFromState();
      this.graphState.selectedState = stateGroup.datum();
      SELECTED_ELEM_GROUP = stateGroup;
      stateGroup.classed(graphConsts.selected, true);
    }
  }

  removeSelectionFromState() {
    if (this.graphState.selectedState == null) {
      return;
    }
    var s = this.graphState.selectedState;
    this.stateGroups
      .filter(function (d) {
        return d.id === s.id;
      })
      .classed(graphConsts.selected, false);
    this.graphState.selectedState = null;
  }

  stateDragstart(e) {
    var node = d3.select(this).node();
    var g = node.parentGraph;
    EditorManager.deselectAll(g.editorId);
    g.temporaryEdgeG.classed(graphConsts.selected, false);


    node.clickTimer = e.sourceEvent.timeStamp;
    node.startX = e.x;
    node.startY = e.y;

    g.hideAllContextMenus();

    if (g.isRenamingState(g.getCurrentState())) {
      g.endRenaming();
      EdgeUtils.hide(g.temporaryEdgeG);
    }

    g.selectState(d3.select(this));
  }

  stateDragmove(event, d) {
    var g = d3.select(this).node().parentGraph;
    StateUtils.toggleFullNameVisibitity(g.svgGroup.stateFullnameRect);

    var p = EditorUtils.applyTransformationToPoint([event.x, event.y], g.svgGroup);
    if (p.x < (params.width - graphConsts.nodeRadius) && p.x >= graphConsts.nodeRadius) {
      d.x = event.x;
    }
    if (p.y < (params.height - graphConsts.nodeRadius) && p.y >= graphConsts.nodeRadius) {
      d.y = event.y;
    }

    d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");

    if (d.initial) {
      g.repositionInitArrow(d, g.svgGroup.initArrow.node().angle);
    }

    g.updateOutgoingEdges(d);
    g.updateIncommingEdges(d);
  }

  stateDragend(e, d) {
    e.stopPropagation;

    var groupNode = d3.select(this).node();
    var g = groupNode.parentGraph;
    var graphState = g.graphState;
    var distance = MathUtils.distBetween(groupNode.startX, groupNode.startY, e.x, e.y);
    var diff = e.sourceEvent.timeStamp - groupNode.clickTimer;

    if (graphState.currentState == graphStateEnum.creatingEdge && diff < 400 && distance < 2) {
      if (graphState.lastSourceState && graphState.mouseOverState) {
        var edge = g.getEdgeDataByStates(graphState.lastSourceState.id, graphState.mouseOverState.id);
        graphState.lastTargetState = graphState.mouseOverState;

        EdgeUtils.hide(g.temporaryEdgeG);
        if (edge != null) { //edge already exists between the two states
          g.selectEdge(g.getEdgeGroupById(edge.id));
          g.startRenaming(graphStateEnum.mergingEdge, edge.symbols);
        }
        else { //adding new edge
          g.removeSelectionFromState();
          var data = g.getNewEdgeData(graphState.lastSourceState.id, graphState.lastTargetState.id, "");
          var edgeG = g.createEdge(data);
          g.selectEdge(edgeG);
          g.startRenaming(graphStateEnum.namingEdge, "");
        }
      }
    }
    //starting to create an edge
    else if (graphState.currentState != graphStateEnum.creatingEdge && diff > 1 && distance < 3) {
      graphState.lastSourceState = d;
      graphState.currentState = graphStateEnum.creatingEdge;
      g.initCreatingTransition(e, true);
    }

    if (!jeProhlizeciStranka_new()) {
      EditorManager.getEditor(g.editorId).generateTextFromData();
    }
  }

  updateOutgoingEdges(stateData) {
    var g = this;
    this.edgeGroups
      .filter(function (ed) {
        return ed.source.id === stateData.id;
      })
      .each(function (ed) {
        var tx, ty, newDef;
        if (ed.source == ed.target) {
          var def = "M " + stateData.x + " " + stateData.y + " C "
            + MathUtils.cubicControlPoints(stateData.x, stateData.y, ed.angle)
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

          str[4] = ((+str[1] + (+str[6])) / 2) + ed.dx;
          str[5] = ((+str[2] + (+str[7])) / 2) + ed.dy;

          tx = (+str[4] + (+((+str[1] + (+str[6])) / 2))) / 2;
          ty = (+str[5] + (+((+str[2] + (+str[7])) / 2))) / 2;

          newDef = str.join(" ");
        }
        d3.select(this).select("." + graphConsts.edgePath).attr("d", newDef);
        EdgeUtils.repositionInputTo(d3.select(this).select("foreignObject"), tx, ty);
        g.repositionMarker(d3.select(this));
      });
  }

  updateIncommingEdges(stateData) {
    var g = this;
    this.edgeGroups
      .filter(function (ed) {
        return ed.target.id === stateData.id && ed.source != ed.target;
      })
      .each(function (ed) {
        var str = d3.select(this).select("." + graphConsts.edgePath).attr("d").split(" ");

        str[6] = stateData.x;
        str[7] = stateData.y;

        str[4] = ((+str[1] + (+str[6])) / 2) + ed.dx;
        str[5] = ((+str[2] + (+str[7])) / 2) + ed.dy;

        var tx = (+str[4] + (+((+str[1] + (+str[6])) / 2))) / 2;
        var ty = (+str[5] + (+((+str[2] + (+str[7])) / 2))) / 2;

        d3.select(this).select("." + graphConsts.edgePath).attr("d", str.join(" "));

        EdgeUtils.repositionInputTo(d3.select(this).select("foreignObject"), tx, ty);
        g.repositionMarker(d3.select(this));
      });

  }


  /* ------------------------------ EDGE ------------------------------ */

  edgeDragstart() {
    var g = d3.select(this).node().parentGraph;
    EditorManager.deselectAll(g.editorId);

    if (g.isRenamingState(g.getCurrentState()) && !d3.select(this).classed("activeRenaming")) {
      g.endRenaming();
    }

    g.selectEdge(d3.select(this));
    StateUtils.toggleFullNameVisibitity(g.svgGroup.stateFullnameRect);

    g.hideAllContextMenus();
    HtmlUtils.hideElem(g.renameError);
  }

  edgeDragmove(e, d) {
    var edgeG = d3.select(this);
    var g = edgeG.node().parentGraph;
    var oldPathDefinition = edgeG.select("." + graphConsts.edgePath).attr("d");

    edgeG
      .select("." + graphConsts.edgePath)
      .attr("d", EdgeUtils.updatePathCurve(d, e.x, e.y, oldPathDefinition));

    var coords = EdgeUtils.getInputPosition(edgeG.select("." + graphConsts.edgePath).attr("d"), d.source == d.target);
    EdgeUtils.repositionInputTo(edgeG.select("foreignObject"), coords.tx, coords.ty);
    g.repositionMarker(edgeG);
  }

  edgeDragend() {
    if (!jeProhlizeciStranka_new()) {
      d3.select(this).node().parentGraph.updateText();
    }
  }

  createEdge(data, origin = elemOrigin.default) {
    var temporaryEdgePath = this.temporaryEdgeG.select("." + graphConsts.edgePath);

    if (data.source == data.target && origin == elemOrigin.default) {
      if (temporaryEdgePath.node().angle) {
        data.angle = temporaryEdgePath.node().angle;
      }
      else {
        data.angle = 1.55;
      }
    }
    this.edgesData.push(data);

    var newEdge = this.edgeGroups
      .data(this.edgesData).enter().append("g").classed(graphConsts.edgeGroup, true);

    newEdge.node().parentGraph = this;

    this.addEdgeSvg(newEdge, origin, temporaryEdgePath.attr("d"));

    this.repositionMarker(newEdge);
    //TODO
    EdgeUtils.updateInputPosition(newEdge);
    this.updateEdgeGroups();

    if (!jeProhlizeciStranka_new()) {
      this.addEdgeEvents(newEdge);
      if (newEdge.select("input").node().correct) {
        this.updateText();
      }
    }
    return newEdge;
  }

  addEdgeSvg(edge, origin, tempEdgeDef) {
    edge
      .append("svg:path")
      .classed(graphConsts.edgePath, true)
      .classed(graphConsts.edgeElem, true)
      .attr("d", function (d) {
        if (origin == elemOrigin.fromExisting) {
          return d.source != d.target ? EdgeUtils.reverseCalculate(d.source, d.target, d.dx, d.dy) : MathUtils.calculateSelfloop(d.source.x, d.source.y, d.angle);
        }
        if (d.source == d.target) {
          if (origin == elemOrigin.fromTable) {
            d.angle = 1.55;
            return MathUtils.calculateSelfloop(d.source.x, d.source.y, d.angle);
          }
          return tempEdgeDef;
        }
        return EdgeUtils.getStraightPathDef(d.source.x, d.source.y, d.target.x, d.target.y);
      });

    edge
      .append("svg:path")
      .classed(graphConsts.edgeMarker, true)
      .classed(graphConsts.edgeElem, true)
      .attr("marker-end", "url(#end-arrow" + this.editorId + ")");

    var fo = edge
      .append("foreignObject")
      .classed(graphConsts.edgeElem, true)
      .attr("height", 29)
      .attr("width", 50);

    var input = fo
      .append("xhtml:input")
      .classed("edgeInput", true)
      .classed(graphConsts.edgeElem, true);

    input.node().correct = false;
    input.node().parentGraph = this;

    EdgeUtils.setInputValue(input.node(), edge.datum().symbols);
    if (origin == elemOrigin.default && this.getEditor().type == "EFA") {
      EdgeUtils.setInputValue(input.node(), epsSymbol);
      input.node().correct = true;
    }
    EdgeUtils.setInputWidth(input.node(), 50);
    if (origin == elemOrigin.fromExisting || origin == elemOrigin.fromTable) {
      EdgeUtils.setInputWidth(input.node());
      HtmlUtils.makeReadonly(input.node());
      input.node().correct = true;
    }
  }

  addEdgeEvents(edge) {
    var g = this;
    edge
      .call(g.dragEdge)
      .on("mouseover", function () {
        d3.select(this).classed(graphConsts.mouseOver, true);
      })
      .on("mouseout", function () {
        d3.select(this).classed(graphConsts.mouseOver, false);
      })
      .on("dblclick", function (_, d) {
        if (g.graphState.selectedEdge == d) {
          g.startRenaming(graphStateEnum.renamingEdge, g.graphState.selectedEdge.symbols);
        }
      })
      .on("contextmenu", function (e) {
        e.preventDefault();

        if (g.getCurrentState() == graphStateEnum.renamingEdge) {
          return;
        }
        EditorManager.deselectAll(g.editorId);
        g.hideAllExtras();
        g.selectEdge(d3.select(this));
      });

    edge.select("input")
      .on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
      })
      .on("keydown", function (e, d) {
        if (d3.select(this).node().getAttribute("readonly") == "readonly") {
          return
        };
        if (e.key.toLowerCase() == "enter") {
          e.preventDefault(); //prevent 'enter' from submitting form
        }
        g.edgeInputOnKeyDown(e, d, d3.select(this).node());
      })
      .on("keyup", function (e, d) {
        var input = d3.select(this).node();
        if (input.getAttribute("readonly") != "readonly") {
          if (e.key.toLowerCase() == "enter") {
            e.preventDefault(); //prevent 'enter' from submitting form
          }
          input.correct = g.getEditor().checkEdgeSymbolsValidity(d.id, d.source, input.value).result;
        }
      })
      .on("blur", function (_, d) {
        g.edgeOnBlur(d, d3.select(this).node());
      });
  }

  edgeOnBlur(d, input) {
    var g = input.parentGraph;
    g.getEdgeGroupById(d.id).classed("activeRenaming", false);
    input.correct = g.getEditor().checkEdgeSymbolsValidity(d.id, d.source, input.value).result;
    HtmlUtils.makeReadonly(input);

    if (input.correct == false) {
      if (g.getCurrentState() == graphStateEnum.mergingEdge
        || g.getCurrentState() == graphStateEnum.renamingEdge) {
        EdgeUtils.setInputValue(input, d.symbols);
        EdgeUtils.setInputWidth(input);
        EdgeUtils.updateInputPosition(g.getEdgeGroupById(d.id));
      }
      else {
        g.deleteEdge(d);
        EditorManager.deselectAll(g.editorId);
      }
    }
    else {
      g.renameEdge(d, input.value);
    }
    if (g.dblclickedState == true && input.value === epsSymbol
      && g.getEditor().type == "EFA" && g.getCurrentState() == graphStateEnum.namingEdge) {
      g.dblclickedState = false;
      g.deleteEdge(d);
    }
    g.setCurrentState(graphStateEnum.default);
    HtmlUtils.hideElem(g.renameError);
    g.enableAllDragging();
  }

  edgeInputOnKeyDown(e, d, input) {
    if (input.getAttribute("readonly") == "readonly") return;
    var g = input.parentGraph;

    var len = HtmlUtils.visualLength(input.value);
    var w = parseInt((input.style.width).substring(0, input.style.width.length - 2));
    if (w && (w - len) < 20) {
      EdgeUtils.setInputWidth(input, len + 50);
      EdgeUtils.updateInputPosition(g.getEdgeGroupById(d.id));
    }

    if (e.key.toLowerCase() == "enter") {
      g.tryToRenameEdge(d, input.value);
    }
  }

  tryToRenameEdge(edgeData, newSymbols, prompt = null) {
    var edgeG = this.getEdgeGroupById(edgeData.id);
    this.setRenameErrorPosition(this.getCurrentState(), edgeG);

    if (prompt != null) {
      this.showRenameError(prompt);
    }

    newSymbols = ArrayUtils.replaceEpsilon(ArrayUtils.removeDuplicates(newSymbols.split(",")));
    if (this.getEditor().type == "EFA" && newSymbols == "") {
      newSymbols = epsSymbol;
    }

    var input = edgeG.select("input").node();
    var validityCheck = this.getEditor().checkEdgeSymbolsValidity(edgeData.id, edgeData.source, newSymbols);
    if (!validityCheck.result) {
      this.showRenameError(validityCheck.errMessage);
      input.correct = false;
    }
    else {
      input.correct = true;
      this.renameEdge(edgeData, newSymbols);
      input.blur();
      EditorManager.deselectAll();
    }
  }

  renameEdge(edgeData, symbols) {
    this.edgesData
      .filter(function (ed) { return ed.id == edgeData.id; })
      .map(function (ed) { ed.symbols = symbols; });

    var edgeGroup = this.getEdgeGroupById(edgeData.id);
    var input = edgeGroup.select("input").node();
    EdgeUtils.setInputValue(input, symbols);
    EdgeUtils.setInputWidth(input);
    EdgeUtils.updateInputPosition(edgeGroup);
    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }


  deleteEdge(edgeData) {
    this.deleteEdgeSvg(edgeData);
    this.updateEdgeGroups();
    this.deleteEdgeData(edgeData);
    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }

  deleteEdgeSvg(edgeData) {
    this.svgGroup
      .select(".edges")
      .selectAll("g")
      .filter(function (ed) {
        return ed.id == edgeData.id;
      })
      .remove();
  }

  deleteEdgeData(edgeData) {
    this.edgesData.splice(this.edgesData.indexOf(edgeData), 1);
  }

  selectEdge(edgeGroup) {
    this.removeSelectionFromState();

    //edgeGroup.datum() == data binded with element
    if (this.graphState.selectedEdge != edgeGroup.datum()) {
      this.removeSelectionFromEdge();
      this.graphState.selectedEdge = edgeGroup.datum();
      SELECTED_ELEM_GROUP = edgeGroup;
      edgeGroup.classed(graphConsts.selected, true);
    }
  }

  removeSelectionFromEdge() {
    if (this.graphState.selectedEdge == null) {
      return;
    }
    var g = this;
    this.edgeGroups
      .filter(function (d) {
        return d.id === g.graphState.selectedEdge.id;
      })
      .classed(graphConsts.selected, false);
    this.graphState.selectedEdge = null;
  }

  updateEdgeGroups() {
    this.edgeGroups = this.svgGroup.select(".edges").selectAll("g");
  }

  /* ------------------------------ repostion utils ------------------------------ */

  repositionMarker(edgeGroup) {
    this.repositionMarkerTo(
      edgeGroup.select("." + graphConsts.edgePath),
      edgeGroup.select("." + graphConsts.edgeMarker),
      graphConsts.nodeRadius + 11); // distance
  }

  repositionMarkerTo(path, markerPath, distance) {
    var pathLength = path.node().getTotalLength();
    var pathPoint = path.node().getPointAtLength(pathLength - distance);
    var pathPoint2 = path.node().getPointAtLength(pathLength - distance - 0.01);
    markerPath.attr("d", `M ${pathPoint2.x} ${pathPoint2.y} L ${pathPoint.x} ${pathPoint.y}`);
  }

  repositionInitArrow(stateData, angle) {
    var arrow = this.svgGroup.initArrow;

    arrow
      .classed("hidden", false) //if it was hidden after deleting previous initial state, show it
      .attr("d",
        "M " + stateData.x + " " + stateData.y
        + " C " + MathUtils.cubicControlPoints(stateData.x, stateData.y, angle, 90, 2000)
        + " " + stateData.x + " " + stateData.y
      );

    arrow.node().angle = angle;
  }

  hideInitArrow() {
    this.svgGroup.initArrow.classed("hidden", true);
  }


  /* ------------------------------ GETTERS ------------------------------ */
  getEdgeGroupById(id) {
    return this.edgeGroups.filter(function (d) {
      return d.id == id;
    });
  }

  getStateGroupById(id) {
    var res = null;
    this.stateGroups
      .each(function (d) { if (d.id == id) res = d3.select(this); });
    return res;
  }


  /* ------------------------------ Graph - State placement functions ------------------------------ */

  findStatePlacement(newStateData) {
    var baseX, baseY;
    if (this.getEditor().isEmpty()) {
      baseX = -(this.graphDiv.lastWidth / 2) + 100;
      baseY = -(this.graphDiv.lastHeight / 2) + 100;
    }
    else if (this.graphState.initialState != null) {
      baseX = this.graphState.initialState.x;
      baseY = this.graphState.initialState.y;
    }
    else {
      //find topmost
      let top = this.statesData[0];
      this.statesData.forEach(d => {
        if (d.y < top.y) {
          top = d;
        }
      });
      baseX = top.x;
      baseY = top.y;
    }

    var x = baseX;
    var y = baseY;
    newStateData.x = x;
    newStateData.y = y;
    var mult = 5;

    var transform = d3.zoomTransform(this.svgGroup.node());

    while (this.invalidStatePosition(newStateData)) {
      x += graphConsts.nodeRadius * mult;
      if (x > this.graphDiv.lastWidth - transform.x) {
        x = baseX; // posunutie x na zaciatok riadku
        y += graphConsts.nodeRadius * mult; //posunutie dolu
      }
      if (y + graphConsts.nodeRadius + 100 > this.graphDiv.lastHeight) {
        this.graphDiv.style.height = y + graphConsts.nodeRadius + 100;

      }

      newStateData.x = x;
      newStateData.y = y;
    }
    newStateData.isNew = false;
    return newStateData;
  }

  invalidStatePosition(state) {
    for (var i = 0, j = this.statesData.length; i < j; i++) {
      const d = this.statesData[i];
      if (state.id == d.id) {
        continue;
      }
      if ((Math.abs(d.x - state.x) < graphConsts.nodeRadius * 2)
        && (Math.abs(d.y - state.y) < graphConsts.nodeRadius * 2)) {
        return true;
      }
    }
    return false;
  }
}

/**
 * Represents Table mode of Automata Editor.
 */
class TableMode extends AutomataEditorMode {
  constructor(editorId, statesData, edgesData) {
    super(editorId, statesData, edgesData);
    this.initialise();
    this.incorrectInputs = new Set();
  }

  initialise() {
    this.createTableDiv();
    this.createSyntaxHint();
    this.createEmptyTable();
    this.createErrorAlert();
  }

  createTableDiv() {
    this.tableDiv = document.createElement("div");
    this.tableDiv.setAttribute("class", "tableDiv");
  }

  createSyntaxHint() {
    var syntaxButton = HtmlUtils.createButton(syntaxLabel, "hintButton");
    syntaxButton.style.marginBottom = "7px";
    $(syntaxButton).prop("title", syntaxTitle);
    var syntaxContentDiv = this.initHintContent(tableSyntaxHints);

    syntaxButton.addEventListener("click", () => this.clickHintButton(syntaxContentDiv));
    HtmlUtils.appendChildren(this.tableDiv, [syntaxButton, syntaxContentDiv]);
  }

  createErrorAlert() {
    var alertP = document.createElement("p");
    alertP.setAttribute("class", "alert alert-danger");

    this.tableDiv.appendChild(alertP);
    HtmlUtils.hideElem(alertP);
    this.alertText = alertP;
  }

  createTableFromData() {
    var oldTable = this.table;
    var table = this.createEmptyTable();

    table.states = [], table.exitStates = [], table.symbols = [];
    table.initState = null;

    this.statesData.forEach(d => {
      table.states.push(d.id);
      if (d.initial) {
        table.initState = d.id;
      }
      if (d.accepting) {
        table.exitStates.push(d.id);
      }
    });

    this.edgesData.forEach(d => {
      d.symbols.split(',').forEach(symb => {
        if (!table.symbols.includes(symb)) table.symbols.push(symb);
      });
    });

    //table.states.sort();
    table.symbols.sort();

    minStateWidth = EditorUtils.findLongestElem(table.states) + 10 + "px";
    //create first row = consisting of 3 inactive cells
    var row1 = table.insertRow(table.rows.length); // -1 ?
    this.insertInactiveCell(row1, 0);
    this.insertInactiveCell(row1, 1);
    this.insertInactiveCell(row1, 2);

    //create second row - "symbols" row
    var row2 = table.insertRow(table.rows.length);
    this.insertInactiveCell(row2, 0);
    this.insertInactiveCell(row2, 1);
    var cell = this.insertInactiveCell(row2, 2);

    cell.style.width = minStateWidth;
    this.addResizable(cell);

    var maxColWidth = EditorUtils.findLongestElem(table.symbols);

    // filling out columns' headers from symbols and delete buttons above them
    table.symbols.forEach(symb => {
      this.insertColumnDeleteButton(row1);
      this.insertColumnHeader(row2, symb, maxColWidth);
    });
    this.insertColumnAddButton(row1);

    // filling out rows' headers (states' titles)
    table.states.forEach(stateTitle => {
      var row = table.insertRow(table.rows.length);
      this.insertRowDeleteButton(row);

      var arrCell = this.insertArrows(row, row.cells.length);

      this.insertRowHeader(row, stateTitle, minStateWidth);

      if (table.initState == stateTitle) {
        $(arrCell.initArrow).addClass("selected-arrow");
        this.selectedInitDiv = arrCell.initArrow;
      }
      if (table.exitStates.includes(stateTitle)) {
        $(arrCell.accArrow).addClass("selected-arrow");
      }

      for (var j = 0, len = table.symbols.length; j < len; j++) {
        this.insertInnerCell(row);
      }
    });
    this.insertRowAddButton();

    // filling transitions
    this.edgesData.forEach(ed => {
      var row = table.rows[table.states.indexOf(ed.source.id) + 2];

      ed.symbols.split(",").forEach(symb => {
        var cell = row.cells[table.symbols.indexOf(symb) + 3];

        if (this.getEditor().type == "DFA") {
          cell.myDiv.value = ed.target.id;
        }
        else if (EditorUtils.typeIsNondeterministic(this.getEditor().type)) {
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

        maxColWidth = Math.max(maxColWidth, HtmlUtils.tableVisualLength(cell.myDiv.value));
      });
    });

    this.setInnerCellSizes(maxColWidth + 10 + "px");

    this.tableDiv.removeChild(oldTable);
    //re-append error
    this.tableDiv.removeChild(this.alertText);
    this.tableDiv.appendChild(this.alertText);
    HtmlUtils.hideElem(this.alertText);

    if (jeProhlizeciStranka_new()) {
      $(table).find("input").prop("disabled", true).addClass("mydisabled");
    }
  }

  createEmptyTable() {
    var table = document.createElement("table");
    table.setAttribute("class", tableClasses.myTable);
    table.style.width = "0";

    this.selectedCellInput = null;
    this.selectedInitDiv = null;
    this.table = table;
    this.tableDiv.appendChild(table);
    this.locked = false;

    return table;
  }

  insertArrows(row, index) {
    var cell = this.insertCell(row, index, ["arrow-td"], "40px");
    cell.style.minWidth = "40px";

    var initArrDiv = document.createElement("div");
    $(initArrDiv).prop("class", "top-arrow base-arrow");
    $(initArrDiv).prop("title", tableInitialButtonName);
    initArrDiv.innerHTML = initSymbol;

    var accArrDiv = document.createElement("div");
    $(accArrDiv).prop("class", "bottom-arrow base-arrow");
    $(accArrDiv).prop("title", tableAcceptingButtonName);
    accArrDiv.innerHTML = accSymbol;

    if (!jeProhlizeciStranka_new()) {
      $(initArrDiv).click(() => this.setInitDiv(initArrDiv));
      $(accArrDiv).click(() => this.toggleAccArrow(accArrDiv));
    }

    cell.initArrow = initArrDiv;
    cell.accArrow = accArrDiv;

    cell.appendChild(initArrDiv);
    cell.appendChild(accArrDiv);

    return cell;
  }

  insertColumnAddButton(row) {
    var cell = this.insertCellWithDiv(row, null, [tableClasses.addButton, tableClasses.noselectCell], null, addSymbol);
    if (!jeProhlizeciStranka_new()) {
      $(cell).prop("title", tableAddSymbolHover);
      cell.addEventListener("click", () => this.insertColumn());
    }
  }

  insertColumnDeleteButton(row) {
    var cell = this.insertCellWithDiv(row, null,
      [tableClasses.deleteButton, tableClasses.noselectCell], null, delSymbol);


    if (!jeProhlizeciStranka_new()) {
      $(cell).prop("title", tableDelSymbolHover);
      cell.addEventListener("click", () => this.deleteColumn(cell.cellIndex));
    }
  }

  insertRowAddButton() {
    var newRow = this.table.insertRow(this.table.rows.length);
    var cell = this.insertCellWithDiv(newRow, 0, [tableClasses.addButton, tableClasses.noselectCell], null, addSymbol);

    if (!jeProhlizeciStranka_new()) {
      $(cell).prop("title", tableAddRowHover);
      cell.addEventListener("click", () => this.insertRow());
    }
  }

  insertRowDeleteButton(row) {
    var cell = this.insertCellWithDiv(row, 0,
      [tableClasses.deleteButton, tableClasses.noselectCell], null, delSymbol);

    if (!jeProhlizeciStranka_new()) {
      $(cell).prop("title", tableDelRowHover);
      cell.addEventListener("click", () => this.deleteRow(cell.parentNode.rowIndex));
    }
  }

  insertInnerCell(row) {
    var cell = this.insertCell(row, row.cells.length, [tableClasses.myCell]);
    var value = EditorUtils.typeIsNondeterministic(this.getEditor().type) ? "{}" : "";
    var input = this.createInput([tableClasses.inputCellDiv], value,
      this.table.rows[1].cells[cell.cellIndex].style.minWidth);

    $(input).click(() => this.innerCellOnClick());
    $(input).on("input", () => this.innerCellOnInput(input));
    $(input).focusout(() => this.innerCellOnFocusout(input));

    $(input).keypress((e) => this.cellKeypressHandler(e));

    cell.myDiv = input;
    cell.appendChild(input);
  }

  insertRowHeader(row, name, width) {
    var cell = this.insertCell(row, row.cells.length, ["row-header-cell"], width);
    var input = this.createInput([tableClasses.inputCellDiv, tableClasses.rowHeader], name, width);
    input.defaultClass = tableClasses.rowHeader;

    $(input).click(() => this.tableHeaderCellClick(input));
    $(input).on("input", (e) => this.rowHeaderOnInput(e));
    $(input).focusout(() => this.rowHeaderOnFocusout(input));
    $(input).keypress((e) => this.cellKeypressHandler(e));

    cell.myDiv = input;
    cell.appendChild(input);
    return cell;
  }

  insertColumnHeader(row, symbol, width) {
    var cell = this.insertCell(row, row.cells.length, [tableClasses.columnHeader], width);
    var input = this.createInput([tableClasses.inputColumnHeaderDiv, tableClasses.inputCellDiv], symbol, width);
    cell.myDiv = input;
    this.addResizable(cell);
    cell.appendChild(input);

    $(input).click(() => this.innerCellOnClick());
    $(input).on("input", () => this.columnHeaderOnInput(input));
    $(input).focusout(() => this.columnHeaderOnFocusout(input));
    $(input).keypress((e) => this.cellKeypressHandler(e));
  }

  insertRow(title) {
    if (this.locked) {
      return;
    }
    //if this is a first state to be created in editor
    var editor = this.getEditor();
    if (editor.isEmpty() && editor.Graph.getCurrentState() == graphStateEnum.initial) {
      editor.Graph.endEmptyState();
    }
    if (title == null) {
      title = editor.generateStateId();
    }
    this.deselectSelectedCell();
    this.table.rows[this.table.rows.length - 1].deleteCell(0);
    this.insertRowDeleteButton(this.table.rows[this.table.rows.length - 1]);
    this.insertArrows(this.table.rows[this.table.rows.length - 1], 1);
    this.insertRowHeader(this.table.rows[this.table.rows.length - 1], title, this.table.rows[1].cells[STATE_INDEX].style.width);

    for (let i = STATE_INDEX + 1, j = this.table.rows[0].cells.length - 1; i < j; i++) {
      this.insertInnerCell(this.table.rows[this.table.rows.length - 1]);
    }
    this.insertRowAddButton();

    // create state in graph
    var data = editor.Graph.getNewStateData(
      title,
      -(params.width / 2) + 100,
      -(params.height / 2) + 100,
      false, false, true);
    editor.addState(data);
  }

  insertColumn(symb = null) {
    if (this.locked) {
      return;
    }
    this.deselectSelectedCell();
    this.table.rows[0].deleteCell(this.table.rows[0].cells.length - 1);
    this.insertColumnDeleteButton(this.table.rows[0]);
    this.insertColumnAddButton(this.table.rows[0]);

    if (!symb) {
      symb = ArrayUtils.findNextAlphabetSymbol(this.table.symbols);
    }
    this.table.symbols.push(symb);
    this.insertColumnHeader(this.table.rows[1], symb);

    for (let i = 2, j = this.table.rows.length - 1; i < j; i++) {
      this.insertInnerCell(this.table.rows[i]);
    }
  }

  deleteRow(rowIndex) {
    if (this.locked) return;

    var stateId = this.table.rows[rowIndex].cells[STATE_INDEX].myDiv.value;
    this.table.states.splice(this.table.states.indexOf(stateId), 1);

    var editor = this.getEditor();
    //delete state in graph (& from data)
    var data = this.getStateDataById(stateId);
    editor.Graph.deleteState(data);

    for (let i = STATE_INDEX, rows = this.table.rows.length - 1; i < rows; i++) {
      for (let j = 3, cols = this.table.rows[i].cells.length; j < cols; j++) {
        var value = this.table.rows[i].cells[j].myDiv.value;
        if (EditorUtils.typeIsNondeterministic(editor.type)) {
          value = value.replace(/{|}/g, "");
          var stateIds = value.split(",");
          var index = stateIds.indexOf(stateId);
          if (index != -1) {
            stateIds.splice(index, 1);
            value = "{" + stateIds.toString() + "}";
            this.table.rows[i].cells[j].myDiv.value = value;
            this.table.rows[i].cells[j].myDiv.prevValue = value;
          }
        }
        else { //DFA
          if (stateId == value) {
            this.table.rows[i].cells[j].myDiv.value = "";
            this.table.rows[i].cells[j].myDiv.prevValue = "";
          }
        }
      }
    }
    this.table.deleteRow(rowIndex);
  }

  deleteColumn(index) {
    if (this.locked) return;
    var symbol = this.table.rows[1].cells[index].myDiv.value;
    this.table.symbols.splice(this.table.symbols.indexOf(symbol), 1);
    this.deleteSymbolFromAllEdges(symbol);

    // Delete table column
    for (let i = 0, j = this.table.rows.length - 1; i < j; i++) {
      this.table.rows[i].deleteCell(index);
    }
  }

  setInitDiv(initDiv) {
    if (!this.locked) {
      this.deselectSelectedCell();
    }
    if (this.selectedInitDiv === initDiv) {
      this.unselectInitDiv();
      this.getEditor().Graph.setInitStateAsNotInitial();
      return;
    }
    if (this.selectedInitDiv != null) {
      this.unselectInitDiv();
    }
    $(initDiv).addClass("selected-arrow");
    this.selectedInitDiv = initDiv;

    //edit state in graph
    var stateId = this.table.rows[initDiv.parentNode.parentNode.rowIndex].cells[STATE_INDEX].myDiv.value;
    var data = this.getStateDataById(stateId);
    this.getEditor().Graph.setNewStateAsInitial(data);
  }

  unselectInitDiv() {
    $(this.selectedInitDiv).removeClass("selected-arrow");
    this.selectedInitDiv = null;
  }

  toggleAccArrow(acceptDiv) {
    if (!this.locked) {
      this.deselectSelectedCell();
    }
    $(acceptDiv).toggleClass("selected-arrow");

    var stateId = this.table.rows[acceptDiv.parentNode.parentNode.rowIndex].cells[STATE_INDEX].myDiv.value;

    //edit state in graph
    var stateG = this.getEditor().Graph.getStateGroupById(stateId);
    this.getEditor().Graph.toggleAcceptingState(stateG.datum(), stateG);
  }

  /**
   * Adds jQuery resizable handles for resizing columns'.
   * @param {td}  cell  Table cell.
   */
  addResizable(cell) {
    var table = this.table;
    $(cell).resizable({
      handles: 'e',
      resize: function () {
        var minSize = MIN_TABLE_CELL_WIDTH.substring(0, 2);
        if (parseInt(this.style.width) >= parseInt(minSize)) {
          this.style.minWidth = this.style.width;
          var ci = this.cellIndex;

          //change width of all cells in column
          for (var i = 1; i < table.rows.length - 1; i++) {
            table.rows[i].cells[ci].style.width = this.style.width;
            table.rows[i].cells[ci].myDiv.style.width = this.style.width;
          }
        }
      },
    });
    cell.style.minWidth = MIN_TABLE_CELL_WIDTH;
  }

  setInnerCellSizes(maxCellWidth) {
    for (var i = 1, rows = this.table.rows.length - 1; i < rows; i++) {
      for (var j = 3, cols = this.table.rows[i].cells.length; j < cols; j++) {
        this.table.rows[i].cells[j].style.width = maxCellWidth;
        this.table.rows[i].cells[j].myDiv.style.width = maxCellWidth;
      }
    }
  }

  /**
   * Lock table and menu buttons except @param exceptionInput.
   * @param {input} exceptionInput Input of table cell which will not be locked.
   */
  lockTable(exceptionInput) {
    for (let i = 1, rows = this.table.rows.length - 1; i < rows; i++) {
      for (let j = 1, cols = this.table.rows[i].cells.length; j < cols; j++) {
        if (this.table.rows[i].cells[j].myDiv == exceptionInput) {
          continue;
        }
        $(this.table.rows[i].cells[j].myDiv).prop("readonly", true);
      }
    }
    this.lockArrows();
    this.locked = true;
    //this.getEditor().lockMenuButtons(true);
  }

  /**
   * Unlocks table and menu buttons.
   */
  unlockTable() {
    for (var i = 1, rows = this.table.rows.length - 1; i < rows; i++) {
      for (var j = 1, cols = this.table.rows[i].cells.length; j < cols; j++) {
        $(this.table.rows[i].cells[j].myDiv).prop('readonly', false);
      }
    }
    this.unlockArrows();
    this.locked = false;
    //this.getEditor().lockMenuButtons();
  }

  /**
   * Removes all event listeners from all table arrows 
   * (buttons for setting state as (non)initial/(non)accepting).
   */
  lockArrows() {
    d3.select(this.table).selectAll(".base-arrow").each(function (ed) {
      $(d3.select(this).node()).off();
    });
  }

  /**
   * Assigns event listeners for all table arrows
   * (buttons for setting state as (non)initial/(non)accepting).
   */
  unlockArrows() {
    let t = this;
    d3.select(this.table).selectAll(".base-arrow").each(function (ed) {
      let arrow = d3.select(this).node();
      if (arrow.classList.contains("top-arrow")) {
        $(arrow).click(() => t.setInitDiv(arrow));
      }
      else {
        $(arrow).click(() => t.toggleAccArrow(arrow));
      }
    });
  }

  /* ------------------------------ Table insert methods ------------------------------ */

  insertCell(row, index, classlist, width = null) {
    var cell = row.insertCell(index);
    classlist.forEach(c => {
      $(cell).addClass(c);
    });

    if (width != null) {
      cell.style.width = width;
      cell.style.minWidth = MIN_TABLE_CELL_WIDTH;
    }
    return cell;
  }

  createInput(classlist, value, width = MIN_TABLE_CELL_WIDTH) {
    var input = document.createElement("input");
    input.value = input.prevValue = value;

    if (width != null) {
      input.style.minWidth = MIN_TABLE_CELL_WIDTH;
      input.style.width = width;
    }
    input.style.margin = "0em";
    classlist.forEach(c => {
      $(input).addClass(c);
    });
    return input;
  }

  insertCellWithDiv(row, index, cellClasslist, divClasslist, innerHtml = "") {
    var cell = index == null ? row.insertCell(row.cells.length) : row.insertCell(index);
    cell.innerHTML = innerHtml;

    cellClasslist.forEach(c => {
      $(cell).addClass(c);
    });

    var div = document.createElement("div");
    if (divClasslist != null) {
      divClasslist.forEach(dc => {
        $(div).addClass(dc);
      });
    }
    cell.myDiv = div;
    cell.appendChild(div);
    return cell;
  }

  insertInactiveCell(row, index) {
    var classes = [
      tableClasses.myCell,
      tableClasses.inactiveCell,
      tableClasses.noselectCell
    ];
    return this.insertCellWithDiv(row, index, classes, []);
  }


  /* ------------------------------ Table utils ------------------------------ */

  //is it necessary to have???
  deselectSelectedCell() {
    if (this.selectedCellInput != null) {
      $(this.selectedCellInput).removeClass(tableClasses.selectedHeaderInput);
      $(this.selectedCellInput).addClass(tableClasses.rowHeader);
      this.selectedCellInput = null;
    }
  }

  selectDifferentRowHeaderCell(input) {
    var prev;
    if (this.selectedCellInput != null) {
      prev = d3.select(this.selectedCellInput);
    }
    if (prev != null) {
      prev.classed(tableClasses.selectedHeaderInput, false);
      prev.classed(tableClasses.rowHeader, true);
    }
    var next = d3.select(input);
    next.classed(tableClasses.selectedHeaderInput, true);
    next.classed(tableClasses.rowHeader, false);

    this.selectedCellInput = input;
  }

  /**
   * Deletes symbol from all table and graph transitions.
   * If transition was containing only this symbol, it is deleted.
   * @param {string}    symbol      Transition symbol to delete.
   */
  deleteSymbolFromAllEdges(symbol) {
    var edgesToDelete = [];
    var editor = this.getEditor();

    this.edgesData.forEach(ed => {
      if (ed.symbols == symbol) {
        edgesToDelete.push(ed);
      }
      else {
        var symbolsArray = ed.symbols.split(',');
        if (symbolsArray.indexOf(symbol) != -1) {
          symbolsArray.splice(symbolsArray.indexOf(symbol), 1);
          editor.Graph.renameEdge(ed, symbolsArray.join(","));
        }
      }
    });

    edgesToDelete.forEach(ed => {
      editor.Graph.deleteEdge(ed);
    });
  }

  /**
 * Checks if state's name already exists in table.
 * @param  {HTMLElement} input      HTML input element.
 * @param  {String}      stateName  State name.
 * @return {Boolean}                True if state name already exists, false otherwise
 */
  tableStateAlreadyExists(input, stateName) {
    let ri = input.parentNode.parentNode.rowIndex;
    for (let i = 2, j = this.table.rows.length - 1; i < j; i++) {
      if (i != ri && stateName == this.table.rows[i].cells[STATE_INDEX].myDiv.value) {
        return true;
      }
    }
    return false;
  }

  /**
   * Checks if symbol already exists as table column.
   * @param  {HTMLElement} input  HTML input element.
   * @param  {String}      symbol The transition symbol.
   * @return {Boolean}            True if symbol already exists, false otherwise.
   */
  tableColumnSymbolAlreadyExists(input, symbol) {
    let ci = input.parentNode.cellIndex;
    for (let i = 2, j = this.table.rows[1].cells.length; i < j; i++) {
      if (i != ci && symbol == this.table.rows[1].cells[i].myDiv.value) {
        return true;
      }
    }
    return false;
  }

  /**
   * Sets table into "alert" mode - table is locked and error is shown.
   * @param {String}      errorMsg  The error message.
   * @param {HTMLElement} exc       HTML td element; all table cells are locked except this one.
   */
  activateAlertMode(errorMsg, exc) {
    this.setAlertMsg(errorMsg, true);
    HtmlUtils.showElem(this.alertText);
    this.lockTable(exc);
  }

  /**
   * Sets the table error message.
   * @param {String}      error The error message.
   * @param {Boolean}     tableLocked 
   */
  setAlertMsg(error, tableLocked = true) {
    this.alertText.innerHTML = error;
    if (tableLocked) {
      this.alertText.innerHTML += " " + errors.tableLocked;
    }
  }

  /**
   * Resets all incorrect cells to their previous correct value and unblocks table.
   */
  rollback() {
    console.log("rollback");
    this.incorrectInputs.forEach(input => {
      input.value = input.prevValue;
      $(input).removeClass(tableClasses.incorrectCell);
    });
    this.incorrectInputs = new Set();
    HtmlUtils.hideElem(this.alertText);
    if (this.locked) {
      this.unlockTable();
    }
  }

  /**
   * Marks the input as incorrect and locks the table.
   * (Edge-case) If another table cell was already incorrect, the method rollback() is called
   * which resets all incorrect cells to their previous correct value.
   * @param {String}      errMsg Error message to display.
   * @param {HTMLElement} input 
   */
  setIncorrectInput(errMsg, input) {
    this.incorrectInputs.add(input);
    $(input).addClass(tableClasses.incorrectCell);
    if (this.incorrectInputs.size > 1) {
      this.rollback();
    }
    else if (this.incorrectInputs.has(input)) {
      this.activateAlertMode(errMsg, input);
    }
  }

  /**
   * Removes input's incorrect status and unlocks the table.
   * @param {HTMLElement} input 
   */
  unblockInput(input) {
    $(input).removeClass(tableClasses.incorrectCell);
    this.incorrectInputs.delete(input);
    if (this.locked) {
      this.unlockTable();
      HtmlUtils.hideElem(this.alertText);
    }
  }

  /* ------------------------------ Table event handlers ------------------------------ */
  /**
   * Handles the table's inner cells' behaviour on a click event.
   */
  innerCellOnClick() {
    if (!this.locked) {
      this.deselectSelectedCell();
    }
  }

  /**
   * Handles the @param input on input change.
   * @param {HTMLElement} input 
   */
  innerCellOnInput(input) {
    if (incorrectTableInnerCellSyntax(this.getEditor().type, input.value)) {
      this.setIncorrectInput(errors.innerCellIncorrectSyntaxBase + " ", input);
    }
    else {
      this.unblockInput(input);
    }
  }

  innerCellOnFocusout(input) {
    var editor = this.getEditor();
    var type = editor.type;

    if (incorrectTableInnerCellSyntax(type, input.value)) {
      this.setIncorrectInput(errors.innerCellIncorrectSyntaxBase + " ", input);
    }
    else {
      var prevName = input.prevValue;
      var newName = input.value;
      if (EditorUtils.typeIsNondeterministic(type)) { // odstranenie {}
        prevName = prevName.substring(1, prevName.length - 1);
        newName = newName.substring(1, newName.length - 1);
      }
      var sourceStateId = this.table.rows[input.parentNode.parentNode.rowIndex].cells[STATE_INDEX].myDiv.value;
      var symbol = this.table.rows[1].cells[input.parentNode.cellIndex].myDiv.prevValue;
      var prevStates = prevName.split(",");
      var newStates = newName.split(",");
      newStates = ArrayUtils.removeDuplicates(newStates);

      //vymaze edges ktore uz nemaju pismenko, pripadne vymaze pismeno z transition
      for (let i = 0; i < prevStates.length; i++) {
        if (newStates.indexOf(prevStates[i]) == -1) {
          var ed = this.getEdgeDataByStates(sourceStateId, prevStates[i]);
          if (ed != null) {
            var trs = ed.symbols.split(',');
            if (trs.length <= 1) {
              editor.Graph.deleteEdge(ed);
            }
            else {
              trs.splice(trs.indexOf(symbol), 1);
              editor.Graph.renameEdge(ed, trs.join(','));
            }
          }
        }
      }
      if (newStates.length == 1 && newStates[0] == "") {
        newStates = [];
      }

      for (let i = 0, len = newStates.length; i < len; i++) {
        //ak predtym stav s tymto nazvom bol v cell == nenastala v nom zmena
        if (prevStates.indexOf(newStates[i]) != -1) continue;

        //ak NEEXISTUJE v grafe stav s danym nazvom=
        if (this.getStateDataById(newStates[i]) == null) {
          var addRowBool = true;
          for (var j = 2, rows = this.table.rows.length - 1; j < rows; j++) { //skontrolovanie, ze sa nazov tohto stavu nenachadza v inom riadku tabulky
            if (this.table.rows[j].cells[STATE_INDEX].myDiv.value == newStates[i]) {
              addRowBool = false;
              break;
            }
          }
          if (addRowBool) {
            this.insertRow(newStates[i]);
          }
          else {
            editor.addState(this.getNewStateData(newStates[i], 100, 100, false, false, true));
          }
          editor.Graph.createEdge(this.getNewEdgeData(sourceStateId, newStates[i], symbol), elemOrigin.fromTable);
        }
        else {
          var ed = this.getEdgeDataByStates(sourceStateId, newStates[i]);
          if (ed != null) {
            var trs = ed.symbols.split(",");
            if (trs.indexOf(symbol) == -1) {
              trs.push(symbol);
              editor.Graph.renameEdge(ed, trs.join(','));
            }
          }
          else {
            editor.Graph.createEdge(this.getNewEdgeData(sourceStateId, newStates[i], symbol), elemOrigin.fromTable);
          }
        }
      }
      //vytvaranie novych transitions
      //pripadne pridavanie pismiek do existujucich
      var val = newStates.toString();
      if (EditorUtils.typeIsNondeterministic(type)) {
        val = "{" + val + "}";
      }
      input.value = input.prevValue = val;
    }
  }

  tableHeaderCellClick(input) {
    if (!this.locked && this.selectedCellInput != input) {
      this.selectDifferentRowHeaderCell(input);
    }
  }

  /**
   * Handles table column header cell ("transition sybol" cell) on input change.
   * @param {HTMLElement} input 
   */
  columnHeaderOnInput(input) {
    if (input.value == "\\e") {
      input.value = epsSymbol;
    }
    if (incorrectTableColumnHeaderSyntax(this.getEditor().type, input.value)) {
      this.setIncorrectInput(errors.incorrectTransitionSymbol, input);
    }
    else if (this.tableColumnSymbolAlreadyExists(input, input.value)) {
      this.setIncorrectInput(errors.duplicitTransitionSymbol, input);
    }
    else {
      this.unblockInput(input);
    }
  }

  columnHeaderOnFocusout(input) {
    if ($(input).hasClass(tableClasses.incorrectCell) || this.locked) {
      return;
    }
    var prevName = input.prevValue;
    var newName = input.value;
    var editor = this.getEditor();
    if (editor.type == "EFA" && newName == "\\e") {
      input.value = epsSymbol;
      newName = input.value;
    }

    this.table.symbols.splice(this.table.symbols.indexOf(prevName), 1);
    this.table.symbols.push(newName);

    if (prevName != newName) {
      // Rename the symbol in graph
      this.edgesData.forEach(ed => {
        if (ed.symbols == prevName) {
          editor.Graph.renameEdge(ed, newName);
        }
        else {
          var syms = ed.symbols.split(',');
          syms[syms.indexOf(prevName)] = newName;
          editor.Graph.renameEdge(ed, syms.join(','));
        }
      });
      input.prevValue = input.value;
    }
  }

  rowHeaderOnInput(e) {
    var input = e.target;

    if (incorrectStateSyntax(input.value)) {
      this.setIncorrectInput(errors.incorrectStateSyntax, input);
    }
    else if (this.tableStateAlreadyExists(input, input.value)) {
      this.setIncorrectInput(errors.duplicitState, input);
    }
    else {
      this.unblockInput(input);
    }
  }

  rowHeaderOnFocusout(input) {
    if ($(input).hasClass(tableClasses.incorrectCell) == false && !this.locked) {
      if (input.prevValue == input.value) return;

      var prevName = input.prevValue;
      var newName = input.value;

      this.table.states.splice(this.table.states.indexOf(prevName), 1);
      this.table.states.push(newName);

      var editor = this.getEditor();
      //update state in graph
      editor.Graph.renameState(this.getStateDataById(prevName), newName);

      // Traverse all transitions cells in table and change the name
      for (let i = 2, rows = this.table.rows.length - 1; i < rows; i++) {
        for (let j = 2, cols = this.table.rows[i].cells.length; j < cols; j++) {
          var val = this.table.rows[i].cells[j].myDiv.value;
          val = val.replace(/{|}/g, "");
          var vals = val.split(",");
          var index = vals.indexOf(prevName);
          if (index != -1) {
            vals[index] = newName;
            val = vals.toString();
            if (EditorUtils.typeIsNondeterministic(editor.type)) {
              this.table.rows[i].cells[j].myDiv.value = "{" + val + "}";
            }
            else if (editor.type == "DFA") {
              this.table.rows[i].cells[j].myDiv.value = val;
            }
            this.table.rows[i].cells[j].myDiv.prevValue = this.table.rows[i].cells[j].myDiv.value;
          }
        }
      }
      input.prevValue = input.value;
    }
  }

  cellKeypressHandler(event) {
    var code = event.keyCode || event.which;
    if (code == 13) {
      event.preventDefault();
      event.target.blur();
      return false;
    }
  }
}

/**
 * Represents Text mode of Automata Editor.
 */
class TextMode extends AutomataEditorMode {
  constructor(editorId, statesData, edgesData, txa) {
    super(editorId, statesData, edgesData);
    this.textArea = txa;
    this.initialise();
  }

  initialise() {
    this.textDiv = document.createElement("div");
    this.textDiv.setAttribute("class", "text-div-" + this.editorId);
    this.textDiv.appendChild(this.textArea);
  }

  updateValue(val) {
    this.textArea.innerText = val;
    $(this.textArea).trigger("change");
  }
}

/**
 * Editor base class.
 */
class Editor {
  constructor(id, type, textArea) {
    this.id = id;
    this.type = type;
    this.div = document.getElementById(id);
    this.Text = new TextMode(this.id, this.statesData, this.edgesData, textArea);
    EditorManager.addEditor(this);
  }

  appendSyntaxCheck() {
    var errDiv = document.createElement("div");
    errDiv.setAttribute("id", this.id + "-error");
    errDiv.setAttribute("class", "alert alert-info");
    errDiv.setAttribute("title", syntaxDivTitle);

    var errIcon = document.createElement("div");
    errIcon.setAttribute("id", this.id + "-i");

    var errText = document.createElement("div");
    errText.setAttribute("id", this.id + "-error-text");
    errText.innerHTML = syntaxDefaultText;

    errDiv.appendChild(errIcon);
    errDiv.appendChild(errText);

    this.Text.textDiv.appendChild(errDiv);
    this.syntaxCheckDiv = errDiv;

    if (jeProhlizeciStranka_new()) {
      HtmlUtils.hideElem(errDiv);
    }

    //call the funtion that links parser function to textarea
    eval("registerElem(this.id, " + this.type + "Parser.parse" + ", this.Text.textArea)");

    return errDiv;
  }
}

/**
 * Editor for regular grammars/expressions.
 */
class TextEditor extends Editor {
  constructor(id, type, textArea) {
    super(id, type, textArea);
    this.initialise();
  }

  initialise() {
    this.div.appendChild(this.Text.textDiv);
    this.appendSyntaxCheck();
  }
}

/**
 * Editor for finite automata.
 */
class AutomataEditor extends Editor {
  constructor(id, type, textArea) {
    super(id, type, textArea);
    this.statesData = [];
    this.edgesData = [];
    this.stateIdCounter = 0;
    this.edgeIdCounter = 0;
    this.initialise();
  }

  initialise() {
    this.lastEdited = "graph";

    //create rulers - elements used to calculate svg and table text length
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
    this.div.parentNode.insertBefore(ruler, this.div.nextSibling);
    this.div.parentNode.insertBefore(tableRuler, this.div.nextSibling);

    //create menu buttons
    var graphButton = HtmlUtils.createButton(graphMenuButton, MENU_BUTTON);
    graphButton.addEventListener("click", () => this.showGraphMode());

    var textButton = HtmlUtils.createButton(textMenuButton, MENU_BUTTON);
    textButton.addEventListener("click", () => this.showTextMode());

    var tableButton = HtmlUtils.createButton(tableMenuButton, MENU_BUTTON);
    tableButton.addEventListener("click", () => this.showTableMode());

    HtmlUtils.appendChildren(this.div, [graphButton, tableButton, textButton]);

    this.Graph = new GraphMode(this.id, this.statesData, this.edgesData);
    this.Table = new TableMode(this.id, this.statesData, this.edgesData);

    HtmlUtils.appendChildren(this.div, [this.Graph.graphDiv, this.Table.tableDiv, this.Text.textDiv]);

    HtmlUtils.hideElem(this.Text.textDiv);

    this.Graph.graphDiv.lastHeight = this.Graph.graphDiv.offsetHeight;
    this.Graph.graphDiv.lastWidth = this.Graph.graphDiv.offsetWidth;

    this.Graph.initStartText();

    //When syntax check is fixed, uncomment this
    //this.appendSyntaxCheck();
    //and delete this:
    $(this.Text.textArea).prop('readonly', true);
  }

  showGraphMode() {
    HtmlUtils.hideElem(this.Text.textDiv);
    HtmlUtils.hideElem(this.Table.tableDiv);
    if (this.lastEdited == "table") {
      //this.Table.rollback();
    }

    HtmlUtils.showElem(this.Graph.hintDiv);
    HtmlUtils.showElem(this.Graph.graphDiv);

    if (!jeProhlizeciStranka_new()) {
      EditorManager.deselectAll();
    }
    this.lastEdited = "graph";
  }

  showTextMode() {
    if (!jeProhlizeciStranka_new()) {
      EditorManager.deselectAll();
    }
    if (this.lastEdited == "table") {
      this.Table.rollback();
    }
    HtmlUtils.hideElem(this.Graph.hintDiv);
    HtmlUtils.hideElem(this.Graph.graphDiv);
    HtmlUtils.hideElem(this.Table.tableDiv);

    HtmlUtils.showElem(this.Text.textDiv);
    this.lastEdited = "text";
  }

  showTableMode() {
    if (!jeProhlizeciStranka_new()) {
      EditorManager.deselectAll();
    }
    if (this.lastEdited == "table") {
      this.Table.rollback();
      return;
    }
    if (this.lastEdited == "graph") {
      //updateSvgDimensions(this.div);
    }
    HtmlUtils.hideElem(this.Graph.hintDiv);
    HtmlUtils.hideElem(this.Graph.graphDiv);
    HtmlUtils.hideElem(this.Text.textDiv);

    this.Table.createTableFromData();
    HtmlUtils.showElem(this.Table.tableDiv);
    this.lastEdited = "table";
  }

  lockMenuButtons(val = null) {
    d3.select(this.div).selectAll("." + MENU_BUTTON).attr("disabled", val);
  }

  //TODO presunut funkcionalitu sem, aby to nebolo v grafe
  addState(stateData) {
    this.Graph.createState(stateData);
  }

  /**
   * Updates textarea based on current states and edges.
   */
  generateAnswer() {
    var result = this.isEmpty() ? "" : this.generateResultFromData();
    this.Text.updateValue(result);
  }

  /**
   * Gets text representation of the automaton based on current states and edges.
   * @returns Automaton as text in the syntax of the evaluation service.
   */
  generateResultFromData() {
    var result = "";
    var initState;
    var acceptingStates = [];

    this.statesData.forEach(function (state) {
      if (state.initial) {
        initState = state;
        result += "init=" + state.id + " ";
      }
      if (state.accepting) {
        acceptingStates.push(state);
      }
    });

    if (this.type == "DFA") {
      for (let i = 0; i < this.edgesData.length; i++) {
        const edge = this.edgesData[i];
        if (!(this.checkEdgeSymbolsValidity(edge.id, edge.source, edge.symbols).result)) continue;

        edge.symbols.split(",").forEach((symbol) => {
          if (symbol == epsSymbol) {
            symbol = "\\e";
          }
          result += "(" + edge.source.id + "," + symbol + ")=" + edge.target.id + " ";
        });
      }
    }
    else if (EditorUtils.typeIsNondeterministic(this.type)) {
      var transitions = new Map();

      for (let i = 0; i < this.edgesData.length; i++) {
        const edge = this.edgesData[i];
        if (!(this.checkEdgeSymbolsValidity(edge.id, edge.source, edge.symbols).result)) continue;

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
    this.statesData.forEach(function (d) {
      result += "@" + d.id
        + ";" + d.x.toFixed(2)
        + ";" + d.y.toFixed(2)
        + ";" + (d.initial ? 1 : 0)
        + ";" + (d.accepting ? 1 : 0);

    });
    result += "edges";
    this.edgesData.forEach(function (d) {
      result += "@" //+ d.id
        + d.source.id
        + ";" + d.target.id
        + ";" + d.symbols
        + ";" + EdgeUtils.shorten(d.dx)
        + ";" + EdgeUtils.shorten(d.dy)
        + ";" + EdgeUtils.shorten(d.angle);
    });
    if (initState) {
      result += "@initAngle:" + this.Graph.svgGroup.initArrow.node().angle.toFixed(3);
    }
    var t = d3.zoomTransform(this.Graph.svgGroup.node());
    //t = Object { k: 1.148698354997035, x: 500.950304961033, y: 446.2509705696626 }
    result += `@t:${t.k.toFixed(3)};${t.x.toFixed(3)};${t.y.toFixed(3)}`;
    return result;
  }

  isEmpty() {
    return this.statesData.length === 0 && this.edgesData.length === 0;
  }

  /**
   * Generates new state ID.
   * @returns {String} state ID.
   */
  generateStateId() {
    this.stateIdCounter++;
    var id = "s" + this.stateIdCounter;

    while (!this.stateIdIsUnique(null, id)) {
      this.stateIdCounter++;
      id = "s" + this.stateIdCounter;
    }
    return id;
  }

  /**
   * Generates new edge ID.
   * @returns {Number} edge ID.
   */
  generateEdgeId() {
    return ++this.edgeIdCounter;
  }

  /**
   * Checks if @param newId is unique.
   * @param   {Object}  stateData 
   * @param   {String}  newId 
   * @returns {Boolean} True if id is unique, false otherwise.
   */
  stateIdIsUnique(stateData, newId) {
    for (var i = 0, j = this.statesData.length; i < j; i++) {
      if (this.statesData[i].id == newId) {
        if (stateData == null) {
          return false;
        }
        else if (stateData && this.statesData[i] != stateData) {
          return false;
        }
      }
    }
    return true;
  }

  /**
   * Checks the validity of @param newId, e.g. while renaming a state.
   * @param {Object} stateData  state data.
   * @param {String} newId      The ID to check.
   * @returns The result and the appropriate error message if newId was not valid.
   */
  checkStateNameValidity(stateData, newId) {
    var err = "";

    if (!newId) {
      err = errors.emptyState;
    }
    else if (!this.stateIdIsUnique(stateData, newId)) {
      err = stateNameAlreadyExists;
    }
    else if (incorrectStateSyntax(newId)) {
      err = errors.incorrectStateSyntax;
    }
    else if (newId.length > 50) {
      err = errors.stateNameTooLong;
    }
    return { result: err == "", errMessage: err };
  }

  /**
   * Checks the validity of transition's input symbols.
   * @param {Number} edgeId 
   * @param {Object} sourceStateData 
   * @param {String} symbols 
   * @returns The result and the appropriate error message if symbols were not valid.
   */
  checkEdgeSymbolsValidity(edgeId, sourceStateData, symbols) {
    var err = "";

    if (symbols == null || symbols == "") {
      err = errors.emptyTransition;
    }
    else if (incorrectGraphTransitionsSyntax(this.type, symbols)) {
      err = INVALID_SYNTAX_ERROR;
    }
    else if (this.type == "DFA") {
      if (edgeId != null && this.transitionWithSymbolExists(edgeId, sourceStateData.id, symbols)
        || edgeId == null && this.transitionWithSymbolExists(null, sourceStateData.id, symbols)) {
        err = DFAInvalidTransition;
      }
    }
    else if (symbols.length > 300) {
      err = errors.transitionSymbolsTooLong;
    }
    return { result: err == "", errMessage: err };
  }

  /**
   * Checks if a state already has another outgoing edge with at least one symbol from @param symbols.
   * Used when checking if the determinism of the automaton is kept when editing edge's symbols.
   * @param {Number} edgeId   ID of edge we are editing.
   * @param {String} stateId  Source state id.
   * @param {String} symbols  Input symbols.
   * @returns True if another edge with symbol exists, false otherwise.
   */
  transitionWithSymbolExists(edgeId, stateId, symbols) {
    for (let i = 0, j = this.edgesData.length; i < j; i++) {
      const ed = this.edgesData[i];
      if (ed.source.id === stateId && (edgeId == null || (edgeId != null && edgeId != ed.id))) {
        if (ArrayUtils.intersects(ed.symbols.split(","), symbols.split(","))) {
          return true;
        }
      }
    }
    return false;
  }
}

/**
 * Sets editor's language based on actual IS language and loads correct language file.
 */
function setupLanguage() {
  var lang = document.documentElement.lang;
  if (!lang) {
    lang = "cs";
  }
  var path;
  try {
    path = langDirPath;
  }
  catch (err) {
    path = "//is.muni.cz/auth/el/fi/jaro2021/IB005/odp/support/v2/";
  }

  var src = `${path}${lang.toUpperCase()}.js`;
  document.write("\<script src=\"" + src + "\"type='text/javascript'><\/script>");
}

/**
 * Creates an editor based on question type.
 * @param {HTMLElement} div       HTML div element where the editor will be placed.
 * @param {HTMLElement} textArea  HTML textarea element (created automatically by IS).
 */
function createEditor(div, textArea) {
  div.setAttribute("class", QUESTION_DIV);
  var type = div.getAttribute("id").substring(0, 3);
  var editor;

  if (EditorUtils.typeIsRegOrGram(type)) {
    editor = new TextEditor(div.id, type, textArea);
    if (jeProhlizeciStranka_new()) {
      $(textArea).prop('readonly', true);
    }
  }
  else {
    editor = new AutomataEditor(div.id, type, textArea);
    editor.Graph.reconstruct(textArea.innerText);

    if (editor.isEmpty()) {
      editor.Graph.setViewToMiddle();
      if (!jeProhlizeciStranka_new()) {
        editor.Graph.initEmptyState();
      }
    }
  }
}

document.addEventListener('keyup', windowKeyUp);

/**
 * Handles editor's key up events.
 * @param {KeyboardEvent} event
 */
function windowKeyUp(event) {
  //SELECTED_ELEM_GROUP is either null, or a d3 selection - stateGroup or an edgeGroup
  if (SELECTED_ELEM_GROUP == null || jeProhlizeciStranka_new()) return;

  var g = SELECTED_ELEM_GROUP.node().parentGraph;
  var data = SELECTED_ELEM_GROUP.datum();

  if (g.graphDiv.style.display == "none") return;

  if (event.key.toLowerCase() == "escape") {
    if (g.getCurrentState() == graphStateEnum.creatingEdge
      || SELECTED_ELEM_GROUP.classed("activeRenaming")) {
      EditorManager.deselectAll();
    }
  }
  if (event.key.toLowerCase() == "delete") {
    if (SELECTED_ELEM_GROUP.classed("activeRenaming")) return; //allow delete while renaming

    if (SELECTED_ELEM_GROUP.node().classList.contains(graphConsts.stateElem)) { // if selected element is state
      g.deleteState(data);
      g.graphState.selectedState = null;
    }
    else { // if selected element is edge
      g.deleteEdge(data);
      g.graphState.selectedEdge = null;
    }
    if (g.getEditor().isEmpty()) {
      g.setCurrentState(graphStateEnum.initial);
    }
    else {
      g.setCurrentState(graphStateEnum.default);
    }
    SELECTED_ELEM_GROUP = null;
    g.hideAllExtras();
    g.enableAllDragging();
  }
}


/**
 * Helper methods concerning HTML elements.
 */
class HtmlUtils {
  static hideElem(element) {
    if (!element) return;
    element.style.display = "none";
  }

  static showElem(element, inline = false) {
    if (!element) return;
    if (inline) {
      element.style.display = "inline-block";
    }
    else {
      element.style.display = "block";
    }
  }

  static createHintParagraph(string) {
    var p = document.createElement("P");
    p.setAttribute("class", "hint-paragraph");
    p.innerHTML = `${hintSymbol} ${string}`;
    return p;
  }

  static createButton(text, className) {
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

  static createContextMenuButton(innerText) {
    var b = HtmlUtils.createButton(innerText, "context-menu-button");
    b.style.width = "100%";
    b.style.marginTop = "3px";
    b.style.marginBottom = "3px";
    b.style.marginLeft = "0px";
    b.style.marginRight = "0px";
    return b;
  }

  static appendChildren(parentElement, childrenArray) {
    childrenArray.forEach(e => {
      parentElement.appendChild(e);
    });
  }

  static makeReadonly(input) {
    input.setAttribute("readonly", "readonly");
  }

  static removeReadonly(input) {
    input.removeAttribute("readonly");
  }

  static visualLength(val) {
    var ruler = document.getElementById("ruler");
    ruler.innerHTML = val;
    return ruler.offsetWidth;
  }

  static visualHeight(val) {
    var ruler = document.getElementById("ruler");
    ruler.innerHTML = val;
    return ruler.offsetHeight;
  }

  static tableVisualLength(val) {
    var ruler = document.getElementById("table-ruler");
    ruler.innerHTML = val;
    return ruler.offsetWidth;
  }

  static setElemPosition(elem, top, left) {
    elem.style.top = top + "px";
    elem.style.left = left + "px";
  }

}

/**
 * Helper state methods for Automata Editor.
 */
class StateUtils {
  static setInputValue(input, value) {
    input.realValue = value;
    var cropped = StateUtils.getCroppedTitle(input);
    input.setAttribute("value", cropped);
    input.value = cropped;
  }

  static getCroppedTitle(input) {
    var title = input.realValue;
    var shortened = false;
    var padding = 10;

    while (HtmlUtils.visualLength(title) >= (graphConsts.nodeRadius * 2) - padding) {
      title = title.substring(0, title.length - 1); //orezanie o 1 pismenko
      shortened = true;
    }
    if (shortened) {
      title = title.substring(0, title.length - 1).concat("..");
    }
    return title;
  }

  static showFullName(invisibleRect, d) {
    StateUtils.toggleFullNameVisibitity(invisibleRect, true);
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

  static toggleFullNameVisibitity(rect, visible = false) {
    rect.style("visibility", function () {
      return visible == true ? "visible" : "hidden";
    });
    rect.FullnameText.style("visibility", function () {
      return visible == true ? "visible" : "hidden";
    });
  }

}

/**
 * Helper edge methods for Automata Editor.
 */
class EdgeUtils {
  static setInputValue(input, value) {
    input.setAttribute("value", value);
    input.value = value;
  }

  static setInputWidth(input, len = null) {
    if (len == null) {
      len = HtmlUtils.visualLength(input.value);
      len += 0; //padding
    }
    if (len < 15) len = 15;

    d3.select(input.parentNode).attr("width", len + 8);
    input.style.width = (len) + "px";
  }

  static getInputPosition(pathDefinitinAttribute, isSelfloop) {
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

  static shorten(num) {
    if (num == 0) {
      return "";
    }
    return num.toFixed(2);
  }

  static checkPathData(data) {
    if (!data.dx) data.dx = 0;
    if (!data.dy) data.dy = 0;
    if (data.angle != 0 && !data.angle) {
      data.angle = data.source == data.target ? 1.55 : 0;
    }
    return data;
  }

  static reverseCalculate(source, target, dx, dy) {
    var s1 = source;
    var s2 = target;

    var c1 = ((s1.x + s2.x) / 2) + dx;
    var c2 = ((s1.y + s2.y) / 2) + dy;

    return `M ${s1.x} ${s1.y} Q ${c1} ${c2} ${s2.x} ${s2.y}`;
  }

  static hide(edgeG) {
    edgeG.select("." + graphConsts.edgePath).classed("hidden", true);
    edgeG.select("." + graphConsts.edgeMarker).classed("hidden", true);
  }

  static updatePathCurve(edgeData, mouseX, mouseY, oldPathDefinition) {
    if (edgeData.source.id == edgeData.target.id) {
      var str = oldPathDefinition.split(" ");
      return EdgeUtils.getSelfloopDef(str[1], str[2], mouseX, mouseY, edgeData);
    }
    else {
      return EdgeUtils.getPathDef(mouseX, mouseY, oldPathDefinition, edgeData);
    }
  }

  /**
   * Based on mouse and transition's source and target states' positions calculates new edge path.
   * @param   {Number}  mouseX    Mouse x coordinate.
   * @param   {Number}  mouseY    Mouse y coordinate.
   * @param   {String}  pathDef   Previous edge path definition.
   * @param   {Object}  edgeData  Edge data object.
   * @return  {String}            New edge path definition.
   */
  static getPathDef(mouseX, mouseY, pathDef, edgeData) {
    var str = pathDef.split(" ");

    var dx = 2 * (mouseX - ((+str[1] + (+str[6])) / 2));
    var dy = 2 * (mouseY - ((+str[2] + (+str[7])) / 2));
    str[4] = ((+str[1] + (+str[6])) / 2) + dx;
    str[5] = ((+str[2] + (+str[7])) / 2) + dy;

    edgeData.dx = dx;
    edgeData.dy = dy;

    //snap into straight line if edge curve is small enough
    if (Math.abs(dy) <= 17 && Math.abs(dx) <= 17) {
      edgeData.dx = edgeData.dy = 0;
      return EdgeUtils.getStraightPathDef(edgeData.source.x, edgeData.source.y, edgeData.target.x, edgeData.target.y);
    }
    return str.join(" ");
  }

  /**
   * Calculates a new (self-loop) path definition based on the mouse and transition's source and target states' positions.
   * @param {Number} x1 The original x coordinate.
   * @param {Number} y1 The original y coordinate.
   * @param {Number} x2 The new x coordinate.
   * @param {Number} y2 The new y coordinate.
   * @param {Object}    edgeData Edge data object.
   * @returns {String} New path definition.
   */
  static getSelfloopDef(x1, y1, x2, y2, edgeData) {
    if (edgeData != null) {
      edgeData.angle = EdgeUtils.calculateAngle(x1, y1, x2, y2);
      return `M ${x1} ${y1} C ${MathUtils.cubicControlPoints(x1, y1, edgeData.angle)} ${x1} ${y1}`;
    }
    return MathUtils.calculateSelfloop(x1, y1, EdgeUtils.calculateAngle(x1, y1, x2, y2));
  }

  static calculateAngle(x1, y1, x2, y2) {
    var distance = MathUtils.distBetween(x1, y1, x2, y2), angle;
    if (distance == 0) {
      distance = 0.001;
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

  static getStraightPathDef(x1, y1, x2, y2) {
    return `M ${x1} ${y1} Q ${MathUtils.midpoint(x1, x2)} ${MathUtils.midpoint(y1, y2)} ${x2} ${y2}`;
  }

  /**
   * Repositions edge input into the middle of edge curve.
   * @param {d3 selection} edge 
   */
  static updateInputPosition(edge) {
    edge
      .each(function (ed) {
        var fo = d3.select(this).select("foreignObject");
        var dAttr = d3.select(this).select("." + graphConsts.edgePath).attr("d");
        var coords = EdgeUtils.getInputPosition(dAttr, ed.source == ed.target);

        EdgeUtils.repositionInputTo(fo, coords.tx, coords.ty);
      });
  }

  /**
   * Sets the edge input's position according to coordinates x,y.
   * @param {Object} foreignObject Object housing the edge input.
   * @param {Number} x 
   * @param {Number} y 
   */
  static repositionInputTo(foreignObject, x, y) {
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

}

class MathUtils {
  static midpoint(x1, x2) {
    return (x1 + x2) / 2;
  }

  static distBetween(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
  }

  /**
  * 
  * @param {*} x 
  * @param {*} y 
  * @param {*} d 
  * @param {*} mult  how long the self loop will be
  * @param {*} div   wideness of loop - the lesser the wider
  */
  static cubicControlPoints(x, y, d, mult = 110, div = 6) {
    var x1 = (+x + (Math.cos(d + Math.PI / div) * mult)).toFixed(3);
    var y1 = (+y - (Math.sin(d + Math.PI / div) * mult)).toFixed(3);
    var x2 = (+x + (Math.cos(d - Math.PI / div) * mult)).toFixed(3);
    var y2 = (+y - (Math.sin(d - Math.PI / div) * mult)).toFixed(3);

    return `${x1} ${y1} ${x2} ${y2}`;
  }

  static calculateSelfloop(x, y, angle) {
    return `M ${x} ${y} C ${MathUtils.cubicControlPoints(x, y, angle)} ${x} ${y}`;
  }
}

/**
 * Basic array utils.
 */
class ArrayUtils {
  /**
   * Replaces '\e' with 'ε' and converts array into string, items are separated by commas.
   * @param   {Array}  array 
   * @returns {String} String with replaced epsilons.
   */
  static replaceEpsilon(array) {
    return array.toString().replace(/\\e/g, epsSymbol);
  }

  /**
   * Decides if two arrays have at least one common element.
   * @param   {array}     array1 
   * @param   {array}     array2 
   * @returns {boolean}   True if arrays intersects, false otherwise.
   */
  static intersects(array1, array2) {
    for (let i = 0, len = array1.length; i < len; i++) {
      if (array2.includes(array1[i])) {
        return true;
      }
    }
    return false;
  }

  /**
   * Deletes duplicate items from array.
   * @param   {Array} array 
   * @returns {Array} Array without duplicates.
   */
  static removeDuplicates(array) {
    return array.filter(function (item, pos) {
      return item != '' && array.indexOf(item) == pos;
    });
  }

  /**
   * Finds next alphabet symbol to be added as column value. 
   * Original author is Matej Poklemba, modified by Patricia Salajova.
   * @param  {Array} Symbols  An array of input symbols.
   * @return {String}         A string - an aplhabet character.
   */
  static findNextAlphabetSymbol(symbols) {
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
    while (symbols.indexOf(symbol) != -1)
    return symbol;
  }


}

/**
 * 
 */
class EditorUtils {
  /**
   * Finds the longest string from array.
   * @param   {Array<String>}   array 
   * @returns {Number}  Length of the longest string.
   */
  static findLongestElem(array) {
    var max = 0;
    array.forEach(title => {
      max = Math.max(max, HtmlUtils.tableVisualLength(title));
    });
    return max;
  }

  static generateEditorId(type) {
    var result = `${type}-`;
    var symbols = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var len = symbols.length;

    for (let i = 0; i < 6; i++) {
      result += symbols.charAt(Math.floor(Math.random() * len));
    }

    result += `-${editorIdCount++}`;
    return result;
  }

  static typeIsRegOrGram(type) {
    return type == "GRA" || type == "REG";
  }

  static typeIsNondeterministic(type) {
    return type == "NFA" || type == "EFA";
  }

  /**
   * Returns the k, x, y parameters as a d3.transform object.
   * @param   {Number} k  Zoom level.
   * @param   {Number} x  X coordinate.
   * @param   {Number} y  Y coordinate.
   * @returns {Object}    { k: k, x: x, y: y } transform object.
   */
  static convertStringToTransform(k, x, y) {
    k = parseFloat(k);
    if (!k) k = 1;
    x = parseFloat(x);
    if (!x) x = params.width / 2;
    y = parseFloat(y);
    if (!y) y = params.height / 2;
    return { k: k, x: x, y: y };
  }

  /**
   * Returns a point [x,y] with applied transform of @param selection.
   * @param   {[Number,Number]}     point       Original point.
   * @param   {Object}              selection   Selection with desired transform.
   * @returns {{x:Number, y:Number}}            New point.
   */
  static applyTransformationToPoint(point, selection) {
    var transform = d3.zoomTransform(selection.node());
    var res = transform.apply(point);
    return { x: res[0], y: res[1], };
  }

  /**
   * Returns a point [x,y] without d3 transform.
   * @param   {[Number,Number]}     oldXy      Original point.
   * @param   {Object}              selection  Selection to calculate inverse transform from.
   * @returns {{x:Number, y:Number}}           New point.
   */
  static getPointWithoutTransform(oldXy, selection) {
    var transform = d3.zoomTransform(selection.node());
    var res = transform.invert(oldXy);
    return {
      x: res[0],
      y: res[1],
    };
  }
}

/* ------------------------------ Syntax functions ------------------------------ */

/**
 * non-empty sequence of a-Z and 0-9 characters
 */
const STATE_ID_SYNTAX = "[a-zA-Z0-9]+";

/**
 * defines any non-empty sequence of symbols that are not white space or "", enclosed in ""; eg. "aaa", "79878"
 */
const QUOT_SEQ = "\"[^\\s\"]+\"";

/**
 * Syntax of automaton's state names.
 * @return {RegExp} Regular expression.
 */
function stateSyntax() {
  return new RegExp(`^${STATE_ID_SYNTAX}$`);
}

/**
 * Holds regular expressions that define syntax of elements in Graph mode.
 */
const graphSyntax = {
  /**
   * Syntax of DFA and NFA transitions (allows more input symbols divided by commas).
   * @return {RegExp} Regular expression.
   */
  transition: function () {
    return new RegExp(`^(([a-zA-Z0-9])|(${QUOT_SEQ}))(,((${QUOT_SEQ})|([a-zA-Z0-9])))*$`);
  },

  /**
   * Syntax of EFA transitions (allows more input symbols divided by commas).
   * @return {RegExp} Regular expression.
   */
  transition_EFA: function () {
    return new RegExp(`^(([a-zA-Z0-9])|(${QUOT_SEQ})|(${epsSymbol})|(\\e))(,(([a-zA-Z0-9])|(${QUOT_SEQ})|(${epsSymbol})|(\\e)))*$`);
  },

}

/**
 * Holds regular expressions that define syntax of elements in Table mode.
 */
const tableSyntax = {
  /**
   * Syntax of one input symbol - table column header (DFA and NFA).
   * @returns {RegExp} Regular expression.
   */
  transition: function () {
    return new RegExp(`^[a-zA-Z0-9]$|^${QUOT_SEQ}$`);
  },

  /**
   * Syntax of one input symbol - table column header (EFA).
   * @returns {RegExp} Regular expression.
   */
  transition_EFA: function () {
    return new RegExp(`^${epsSymbol}$|^\\e$|^[a-zA-Z0-9]$|^${QUOT_SEQ}$`);
  },

  /**
   * Syntax of result of transition function (= one state name).
   * @returns {RegExp} Regular expression.
   */
  innerCell_DFA: function () {
    return new RegExp(`^$|^${STATE_ID_SYNTAX}$`);
  },

  /**
   * Syntax of result of transition function (= set of state names).
   * @returns {RegExp} Regular expression.
   */
  innerCell_Nondeterm: function () {
    return new RegExp(`^{}$|^{${STATE_ID_SYNTAX}(,${STATE_ID_SYNTAX})*}$`);
  }

}

/**
 * Decides if value is incorrect state name.
 * @param   {string}  value State name to check.
 * @return  {boolean}       True if value is incorrect state name, false otherwise.
 */
function incorrectStateSyntax(value) {
  return !stateSyntax().test(value);
}

function incorrectGraphTransitionsSyntax(type, value) {
  return ((type == "DFA" || type == "NFA") && !graphSyntax.transition().test(value)) ||
    (type == "EFA" && !graphSyntax.transition_EFA().test(value));
}

function incorrectTableInnerCellSyntax(type, value) {
  return (type == "DFA" && !tableSyntax.innerCell_DFA().test(value)) ||
    (EditorUtils.typeIsNondeterministic(type) && !tableSyntax.innerCell_Nondeterm().test(value));
}

function incorrectTableColumnHeaderSyntax(type, value) {
  return ((type == "DFA" || type == "NFA") && !tableSyntax.transition().test(value)) ||
    (type == "EFA" && !tableSyntax.transition_EFA().test(value));
}


/* ------------------------------ IS helper functions ------------------------------ */

/**
 * Registers function to element with correct question id.
 * The original author is Radim Cebis, modified by Patricia Salajova.
 * This is the function used to bind syntax parser to editor's textarea.
 * @param {String}      id    Question id.
 * @param {Function}    func  Function. 
 * @param {HTMLElement} elem  Textarea HTMLElement which will be binded with func.
 */
function registerElem(id, func, elem) {
  // when we are in inspection (browse) mode, we do not want the syntax check to work
  if (jeProhlizeciStranka_new()) {
    if (document.getElementById(id + "-error")) {
      //hide the syntax check
      document.getElementById(id + "-error").setAttribute("hidden", '');
    }
    return;
  }

  function test(evt) {
    if (!evt) var evt = window.event;
    var input = (evt.target) ? evt.target : evt.srcElement;

    var result = func(input.value);
    if (elem.value == "") {
      document.getElementById(id + "-error").className = "alert alert-info";
      document.getElementById(id + "-i").className = "";
      document.getElementById(id + "-error-text").innerHTML = syntaxDefaultText;
    }
    else {
      if (result.error_string != "")
        document.getElementById(id + "-error-text").innerHTML = htmlentities(result.error_string);
      else
        document.getElementById(id + "-error-text").innerHTML = syntaxIsCorrect;

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

/**
 * Decides if the current IS page is in inspection (browse) mode or not.
 * Works for the *new version* of IS.
 * @return {Boolean} True if page is in inspection mode, false otherwise.
 */
function jeProhlizeciStranka_new() {
  var sp = document.getElementById("app_name");
  if (sp && sp.innerText.includes(browse)) {
    return true;
  }

  var all = document.getElementsByClassName("drobecek_app");
  for (let i = 0; i < all.length; i++) {
    if (all[i].innerHTML == browse2) {
      return true;
    }
  }
  return false;
}