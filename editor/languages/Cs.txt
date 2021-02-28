/**
 * Czech language for finite automata editor
 */

/* ------------------------------ symbols ------------------------------ */
var delSymbol = "×"; //table delete row/column
var addSymbol = "+"; //table add row/column
var initSymbol = "→";
var accSymbol = "←";
var bothSymbol = "↔";
var epsSymbol = 'ε';

/* ------------------------------ main menu ------------------------------ */
var graphMenuButton = "Graf";
var textMenuButton = "Text";
var tableMenuButton = "Tabulka";
var hintLabel = "Nápověda";
var hintTitle = "Nápověda k používání grafového editoru";

var tableInitialButtonName = "Počáteční stav"; //table button to toggle initial state
var tableAcceptingButtonName = "Akceptující stav"; //table button to toggle accepting state

/* ------------------------------ context menus ------------------------------ */
//state
var renameStateText = "Přejmenovat";
var deleteStateText = "Odstranit";
var setAsInitialText = "Nastavit jako počáteční";
var setStateAsAcceptingText = "Nastavit jako akceptující";
var setStateAsNonAcceptingText ="Nastavit jako neakceptující";

//edge
var deleteEdgeText = "Odstranit";
var renameEdgeText = "Upravit symboly přechodu";

//new state
var addStateText = addSymbol + " Nový stav";


/* ------------------------------ hint ------------------------------ */
var hints = {
  addState : "<b>Vytvoření stavu:</b> dvojklikem na plátno nebo kliknutím pravého tlačítka na plátno.",
  addTransition : "<b>Vytvoření prechodu:</b> klik na stav + klik na cílový stav.",
  drag : "Stavy i přechody můžete přesouvat taháním myší.",
  stateMenu: "Kliknutím pravého tlačítka myši na stav otevřete menu, kde můžete stav <b>přejmenovat, odstranit, nastavit jako počáteční, označit jako akceptující/neakceptujúci</b>.",
  transitionMenu: "Kliknutím pravého tlačítka myši na přechod otevřete menu, kde můžete <b>upravit symboly přechodu</b> nebo přechod <b>odstranit</b>.",
  rename : "Přechod můžete upravit i dvojklikem. Pro uložení změn po přejmenování stiskněte ENTER.",
  delete : "Vymazat stav/přechod můžete i označením daného elementu a stisknutím klávesy DEL.",
}


/* ------------------------------ errors ------------------------------ */
var STATE_SYNTAX = "{a-z,A-Z,0-9}";
var DFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}";
var EFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}, \\e, ε}";
var INVALID_SYNTAX_ERROR = "<strong>Chyba:</strong> Nevyhovující syntax!";

var errors = {
  tableLocked : "Tabulka je uzamčena dokud nebude chyba opravena.",

  //table row headers (state names) errors
  incorrectStateSyntax : "<strong>Chyba!</strong> Nevyhovující syntax názvu stavu. Očekávaný řetězec znaků z "+ STATE_SYNTAX + ". ",
  duplicitState : "<strong>Chyba!</strong> Duplicitní název stavu není povolen.",
  emptyState: "<strong>Chyba!</strong> Prázdný název stavu není povolen.",

  //table header cells (transition symbols) errors
  EFA_incorrectTransitionSymbol : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu (řetězec znaků z {a-z,A-Z,0-9}, \\e nebo ε).",
  NFA_incorrectTransitionSymbol : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu (řetězec znaků z {a-z,A-Z,0-9}).",
  emptyTransition: "<strong>Chyba!</strong> Nelze přidat prázdný přechod.",
  duplicitTransitionSymbol : "<strong>Chyba!</strong> Duplicitní název symbolu přechodu není povolen.",

  // table inner cell errors
  innerCellIncorrectSyntaxBase: "<strong>Chyba!</strong> Nevyhovující syntax výsledku přechodové funkce.",
  NFAInnerCellSyntax: "Očekávané řetězce znaků z {a-z,A-Z,0-9} oddělené čárkami, uzavřeny do složených závorek {}.",
  DFAInnerCellSyntax: "Očekávaný řetězec znaků z {a-z,A-Z,0-9}.",

  transitionSymbolsTooLong: "Prekrocena maximalna dlzka symbolov prechodu (300)!",
  stateNameTooLong: "Název stavu je příliš dlouhý (max. 50 znaků)."
}

var stateNameAlreadyExists = "<strong>Chyba:</strong> Takto pojmenovaný stav již existuje.";
var edgeAlreadyExistsAlert = "Přechod mezi těmito stavy již existuje. <br>Chcete-li přidat přechod pod nějakým symbolem, upravte symboly stávajícího přechodu.";
var DFAInvalidTransition = "<strong>Chyba:</strong> Zadání vyžaduje determinizmus (přechod z tohoto stavu pod alespoň jedním z těchto symbolů do jiného stavu již existuje).";

var expectedEFASyntax = "Očekávané znaky z " + EFA_TRANSITION_SYNTAX + ", nebo řetězce znaků z " + EFA_TRANSITION_SYNTAX + " uzavřeny do uvozovek \"\", oddělené čárkami."
var expectedDFASyntax = "Očekávané znaky z " + DFA_TRANSITION_SYNTAX + ", nebo řetězce znaků z " + DFA_TRANSITION_SYNTAX + " uzavřeny do uvozovek \"\", oddělené čárkami."


var tableDelSymbolHover = "Vymazat sloupec (symbol ze všech přechodů)";
var tableDelRowHover = "Vymazat řádek (stav a všechny jeho přechody)";
var tableAddRowHover = "Přidat stav";
var tableAddSymbolHover = "Přidat symbol";

var emptyGraphText = "První stav vytvoříte dvojklikem.";

/* ------------------------------ syntax check div ------------------------------ */
//currently unused
var syntaxDivTitle = "Nápověda syntaxe učitele.";
var syntaxTextDefault = "Zde se zobrazuje nápověda syntaxe.";