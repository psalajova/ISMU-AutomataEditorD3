/**
 * English language for finite automata editor
 */

/* ------------------------------ symbols ------------------------------ */
var delSymbol = "×"; //table delete row/column
var addSymbol = "+"; //table add row/column
var initSymbol = "→";
var accSymbol = "←";
var bothSymbol = "↔";
var epsSymbol = 'ε';
var hintSymbol = "•";

/* ------------------------------ main menu ------------------------------ */
var graphMenuButton = "Graph";
var textMenuButton = "Text";
var tableMenuButton = "Table";
var hintLabel = "Hint";
var hintTitle = "How to use graph editor";
var syntaxLabel = "Syntax";
var syntaxTitle = "Syntax rules";

var tableInitialButtonName = "Initial state";     //label - table button to toggle initial state
var tableAcceptingButtonName = "Accepting state"; //label - table button to toggle accepting state

/* ------------------------------ context menus ------------------------------ */
//state
var renameStateText = "Rename";
var deleteStateText = "Delete";
var setAsInitialText = "Make initial";
var setStateAsAcceptingText = "Make accepting";
var setStateAsNonAcceptingText ="Make non-accepting";

//edge
var deleteEdgeText = "Delete";
var renameEdgeText = "Edit transition symbols";

//new state
var addStateText = addSymbol + " New state";

var STATE_SYNTAX = "{a-z,A-Z,0-9}";
var DFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}";
var EFA_TRANSITION_SYNTAX = "{a-z,A-Z,0-9}, \\e, ε}";
var INVALID_SYNTAX_ERROR = "<strong>Error:</strong> Wrong syntax!";

/* ------------------------------ hint ------------------------------ */
var graphHints = {
  addState : "<b>Create state:</b> double click on canvas or right click on canvas + New state.",
  addTransition : "<b>Create transition:</b> click on a state + click on another state (or the same state to create a selfloop).",
  drag : "You can drag both states and transitions.",
  stateMenu: "Right clicking on a state will open a menu where you can <b>rename</b> or <b>delete</b> state, <b>make state initial</b>, <b>make state accepting/non-accepting</b>.",
  transitionMenu: "Right clicking on a transition will open a menu where you can <b>edit symbols</b> or <b>delete</b> transition.",
  rename : "Transitions and states can also be edited by double clicking. To save changes press ENTER.",
  delete : "Deleting a state or a transition is also possible by selecting the element and pressing DEL.",
}

var graphSyntaxHints = {
  states: `<b>State name:</b> a string of characters from ${STATE_SYNTAX}.`,
  transition: `<b>Transition symbol:</b> a symbol from ${DFA_TRANSITION_SYNTAX}, or sequence of any symbols (except quotation marks and whitespace characters) enclosed in quotation marks.`,
  efa: `In nondeterministic automata with ε-steps, the transition under an empty word is written using a character ε or \\e.`,
  commas: `Transitions under multiple symbols are written as individual symbols separated by commas (eg. <code>a,c</code>; <code>b,ε,a</code>; <code>"dog","cat","mouse"</code>;).`,
  lang: `The alphabet of a language recognized by an automaton is determined by the symbols that appear at its transitions.`
}

var tableSyntaxHints = {
  a: graphSyntaxHints.states,
  b: graphSyntaxHints.transition,
  c: graphSyntaxHints.efa,
  d: graphSyntaxHints.lang,
  e: `<b>Result of the transition function</b>: name of a state, in case of nondeterministic automata a set containing names of the states (eg. <code>{s1,s2,s3}</code>)`,
}

/* ------------------------------ errors ------------------------------ */

var errors = {
  tableLocked : "Table is locked until the error is fixed.",

  //table row headers (state names) errors
  incorrectStateSyntax : "<strong>Error!</strong> Wrong state name syntax. Expecting a string of characters from "+ STATE_SYNTAX + ". ",
  duplicitState : "<strong>Error!</strong> A state with this name already exists.",
  emptyState: "<strong>Error!</strong> Empty state name.",

  //table header cells (transition symbols) errors
  EFA_incorrectTransitionSymbol : "<strong>Error!</strong> Wrong transition symbol syntax.",
  incorrectTransitionSymbol : "<strong>Error!</strong> Wrong transition symbol syntax.",
  emptyTransition: "<strong>Error!</strong> The transition cannot be empty.",
  duplicitTransitionSymbol : "<strong>Error!</strong> Duplicate transition symbol.",

  // table inner cell errors
  innerCellIncorrectSyntaxBase: "<strong>Error!</strong> Wrong syntax of the result of the transition function.",
  NFAInnerCellSyntax: "Expecting a string of characters from "+ STATE_SYNTAX + " separated by commas, enclosed in braces {}.",
  DFAInnerCellSyntax: "Expecting a string of characters from "+ STATE_SYNTAX + ".",

  transitionSymbolsTooLong: "Too many symbols! (Maximum transition symbol count is 300)",
  stateNameTooLong: "The state name is too long (max. 50 characters)."
}

var stateNameAlreadyExists = "<strong>Error:</strong> A state with this name already exists.";
var edgeAlreadyExistsAlert = "A transition between these two states already exists.<br>Edit the existing transition to add more symbols.";
var DFAInvalidTransition = "<strong>Error:</strong> The automaton has to be <b>deterministic</b> (a transition from this state with at least one of these symbols to another state already exists).";

//Titles shown upon mouse hover over table elements.
var tableDelSymbolHover = "Delete column (deletes the symbol from all transitions)";
var tableDelRowHover = "Delete row (deletes the state and all its transitions)";
var tableAddRowHover = "New state";
var tableAddSymbolHover = "New symbol";

var emptyGraphText = "Double click to create the first state.";

/* ------------------------------ syntax check div ------------------------------ */
var syntaxDivTitle = "Syntax help.";
var syntaxDefaultText = "Syntax help is displayed here. ";
var syntaxIsCorrect = "Syntax is correct.";

/* ------------------------------ IS related ------------------------------ */
var browse = "– browse";
var browse2 = "Browse";