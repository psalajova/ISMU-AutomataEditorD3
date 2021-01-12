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
            if (!table.symbols.includes(symb)) table.symbols.push(symb);
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

    /*
    if (jeProhlizeciStranka()) {
      jQuery_new(table).find("input").prop("disabled", true).addClass("mydisabled");
    }
    */
}

function insertColumnAddButton(table, row) {
    var cell = insertCellWithDiv(row, null, [tableClasses.addButton, tableClasses.noselectCell], null, "+");
    //cell.table = table;
    cell.addEventListener("click", function () {
        insertColumn(table);
    });
}

function insertColumnDeleteButton(table, row) {
    var cell = insertCellWithDiv(row, null,
        [tableClasses.deleteButton, tableClasses.noselectCell],
        null, "×");

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
        [tableClasses.deleteButton, tableClasses.noselectCell], null, "×");

    cell.addEventListener("click", function () { deleteRow(table, cell.parentNode.rowIndex); });
}

function insertInnerCell(table, row) {
    var cell = insertCell(row, row.cells.length, [tableClasses.myCell]);

    var value = typeIsNondeterministic(table.questionDiv.type) ? "{}" : "";
    var input = createInput([tableClasses.inputCellDiv], value, value,
        table.rows[1].cells[cell.cellIndex].style.minWidth);

    input.addEventListener("click", (e) => cellClickHandler(e, table));
    input.addEventListener("input", (e) => tableCellChanged(e, table, input));
    input.addEventListener("focusout", (e) => tableCellChangedFinal(e, table, input));

    var regex;

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
    var table = getParentByType("table", cell);
    var input = createInput([tableClasses.inputCellDiv, tableClasses.rowHeader],
        name, name, table.rows[1].cells[cell.cellIndex].style.minWidth);

    input.defaultClass = tableClasses.rowHeader; // whhy>?

    input.addEventListener("click", tableHeaderCellClick);
    input.addEventListener("input", (e) => tableRhChanged(e, table, input));
    input.addEventListener("focusout", (e) => tableRhChangedFinal(e, table, input));
    input.addEventListener("keypress", function (event) { cellKeypressHandler(event, stateSyntax()); });

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

    cell.myDiv = input;
    cell.appendChild(input);

    addResizable(table, cell);

    input.addEventListener("click", cellClickHandler);
    input.addEventListener("input", (e) => tableChChanged(e, table, input));
    input.addEventListener("focusout", (e) => tableChChangedFinal(e, table, input));

    var regex = table.questionDiv.type == "EFA" ? tableEFATransitionSyntax() : DFATransitionSymbolsSyntax();
    input.addEventListener("keypress", function (e) {
        cellKeypressHandler(e, regex);
    });


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

    //TOHO ? ak sme vymazali \e zo vsetkych prechodov tak v tabulke mozme znova obnovit button
}

/* INPUT CHANGES */
function tableChChanged(e, table, input) {
    var value = input.value;
    //if (symbol == "\e") symbol = "ε"; 
    var type = table.questionDiv.type;

    if (incorrectTableColumnHeaderSyntax(type, value)) {
        d3.select(input).classed(tableClasses.incorrectCell, true);
        var err;
        if (type == "EFA") {
            err = errors.EFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX;
        }
        else {
            err = errors.NFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX;
        }
        activateAlertMode(table, err, input);
    }
    else if (tableColumnSymbolAlreadyExists(table, input, value)) {
        d3.select(input).classed(tableClasses.incorrectCell, true);
        activateAlertMode(table, errors.DUPLICIT_TRANSITION_SYMBOL, input);
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
    if (jQuery_new(input).hasClass(tableClasses.incorrectCell) || table.locked) {
        return;
    }
    var prevName = input.prevValue;
    var newName = input.value;
    if (table.questionDiv.type == "EFA" && newName == "\\e") {
        input.value = 'ε';
        newName = input.value;
    }

    table.symbols.splice(table.symbols.indexOf(prevName), 1);
    table.symbols.push(newName);

    if (prevName != newName) {
        // Rename the symbol in GRAPH
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
        //TODO button
        /*
        if (table.wp.realtype == "EFA")
        {
          if (newName == 'ε')
            table.tableTab.buttonEpsilon.disabled = true;
          else if (prevName == 'ε')
            table.tableTab.buttonEpsilon.disabled = false;
        }*/

        input.prevValue = input.value;
    }
}

function tableRhChanged(e, table, input) {
    var currentValue = removePrefix(input.value);
    var rowIndex = input.parentNode.parentNode.rowIndex;

    if (incorrectStateSyntax(currentValue)) {
        d3.select(input).classed(tableClasses.incorrectCell, true);
        activateAlertMode(table, errors.INCORRECT_STATE_SYNTAX, input);
    }
    else if (tableStateAlreadyExists(table, input, currentValue)) {
        d3.select(input).classed(tableClasses.incorrectCell, true);
        activateAlertMode(table, errors.DUPLICIT_STATE_NAME, input);
    }
    else {
        d3.select(input).classed(tableClasses.incorrectCell, false);
        if (table.locked) {
            unlockTable(table);
            hideElem(table.alertStatus);
        }
        //TODO: toggling initial / accepting (1094) ???
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

        var err = errors.INCORRECT_TRANSITION_SYNTAX + " ";
        if (type == "DFA") {
            err += errors.DFA_TRANSITION_EXPECTED_SYNTAX;
        }
        else {
            err += errors.NFA_TRANSITION_EXPECTED_SYNTAX
        }
        activateAlertMode(table, err, input);
    }
    else {
        var prevName = input.prevValue;
        var newName = input.value;
        if (typeIsNondeterministic(type)) {
            prevName = prevName.substring(1, prevName.length - 1);
            newName = newName.substring(1, newName.length - 1);
        }
        var sourceStateId = removePrefix(table.rows[input.parentNode.parentNode.rowIndex].cells[1].myDiv.value);
        //var stateInGraph = findState(table.wp.svg.rect, stateName);
        var symbol = table.rows[1].cells[input.parentNode.cellIndex].myDiv.prevValue;
        var prevStates = prevName.split(",");
        var newStates = newName.split(",");
        //vymazanie duplicitnych stavov
        newStates = newStates.filter(function (item, pos) { return newStates.indexOf(item) == pos; });

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
            //ak predtym stav s tymto nazvom je v cell == nebola v nom zmena
            if (prevStates.indexOf(newStates[i]) != -1) continue;

            var state2Name = newStates[i];
            //ak NEEXISTUJE v grafe stav s danym nazvom
            if (getStateDataById(questionDiv, state2Name) == null) {
                var addRowBool = true;
                for (var j = 2; j < table.rows.length - 1; j++) {
                    if (table.rows[j].cells[1].myDiv.value == state2Name) {
                        addRowBool = false;
                        break;
                    }
                }
                if (addRowBool) {
                    //v insertRow sa prida riadok do tabulky AJ sa vytvori stav v grafe!!
                    insertRow(table, state2Name);
                }
                else {
                    var nd = newStateData(questionDiv, state2Name, 0, 0, false, false, true);
                    addState(questionDiv, nd);
                }
                var source = getStateDataById(questionDiv, sourceStateId);
                var target = getStateDataById(questionDiv, state2Name);
                addEdge(questionDiv, source, target, symbol, true);

            }
            else {
                var edgeData = getEdgeDataByStates(questionDiv, sourceStateId, state2Name);
                if (edgeData != null) {
                    var trs = edgeData.symbols.split(",");
                    if (trs.indexOf(symbol) == -1) {
                        trs.push(symbol);
                        renameEdge(questionDiv, edgeData, trs.join(','));
                    }
                }
                else {
                    var source = getStateDataById(questionDiv, sourceStateId);
                    var target = getStateDataById(questionDiv, state2Name);
                    addEdge(questionDiv, source, target, symbol, true);
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
    input.value = value;
    input.prevValue = prevValue;
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
        resize: function () {
            var minSize = MIN_TABLE_CELL_WIDTH.substring(0, 2);
            if (parseInt(this.style.width) >= parseInt(minSize)) {
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
    lockButtons(table.questionDiv, true);
}

function unlockTable(table) {
    for (var i = 1; i < table.rows.length - 1; i++) {
        for (var j = 1; j < table.rows[i].cells.length; j++) {
            jQuery_new(table.rows[i].cells[j].myDiv).prop('readonly', false);
        }
    }
    table.locked = false;
    lockButtons(table.questionDiv);
}

function lockButtons(questionDiv, val = null) {
    d3.select(questionDiv).selectAll("." + menuButtonClass).attr("disabled", val);
}

function tableStateAlreadyExists(table, input, value) {
    var ri = input.parentNode.parentNode.rowIndex;
    for (var i = 2; i < table.rows.length - 1; i++) {
        if (i != ri && value == removePrefix(table.rows[i].cells[1].myDiv.value)) {
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
        table.alertStatus.innerHTML += " " + errors.TABLE_LOCKED;
    }
}

function activateAlertMode(table, error, exc) {
    setAlert(table, error, true);
    showElem(table.alertStatus);
    lockTable(table, exc);
}