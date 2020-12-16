// -------------------
//  Slovensky jazyk
// -------------------

var graphMenuButton = "Graf";
var textMenuButton = "Text";
var tableMenuButton = "Tabuľka";
var hintLabel = "Nápoveda";
var addTransitionPrompt = "Zadajte symboly prechodu:";
var renameStatePrompt = "Zadajte názov stavu:";
var stateNameAlreadyExistsPrompt = "Chyba: Takto pojmenovaný stav již existuje! ";
var edgeAlreadyExistsAlert = "Prechod medzi týmito stavmi už existuje. Ak chcete pridať prechod pod nejakým symbolom, upravte symboly existujúceho prechodu.";
var DFA_invalid_transition = "Chyba: Zadání vyžaduje determinizmus (přechod z tohoto stavu pod alespoň jedním z těchto symbolů do jiného stavu už existuje).";
//Chyba: Zadanie vyžaduje determinizmus (prechod z tohto stavu pod aspoň jedným z týchto symbolov do iného stavu už existuje).

//state context menu
var addTransitionText = "Pridať prechod";
var renameStateText = "Premenovať";
var deleteStateText = "Odstrániť";
var setAsInitialText = "Nastaviť ako počiatočný";
var setStateAsAcceptingText = "Akceptujúci stav";

var renameEdgeText = "Upravit symboly prechodu";

var hints = {
  HINT_ADD_STATE : "<b>Vytvorenie stavu:</b> double click na plátno.",
  HINT_ADD_TRANSITION : "<b>Vytvorenie prechodu:</b> click na stav + click na cieľový stav.",
  HINT_MOVE : "Stavy aj prechody môžte presúvať ťahaním myšou.",
  HINT_STATE_CONTEXT_MENU: "Kliknutím pravého tlačítka myši/touchpadu na stav otvoríte menu, kde môžte stav <b>premenovať, odstrániť, nastaviť ako počiatočný, označiť ako akceptujúci/neakceptujúci</b>.",
  HINT_TRANSITION_CONTEXT_MENU: "Kliknutím pravého tlačítka myši/touchpadu na prechod otvoríte menu, kde môžte <b>upraviť symboly prechodu</b> alebo prechod <b>odstrániť</b>.",
  HINT_DELETE_ELEMENT : "Vymazať stav/prechod môžte aj označením daného elementu a stlačením klávesy DEL.",
  //HINT_RENAME_ELEMENT : "<b>premenovanie stavu/prechodu:</b> right click",
  //HINT_TOGGLE_INITIAL_STATE : "<b>oznacenie stavu ako inicialneho:</b> right click -> \"" + setAsInitialText + "\"",
  //HINT_TOGGLE_ACCEPTING_STATE : "<b>oznacenie a odznacenie stavu ako akceptujuceho:</b> double click na stav"
}

var tableErrors = {
  TABLE_LOCKED : "Tabulka je uzamčena dokud nebude chyba opravena.",
  INCORRECT_STATE_SYNTAX : "<strong>Chyba!</strong> Nevyhovující syntax názvu stavu (řetězec znaků z {a-z,A-Z,0-9}). ",
  DUPLICIT_STATE_NAME : "<strong>Chyba!</strong> Duplicitní název stavu není povolen.",
  EFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu (řetězec znaků z {a-z,A-Z,0-9}, \\e nebo ε).",
  NFA_INCORRECT_TRANSITION_SYMBOL_SYNTAX : "<strong>Chyba!</strong> Nevyhovující syntax symbolu přechodu (řetězec znaků z {a-z,A-Z,0-9}).",
  DUPLICIT_TRANSITION_SYMBOL : "<strong>Chyba!</strong> Duplicitní název symbolu přechodu není povolen.",
  INCORRECT_TRANSITION_SYNTAX: "<strong>Chyba!</strong> Nevyhovující syntax výsledku přechodové funkce.",
  NFA_TRANSITION_EXPECTED_SYNTAX: "Očekávané řetězce znaků z {a-z,A-Z,0-9} oddělené čárkami, uzavřeny do složených závorek.",
  DFA_TRANSITION_EXPECTED_SYNTAX: "Očekávané řetězce znaků z {a-z,A-Z,0-9}."
}