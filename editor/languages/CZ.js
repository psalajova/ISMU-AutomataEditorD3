// -------------------
//  Cesky jazyk
// -------------------

var graphMenuButton = "Graf";
var textMenuButton = "Text";
var tableMenuButton = "Tabulka";
var hintLabel = "Nápověda";
var addTransitionPrompt = "Zadejte symboly přechodu:";
var renameStatePrompt = "Zadejte název stavu:";
var stateNameAlreadyExistsPrompt = "Chyba: Takto pojmenovaný stav již existuje!";
var edgeAlreadyExistsAlert = "Přechod mezi těmito stavy již existuje. Chcete-li přidat přechod pod nějakým symbolem, upravte symboly stávajícího přechodu.";
var DFA_invalid_transition = "Chyba: Zadání vyžaduje determinizmus (přechod z tohoto stavu pod alespoň jedním z těchto symbolů do jiného stavu už existuje).";

//state context menu
var addTransitionText = "Přidať prechod";
var renameStateText = "Přejmenovat";
var deleteStateText = "Odstranit";
var setAsInitialText = "Nastavit jako počáteční";
var setStateAsAcceptingText = "Akceptující stav";

var renameEdgeText = "Upravit symboly přechodu";

var hints = {
  HINT_ADD_STATE : "<b>Vytvoření stavu:</b> double click na plátno.",
  HINT_ADD_TRANSITION : "<b>Vytvoření prechodu:</b> click na stav + click na cílový stav.",
  HINT_MOVE : "Stavy i přechody můžete přesouvat taháním myší.",
  HINT_STATE_CONTEXT_MENU: "Kliknutím pravého tlačítka myši na stav otevřete menu, kde můžete stav <b>přejmenovat, odstranit, nastavit jako počáteční, označit jako akceptující/neakceptujúci</b>.",
  HINT_TRANSITION_CONTEXT_MENU: "Kliknutím pravého tlačítka myši na přechod otevřete menu, kde můžete <b>upravit symboly přechodu</b> nebo přechod <b>odstranit</b>.",
  HINT_DELETE_ELEMENT : "Vymazat stav/přechod můžete i označením daného elementu a stisknutím klávesy DEL.",
  //HINT_RENAME_ELEMENT : "<b>premenovanie stavu/prechodu:</b> right click",
  //HINT_TOGGLE_INITIAL_STATE : "<b>oznacenie stavu ako inicialneho:</b> right click -> \"" + setAsInitialText + "\"",
  //HINT_TOGGLE_ACCEPTING_STATE : "<b>oznacenie a odznacenie stavu ako akceptujuceho:</b> double click na stav"
}

var STATE_SYNTAX = "{a-z,A-Z,0-9}";

var tableErrors = {
  TABLE_LOCKED : "Tabulka je uzamčena dokud nebude chyba opravena.",
  INCORRECT_STATE_SYNTAX : "<strong>Chyba!</strong> Nevyhovující syntax názvu stavu (řetězec znaků z {a-z,A-Z,0-9}). ",
  DUPLICIT_STATE_NAME : "<strong>Chyba!</strong> Duplicitní název stavu není povolen.",
  EFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu (řetězec znaků z {a-z,A-Z,0-9}, \\e nebo ε).",
  NFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu (řetězec znaků z {a-z,A-Z,0-9}).",
  DUPLICIT_TRANSITION_SYMBOL : "<strong>Chyba!</strong> Duplicitní název symbolu přechodu není povolen.",
  INCORRECT_TRANSITION_SYNTAX: "<strong>Chyba!</strong> Nevyhovující syntax výsledku přechodové funkce.",
  NFA_TRANSITION_EXPECTED_SYNTAX: "Očekávané řetězce znaků z {a-z,A-Z,0-9} oddělené čárkami, uzavřeny do složených závorek {}.",
  DFA_TRANSITION_EXPECTED_SYNTAX: "Očekávané řetězce znaků z {a-z,A-Z,0-9}.",
  
}