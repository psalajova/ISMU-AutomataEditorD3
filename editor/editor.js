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
  "initial": 6 //when editor contains no states (= is empty)
});

/**
 * Enum to specify state and edge data origin.
 */
const elemOrigin = Object.freeze({
  "default": 0, //created in graph mode
  "fromTable": 1, //created in table mode
  "fromExisting": 2  //when recreating editor from existing data
});

var editor_init, upload, editorIdCount = 0;
var minStateWidth = "50px";
var SELECTED_ELEM_GROUP, maxZoomout = 0.5;

/* ------------------------------ Initialization ------------------------------ */

setupLanguage();

/**
 * This section of code ensured the initialisation of editor(s) when the page is loading.
 */
if (typeof editor_init !== 'function') {
  var editorQuestions = {};

  var onl = window.onload || function () { };
  /**
   * Second, after the editorQuestions object is filled, we iterate over it,
   * creating the editor for the appropriate textareas.
   */
  window.onload = function () {
    onl();
    var textAreas = document.getElementsByTagName('textarea');
    for (var n in editorQuestions) {
      var txa = textAreas[n];
      if (editorQuestions[n] != null) {
        createEditor(editorQuestions[n], txa);
      }
    }
  }
  /**
   * First, this method is called from the individual questions in a ROPOT,
   * filling the editorQuestions object as {1: "id1", 2: "id2", ...}. 
   * The first number is an index of that textarea, marking it from all textareas on page,
   * so that the editor is created only for the according textareas.
   */
  editor_init = function (type) {
    var id = EditorUtils.generateEditorId(type);
    while (document.getElementById(id) != null) {
      id = EditorUtils.generateEditorId(type);
    }
    editorQuestions[document.getElementsByTagName('textarea').length] = id;
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
    this.getEditor().generateAnswer();
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

  /**
 * Constants for classes of HTML elements in GraphMode.
 */
  static get CONSTS() {
    return {
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
  }

  /**
   * Creates graph hint and syntax hint elements for graph mode.
   */
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
   * Creates all elements of Graph mode.
   */
  initialise() {
    this.graphDiv.setAttribute("class", "graph-div");
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
      .attr("class", GraphMode.CONSTS.edgePath + " dragline hidden")
      .attr("d", "M0,0L0,0")
      .style("marker-end", "url(#temporary-arrow-end" + this.editorId + ")");

    temporaryEdgeG
      .append("svg:path")
      .classed(GraphMode.CONSTS.edgeMarker, true)
      .attr("marker-end", "url(#end-arrow" + this.editorId + ")");

    //init-arrow
    var initArrow = svgGroup
      .append("svg:path")
      .attr("class", GraphMode.CONSTS.edgePath + " init-arrow")
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
      .classed(GraphMode.CONSTS.stateGroup, true);

    this.stateGroups = svgGroup.stateGroups;

    svgGroup.edgeGroups = svgGroup
      .select(".edges")
      .selectAll("g")
      .data(this.edgesData)
      .enter()
      .append("g")
      .classed(GraphMode.CONSTS.edgeGroup, true);

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
        .on("contextmenu", (e) => this.canvasOnContextmenu(e))
        ;

      rect.on("contextmenu", (e) => this.canvasOnContextmenu(e))
        .on("dblclick", (e) => this.canvasOnDblclick(e));

      initArrow.call(g.dragInitArrow);
    }
  }

  /**
   * Recreates automaton based on @param answer.
   * @param {String} answer String representing a finite automaton in syntax of IS MUNI evaluation service.
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

    var splitted = answer.split("#states");

    let final = new RegExp(`final={(${EditorSyntax.elems.stateId}|${EditorSyntax.elems.QUOT_SEQ})(,(${EditorSyntax.elems.QUOT_SEQ}|${EditorSyntax.elems.stateId}))*}`);
    let matches = splitted[0].match(final);
    var finalStates = matches ? matches[0].substring(7, matches[0].length - 1).split(',') : [];

    let initial = EditorUtils.getInitialStateFromText(answer);
    var data = splitted[1].split("edges@");
    var states = data[0];
    var rest = "@" + data[1];
    var editor = this.getEditor();

    if (states != null && states != "") {
      states = states.split("@");
      for (var d of states) {
        var stateParts = d.split(';');
        let id = stateParts[0];
        let x = parseInt(stateParts[1]);
        let y = parseInt(stateParts[2]);
        if (EditorSyntax.incorrectStateSyntax(id)) continue;
        this.checkStatePosData(data);
        var data = this.getNewStateData(id, x, y);
        
        this.createState(data);
        if (initial != null && initial === data.id) {
          this.setNewStateAsInitial(data);
        }
        if (finalStates.includes(id)) {
          this.toggleAcceptingState(data);
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

    editor.Text.textArea.innerText = answer;

    /**
     * TODO:
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

  /**
   * Creates elements of the state context menu.
   */
  createStateContextMenu() {
    var menu = document.createElement("div");
    menu.setAttribute("class", AutomataEditor.CONSTS.CONTEXT_MENU);

    var a = HtmlUtils.createContextMenuButton(renameStateText);
    a.addEventListener("click", () => {
      HtmlUtils.hideElem(this.stateContextMenuDiv);
      this.startRenaming(graphStateEnum.renamingState, this.graphState.selectedState.id);
    });

    var b = HtmlUtils.createContextMenuButton(deleteStateText);
    b.addEventListener("click", () => {
      this.deleteState(this.graphState.selectedState);
      HtmlUtils.hideElem(this.stateContextMenuDiv);
    });

    var c = HtmlUtils.createContextMenuButton(setStateAsAcceptingText);
    c.addEventListener("click", () => {
      this.toggleAcceptingState(this.graphState.selectedState);
      HtmlUtils.hideElem(this.stateContextMenuDiv);
    });

    var d = HtmlUtils.createContextMenuButton(setAsInitialText);
    d.addEventListener("click", () => {
      this.setNewStateAsInitial(this.graphState.selectedState);
      HtmlUtils.hideElem(this.stateContextMenuDiv);
    });

    HtmlUtils.appendChildren(menu, [a, b, c, d]);
    this.acceptingButton = c;
    this.initialButton = d;
    this.graphDiv.appendChild(menu);
    this.stateContextMenuDiv = menu;
  }

  /**
   * Creates elements of the edge (transition) context menu
   */
  createEdgeContextMenu() {
    let menu = document.createElement("div");
    menu.setAttribute("class", "context-menu");

    let renameButton = HtmlUtils.createContextMenuButton(renameEdgeText);
    renameButton.addEventListener("click", () => {
      HtmlUtils.hideElem(this.edgeContextMenuDiv);
      this.startRenaming(graphStateEnum.renamingEdge, this.graphState.selectedEdge.symbols);
    });

    let deleteButton = HtmlUtils.createContextMenuButton(deleteEdgeText);
    deleteButton.addEventListener("click", () => {
      this.deleteEdge(this.graphState.selectedEdge);
      HtmlUtils.hideElem(this.edgeContextMenuDiv);
    });

    HtmlUtils.appendChildren(menu, [renameButton, deleteButton]);

    this.graphDiv.appendChild(menu);
    this.edgeContextMenuDiv = menu;
  }

  /**
   * Creates the "new state" context menu, shown when right-clicking on canvas.
   */
  createAddStateMenu() {
    var menu = document.createElement("div");
    menu.setAttribute("class", AutomataEditor.CONSTS.CONTEXT_MENU);

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

  /**
   * Creates the error message shown when renaming state/editing transition.
   */
  createRenameError() {
    var p = document.createElement("p");
    p.setAttribute("class", "rename-error-p");
    HtmlUtils.hideElem(p);
    this.graphDiv.appendChild(p);
    this.renameError = p;
  }

  /* ------------------------------ event handlers ------------------------------ */

  /**
   * Handles clicks on canvas.
   * @param {MouseEvent} e 
   */
  canvasOnClick(e) {
    e.preventDefault();
    var classes = e.target.classList;
    var isState = classes.contains(GraphMode.CONSTS.stateElem);
    var isEdge = classes.contains(GraphMode.CONSTS.edgeElem) || classes.contains("edge-path");
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

  /**
   * Handles double-clicks on canvas.
   * @param {MouseEvent} e 
   */
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

  /**
   * Handles the context-menu event (right-clicks) on canvas.
   * @param {*} e 
   * @returns 
   */
  canvasOnContextmenu(e) {
    e.preventDefault();
    var classes = e.target.classList;
    var isState = classes.contains(GraphMode.CONSTS.stateElem);
    var isEdge = classes.contains(GraphMode.CONSTS.edgeElem);
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
    HtmlUtils.setElemPosition(elem, d3.pointer(e)[1], d3.pointer(e)[0]);
    HtmlUtils.showElem(elem);
  }

  /**
   * Defines the behaviour when moving the mouse.
   * @param {MouseEvent} e 
   */
  canvasOnMousemove(e) {
    if (this.graphState.currentState == graphStateEnum.creatingEdge) {
      this.initCreatingTransition(e);
    }
  }

  /**
   * According to where mouse is pointing decides the shape of the new edge.
   * @param {MouseEvent}  e 
   * @param {Boolean}     hide 
   */
  initCreatingTransition(e, hide = false) {
    var path = this.temporaryEdgeG.select("." + GraphMode.CONSTS.edgePath);
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
      if (!hide) this.temporaryEdgeG.select("." + GraphMode.CONSTS.edgeMarker).classed("hidden", false);
      this.repositionMarker(this.temporaryEdgeG);
    }
    //mouse is not hovering above any state
    else {
      this.temporaryEdgeG.select("." + GraphMode.CONSTS.edgeMarker).classed("hidden", true);
      path.attr("d", EdgeUtils.getStraightPathDef(sourceState.x, sourceState.y, mouseX, mouseY));
    }
    this.disableAllDragging();
  }

  /* ------------------------------ pan & zoom ------------------------------ */

  /**
   * Defines editor's behaviour at the start of the zooming.
   */
  svgZoomStart() {
    EditorManager.deselectAll();
    this.hideAllContextMenus();
  }

  /**
   * Defines editor's behaviour during the zooming.
   * @param {Object} e d3 zoom event object.
   */
  svgZoomed(e) {
    this.svgGroup.attr("transform", e.transform);
  }

  /**
   * Defines editor's behaviour at the end of the zooming.
   */
  svgZoomEnd() {
    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }

  /**
   * Sets the view of the canvas to its middle.
   */
  setViewToMiddle() {
    this.setTransform(1, params.width / 2, params.height / 2);
  }

  /**
   * Sets the zoom&pan of the canvas - its scale and position.
   * @param {Number} k Scale.
   * @param {Number} x X coordinate.
   * @param {Number} y Y coordinate.
   */
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

  /**
   * Hides the arrow marking the initial state.
   */
  hideInitArrow() {
    this.svgGroup.initArrow.classed("hidden", true);
  }

  /**
   * Returns the current state of the editor.
   * @returns {Number} One number of graphStateEnum.
   */
  getCurrentState() {
    return this.graphState.currentState;
  }

  /**
   * Checks if the editor is in the middle of renaming of a state/editing of a edge.
   * @param   {Number}  state The current editor's state.
   * @returns {Boolean}       True if is in renamind/editing state, false otherwise.
   */
  isRenamingState(state) {
    return state == graphStateEnum.renamingState ||
      state == graphStateEnum.renamingEdge ||
      state == graphStateEnum.namingEdge ||
      state == graphStateEnum.mergingEdge;
  }

  /**
   * Sets the state of the editor.
   * @param {Number} state One element of graphStateEnum.
   */
  setCurrentState(state) {
    this.graphState.currentState = state;
  }

  /**
   * Hides all context menus.
   */
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

  /**
   * Enables dragging of elements and canvas.
   */
  enableAllDragging() {
    if (!jeProhlizeciStranka_new()) {
      this.svgGroup.selectAll("." + GraphMode.CONSTS.stateGroup).call(this.dragState);
      this.svgGroup.selectAll("." + GraphMode.CONSTS.edgeGroup).call(this.dragEdge);
      this.svg.call(this.zoom).on("dblclick.zoom", null);
    }
  }

  /**
   * Disables dragging of elements and canvas.
   */
  disableAllDragging() {
    var limitedDrag = d3.drag()
      .on("start", this.stateDragstart)
      .on("end", this.stateDragend);

    this.svgGroup.selectAll("." + GraphMode.CONSTS.stateGroup).call(limitedDrag);
    this.svgGroup.selectAll("." + GraphMode.CONSTS.edgeGroup).on(".drag", null);
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
    this.svgGroup.selectAll("." + GraphMode.CONSTS.stateGroup).on(".drag", null);

    this.setCurrentState(graphState);
    if (isState) this.selectState(elemG);

    this.setRenameErrorPosition(graphState, elemG);
    errMsg != null ? this.showRenameError(errMsg) : HtmlUtils.hideElem(this.renameError);
  }

  /**
   * Ends renaming/editing of an element.
   */
  endRenaming() {
    if (SELECTED_ELEM_GROUP) {
      SELECTED_ELEM_GROUP.select("input").node().blur();
    }
    this.setCurrentState(graphStateEnum.default);
    HtmlUtils.hideElem(this.renameError);
    this.enableAllDragging();
  }

  /**
   * Sets the position of the error message.
   * @param {Number}      graphState   An element of graphStateEnum.
   * @param {HTMLElement} activeElemG  A state or an edge that is currently selected.
   */
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
        activeElemG.select("." + GraphMode.CONSTS.edgePath).attr("d"),
        activeElemG.datum().source == activeElemG.datum().target);

      var p = EditorUtils.applyTransformationToPoint([t.tx - inputWidth / 2, t.ty + 16], activeElemG);
      x = p.x;
      y = p.y;
    }
    HtmlUtils.setElemPosition(this.renameError, y, x);
  }

  /**
   * Shows the error message.
   * @param {String} msg The text of the error message.
   */
  showRenameError(msg) {
    this.renameError.innerHTML = msg;
    HtmlUtils.showElem(this.renameError);
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
    else {
      let g = this;
      newStateG
        .on("mouseover", function(_, d) {
          if (d.id != d3.select(this).select("input").node().value) {
            StateUtils.showFullName(g.svgGroup.stateFullnameRect, d);
          }
        })
        .on("mouseout", function() {
          StateUtils.toggleFullNameVisibitity(g.svgGroup.stateFullnameRect);
        });
    }
  }

  /**
   * Creates the svg elements of a state.
   * @param {SVGElement}  state   A svg <g> element.
   * @param {Number}      origin  A memebr of elemOrigin enum.
   */
  addStateSvg(state, origin = elemOrigin.default) {
    state
      .classed(GraphMode.CONSTS.stateGroup, true)
      .classed(GraphMode.CONSTS.stateElem, true)
      .attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    state
      .append("circle")
      .classed(GraphMode.CONSTS.stateMainCircle, true)
      .classed(GraphMode.CONSTS.stateElem, true)
      .attr("r", GraphMode.CONSTS.nodeRadius);

    var g = this;
    var input = state
      .append("foreignObject")
      .classed(GraphMode.CONSTS.stateElem, true)
      .attr("x", -24)
      .attr("y", -12)
      .attr("height", 23)
      .attr("width", 50)
      .append("xhtml:input")
      .classed("stateInput", true)
      .classed(GraphMode.CONSTS.stateElem, true);

    HtmlUtils.makeReadonly(input.node());
    input.node().correct = false;
    if (origin == elemOrigin.fromExisting || origin == elemOrigin.fromTable) {
      input.node().correct = true;
    }
    input.node().realValue = state.datum().id;
    StateUtils.setInputValue(input.node(), state.datum().id);
  }

  /**
   * Adds event handlers for a state.
   * @param {SVGElement} state A svg <g> element.
   */
  addStateEvents(state) {
    var g = this;
    state
      .call(g.dragState)
      .on("mouseover", function(_, d) {
        g.graphState.mouseOverState = d;
        d3.select(this).classed(GraphMode.CONSTS.mouseOver, true);
  
        if (d.id != d3.select(this).select("input").node().value) {
          StateUtils.showFullName(g.svgGroup.stateFullnameRect, d);
        }
      })
      .on("mouseout", function () {
        StateUtils.toggleFullNameVisibitity(g.svgGroup.stateFullnameRect);
        g.graphState.mouseOverState = null;
        d3.select(this).classed(GraphMode.CONSTS.mouseOver, false);
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

  /**
   * Creates a new state with position [x,y] and sets it as initial state.
   * @param {Number} x X coordinate.
   * @param {Number} y Y coordinate.
   */
  initInitialState(x, y) {
    var initialData = this.getNewStateData(null, x, y, true, false);
    this.createState(initialData);
    this.repositionInitArrow(initialData, 3.14);
    this.graphState.initialState = initialData;
  }

  /**
   * Updates the graph d3 selection of state svg groups.
   */
  updateStateGroups() {
    this.stateGroups = this.svgGroup.select(".states").selectAll("g");
  }

  /**
   * Delets the state.
   * @param {Object} stateData 
   */
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
        //editor.resetStateIds();
        this.initEmptyState();
      }
    }
  }

  /**
   * Tries to rename the state if the new name is valid.
   * @param {Object} stateData  State data.
   * @param {String} newId      Possible new name.
   * @param {String} prompt     Error message to show.
   */
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

  /**
   * Renames the state.
   * @param {Object} stateData  State data.
   * @param {String} newId      New name.
   */
  renameState(stateData, newId) {
    this.statesData
      .filter(function (d) { return d.id == stateData.id; })
      .map(function (d) { d.id = newId; });

    StateUtils.setInputValue(this.getStateGroupById(stateData.id).select(".stateInput").node(), newId);

    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }

  /**
   * Deletes the svg elements of a state.
   * @param {String} stateId State ID.
   */
  deleteStateSvg(stateId) {
    this.svgGroup
      .select(".states")
      .selectAll("g")
      .filter(function (d) { return d.id == stateId; })
      .remove();
  }

  /**
   * Deletes the @param stateData from graph's collection of states' data.
   * @param {Object} stateData State data.
   */
  deleteStateData(stateData) {
    this.statesData.splice(this.statesData.indexOf(stateData), 1);
  }

  /**
   * Delets all edges associated with a state.
   * @param {String} stateData State data.
   */
  deleteStateEdges(stateData) {
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

  /**
   * Sets a new state as initial.
   * @param {Object} stateData Data of the new initial state.
   */
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

  /**
   * Removes the initial status of the current initial state.
   */
  setInitStateAsNotInitial() {
    this.statesData
      .filter(function (d) { return d.initial == true; })
      .map(function (d) { d.initial = false; });
    this.hideInitArrow();
  }

  /**
   * Toggles the accepting status of a state.
   * @param {Object} stateData 
   */
  toggleAcceptingState(stateData) {
    let stateG = this.getStateGroupById(stateData.id);
    if (stateData.accepting) {
      stateG.select("." + GraphMode.CONSTS.stateAccCircle).remove();
    } else {
      this.addAcceptingCircle(stateG);
    }
    stateData.accepting = !stateData.accepting;

    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }

  /**
   * Adds the svg circle marking accepting status of a state.
   * @param {SVGElement} stateG A svg <g> element.
   */
  addAcceptingCircle(stateG) {
    stateG
      .append("circle")
      .classed(GraphMode.CONSTS.stateAccCircle, true)
      .classed(GraphMode.CONSTS.stateElem, true)
      .attr("r", GraphMode.CONSTS.nodeRadius - 3.5);
    stateG.select("foreignObject").raise();
  }

  /**
   * Selects the state.
   * @param {SVGElement} stateG A svg <g> element.
   */
  selectState(stateG) {
    this.removeSelectionFromEdge();

    if (this.graphState.selectedState != stateG.datum()) { // another state was selected
      this.removeSelectionFromState();
      this.graphState.selectedState = stateG.datum();
      SELECTED_ELEM_GROUP = stateG;
      stateG.classed(GraphMode.CONSTS.selected, true);
    }
  }

  /**
   * Deselects the currently selected state.
   */
  removeSelectionFromState() {
    if (this.graphState.selectedState == null) {
      return;
    }
    var s = this.graphState.selectedState;
    this.stateGroups
      .filter(function (d) {
        return d.id === s.id;
      })
      .classed(GraphMode.CONSTS.selected, false);
    this.graphState.selectedState = null;
  }

  /**
   * Defines the state's behaviour in the beginning of dragging.
   * @param {Object} e D3 drag event object.
   */
  stateDragstart(e) {
    var node = d3.select(this).node();
    var g = node.parentGraph;
    EditorManager.deselectAll(g.editorId);
    g.temporaryEdgeG.classed(GraphMode.CONSTS.selected, false);


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

  /**
   * Defines the state's behaviour during dragging.
   * @param {Object} e D3 drag event object.
   * @param {Object} d State data.
   */
  stateDragmove(e, d) {
    var g = d3.select(this).node().parentGraph;
    StateUtils.toggleFullNameVisibitity(g.svgGroup.stateFullnameRect);

    var p = EditorUtils.applyTransformationToPoint([e.x, e.y], g.svgGroup);
    if (p.x < (params.width - GraphMode.CONSTS.nodeRadius) && p.x >= GraphMode.CONSTS.nodeRadius) {
      d.x = e.x;
    }
    if (p.y < (params.height - GraphMode.CONSTS.nodeRadius) && p.y >= GraphMode.CONSTS.nodeRadius) {
      d.y = e.y;
    }

    d3.select(this).attr("transform", "translate(" + d.x + "," + d.y + ")");

    if (d.initial) {
      g.repositionInitArrow(d, g.svgGroup.initArrow.node().angle);
    }

    g.updateOutgoingEdges(d);
    g.updateIncomingEdges(d);
  }

  /**
   * Defines the state's behaviour at the end of dragging.
   * @param {Object} e D3 drag event object.
   * @param {Object} d State data.
   */
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
      EditorManager.getEditor(g.editorId).generateAnswer();
    }
  }

  /**
   * Updates positions of state's outgoing edges.
   * @param {Object} stateData State data.
   */
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
          var str = d3.select(this).select("." + GraphMode.CONSTS.edgePath).attr("d").split(" ");
          str[1] = stateData.x;
          str[2] = stateData.y;

          str[4] = ((+str[1] + (+str[6])) / 2) + ed.dx;
          str[5] = ((+str[2] + (+str[7])) / 2) + ed.dy;

          tx = (+str[4] + (+((+str[1] + (+str[6])) / 2))) / 2;
          ty = (+str[5] + (+((+str[2] + (+str[7])) / 2))) / 2;

          newDef = str.join(" ");
        }
        d3.select(this).select("." + GraphMode.CONSTS.edgePath).attr("d", newDef);
        EdgeUtils.repositionInputTo(d3.select(this).select("foreignObject"), tx, ty);
        g.repositionMarker(d3.select(this));
      });
  }

  /**
   * Updates positions of state's incoming edges.
   * @param {Object} stateData State data.
   */
  updateIncomingEdges(stateData) {
    var g = this;
    this.edgeGroups
      .filter(function (ed) {
        return ed.target.id === stateData.id && ed.source != ed.target;
      })
      .each(function (ed) {
        var str = d3.select(this).select("." + GraphMode.CONSTS.edgePath).attr("d").split(" ");

        str[6] = stateData.x;
        str[7] = stateData.y;

        str[4] = ((+str[1] + (+str[6])) / 2) + ed.dx;
        str[5] = ((+str[2] + (+str[7])) / 2) + ed.dy;

        var tx = (+str[4] + (+((+str[1] + (+str[6])) / 2))) / 2;
        var ty = (+str[5] + (+((+str[2] + (+str[7])) / 2))) / 2;

        d3.select(this).select("." + GraphMode.CONSTS.edgePath).attr("d", str.join(" "));

        EdgeUtils.repositionInputTo(d3.select(this).select("foreignObject"), tx, ty);
        g.repositionMarker(d3.select(this));
      });
  }

  checkStatePosData(data) {
    if (!data.x || !data.y) {
      data = this.findStatePlacement(data);
    }
  }

  /* ------------------------------ EDGE ------------------------------ */

  /**
   * Defines the editor's behaviour in the beginning of edge dragging.
   */
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

  /**
   * Defines the edge's behaviour during dragging.
   * @param {Object} e D3 drag event object.
   * @param {Object} d Edge data.
   */
  edgeDragmove(e, d) {
    var edgeG = d3.select(this);
    var g = edgeG.node().parentGraph;
    var oldPathDefinition = edgeG.select("." + GraphMode.CONSTS.edgePath).attr("d");

    edgeG
      .select("." + GraphMode.CONSTS.edgePath)
      .attr("d", EdgeUtils.updatePathCurve(d, e.x, e.y, oldPathDefinition));

    var coords = EdgeUtils.getInputPosition(edgeG.select("." + GraphMode.CONSTS.edgePath).attr("d"), d.source == d.target);
    EdgeUtils.repositionInputTo(edgeG.select("foreignObject"), coords.tx, coords.ty);
    g.repositionMarker(edgeG);
  }

  /**
   * Defines the editors's behaviour at the end of edge dragging.
   */
  edgeDragend() {
    if (!jeProhlizeciStranka_new()) {
      d3.select(this).node().parentGraph.updateText();
    }
  }

  /**
   * Creates a new edge.
   * @param   {Object}      data    Edge data.
   * @param   {Number}      origin  A member of elemOrigin enum.
   * @returns {SVGELement}          The svg <g> element representing the new edge.
   */
  createEdge(data, origin = elemOrigin.default) {
    var temporaryEdgePath = this.temporaryEdgeG.select("." + GraphMode.CONSTS.edgePath);

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
      .data(this.edgesData).enter().append("g").classed(GraphMode.CONSTS.edgeGroup, true);

    newEdge.node().parentGraph = this;

    this.addEdgeSvg(newEdge, origin, temporaryEdgePath.attr("d"));

    this.repositionMarker(newEdge);
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

  /**
   * Creates svg elements for the new edge.
   * @param {SVGELement} edge The svg <g> element representing the edge.
   * @param {Number}     origin  A member of elemOrigin enum.
   * @param {String}     tempEdgeDef The definition attribute of the temporary edge.
   */
  addEdgeSvg(edge, origin, tempEdgeDef) {
    edge
      .append("svg:path")
      .classed(GraphMode.CONSTS.edgePath, true)
      .classed(GraphMode.CONSTS.edgeElem, true)
      .attr("d", function (d) {
        if (origin == elemOrigin.fromExisting) {
          return d.source != d.target ? EdgeUtils.reverseCalculate(d.source, d.target, d.dx, d.dy) : EdgeUtils.calculateSelfloop(d.source.x, d.source.y, d.angle);
        }
        if (d.source == d.target) {
          if (origin == elemOrigin.fromTable) {
            d.angle = 1.55;
            return EdgeUtils.calculateSelfloop(d.source.x, d.source.y, d.angle);
          }
          return tempEdgeDef;
        }
        return EdgeUtils.getStraightPathDef(d.source.x, d.source.y, d.target.x, d.target.y);
      });

    edge
      .append("svg:path")
      .classed(GraphMode.CONSTS.edgeMarker, true)
      .classed(GraphMode.CONSTS.edgeElem, true)
      .attr("marker-end", "url(#end-arrow" + this.editorId + ")");

    var fo = edge
      .append("foreignObject")
      .classed(GraphMode.CONSTS.edgeElem, true)
      .attr("height", 29)
      .attr("width", 50);

    var input = fo
      .append("xhtml:input")
      .classed("edgeInput", true)
      .classed(GraphMode.CONSTS.edgeElem, true);

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

  /**
   * Adds event handlers for edge.
   * @param {SVGELement} edge The svg <g> element representing the edge.
   */
  addEdgeEvents(edge) {
    var g = this;
    edge
      .call(g.dragEdge)
      .on("mouseover", function () {
        d3.select(this).classed(GraphMode.CONSTS.mouseOver, true);
      })
      .on("mouseout", function () {
        d3.select(this).classed(GraphMode.CONSTS.mouseOver, false);
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

  /**
   * Handles edge's behaviour when the input housing its input symbols goes out of focus.
   * @param {Object}      d     Edge data.
   * @param {HTMLElement} input HTML <input> element.
   */
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

  /**
   * Handles edge's input on keydown.
   * @param {KeyboardEvent} e 
   * @param {Object}        d     Edge data.
   * @param {HTMLElement}   input HTML <input> element.
   * @returns 
   */
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

  /**
   * Tries to edit transiton's input symbols if the new symbols are valid.
   * @param {Object} edgeData Edge data.
   * @param {String} newSymbols Possible new input symbols.
   * @param {String} prompt Error message to show.
   */
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

  /**
   * Renames the edge.
   * @param {Object} edgeData Edge data.
   * @param {String} symbols  New inpu symbols.
   */
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

  /**
   * Deletes the edge.
   * @param {Object} edgeData Edge data.
   */
  deleteEdge(edgeData) {
    this.deleteEdgeSvg(edgeData);
    this.updateEdgeGroups();
    this.deleteEdgeData(edgeData);
    if (!jeProhlizeciStranka_new()) {
      this.updateText();
    }
  }

  /**
   * Deletes the edge's svg elements.
   * @param {Object} edgeData Edge data.
   */
  deleteEdgeSvg(edgeData) {
    this.svgGroup
      .select(".edges")
      .selectAll("g")
      .filter(function (ed) {
        return ed.id == edgeData.id;
      })
      .remove();
  }

  /**
   * Deletes the @param edgeData from graph's collection of edges' data.
   * @param {Object} edgeData Edge data.
   */
  deleteEdgeData(edgeData) {
    this.edgesData.splice(this.edgesData.indexOf(edgeData), 1);
  }

  /**
   * Selects the edge.
   * @param {SVGElement} edgeGroup A svg <g> representing the edge.
   */
  selectEdge(edgeGroup) {
    this.removeSelectionFromState();

    //edgeGroup.datum() == data binded with element
    if (this.graphState.selectedEdge != edgeGroup.datum()) {
      this.removeSelectionFromEdge();
      this.graphState.selectedEdge = edgeGroup.datum();
      SELECTED_ELEM_GROUP = edgeGroup;
      edgeGroup.classed(GraphMode.CONSTS.selected, true);
    }
  }

  /**
   * Deselects the currently selected edge.
   */
  removeSelectionFromEdge() {
    if (this.graphState.selectedEdge == null) {
      return;
    }
    var g = this;
    this.edgeGroups
      .filter(function (d) {
        return d.id === g.graphState.selectedEdge.id;
      })
      .classed(GraphMode.CONSTS.selected, false);
    this.graphState.selectedEdge = null;
  }

  /**
   * Updates the graph d3 selection of edge svg groups.
   */
  updateEdgeGroups() {
    this.edgeGroups = this.svgGroup.select(".edges").selectAll("g");
  }

  /* ------------------------------ repostion utils ------------------------------ */

  /**
   * Updates the edge's arrow marker position and angle.
   * @param {SVGElement} edgeGroup A svg <g> representing the edge.
   */
  repositionMarker(edgeGroup) {
    let path = edgeGroup.select("." + GraphMode.CONSTS.edgePath);
    let distance = GraphMode.CONSTS.nodeRadius + 11;

    let pathLength = path.node().getTotalLength();
    let pathPoint = path.node().getPointAtLength(pathLength - distance);
    let pathPoint2 = path.node().getPointAtLength(pathLength - distance - 0.01);

    edgeGroup
      .select("." + GraphMode.CONSTS.edgeMarker)
      .attr("d", `M ${pathPoint2.x} ${pathPoint2.y} L ${pathPoint.x} ${pathPoint.y}`);
  }

  /**
   * Repositions the arrow marking the initial state to the state @param stateData .
   * @param {Object} stateData State data.
   * @param {Number} angle     Angle of the arrow.
   */
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

  /**
   * Finds placement for new state created in Table mode.
   * @param {Object} newStateData 
   * @returns {Object} Modified state data.
   */
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
      x += GraphMode.CONSTS.nodeRadius * mult;
      if (x > this.graphDiv.lastWidth - transform.x) {
        x = baseX; // posunutie x na zaciatok riadku
        y += GraphMode.CONSTS.nodeRadius * mult; //posunutie dolu
      }
      if (y + GraphMode.CONSTS.nodeRadius + 100 > this.graphDiv.lastHeight) {
        this.graphDiv.style.height = y + GraphMode.CONSTS.nodeRadius + 100;

      }

      newStateData.x = x;
      newStateData.y = y;
    }
    newStateData.isNew = false;
    return newStateData;
  }

  /**
   * Finds out if state has a valid position in graph or if it intersects with any other state.
   * @param   {Object} state State data.
   * @returns {Boolean}      True if state's position is invalid, false otherwise.
   */
  invalidStatePosition(state) {
    for (var i = 0, j = this.statesData.length; i < j; i++) {
      const d = this.statesData[i];
      if (state.id == d.id) {
        continue;
      }
      if ((Math.abs(d.x - state.x) < GraphMode.CONSTS.nodeRadius * 2)
        && (Math.abs(d.y - state.y) < GraphMode.CONSTS.nodeRadius * 2)) {
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

  /**
   * Constants of TableMode.
   */
  static get CONSTS() {
    return {
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
      controlButton: "control-button",
      STATE_INDEX: 2,
      MIN_CELL_WIDTH: "50px",
    };
  }

  initialise() {
    this.createTableDiv();
    this.createSyntaxHint();
    this.createEmptyTable();
    this.createErrorAlert();
  }

  /**
   * Creates the div element where table will be placed.
   */
  createTableDiv() {
    this.tableDiv = document.createElement("div");
    this.tableDiv.setAttribute("class", "tableDiv");
  }

  /**
   * Cretaes elements for syntax hint.
   */
  createSyntaxHint() {
    var syntaxButton = HtmlUtils.createButton(syntaxLabel, "hintButton");
    syntaxButton.style.marginBottom = "7px";
    $(syntaxButton).prop("title", syntaxTitle);
    var syntaxContentDiv = this.initHintContent(tableSyntaxHints);

    syntaxButton.addEventListener("click", () => this.clickHintButton(syntaxContentDiv));
    HtmlUtils.appendChildren(this.tableDiv, [syntaxButton, syntaxContentDiv]);
  }

  /**
 * Cretaes the error alert.
 */
  createErrorAlert() {
    var alertP = document.createElement("p");
    alertP.setAttribute("class", "alert alert-danger");

    this.tableDiv.appendChild(alertP);
    HtmlUtils.hideElem(alertP);
    this.alertText = alertP;
  }

  /**
   * Creates new table from states and transitions.
   */
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

  /**
   * Creates an empty table.
   * @returns {HTMLElement} Table.
   */
  createEmptyTable() {
    var table = document.createElement("table");
    table.setAttribute("class", TableMode.CONSTS.myTable);
    table.style.width = "0";

    this.selectedCellInput = null;
    this.selectedInitDiv = null;
    this.table = table;
    this.tableDiv.appendChild(table);
    this.locked = false;

    return table;
  }

  /**
   * Inserts a pair of arrow buttons (init/accept) to the left of a state name.
   * @param {HTMLElement} row 
   * @param {Number} index 
   * @returns {HTMLElement} A table cell containing the arrow buttons.
   */
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

  /**
   * Inserts column add button into the table.
   * @param {HTMLElement} row 
   */
  insertColumnAddButton(row) {
    var cell = this.insertCellWithDiv(row, null, [TableMode.CONSTS.addButton, TableMode.CONSTS.noselectCell], null, addSymbol);
    if (!jeProhlizeciStranka_new()) {
      $(cell).prop("title", tableAddSymbolHover);
      cell.addEventListener("click", () => this.insertColumn());
    }
  }

  /**
   * Inserts delete button for column into the table.
   * @param {HTMLElement} row 
   */
  insertColumnDeleteButton(row) {
    var cell = this.insertCellWithDiv(row, null,
      [TableMode.CONSTS.deleteButton, TableMode.CONSTS.noselectCell], null, delSymbol);


    if (!jeProhlizeciStranka_new()) {
      $(cell).prop("title", tableDelSymbolHover);
      cell.addEventListener("click", () => this.deleteColumn(cell.cellIndex));
    }
  }

  /**
   * Inserts row add button into the table.
   */
  insertRowAddButton() {
    var newRow = this.table.insertRow(this.table.rows.length);
    var cell = this.insertCellWithDiv(newRow, 0, [TableMode.CONSTS.addButton, TableMode.CONSTS.noselectCell], null, addSymbol);

    if (!jeProhlizeciStranka_new()) {
      $(cell).prop("title", tableAddRowHover);
      cell.addEventListener("click", () => this.insertRow());
    }
  }

  /**
   * Inserts delete button for row into the table.
   * @param {HTMLElement} row 
   */
  insertRowDeleteButton(row) {
    var cell = this.insertCellWithDiv(row, 0,
      [TableMode.CONSTS.deleteButton, TableMode.CONSTS.noselectCell], null, delSymbol);

    if (!jeProhlizeciStranka_new()) {
      $(cell).prop("title", tableDelRowHover);
      cell.addEventListener("click", () => this.deleteRow(cell.parentNode.rowIndex));
    }
  }

  /**
   * Inserts an empty inner cell - a result of the transition function - into the table.
   * @param {HTMLElement} row 
   */
  insertInnerCell(row) {
    var cell = this.insertCell(row, row.cells.length, [TableMode.CONSTS.myCell]);
    var value = EditorUtils.typeIsNondeterministic(this.getEditor().type) ? "{}" : "";
    var input = this.createInput([TableMode.CONSTS.inputCellDiv], value,
      this.table.rows[1].cells[cell.cellIndex].style.minWidth);

    $(input).on("input", () => this.innerCellOnInput(input));
    $(input).focusout(() => this.innerCellOnFocusout(input));
    $(input).keypress((e) => this.cellKeypressHandler(e));

    cell.myDiv = input;
    cell.appendChild(input);
  }

  /**
   * Inserts a row header cell - state name - into the table.
   * @param {HTMLElement} row 
   * @param {String} name 
   * @param {Number} width 
   * @returns 
   */
  insertRowHeader(row, name, width) {
    var cell = this.insertCell(row, row.cells.length, ["row-header-cell"], width);
    var input = this.createInput([TableMode.CONSTS.inputCellDiv, TableMode.CONSTS.rowHeader], name, width);
    input.defaultClass = TableMode.CONSTS.rowHeader;

    $(input).on("input", (e) => this.rowHeaderOnInput(e));
    $(input).focusout(() => this.rowHeaderOnFocusout(input));
    $(input).keypress((e) => this.cellKeypressHandler(e));

    cell.myDiv = input;
    cell.appendChild(input);
    return cell;
  }

  /**
   * Inserts a culumn header cell - input symbol - into the table.
   * @param {HTMLElement} row 
   * @param {String} symbol 
   * @param {Number} width 
   */
  insertColumnHeader(row, symbol, width) {
    var cell = this.insertCell(row, row.cells.length, [TableMode.CONSTS.columnHeader], width);
    var input = this.createInput([TableMode.CONSTS.inputColumnHeaderDiv, TableMode.CONSTS.inputCellDiv], symbol, width);
    cell.myDiv = input;
    this.addResizable(cell);
    cell.appendChild(input);

    $(input).on("input", () => this.columnHeaderOnInput(input));
    $(input).focusout(() => this.columnHeaderOnFocusout(input));
    $(input).keypress((e) => this.cellKeypressHandler(e));
  }

  /**
   * Inserts a new row to the table.
   * @param {String} title State name.
   */
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
    this.table.rows[this.table.rows.length - 1].deleteCell(0);
    this.insertRowDeleteButton(this.table.rows[this.table.rows.length - 1]);
    this.insertArrows(this.table.rows[this.table.rows.length - 1], 1);
    this.insertRowHeader(this.table.rows[this.table.rows.length - 1], title, this.table.rows[1].cells[TableMode.CONSTS.STATE_INDEX].style.width);

    for (let i = TableMode.CONSTS.STATE_INDEX + 1, j = this.table.rows[0].cells.length - 1; i < j; i++) {
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

  /**
   * Inserts a new column to the table with the appropriate input symbol.
   * @param {String} symb Input symbol. If null, next one in alphabet 
   *                      that is not present in table will be generated.
   */
  insertColumn(symb = null) {
    if (this.locked) {
      return;
    }
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

  /**
  * Deletes table row with index.
  * @param {Number} index 
  */
  deleteRow(index) {
    if (this.locked) return;

    var stateId = this.table.rows[index].cells[TableMode.CONSTS.STATE_INDEX].myDiv.value;
    this.table.states.splice(this.table.states.indexOf(stateId), 1);

    var editor = this.getEditor();
    //delete state in graph (& from data)
    var data = this.getStateDataById(stateId);
    editor.Graph.deleteState(data);

    for (let i = TableMode.CONSTS.STATE_INDEX, rows = this.table.rows.length - 1; i < rows; i++) {
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
    this.table.deleteRow(index);
  }

  /**
   * Deletes table column with index.
   * @param {Number} index 
   */
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

  /**
   * Handles clicks on @param initDiv - selecting/deselecting state as initial.
   * @param {HTMLelement} initDiv Div housing the ← arrow symbol next to state name in table.
   */
  setInitDiv(initDiv) {
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
    var stateId = this.table.rows[initDiv.parentNode.parentNode.rowIndex].cells[TableMode.CONSTS.STATE_INDEX].myDiv.value;
    var data = this.getStateDataById(stateId);
    this.getEditor().Graph.setNewStateAsInitial(data);
  }

  /**
   * Deselects the div housing the → arrow symbol.
   */
  unselectInitDiv() {
    $(this.selectedInitDiv).removeClass("selected-arrow");
    this.selectedInitDiv = null;
  }

  /**
   * Toggles state as accepting/not accepting.
   * @param {HTMLElement} acceptDiv Div housing the ← arrow symbol next to state name in table.
   */
  toggleAccArrow(acceptDiv) {
    $(acceptDiv).toggleClass("selected-arrow");

    var stateId = this.table.rows[acceptDiv.parentNode.parentNode.rowIndex].cells[TableMode.CONSTS.STATE_INDEX].myDiv.value;

    //edit state in graph
    this.getEditor().Graph.toggleAcceptingState(this.getStateDataById(stateId));
  }

  /**
   * Adds jQuery resizable handles for resizing columns'.
   * @param {HTMLElement}  cell  HTML td element - a table cell.
   */
  addResizable(cell) {
    var table = this.table;
    $(cell).resizable({
      handles: 'e',
      resize: function () {
        var minSize = TableMode.CONSTS.MIN_CELL_WIDTH.substring(0, 2);
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
    cell.style.minWidth = TableMode.CONSTS.MIN_CELL_WIDTH;
  }

  /**
   * Sets width of all inner cells - transition function results.
   * @param {Number} width 
   */
  setInnerCellSizes(width) {
    for (var i = 1, rows = this.table.rows.length - 1; i < rows; i++) {
      for (var j = 3, cols = this.table.rows[i].cells.length; j < cols; j++) {
        this.table.rows[i].cells[j].style.width = width;
        this.table.rows[i].cells[j].myDiv.style.width = width;
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

  /**
   * Inserts a new cell into table.
   * @param {HTMLElement} row
   * @param {Number} index Index in row where to insert the cell.
   * @param {Array<String>} classlist Array of classes for input to have.
   * @param {Number} width 
   * @returns 
   */
  insertCell(row, index, classlist, width = null) {
    var cell = row.insertCell(index);
    classlist.forEach(c => {
      $(cell).addClass(c);
    });

    if (width != null) {
      cell.style.width = width;
      cell.style.minWidth = TableMode.CONSTS.MIN_CELL_WIDTH;
    }
    return cell;
  }

  /**
   * Creates a new input element.
   * @param {Array<String>} classlist Array of classes for input to have.
   * @param {String} value Default value of the input.
   * @param {Number} width
   * @returns 
   */
  createInput(classlist, value, width = TableMode.CONSTS.MIN_CELL_WIDTH) {
    var input = document.createElement("input");
    input.value = input.prevValue = value;

    if (width != null) {
      input.style.minWidth = TableMode.CONSTS.MIN_CELL_WIDTH;
      input.style.width = width;
    }
    input.style.margin = "0em";
    classlist.forEach(c => {
      $(input).addClass(c);
    });
    return input;
  }

  /**
   * Inserts a new cell containing a div into @param row.
   * @param {HTMLElement} row 
   * @param {Number} index Index in row where to insert the cell.
   * @param {Array<String>} cellClasslist Array of classes for the cell.
   * @param {Array<String>} divClasslist Array of classes for the div.
   * @param {String} innerHtml Default value for the cell.
   * @returns {HTMLElement} The new cell.
   */
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

  /**
   * Inserts a new cell into row.
   * @param {HTMLElement} row 
   * @param {Number} index Index where to insert the cell.
   * @returns The new cell.
   */
  insertInactiveCell(row, index) {
    var classes = [
      TableMode.CONSTS.myCell,
      TableMode.CONSTS.inactiveCell,
      TableMode.CONSTS.noselectCell
    ];
    return this.insertCellWithDiv(row, index, classes, []);
  }


  /* ------------------------------ Table utils ------------------------------ */
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
      if (i != ri && stateName == this.table.rows[i].cells[TableMode.CONSTS.STATE_INDEX].myDiv.value) {
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
   * Resets all incorrect cells to their previous correct value and unblocks the table.
   */
  rollback() {
    this.incorrectInputs.forEach(input => {
      input.value = input.prevValue;
      $(input).removeClass(TableMode.CONSTS.incorrectCell);
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
    $(input).addClass(TableMode.CONSTS.incorrectCell);
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
    $(input).removeClass(TableMode.CONSTS.incorrectCell);
    this.incorrectInputs.delete(input);
    if (this.locked) {
      this.unlockTable();
      HtmlUtils.hideElem(this.alertText);
    }
  }

  /* ------------------------------ Table event handlers ------------------------------ */
  /**
   * Handles table inner cell - result of transition function - on input change.
   * @param {HTMLElement} input HTML input element containing a result of transition function.
   */
  innerCellOnInput(input) {
    if (TableSyntax.incorrectInnerCell(this.getEditor().type, input.value)) {
      this.setIncorrectInput(errors.innerCellIncorrectSyntaxBase + " ", input);
    }
    else {
      this.unblockInput(input);
    }
  }

  /**
   * Handles table inner cell - result of transition function - on focuout.
   * @param {HTMLElement} input HTML input element containing a result of transition function.
   */
  innerCellOnFocusout(input) {
    var editor = this.getEditor();
    var type = editor.type;

    if (TableSyntax.incorrectInnerCell(type, input.value)) {
      this.setIncorrectInput(errors.innerCellIncorrectSyntaxBase + " ", input);
    }
    else {
      var prevName = input.prevValue;
      var newName = input.value;
      if (EditorUtils.typeIsNondeterministic(type)) { // odstranenie {}
        prevName = prevName.substring(1, prevName.length - 1);
        newName = newName.substring(1, newName.length - 1);
      }
      var sourceStateId = this.table.rows[input.parentNode.parentNode.rowIndex].cells[TableMode.CONSTS.STATE_INDEX].myDiv.value;
      var symbol = this.table.rows[1].cells[input.parentNode.cellIndex].myDiv.prevValue;
      var prevStates = prevName.split(",");
      var newStates = newName.split(",");
      newStates = ArrayUtils.removeDuplicates(newStates);

      //deletes the input symbol from any transitions, or whole transitions if they contained only one symbol
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
        //if the cell already contained this state
        if (prevStates.indexOf(newStates[i]) != -1) continue;

        //if the state doesn't exist in graph
        if (this.getStateDataById(newStates[i]) == null) {
          var addRowBool = true;
          for (var j = 2, rows = this.table.rows.length - 1; j < rows; j++) { //skontrolovanie, ze sa nazov tohto stavu nenachadza v inom riadku tabulky
            if (this.table.rows[j].cells[TableMode.CONSTS.STATE_INDEX].myDiv.value == newStates[i]) {
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
      var val = newStates.toString();
      if (EditorUtils.typeIsNondeterministic(type)) {
        val = "{" + val + "}";
      }
      input.value = input.prevValue = val;
    }
  }

  /**
   * Handles table column header - input symbol - cell on input change.
   * @param {HTMLElement} input HTML input element containing an input symbol.
   */
  columnHeaderOnInput(input) {
    if (input.value == "\\e") {
      input.value = epsSymbol;
    }
    if (TableSyntax.incorrectColumnHeader(this.getEditor().type, input.value)) {
      this.setIncorrectInput(errors.incorrectTransitionSymbol, input);
    }
    else if (this.tableColumnSymbolAlreadyExists(input, input.value)) {
      this.setIncorrectInput(errors.duplicitTransitionSymbol, input);
    }
    else {
      this.unblockInput(input);
    }
  }

  /**
   * Handles column header - input symbol - cell on focusout.
   * @param {HTMLElement} input HTML input element containing an input symbol.
   */
  columnHeaderOnFocusout(input) {
    if ($(input).hasClass(TableMode.CONSTS.incorrectCell) || this.locked) {
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

  /**
   * Handles row header - state name - on input change.
   * @param {Event} e 
   */
  rowHeaderOnInput(e) {
    var input = e.target;

    if (EditorSyntax.incorrectStateSyntax(input.value)) {
      this.setIncorrectInput(errors.incorrectStateSyntax, input);
    }
    else if (this.tableStateAlreadyExists(input, input.value)) {
      this.setIncorrectInput(errors.duplicitState, input);
    }
    else {
      this.unblockInput(input);
    }
  }

  /**
   * Handles row header - state name - cell on focusout.
   * @param {HTMLElement} input Input with state name.
   */
  rowHeaderOnFocusout(input) {
    if ($(input).hasClass(TableMode.CONSTS.incorrectCell) == false && !this.locked) {
      if (input.prevValue == input.value) return;

      var prevName = input.prevValue;
      var newName = input.value;

      this.table.states.splice(this.table.states.indexOf(prevName), 1);
      this.table.states.push(newName);

      var editor = this.getEditor();
      //update state in graph
      editor.Graph.renameState(this.getStateDataById(prevName), newName);

      //traverse all transitions cells in table and change the name
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

  /**
   * Handles keypress events. Prevents form submission on ENTER.
   * @param {KeyEvent} event 
   */
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

  /**
   * Sets textArea's value to @param val.
   * @param {String} val 
   */
  updateValue(val) {
    this.textArea.innerText = val;
    $(this.textArea).trigger("change");
  }

  updateGraphFromText() {
    let value = this.textArea.innerText;


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

  /**
   * Adds syntax checking for editor's textarea.
   */
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

    //call the funtion registerElem which links parser function to textarea
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
 * Editor for finite automata. Consists of Graph, Table and Text modes.
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

  /**
   * Constants used by AutomataEditor.
   */
  static get CONSTS() {
    return {
      MENU_BUTTON: "menu-button",
      CONTEXT_MENU: "context-menu"
    };
  }

  /**
   * Creates all elements of editor.
   */
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
    var graphButton = HtmlUtils.createButton(graphMenuButton, AutomataEditor.CONSTS.MENU_BUTTON);
    graphButton.addEventListener("click", () => this.showGraphMode());

    var textButton = HtmlUtils.createButton(textMenuButton, AutomataEditor.CONSTS.MENU_BUTTON);
    textButton.addEventListener("click", () => this.showTextMode());

    var tableButton = HtmlUtils.createButton(tableMenuButton, AutomataEditor.CONSTS.MENU_BUTTON);
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
    HtmlUtils.hideElem(this.Graph.hintDiv);
    HtmlUtils.hideElem(this.Graph.graphDiv);
    HtmlUtils.hideElem(this.Text.textDiv);

    this.Table.createTableFromData();
    HtmlUtils.showElem(this.Table.tableDiv);
    this.lastEdited = "table";
  }

  /**
   * Creates a new state in graph mode.
   * @param {Object} stateData 
   */
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
    result += " #";
    result += "states";
    this.statesData.forEach(function (d) {
      result += "@" + d.id
        + ";" + d.x.toFixed(2)
        + ";" + d.y.toFixed(2);

    });
    result += " edges";
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
    result += `@t:${t.k.toFixed(3)};${t.x.toFixed(3)};${t.y.toFixed(3)}`;
    return result;
  }

  /**
   * @returns {Boolean} True if there are no states or transitions.
   */
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
    else if (EditorSyntax.incorrectStateSyntax(newId)) {
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

    if (sourceStateData == null || typeof sourceStateData == undefined) {
      err = "invalid source state";
    }
    else if (symbols == null || symbols == "") {
      err = errors.emptyTransition;
    }
    else if (GraphSyntax.incorrectTransition(this.type, symbols)) {
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
 * Creates an editor based on question's type.
 * @param {HTMLElement} div       HTML div element where the editor will be placed.
 * @param {HTMLElement} textArea  HTML textarea element (created automatically by IS).
 */
function createEditor(id, textArea) {
  var div = document.createElement("div");
  div.setAttribute("id", id);
  div.setAttribute("class", "editor-content");
  
  textArea.parentNode.insertBefore(div, textArea.nextSibling);

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
 * if a state or edge is selected and we interact with something 
 * that's not a part of the editor, we deselect the editor
 */
$(document).on('click touchstart input drag contextmenu', (e) => {
  if (SELECTED_ELEM_GROUP == null || jeProhlizeciStranka_new()) {
    return;
  }
  var graph = SELECTED_ELEM_GROUP.node().parentGraph;
  if (!graph.getEditor().div.contains(e.target)) {
    EditorManager.deselectAll();
    SELECTED_ELEM_GROUP = null;
  }
});

/**
 * Handles editor's key up events.
 * @param {KeyboardEvent} event
 */
function windowKeyUp(event) {
  //SELECTED_ELEM_GROUP is either null, or a d3 selection - stateGroup or an edgeGroup
  //when renaming a state or edge, that stateGroup/edgeGroup has a class "activeRenaming"
  if (SELECTED_ELEM_GROUP == null || jeProhlizeciStranka_new()) {
    return;
  }
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
    //when renaming a state/an edge allow deleting
    if (SELECTED_ELEM_GROUP.classed("activeRenaming")) {
      return;
    }
    //when typing into an element that is not a part of the editor
    if ((event.target.type == "textarea" || event.target.type == "input") && !g.graphDiv.contains(event.target)) {
      EditorManager.deselectAll();
      return;
    }
    // if selected element is state
    if (SELECTED_ELEM_GROUP.node().classList.contains(GraphMode.CONSTS.stateElem)) {
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


/* ------------------------------ Utils ------------------------------ */

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
  /**
   * Sets value of input housing state name.
   * @param {HTMLElement} input 
   * @param {String}      value 
   */
  static setInputValue(input, value) {
    input.realValue = value;
    var cropped = StateUtils.getCroppedTitle(input.realValue);
    input.setAttribute("value", cropped);
    input.value = cropped;
  }

  /**
   * Cropps state name so it fits into state circle.
   * @param   {String} name State name.
   * @returns {String}      Cropped state name.
   */
  static getCroppedTitle(name) {
    var shortened = false;
    var padding = 10;

    while (HtmlUtils.visualLength(name) >= (GraphMode.CONSTS.nodeRadius * 2) - padding) {
      name = name.substring(0, name.length - 1); //orezanie o 1 pismenko
      shortened = true;
    }
    if (shortened) {
      name = name.substring(0, name.length - 1).concat("..");
    }
    return name;
  }

  /**
   * Shows rectangle housing the full name of a state and sets its position.
   * @param {SVGElement} invisibleRect Svg rectangle.
   * @param {Obejct} d State data.
   */
  static showFullName(invisibleRect, d) {
    StateUtils.toggleFullNameVisibitity(invisibleRect, true);
    invisibleRect.FullnameText.text(d.id);
    var w = invisibleRect.FullnameText.node().getComputedTextLength() + 8;
    invisibleRect.attr("width", w);
    invisibleRect.FullnameText
      .attr("x", d.x - w / 2 + 3.5)
      .attr("y", d.y + GraphMode.CONSTS.nodeRadius + 19.5);
    invisibleRect
      .attr("x", d.x - w / 2)
      .attr("y", d.y + (GraphMode.CONSTS.nodeRadius + 2));
  }

  /**
   * Toggles visibility of the rectangle housing the full name of a state shown
   * when it is too long to fit in the state's circle.
   */
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
  /**
   * Sets the value of a input.
   * @param {HTMLElement} input 
   * @param {String} value 
   */
  static setInputValue(input, value) {
    input.setAttribute("value", value);
    input.value = value;
  }

  /**
   * Sets the width of a input.
   * @param {HTMLElement} input 
   * @param {Number} len 
   */
  static setInputWidth(input, len = null) {
    if (len == null) {
      len = HtmlUtils.visualLength(input.value);
      len += 0; //padding
    }
    if (len < 15) len = 15;

    d3.select(input.parentNode).attr("width", len + 8);
    input.style.width = (len) + "px";
  }

  /**
   * Finds position for input based on the "peak" of the edge.
   * @param {String} pathDefinitinAttribute 
   * @param {Boolean} isSelfloop 
   * @returns {Object} { tx: number, ty: number }
   */
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

  /**
   * Shortens a number into 2 decimal digits and returns it as string.
   * @param {Number} num 
   * @returns {String}
   */
  static shorten(num) {
    if (num == 0) {
      return "";
    }
    return num.toFixed(2);
  }

  /**
   * Verifies that edge path data are valid and sets them to default values if not.
   * @param {Object} data Edge data.
   * @returns {Object} Edge data.
   */
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

  /**
   * Hides the edge.
   * @param {Object} edgeG edge (svg group)
   */
  static hide(edgeG) {
    edgeG.select("." + GraphMode.CONSTS.edgePath).classed("hidden", true);
    edgeG.select("." + GraphMode.CONSTS.edgeMarker).classed("hidden", true);
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
    return EdgeUtils.calculateSelfloop(x1, y1, EdgeUtils.calculateAngle(x1, y1, x2, y2));
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

  static calculateSelfloop(x, y, angle) {
    return `M ${x} ${y} C ${MathUtils.cubicControlPoints(x, y, angle)} ${x} ${y}`;
  }

  /**
   * Repositions edge input into the middle of edge curve.
   * @param {d3 selection} edge 
   */
  static updateInputPosition(edge) {
    edge
      .each(function (ed) {
        var fo = d3.select(this).select("foreignObject");
        var dAttr = d3.select(this).select("." + GraphMode.CONSTS.edgePath).attr("d");
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

/**
 * Math helper functions.
 */
class MathUtils {
  /**
   * Calculates a middle between two numbers.
   * @param {Number} a 
   * @param {Number} b 
   * @returns {Number} Result.
   */
  static midpoint(a, b) {
    return (a + b) / 2;
  }

  /**
   * Calculates distance between two points - [x1,y1] and [x2,y2].
   * @param {Number} x1 
   * @param {Number} y1 
   * @param {Number} x2 
   * @param {Number} y2
   * @returns {Number} Distance.
   */
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
 * Helper functions for editor.
 */
class EditorUtils {
  /**
   * Finds the longest string in array.
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

  /**
   * Generates new unique ID for editor.
   * @param   {String} type 
   * @returns {String} ID.
   */
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

  static getInitialStateFromText(answer) {
    let matches = answer.match(new RegExp(`init=${EditorSyntax.elems.stateId}`));
    if (matches) {
      return matches[0].substring(5);
    }
    //finds the first state in transition function
    matches = answer.match(new RegExp(`\\(${EditorSyntax.elems.stateId}`));
    if (matches) {
      return matches[0].substring(1);
    }
    return null;
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


/* ------------------------------ Syntax ------------------------------ */

/**
 * Represents basic syntax rules for editor.
 */
class EditorSyntax {
  static get elems() {
    return {
      stateId: `[a-zA-Z0-9]+`,
      QUOT_SEQ: "\"[^\\s\"]+\"",
      //  \"[^\\s\"]+\"  - defines any non-empty sequence of symbols that are not white-space or "", 
      //                   enclosed in ""; e.g. "aaa" or "79878"
      inputSymbol: `([a-zA-Z0-9])|(\"[^\\s\"]+\")`,
      inputSymbol_EFA: `([a-zA-Z0-9])|(\"[^\\s\"]+\")|(ε)|(\\e)`,
    };
  }

  /**
  * Syntax of automaton's state names.
  * @return {RegExp} Regular expression.
  */
  static stateSyntax() {
    return new RegExp(`^${EditorSyntax.elems.stateId}$`);
  }

  /**
   * Decides if value is incorrect state name.
   * @param   {string}  value State name to check.
   * @return  {boolean}       True if value is incorrect state name, false otherwise.
   */
  static incorrectStateSyntax(value) {
    return !this.stateSyntax().test(value);
  }
}

/**
 * Class that defines syntax of elements in Graph mode and contains functions for syntax checking.
 */
class GraphSyntax extends EditorSyntax {
  /**
   * Syntax of DFA and NFA transitions (allows more input symbols divided by commas).
   * @return {RegExp} Regular expression.
   */
  static transition() {
    return new RegExp(`^(${this.elems.inputSymbol})(,(${this.elems.inputSymbol}))*$`);
  }

  /**
   * Syntax of EFA transitions (allows more input symbols divided by commas).
   * @return {RegExp} Regular expression.
   */
  static transition_EFA() {
    return new RegExp(`^(${this.elems.inputSymbol_EFA})(,(${this.elems.inputSymbol_EFA}))*$`);
  }

  /**
   * Checks if syntax of transition is incorrect.
   * @param   {String}  type  Editor's type {DFA, NFA, EFA}.
   * @param   {String}  value Input symbol(s).
   * @returns {Boolean}       True if syntax is incorrect, false otherwise.
   */
  static incorrectTransition(type, value) {
    return ((type == "DFA" || type == "NFA") && !this.transition().test(value)) ||
      (type == "EFA" && !this.transition_EFA().test(value));
  }
}

/**
 * Class that defines syntax of elements in Table mode and contains functions for syntax checking.
 */
class TableSyntax extends EditorSyntax {
  /**
   * Syntax of one input symbol - table column header (DFA and NFA).
   * @returns {RegExp} Regular expression.
   */
  static transition() {
    return new RegExp(`^(${this.elems.inputSymbol})$`);
  }

  /**
   * Syntax of  table column header - one input symbol - (EFA).
   * @returns {RegExp} Regular expression.
   */
  static transition_EFA() {
    return new RegExp(`^(${this.elems.inputSymbol_EFA})$`);
  }

  /**
   * Syntax of a result of transition function (= one state name).
   * @returns {RegExp} Regular expression.
   */
  static innerCell_DFA() {
    return new RegExp(`^$|^${this.elems.stateId}$`);
  }

  /**
   * Syntax of result of transition function (= set of state names).
   * @returns {RegExp} Regular expression.
   */
  static innerCell_Nondeterm() {
    return new RegExp(`^{}$|^{${this.elems.stateId}(,${this.elems.stateId})*}$`);
  }

  /**
   * Checks if syntax of table inner cell - result of transition function - is incorrect.
   * @param   {String}  type  Editor's type {DFA, NFA, EFA}.
   * @param   {String}  value 
   * @returns {Boolean}       True if syntax is incorrect, false otherwise.
   */
  static incorrectInnerCell(type, value) {
    return (type == "DFA" && !this.innerCell_DFA().test(value)) ||
      (EditorUtils.typeIsNondeterministic(type) && !this.innerCell_Nondeterm().test(value));
  }

  /**
   * Checks if syntax of table column header - one input symbol - is incorrect.
   * @param   {String}  type  Editor's type {DFA, NFA, EFA}.
   * @param   {String}  value Input symbol.
   * @returns {Boolean}       True if syntax is incorrect, false otherwise.
   */
  static incorrectColumnHeader(type, value) {
    return ((type == "DFA" || type == "NFA") && !this.transition().test(value)) || (
      type == "EFA" && !this.transition_EFA().test(value));
  }
}


/* ------------------------------ IS MUNI helper functions ------------------------------ */

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

    var result = func(input.value, document.documentElement.lang.toLowerCase() !== "cs");
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