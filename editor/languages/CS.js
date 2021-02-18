// -------------------
//  CS
// -------------------

var graphMenuButton = "Graf";
var textMenuButton = "Text";
var tableMenuButton = "Tabulka";
var hintLabel = "Nápověda";
var stateNameAlreadyExists = "<strong>Chyba:</strong> Takto pojmenovaný stav již existuje.";
var edgeAlreadyExistsAlert = "Přechod mezi těmito stavy již existuje. <br>Chcete-li přidat přechod pod nějakým symbolem, upravte symboly stávajícího přechodu.";
var DFAInvalidTransition = "<strong>Chyba:</strong> Zadání vyžaduje determinizmus (přechod z tohoto stavu pod alespoň jedním z těchto symbolů do jiného stavu už existuje).";

const tableInitialButtonName = "Počáteční stav"; 
const tableAcceptingButtonName = "Akceptující stav";

//context menus
var renameStateText = "Přejmenovat";
var deleteStateText = "Odstranit";
var setAsInitialText = "Nastavit jako počáteční";
var setStateAsAcceptingText = "Nastavit jako akceptující";
var setStateAsNonAcceptingText ="Nastavit jako neakceptující";
var renameEdgeText = "Upravit symboly přechodu";


var hints = {
  addState : "<b>Vytvoření stavu:</b> double click na plátno nebo right click na plátno.",
  addTransition : "<b>Vytvoření prechodu:</b> click na stav + click na cílový stav.",
  drag : "Stavy i přechody můžete přesouvat taháním myší.",
  stateMenu: "Kliknutím pravého tlačítka myši na stav otevřete menu, kde můžete stav <b>přejmenovat, odstranit, nastavit jako počáteční, označit jako akceptující/neakceptujúci</b>.",
  transitionMenu: "Kliknutím pravého tlačítka myši na přechod otevřete menu, kde můžete <b>upravit symboly přechodu</b> nebo přechod <b>odstranit</b>.",
  rename : "Pro uložení změn po přejmenování stiskněte ENTER nebo klikněte vedle.",
  delete : "Vymazat stav/přechod můžete i označením daného elementu a stisknutím klávesy DEL."
}

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

  transitionSymbolsTooLong: "Prekrocena maximalna dlzka symbolov prechodu (300)!"
}

var delSymbol = "×";
var addSymbol = "+";
var initSymbol = "→";
var accSymbol = "←";
var bothSymbol = "↔";
var epsSymbol = 'ε';

var expectedEFASyntax = "Očekávané znaky z " + EFA_TRANSITION_SYNTAX + ", nebo řetězce znaků z " + EFA_TRANSITION_SYNTAX + " uzavřeny do uvozovek \"\", oddělené čárkami."
var expectedDFASyntax = "Očekávané znaky z " + DFA_TRANSITION_SYNTAX + ", nebo řetězce znaků z " + DFA_TRANSITION_SYNTAX + " uzavřeny do uvozovek \"\", oddělené čárkami."

var syntaxDivTitle = "Nápověda syntaxe učitele.";
var syntaxTextDefault = "Zde se zobrazuje nápověda syntaxe.";