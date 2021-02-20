function isRegOrGram(type) {
    //TODO !!!

    return type == "GRA" || type == "REG";
}

/* ------------------------------ HTML elements utils ------------------------------ */

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

function hideAllContextMenus(questionDiv) {
    hideElem(questionDiv.graphDiv.stateContextMenuDiv);
    hideElem(questionDiv.graphDiv.edgeContextMenuDiv);
    hideElem(questionDiv.graphDiv.addStateContextMenu);
}

function clickGraph(questionDiv) {
    hideElem(questionDiv.textArea);
    //hideElem(questionDiv.errDiv);
    hideElem(questionDiv.tableDiv);

    showElem(questionDiv.graphDiv);
    showElem(questionDiv.hintDiv);
    if (!jeProhlizeciStranka_new()) {
        deselectAll();
    }
    questionDiv.lastEdited = "graph"
}

function clickTable(questionDiv) {
    if (!jeProhlizeciStranka_new()) deselectAll();

    if (questionDiv.lastEdited == "table") {
        return;
    }
    if (questionDiv.lastEdited == "graph") {
        updateSvgDimensions(questionDiv);
        
    }
    /*
    if (questionDiv.lastEdited == "text") {
      updateDataFromText(questionDiv);
    } */

    hideElem(questionDiv.graphDiv);
    hideElem(questionDiv.hintDiv);
    hideElem(questionDiv.textArea);

    //TODO delete
    hideElem(questionDiv.tableDiv.buttonInit);
    hideElem(questionDiv.tableDiv.buttonAcc);
    //hideElem(questionDiv.errDiv);

    //disableControlButtons(questionDiv.tableDiv);
    createTableFromData(questionDiv);
    showElem(questionDiv.tableDiv);
    questionDiv.lastEdited = "table";
}

function clickText(questionDiv) {
    if (!jeProhlizeciStranka_new()) deselectAll();

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
    b.style.minHeight = "36px"
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

function createTableControlButtons(questionDiv) {
    var button = createButton(tableInitialButtonName, tableClasses.controlButton + " secondary");
    button.addEventListener("click", () => tableInitialOnClick(questionDiv.tableDiv));
    questionDiv.tableDiv.appendChild(button);
    questionDiv.tableDiv.buttonInit = button;

    var button = createButton(tableAcceptingButtonName, tableClasses.controlButton);
    button.addEventListener("click", () => tableAcceptingOnClick(questionDiv.tableDiv));
    questionDiv.tableDiv.appendChild(button);
    questionDiv.tableDiv.buttonAcc = button;
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

function showRenameError(msg, questionDiv) {
    var p = questionDiv.graphDiv.renameError;
    p.innerHTML = msg;
    showElem(p);
}

function setRenameStyle(renameInput, isState = true) {
    if (isState) {
        $(renameInput).switchClass("edge-renaming", "state-renaming", 0);
    }
    else {
        $(renameInput).switchClass("state-renaming", "edge-renaming", 0);
    }
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
    edgeG.select("." + graphConsts.edgePathClass).classed("hidden", true);
    edgeG.select("." + graphConsts.edgeMarkerClass).classed("hidden", true);
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

    while (visualLength(title.concat("...")) >= (graphConsts.nodeRadius * 2) - 4) {
        title = title.substring(0, title.length - 1);
    }
    if (title != input.realValue) {
        title = title.concat("...");
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
    var valid = true;

    if (!newId) {
        err = errors.emptyState;
        valid = false;
    }

    else if (!stateIdIsUnique(questionDiv.statesData, stateData, newId)) {
        err = stateNameAlreadyExists;
        valid = false;
    }

    else if (incorrectStateSyntax(newId)) {
        err = errors.incorrectStateSyntax;
        valid = false;
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

    var x = 100;
    var y = 100;
    var mult = 5;

    while (invalidStatePosition(states, newStateData)) {
        x += graphConsts.nodeRadius * mult;
        if (x > questionDiv.graphDiv.lastWidth) {
            x = 100;
            y += graphConsts.nodeRadius * mult;
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

function typeIsNondeterministic(type) {
    return type == "NFA" || type == "EFA";
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
    svg.svgGroup.selectAll("." + graphConsts.stateGroupClass).call(dragState2);
    svg.svgGroup.selectAll("." + graphConsts.edgeGroupClass).on(".drag", null);
    svg.on(".zoom", null);
}

function enableAllDragging(svg) {
    if (!jeProhlizeciStranka_new()) {
        svg.svgGroup.selectAll("." + graphConsts.stateGroupClass).call(dragState);
        svg.svgGroup.selectAll("." + graphConsts.edgeGroupClass).call(dragEdge);
        svg.call(zoom).on("dblclick.zoom", null);
    }
}

function deselectAll(exceptionId = null) {
    var questions = document.querySelectorAll("." + QUESTION_DIV_CLASS);
    d3.selectAll(questions)
        .selectAll("." + GRAPH_DIV_CLASS)
        .each(function () {
            var graphDiv = d3.select(this).node();
            if (graphDiv.parentNode.getAttribute("id") != exceptionId) {

                //if current selected element is not in this graphDiv
                if (SELECTED_ELEM_GROUP && SELECTED_ELEM_GROUP.node().parentGraphDiv == graphDiv) {
                    SELECTED_ELEM_GROUP.select("input").node().blur();
                }

                graphDiv.graphState.currentState = graphStateEnum.default;
                graphDiv.graphState.lastTargetState = null;

                removeSelectionFromState(graphDiv);
                removeSelectionFromEdge(graphDiv);
                hideAllContextMenus(graphDiv.parentNode);
                hideElem(graphDiv.renameError);
                hideEdge(graphDiv.svg.svgGroup.temporaryEdgeG);

                graphDiv.svg.svgGroup.temporaryEdgeG.classed(graphConsts.selectedClass, false);
                enableAllDragging(graphDiv.svg);
            }
        });
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

//TODO - possibly delete
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

function getCoordinates(oldXy, svgGroup) {
    var transform = d3.zoomTransform(svgGroup.node());
    var newXy = transform.invert(oldXy);

    return {
        x: newXy[0],
        y: newXy[1],
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
var MIN_TABLE_CELL_WIDTH = "70px";

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
    addResizable(table, cell);

    // filling out columns' headers from symbols and delete buttons above them
    table.symbols.forEach(symb => {
        insertColumnDeleteButton(table, row1);
        insertColumnHeader(row2, symb);
    });
    insertColumnAddButton(table, row1);

    // filling out rows' headers (states' titles)
    //var prevRh;
    table.states.forEach(stateTitle => {
        var row = table.insertRow(table.rows.length);
        insertRowDeleteButton(table, row);

        var arrCell = insertArrows(table, row, row.cells.length);

        var rh = insertRowHeader(row, stateTitle);
        /*         if (prevRh && parseInt(prevRh.style.width)) {
        
                } */
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
        //prevRh = rh;

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
        });
    });

    questionDiv.tableDiv.removeChild(oldTable);
    questionDiv.tableDiv.removeChild(questionDiv.tableDiv.alertText);
    questionDiv.tableDiv.appendChild(questionDiv.tableDiv.alertText);

    if (jeProhlizeciStranka_new()) {
        $(table).find("input").prop("disabled", true).addClass("mydisabled");
    }
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

    var regex;

    //TODO?
    if (typeIsNondeterministic(table.questionDiv.type))
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
    var table = findParentWithClass(cell, tableClasses.myTable);
    var input = createInput([tableClasses.inputCellDiv, tableClasses.rowHeader],
        name, name, table.rows[1].cells[cell.cellIndex].style.minWidth);

    input.defaultClass = tableClasses.rowHeader; // whhy>?

    $(input).click(() => tableHeaderCellClick(table, input));
    $(input).on("input", (e) => tableRhChanged(e, table));
    $(input).focusout((e) => tableRhChangedFinal(e, table, input));
    $(input).keypress((e) => cellKeypressHandler(e, stateSyntax()));

    cell.myDiv = input;
    cell.appendChild(input);
    return cell;
}

function insertColumnHeader(row, symbol) {
    var cell = insertCell(row, row.cells.length, [ tableClasses.columnHeader ], MIN_TABLE_CELL_WIDTH);
    var table = findParentWithClass(cell, tableClasses.myTable);
    var input = createInput([tableClasses.inputColumnHeaderDiv, tableClasses.inputCellDiv], symbol, symbol, MIN_TABLE_CELL_WIDTH);

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
    if (title == null) {
        title = generateStateId(table.parentNode.parentNode);
    }
    deselectCell(table);
    table.rows[table.rows.length - 1].deleteCell(0);
    insertRowDeleteButton(table, table.rows[table.rows.length - 1]);
    insertArrows(table, table.rows[table.rows.length - 1], 1);
    insertRowHeader(table.rows[table.rows.length - 1], title);

    for (i = 3; i < table.rows[0].cells.length - 1; i++) {
        insertInnerCell(table, table.rows[table.rows.length - 1]);
    }
    insertRowAddButton(table);

    // create state in graph
    var data = newStateData(table.questionDiv, title, 100, 100, false, false, true);
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

/*
    table header cells (symbols of transition) on change
*/
function tableChChanged(e, table, input) {
    var value = input.value;
    var type = table.questionDiv.type;

    if (incorrectTableColumnHeaderSyntax(type, value)) {
        d3.select(input).classed(tableClasses.incorrectCell, true);
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
        d3.select(input).classed(tableClasses.incorrectCell, true);
        activateAlertMode(table, errors.duplicitTransitionSymbol, input);
    }
    else {
        d3.select(input).classed(tableClasses.incorrectCell, false);
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
        updateStateInitAcc(table.questionDiv, getStateDataById(table.questionDiv, newName), input.value[0]);

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

        //vymaze edges ktore uz nemaju pismenko
        //pripadne vymaze pismeno z transition
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
                    //v insertRow sa prida riadok do tabulky AJ sa vytvori stav v grafe!!
                    insertRow(table, newStates[i]);
                }
                else {
                    addState(questionDiv, newStateData(questionDiv, newStates[i], 100, 100, false, false, true));
                }
                addEdge(questionDiv, newEdgeData(questionDiv, sourceStateId, newStates[i], symbol), elementOrigin.fromTable);
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
                    addEdge(questionDiv, newEdgeData(questionDiv, sourceStateId, newStates[i], symbol), elementOrigin.fromTable);
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

function stateExistsInRow(table, row, state) {

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
    d3.select(questionDiv).selectAll("." + menuButtonClass).attr("disabled", val);
}

//TODO lock and unlock table into one function?
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


function updateStateInitAcc(questionDiv, stateData, sym) {
    var initial = false, accepting = false;

    if (sym == bothSymbol) {
        initial = accepting = true;
    }
    else if (sym == accSymbol) {
        initial = false;
        accepting = true;
    }
    else if (sym == initSymbol) {
        initial = true;
        accepting = false;
    }
    if (initial) {
        setNewStateAsInitial(questionDiv, stateData);
    }
    else {
        setInitStateAsNotInitial(questionDiv);
    }
    if (accepting != stateData.accepting) {
        toggleAcceptingState(questionDiv, stateData, getStateGroupById(questionDiv, stateData.id));
    }
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
        cell.style.minWidth = width;
    }
    return cell;
}

function createInput(classlist, value, prevValue, width = MIN_TABLE_CELL_WIDTH) {
    var input = document.createElement("input");
    input.value = value;
    input.prevValue = prevValue;
    if (width != null) {
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
    return insertCellWithDiv(row, index, classes,
        [
            // tableClasses.inactiveCell
        ]);
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

                //zmenenie sirky vsetkych cells v stlpci
                for (var i = 1; i < table.rows.length - 1; i++) {
                    var t = findParentWithClass(this, tableClasses.myTable);
                    t.rows[i].cells[ci].myDiv.style.width = this.style.width;
                }
            }
        },
    });
    cell.style.minWidth = MIN_TABLE_CELL_WIDTH;
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



/* -FUNCTION--------------------------------------------------------------------
	Author:			Radim Cebis, modified by Patricia Salajova
	Function:		register(id, func)
	Param elem:		element (textArea)
	Usage:			registers func to element with correct question ID
----------------------------------------------------------------------------- */ 	
function registerElem(id, func, elem)
{	
	// when we are in inspection mode, we do not want the syntax check to work
	if(jeProhlizeciStranka_new()) {
		if (document.getElementById(id + "-error"))
        	document.getElementById(id + "-error").setAttribute("hidden", '');
        return;
    }
	
	function test(evt)
	{		
		if (!evt) var evt = window.event;		
		var input = (evt.target) ? evt.target : evt.srcElement;
		
		var result = func(input.value);
		if(elem.value == "") 
	    {
	      document.getElementById(id + "-error").className = "alert alert-info";
		  document.getElementById(id + "-i").className = "";
	      document.getElementById(id + "-error-text").innerHTML = "Zde se zobrazuje nápověda syntaxe.";
	    }
		else
		{
	  		if(result.error_string != "")
	  			document.getElementById(id + "-error-text").innerHTML = htmlentities(result.error_string);
	  		else 
	  			document.getElementById(id + "-error-text").innerHTML = "Syntax je korektní.";
	  		
	  		if (result.error == 2) {
	  			document.getElementById(id + "-error").className = "alert alert-danger";
				document.getElementById(id + "-i").className = "glyphicon glyphicon-remove";
	  		}
	  		else if(result.error == 1){
	  			document.getElementById(id + "-error").className = "alert alert-warning";
				document.getElementById(id + "-i").className = "glyphicon glyphicon-warning-sign";
	  		}
	  		else {
	  			document.getElementById(id + "-error").className = "alert alert-success";
				document.getElementById(id + "-i").className = "glyphicon glyphicon-ok";
	  		}
		}
	}	
	addEvent(elem,'change',test);
	addEvent(elem,'keyup',test);	
	addEvent(elem,'focus',test);
	addEvent(elem,'blur',test);	
	addEvent(elem,'mouseup',test);	
	elem.focus();
	elem.blur();
	scroll(0,0);
}

//TODO not like this...
function jeProhlizeciStranka_new() {
    var sp = document.getElementById("app_name");
    if (sp && sp.innerText.includes("– prohlídka")) {
        return true;
    }
    return false;
}