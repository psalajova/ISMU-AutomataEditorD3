


/* -OBJECT--------------------------------------------------------------------
    Object:   DFAParser
    Usage:    this object contains private methods and attributes for parser 
              and public method parse
----------------------------------------------------------------------------- */      
var DFAParser = function ()
{ 
  /* -PRIVATE---------------------------------------------------------------- */
    
  /* -STRUCTURE-----------------------------------------------------------------
  Structure:  LL1TABENTRY
  Usage:      contains all data needed for LL(1) table entry
  --------------------------------------------------------------------------- */    
  function LL1TABENTRY()
  {
    var shift;      //shift the input (ignored char on input)
    var remove;       // shift the input AND pop the stack (ex. a on stack and a on input)
    var error;      // array of expected symbols
    var production;     //array of symbols which should be placed on stack
    var accept;       //accept the string   
  }  
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   createLL1TabEntry(shift, error, production, accept, remove)
  Usage:      returns new LL1TABENTRY structure, initalized...
  --------------------------------------------------------------------------- */    
  function createLL1TabEntry(shift, error, production, accept, remove)
  {
    var result = new LL1TABENTRY();
    result.shift = shift;
    result.remove = remove;
    result.error = error;
    result.production = production;
    result.accept = accept;   
    return result;
  }  
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   printPosition(source, offset)
  Usage:      returns string in format [line:column]
  --------------------------------------------------------------------------- */    
  function printPosition(source, offset)
  {     
    var line = 1;     
    var counter = 0;
    while(true)
    {
        pos = source.indexOf("\n");
        if(pos != -1) 
        {
            if(counter + pos  > offset) break;
            line++;
            counter += pos + 1;            
            source = source.substr(pos+1);
        } else break;        
    }     
    var column = offset - counter + 1;
    return "[" + line + ":" + column + "] ";
  }
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   getStringNeigbourhood(src, info.offset, info.att.length)
  Param length: means length of the string ending in offset
  Param offset: offfset of the end of the string
  Usage:      returns string with neighbouring content without new lines  
  --------------------------------------------------------------------------- */    
  function getStringNeigbourhood(src, offset, length)
  {     
      offset -=length;
      if(length==0)length=1;
      var str = "";
      var prefix = "";
      var postfix = "";
      // string is over the new line, we cut it...
      var pos = src.substr(offset, length).indexOf("\n");
      if(pos != -1) 
      {
        str = src.slice(offset, pos-1);
        postfix = "";
      }
      else
      {
        str = src.substr(offset, length);
        postfix = src.substr(offset+length, length);
        pos = postfix.indexOf("\n");
        if(pos != -1)
        {
          postfix = postfix.slice(0, pos);
        }        
      }
      if(length <= offset)
      {
        prefix = src.substr(offset-length, length);
      } 
      else prefix = src.slice(0, offset); 
      
      while(prefix.indexOf("\n")!= -1)
      {
          pos = prefix.indexOf("\n");
          if(prefix.length <= pos) 
            prefix = "";
          else  
            prefix = prefix.substr(prefix.indexOf("\n")+1);
      }    
      
      return prefix + str + postfix; 
  }
  
  // this array contains pairs (offset, array of expected terminals)
  // there is new line every call to lex()
  var exp = new Array();
  
  // array indexed by states, containing information about transitions,
  // possible matches on that transitions and possible states on that transitions 
  var others = new Array();
  		others[0] = new Array();
		others[0].push([[[9, 10], [13], [32]],   [1],   [1]]);
		others[0].push([[[40]],   [4],   [2]]);
		others[0].push([[[41]],   [5],   [3]]);
		others[0].push([[[44]],   [8],   [4]]);
		others[0].push([[[48, 57], [65, 90], [97, 101], [103, 104], [106, 122]],   [10],   [5]]);
		others[0].push([[[61]],   [3],   [6]]);
		others[0].push([[[123]],   [6],   [7]]);
		others[0].push([[[125]],   [7],   [8]]);
		others[0].push([[[105]],   [10,2],   [5, 13, 11, 9, 15]]);
		others[0].push([[[102]],   [10,9],   [5, 16, 14, 12, 10, 17]]);
		others[1] = new Array();
		others[2] = new Array();
		others[3] = new Array();
		others[4] = new Array();
		others[5] = new Array();
		others[5].push([[[48, 57], [65, 90], [97, 122]],   [10],   [5]]);
		others[6] = new Array();
		others[7] = new Array();
		others[8] = new Array();
		others[9] = new Array();
		others[9].push([[[48, 57], [65, 90], [97, 122]],   [10],   [5]]);
		others[10] = new Array();
		others[10].push([[[48, 57], [65, 90], [97, 122]],   [10],   [5]]);
		others[11] = new Array();
		others[11].push([[[48, 57], [65, 90], [97, 115], [117, 122]],   [10],   [5]]);
		others[11].push([[[116]],   [10,2],   [5, 9]]);
		others[12] = new Array();
		others[12].push([[[48, 57], [65, 90], [97, 107], [109, 122]],   [10],   [5]]);
		others[12].push([[[108]],   [10,9],   [5, 10]]);
		others[13] = new Array();
		others[13].push([[[48, 57], [65, 90], [97, 104], [106, 122]],   [10],   [5]]);
		others[13].push([[[105]],   [10,2],   [5, 9, 11]]);
		others[14] = new Array();
		others[14].push([[[48, 57], [65, 90], [98, 122]],   [10],   [5]]);
		others[14].push([[[97]],   [10,9],   [5, 10, 12]]);
		others[15] = new Array();
		others[15].push([[[48, 57], [65, 90], [97, 109], [111, 122]],   [10],   [5]]);
		others[15].push([[[110]],   [10,2],   [5, 11, 9, 13]]);
		others[16] = new Array();
		others[16].push([[[48, 57], [65, 90], [97, 109], [111, 122]],   [10],   [5]]);
		others[16].push([[[110]],   [10,9],   [5, 12, 10, 14]]);
		others[17] = new Array();
		others[17].push([[[48, 57], [65, 90], [97, 104], [106, 122]],   [10],   [5]]);
		others[17].push([[[105]],   [10,9],   [5, 14, 12, 10, 16]]);

  
  /* -FUNCTION------------------------------------------------------------------
  Function:   lex( info )
  Usage:      advanced lexical analyzer
  Returns:    object, with properties: match, last_state
              match =  index to labels array (terminal's id)
              last_state = last state of lexical analyer which was visited              
  --------------------------------------------------------------------------- */
  function lex( info )
  {
    var state     = 0;
    var match     = -1;
    var match_pos   = 0;
    var start     = 0;
    var pos       = info.offset + 1;
    var last_state = 0;
    
    var expecting = new Array();
    for(var i = 0; i < parseTable[stack[stack.length-1]].length; i++)
    {
      if(parseTable[stack[stack.length-1]][i] 
          && (parseTable[stack[stack.length-1]][i].production 
              || parseTable[stack[stack.length-1]][i].remove 
              || parseTable[stack[stack.length-1]][i].accept))
      {                   
          expecting.push(i);
      }
    }
    exp.push([info.offset,expecting]);
    
      pos--;
      state = 0;
      match = -2;
      start = pos;
  
      if( info.src.length <= start )  
      {
          match = 20;
          var result = new Object();
          result.match = match;
          result.last_state = last_state;   
          return result;
      }
      do
      {
  
  switch( state )
{
	case 0:
		if( (( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 )) state = 1;
		else if( (info.src.charCodeAt( pos ) == 40 )) state = 2;
		else if( (info.src.charCodeAt( pos ) == 41 )) state = 3;
		else if( (info.src.charCodeAt( pos ) == 44 )) state = 4;
		else if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 101 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 61 )) state = 6;
		else if( (info.src.charCodeAt( pos ) == 123 )) state = 7;
		else if( (info.src.charCodeAt( pos ) == 125 )) state = 8;
		else if( (info.src.charCodeAt( pos ) == 105 )) state = 15;
		else if( (info.src.charCodeAt( pos ) == 102 )) state = 17;
		else state = -1;
   	last_state = 0;
		break;

	case 1:
		state = -1;
   	last_state = 1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		state = -1;
   	last_state = 2;
		match = 4;
		match_pos = pos;
		break;

	case 3:
		state = -1;
   	last_state = 3;
		match = 5;
		match_pos = pos;
		break;

	case 4:
		state = -1;
   	last_state = 4;
		match = 8;
		match_pos = pos;
		break;

	case 5:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else state = -1;
   	last_state = 5;
		match = 10;
		match_pos = pos;
		break;

	case 6:
		state = -1;
   	last_state = 6;
		match = 3;
		match_pos = pos;
		break;

	case 7:
		state = -1;
   	last_state = 7;
		match = 6;
		match_pos = pos;
		break;

	case 8:
		state = -1;
   	last_state = 8;
		match = 7;
		match_pos = pos;
		break;

	case 9:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else state = -1;
   	last_state = 9;
		match = 2;
		match_pos = pos;
		break;

	case 10:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else state = -1;
   	last_state = 10;
		match = 9;
		match_pos = pos;
		break;

	case 11:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 116 )) state = 9;
		else state = -1;
   	last_state = 11;
		match = 10;
		match_pos = pos;
		break;

	case 12:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 108 )) state = 10;
		else state = -1;
   	last_state = 12;
		match = 10;
		match_pos = pos;
		break;

	case 13:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 105 )) state = 11;
		else state = -1;
   	last_state = 13;
		match = 10;
		match_pos = pos;
		break;

	case 14:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 97 )) state = 12;
		else state = -1;
   	last_state = 14;
		match = 10;
		match_pos = pos;
		break;

	case 15:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 110 )) state = 13;
		else state = -1;
   	last_state = 15;
		match = 10;
		match_pos = pos;
		break;

	case 16:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 110 )) state = 14;
		else state = -1;
   	last_state = 16;
		match = 10;
		match_pos = pos;
		break;

	case 17:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 105 )) state = 16;
		else state = -1;
   	last_state = 17;
		match = 10;
		match_pos = pos;
		break;

}


        pos++;
  
      }
      while( state > -1 );
    
    if( match > -1 )
    {
      if(match != 1)
          info.att = info.src.substr( start, match_pos - start );
      info.offset = match_pos;
      
  
    }
    else
    {
      info.att = new String();     
      match = -1;
    }  
    var result = new Object();
    result.match = match;
    result.last_state = last_state;         
    return result;
  }
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   lexTest( info )
  Usage:      used for testing, what will be found...
  Returns:    object, with properties: match, last_state, pos
              match =  index to labels array (terminal's id)
              last_state = last state of lexical analyer which was visited      
              pos = last pos in string before return...        
  --------------------------------------------------------------------------- */
  function lexTest( info )
  {
    var state     = 0;
    var match     = -1;
    var match_pos   = 0;
    var start     = 0;
    var pos       = info.offset + 1;
    var last_state = 0;
    
       
      pos--;
      state = 0;
      match = -2;
      start = pos;
  
      if( info.src.length <= start )  
      {
          match = 20;
          var result = new Object();
          result.match = match;
          result.last_state = last_state;   
          result.pos = pos-1; 
          return result;
      }
      do
      {
  
  switch( state )
{
	case 0:
		if( (( info.src.charCodeAt( pos ) >= 9 && info.src.charCodeAt( pos ) <= 10 ) || info.src.charCodeAt( pos ) == 13 || info.src.charCodeAt( pos ) == 32 )) state = 1;
		else if( (info.src.charCodeAt( pos ) == 40 )) state = 2;
		else if( (info.src.charCodeAt( pos ) == 41 )) state = 3;
		else if( (info.src.charCodeAt( pos ) == 44 )) state = 4;
		else if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 101 ) || ( info.src.charCodeAt( pos ) >= 103 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 61 )) state = 6;
		else if( (info.src.charCodeAt( pos ) == 123 )) state = 7;
		else if( (info.src.charCodeAt( pos ) == 125 )) state = 8;
		else if( (info.src.charCodeAt( pos ) == 105 )) state = 15;
		else if( (info.src.charCodeAt( pos ) == 102 )) state = 17;
		else state = -1;
   	last_state = 0;
		break;

	case 1:
		state = -1;
   	last_state = 1;
		match = 1;
		match_pos = pos;
		break;

	case 2:
		state = -1;
   	last_state = 2;
		match = 4;
		match_pos = pos;
		break;

	case 3:
		state = -1;
   	last_state = 3;
		match = 5;
		match_pos = pos;
		break;

	case 4:
		state = -1;
   	last_state = 4;
		match = 8;
		match_pos = pos;
		break;

	case 5:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else state = -1;
   	last_state = 5;
		match = 10;
		match_pos = pos;
		break;

	case 6:
		state = -1;
   	last_state = 6;
		match = 3;
		match_pos = pos;
		break;

	case 7:
		state = -1;
   	last_state = 7;
		match = 6;
		match_pos = pos;
		break;

	case 8:
		state = -1;
   	last_state = 8;
		match = 7;
		match_pos = pos;
		break;

	case 9:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else state = -1;
   	last_state = 9;
		match = 2;
		match_pos = pos;
		break;

	case 10:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else state = -1;
   	last_state = 10;
		match = 9;
		match_pos = pos;
		break;

	case 11:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 115 ) || ( info.src.charCodeAt( pos ) >= 117 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 116 )) state = 9;
		else state = -1;
   	last_state = 11;
		match = 10;
		match_pos = pos;
		break;

	case 12:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 107 ) || ( info.src.charCodeAt( pos ) >= 109 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 108 )) state = 10;
		else state = -1;
   	last_state = 12;
		match = 10;
		match_pos = pos;
		break;

	case 13:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 105 )) state = 11;
		else state = -1;
   	last_state = 13;
		match = 10;
		match_pos = pos;
		break;

	case 14:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 98 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 97 )) state = 12;
		else state = -1;
   	last_state = 14;
		match = 10;
		match_pos = pos;
		break;

	case 15:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 110 )) state = 13;
		else state = -1;
   	last_state = 15;
		match = 10;
		match_pos = pos;
		break;

	case 16:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 109 ) || ( info.src.charCodeAt( pos ) >= 111 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 110 )) state = 14;
		else state = -1;
   	last_state = 16;
		match = 10;
		match_pos = pos;
		break;

	case 17:
		if( (( info.src.charCodeAt( pos ) >= 48 && info.src.charCodeAt( pos ) <= 57 ) || ( info.src.charCodeAt( pos ) >= 65 && info.src.charCodeAt( pos ) <= 90 ) || ( info.src.charCodeAt( pos ) >= 97 && info.src.charCodeAt( pos ) <= 104 ) || ( info.src.charCodeAt( pos ) >= 106 && info.src.charCodeAt( pos ) <= 122 ) )) state = 5;
		else if( (info.src.charCodeAt( pos ) == 105 )) state = 16;
		else state = -1;
   	last_state = 17;
		match = 10;
		match_pos = pos;
		break;

}


        pos++;
  
      }
      while( state > -1 );
    
    
    if( match > -1 )
    {
      info.att = info.src.substr( start, match_pos - start );
      info.offset = match_pos;  
    }
    else
    {
      info.att = new String();     
      match = -1;
    }  
    var result = new Object();
    result.match = match;
    result.last_state = last_state;        
    result.pos = pos-1; 
    return result;
  }
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   contains(arr, element)
  Usage:      retruns true parameter element is an element of the array (arr)
  Returns:    true if element is inside the array 
  --------------------------------------------------------------------------- */
  function contains(arr, element)
  {
       for(var i = 0; i < arr.length; i++)
       {
          if(arr[i]==element)return true;
       }  
       return false;
  }
  
    
  /* -FUNCTION------------------------------------------------------------------
  Function:   difference(A, B)
  Usage:      set difference
  Returns:    array representing A\B
  --------------------------------------------------------------------------- */
  function difference(A, B)
  {
       var result = new Array();
       for(var i = 0; i < A.length; i++)
       {
          if(!contains(B, A[i])) result.push(A[i]);
       }  
       return result;
  }
  
 
   /* -FUNCTION--------------------------------------------------------------------
    	Function:		intersection(array1, array2)
    		
    	Usage:			returns intersection of two sets
    ----------------------------------------------------------------------------- */ 	
    function intersection(array1, array2)
    {
    	var result = new Array();
    	for(var i = 0; i < array1.length; i++)
    	{
    		for(var j = 0; j < array2.length; j++)
    		{
    			if(array1[i] == array2[j] && !contains(result, array1[i])) result.push(array1[i]);
    		}			
    	}
    	return result;		
    }
  
    /* -FUNCTION--------------------------------------------------------------------
    	Function:		union( dest_array, src_array )
    		
    	Usage:			returns union of two sets
    ----------------------------------------------------------------------------- */ 	
    function union( dest_array, src_array )
    {
    	var i, j;
    	for( i = 0; i < src_array.length; i++ )
    	{
    		for( j = 0; j < dest_array.length; j++ )
    		{
    			if( src_array[i] == dest_array[j] )
    				break;
    		}
    		
    		if( j == dest_array.length )
    			dest_array.push( src_array[i] );
    	}
    	return dest_array;
    }

    
  /* -FUNCTION------------------------------------------------------------------
  Function:   lexPossibleMatchesForState(state)
  Usage:      used for geting possible matches for the provided state
  Params:     state - state of the lexer...
  Returns:    array with matches which can be achived by writing other characters... 
  --------------------------------------------------------------------------- */
  function lexPossibleMatchesForState(state)
  {
       var result = new Array();
       // other is array with transitions, each transition has on index [0] string of possible transition
       // on index [1], there is array with possible matches on that transition
       
       // for each transition we will add its possible matches
       for(var i = 0; i < others[state].length; i++)
       {
          for(var j = 0; j < others[state][i][1].length; j++)
          {          
                  result.push(others[state][i][1][j]);                
          }
       }  
     return result;
  }
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   getExpectedLabels(expected)
  Usage:      centraly used for printing labels
  Params:     expected - array of expected symbols (contains indexes to labels array)
  Returns:    array of strings describing expected symbols
  --------------------------------------------------------------------------- */
  function getExpectedLabels(expected)
  {
        var expected_labels = new Array();
        for(var i = 0; i < expected.length; i++)
        {                
              expected_labels.push( "\"" + regexes[expected[i]].replace(/"/gi, "\\\"") + "\" [" + labels[expected[i]] + "]");
        }
        return expected_labels;
  }
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   fillLineWithConditions(conditions)
  Usage:      used to create line from conditions
  Params:     conditions - array of conditions (condition can be one element array 
                            - meaning that it is one UNICODE value, or two element
                            array - meaning that it is interval of UNICODE values)
  Returns:    array representing all conditions (for every value, there is true or false)
  --------------------------------------------------------------------------- */
  function fillLineWithConditions(conditions)
  {
   
      // init line
      var line = new Array(1024);
      for(var i = 0; i < line.length; i++)
      {
          line[i] = false;
      }
      
      for(var i = 0; i < conditions.length; i++)
      {
          if(conditions[i].length ==1)
          {
              line[conditions[i][0]] = true;
          }
          else // length == 2
          {
              for(var j = conditions[i][0]; j <= conditions[i][1]; j++)
                line[j] = true;
          }        
      }
      // now line was filled with false, where we do not want it to continue
      return line;
  }
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   createSimpleRegular(conditions)
  Params:     conditions       array of conditions, condition is array with 1 or 2 elements
                               1 means that the character should be equal, 2 elements means interval
                               an element represents UNICODE value of the character
  Returns:    string representing simple regular (i.e. "[a-z]|c")
  --------------------------------------------------------------------------- */
  function createSimpleRegular(conditions)
  {     
        var line = fillLineWithConditions(conditions);
        
        // in result we have again intervals...
        var intervals = new Array();
        var i = 0;
        var intStarted = false;   
        var start = -1;
        var end = -1;
        while(i < line.length)
        {
            if(line[i] && !intStarted) 
            {
                start = i;
                end = i;
                intStarted = true;
            }
            else if(line[i] && intStarted)
            {
              end = i;
            }
            else if(!line[i] && intStarted)
            {
                intStarted = false;
                intervals.push([start, end]);
            }            
            i++;
            if(intStarted && i==line.length && start!=-1)intervals.push([start, end]);
        }
        var result = new Array();
        for(var i = 0; i < intervals.length; i++)
        {        
            if(intervals[i][0] == intervals[i][1]) 
            {
              result.push(String.fromCharCode(intervals[i][0]).replace(/\|/gi, "\\|").replace(/\[/gi, "\\[").replace(/\]/gi, "\\]"));
            }
            else 
            {
              result.push("[" + String.fromCharCode(intervals[i][0]).replace(/\|/gi, "\\|").replace(/\[/gi, "\\[").replace(/\]/gi, "\\]") +
              "-" +
              String.fromCharCode(intervals[i][1]).replace(/\|/gi, "\\|").replace(/\[/gi, "\\[").replace(/\]/gi, "\\]") +
              "]");        
            }
        }
        return result.join("|");        
  }
  /* -FUNCTION------------------------------------------------------------------
    Function:   findMatches(state, expected)
    Usage:      finds matches, which are expected and can be achieved from state of lexical analyzer
    Params:     state      state of lexical analyzer
                expected        array of expected terminals
    Returns:    array of achievable terminals from the given state of lexer
    --------------------------------------------------------------------------- */  
  function findMatches(state, expected)
  {
    var found_matches = new Array();
    // find out where I can get from the state of lexical analyzer
    var possible_matches = lexPossibleMatchesForState(state);    
    return intersection(possible_matches, expected);
  }


  /* -FUNCTION------------------------------------------------------------------
    Function:   computeArrayOfTransitions(state, found_matches)
    Usage:      creates array of descriptions how to get to found match through transition 
                every transition is written in format: (regex) "tokens_regex" [TOKEN_NAME]  
    Params:     state      state of lexical analyzer
                found_matches        matches for each, I want a transition to be added
                
    Returns:    array of string representation of transitions
    --------------------------------------------------------------------------- */  
  function computeArrayOfTransitions(state, found_matches)
  {
     var matches_transitions = new Array();
     for(var l = 0; l < found_matches.length; l++)
     {
         var conditions = getConditionsFromState(state, [found_matches[l]]);
         // for every transition, we will find characters to use to continue on path to the finish and get to found matches
         if(conditions.length)
            matches_transitions.push("(" + createSimpleRegular(conditions) + ")" + LANG.forLabel +  getExpectedLabels([found_matches[l]]).join());               
     }            
     return matches_transitions;
  }  
  
  /* -FUNCTION------------------------------------------------------------------
    Function:   getConditionsFromState(state, found_matches)
    Usage:      to get conditions... 
    Params:     state      state of lexical analyzer
                found_matches        matches which are interesting
    Returns:    array of conditions, which can be used to get to one of the found_matches
    --------------------------------------------------------------------------- */  
  function getConditionsFromState(state, found_matches)
  {
     var conditions = new Array();
     for(var l = 0; l < found_matches.length; l++)
     {
         for(var i = 0; i < others[state].length; i++)
         {
            if(contains(others[state][i][1], found_matches[l]))
            {                    
                for(var k = 0; k < others[state][i][0].length; k++)
                {
                    conditions.push(others[state][i][0][k]);
                }
            }             
         }   
     }
     return conditions;
  }  
  
  
  
  /* -FUNCTION------------------------------------------------------------------
    Function:   findAllTransitionsMatches(source, forbidden_matches)    
    Usage:      finds all matches, which were expected in past, and can be achieavable
                by adding some input, also returns nice array of transitions
    Params:     source      input of the parser
                forbidden_matches   matches, I don't want to get to...
    Returns:    object with properties matches and transitions
    --------------------------------------------------------------------------- */  
  function findAllTransitionsMatches(source, forbidden_matches)
  {
     if(!forbidden_matches) var forbidden_matches = new Array();
     var testInfo = new Object();
     var matches_transitions = new Array();
     var found_matches = new Array();
     for(var i = 0; i < exp.length ; i++)
     {
        var rest = source.substr(exp[i][0])
        testInfo.src = rest;
        testInfo.offset = 0;
        testInfo.att = new String;
        var testLexRes = lexTest(testInfo);
        if(testLexRes.pos == rest.length) 
        {
            var now_found_matches = findMatches(testLexRes.last_state, difference(exp[i][1], forbidden_matches));
            if(now_found_matches.length)
            {
              matches_transitions = matches_transitions.concat(computeArrayOfTransitions(testLexRes.last_state, now_found_matches));                              
            }      
            found_matches = union(found_matches, now_found_matches);
        }
     }
     result = new Object();
     result.matches = found_matches;    
     result.transitions = matches_transitions;
     return result;
  }
    
  /* -FUNCTION------------------------------------------------------------------
    Function:   getConditionsToAnyMatch(source, last_state)
    Usage:      returns all conditions from which we can get to some PREVIOUSLY EXPECTED
                matches, from the last_state
    Params:     source      input of the parser
                last_state  state from which we want to get there..
    Returns:    conditions
    --------------------------------------------------------------------------- */  
  function getConditionsToAnyMatch(source, last_state)
  {     
     var conditions = new Array();
     var symbols = new Array();
     for(var i = 0; i < labels.length; i++) symbols.push(i);
     
     for(var i = 0; i < exp.length - 1  ; i++)
     {      
        var rest = source.substr(exp[i][0]);
        var testInfo = new Object();                
        testInfo.src = rest;
        testInfo.offset = 0;
        testInfo.att = new String;
        var testLexRes = lexTest(testInfo);
        if(testLexRes.pos == rest.length) 
        {
            conditions = conditions.concat(getConditionsFromState( testLexRes.last_state, symbols));                              
        }
     }   
     return conditions;
   }                      
   
    /* -FUNCTION------------------------------------------------------------------
    Function:   isProblematicWhitespace(source)
    Usage:      finds out if there will be problem with connection of two terminals into one
                if true is returned than there is danger...
                
    Params:     source      input of the parser
    Returns:    if it will be probably needed to use whitespace...
    --------------------------------------------------------------------------- */  
   function isProblematicWhitespace(source)
   {
      var testInfo = new Object();
      if(exp.length < 2)return false;
      
      for(var o = 0; o < exp.length - 1; o++)
      {
      
      var rest = source.substr(exp[o][0]);    
      testInfo.src = rest;
      testInfo.offset = 0;
      testInfo.att = new String;
      var testLexRes = lexTest(testInfo);
      
      if(testLexRes.pos == rest.length) 
      {  
          var conditions = getConditionsToAnyMatch(source, testLexRes.last_state);           
          var line = fillLineWithConditions(conditions);
         
          // for every transition
           for(var i = 0; i < others[0].length; i++)
           {
                 for(var j= 0; j < others[0][i][0].length; j++)
                 {                       
                          for(var k = 0; k < exp[exp.length-1][1].length; k++) 
                          {
                                 if(contains(others[0][i][1], exp[exp.length-1][1][k]))
                                 {
                                      if(others[0][i][0][j].length == 2)
                                      {
                                          for(var l = others[0][i][0][j][0]; l <= others[0][i][0][j][1]; l++)
                                          {
                                              if(line[l]) return true;
                                          }
                                      }
                                      else
                                      {
                                        if(line[others[0][i][0][j][0]])return true;
                                      }
                                }
                          }
                   }
          }
       }   
       
      }
      return false;   
   }
 
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   evaluateError(errorType, source, info)
  Usage:      prints parsing error or helping message
  Params:     errorType      type of the error, see comments in code...
              source         source string which was send to parser
              info           info from the lexical analyzer (includes offset, att) 
              previous_lex_res        previous lexer result
  Returns:    object with params: error, error_string       // error 0 = without error, 1 = with other typing we can succeed, 2 = full error
  --------------------------------------------------------------------------- */
  function evaluateError(errorType, source, info, previous_lex_res)
  {      
     
     var result = new Object();
     result.error = 0;
     result.error_string = "";
     var expected = exp[exp.length-1][1];
    
    
     switch(errorType)
     {
          //nonterminal has no expected terminals
          case 0:     
                     var transitions_matches = findAllTransitionsMatches(source, [previous_lex_res.match]);
                      
                     if(transitions_matches.matches.length)
                     {                                              
                         // we can get to some expected matches by typing, let's help the user with predictions...                        
                         // now we have in matches_transitions strings in format: (regex) "tokens_regex" [TOKEN_NAME]   
                         //printPosition(source, source.length-1) +
                         result.error_string +=  LANG.mustContinue
                                              + " " + transitions_matches.transitions.join(LANG.or) + ". "
                         result.error = 1;            
                     }
                     else
                     {
                          // we cannot get to expected match by typing..., it is dead now forever...                          
                          result.error_string += printPosition(source, info.offset - info.att.length) + LANG.parseError
                                      + ". " + LANG.string + " \"" + info.att + "\" " + LANG.leadsToDeadend                                     
                                      ;
                          result.error = 2;   
                     }
                    break;
                            
          // errorType = 1 => error has occured before end of reading the string          
          case 1:      
                       var transitions_matches = findAllTransitionsMatches(source);
                       
                       if(transitions_matches.matches.length)
                       {        
                         // we can get to some expected matches by typing, let's help the user with predictions...
                        
                         // now we have in matches_transitions strings in format: (regex) "tokens_regex" [TOKEN_NAME]   
                         result.error_string +=  LANG.mustContinue
                                              + " " + transitions_matches.transitions.join(LANG.or) + ". "                                  
                         result.error = 1;                                 
                       }
                       else
                       {
                          // we cannot get to expected match by typing..., it is dead now forever...
                           
                          result.error_string += printPosition(source, info.offset - info.att.length) + LANG.parseError + LANG.near
                                  + "\"" + getStringNeigbourhood(source, info.offset, info.att.length) + "\". "
                                  +    LANG.unexpected_string + " \"" + info.att + "\". " + LANG.was_expected 
                                  +    " {" +   getExpectedLabels(expected).join(", ") + "}";
                          result.error = 2;
                       
                       }    
                      break;
     
          // errorType = 2 => some text is missing
          case 2:     
                      var transitions_matches = findAllTransitionsMatches(source);                                                
                        
                       if(transitions_matches.matches.length)
                       {        
                         // we can get to some expected matches by typing, let's help the user with predictions...                                               
                         
                          // now we have in matches_transitions strings in format: (regex) "tokens_regex" [TOKEN_NAME]      
                          
                              result.error_string += LANG.cont 
                                                  + " " + transitions_matches.transitions.join(LANG.or)
                                                  + LANG.but_missing             
                                                  +    " {" +   getExpectedLabels(expected).join(", ") + "}. "
                                                  + ((isProblematicWhitespace(source))? LANG.maybeWhitespace:"");
                                                 
                         
                         result.error = 1;                                 
                       }
                       else
                       {
                          // we cannot get to previously expected match by typing. So we offer only advices for other expected matches                           
                          result.error_string += LANG.missing 
                                              + " {" +  getExpectedLabels(expected).join(", ") + "}. "
                                              + ((isProblematicWhitespace(source))? LANG.maybeWhitespace:"");
                                              ;
                          result.error = 1;
                       
                       } 
                       break;
                          
          // errorType = 3 => there was something unexpected for lexical analyzer - we do not have match...
          case 3:     //find out if we can continue writing and get to any expected match
                      var transitions_matches = findAllTransitionsMatches(source);
                      
                      if(transitions_matches.matches.length)
                       {        
                         // we can get to some expected matches by typing, let's help the user with predictions...
                        
                         // now we have in matches_transitions strings in format: (regex) "tokens_regex" [TOKEN_NAME]   
                         result.error_string += LANG.mustContinue
                                              + " " + transitions_matches.transitions.join(LANG.or) + ". "                                                        
                                                       
                         result.error = 1;                                 
                       }
                       else
                       {
                          // we cannot get to previously expected match by typing. So we offer only advices for other expected matches                           
                          result.error_string += printPosition(source, info.offset - 1) + LANG.parseError 
                                              + " \"" + getStringNeigbourhood(source, info.offset, info.att.length) + "\", "
                                              + LANG.unexpected_symbol + " \"" + source.substr(info.offset, 1) 
                                              + "\". " + LANG.was_expected + " " 
                                              + "{" +   getExpectedLabels(expected).join(", ") + "}";
                          result.error = 2;   
                       
                       } 
                  break;
                  
          // errorType = 4 => source was accepted
          case 4:            
          
                      var transitions_matches = findAllTransitionsMatches(source);                                                
                        
                       if(transitions_matches.matches.length)
                       {        
                             // we can get to some expected matches by typing, let's help the user with predictions...                                               
                         
                             // now we have in matches_transitions strings in format: (regex) "tokens_regex" [TOKEN_NAME]      
                          
                              result.error_string += LANG.cont 
                                                  + " " + transitions_matches.transitions.join(LANG.or)
                                                  + ". " 
                                                  
                              if(difference(expected,[20]).length) result.error_string += LANG.canCont             
                                                  +    " {" +   getExpectedLabels(difference(expected,[20])).join(", ") + "}. "
                                                  + ((isProblematicWhitespace(source))? LANG.maybeWhitespace:"");
                                                 
                         
                                                   
                       }
                       else
                       {
                          // we cannot get to previously expected match by typing. So we offer only advices for other expected matches                           
                          if(difference(expected,[20]).length)result.error_string +=  LANG.canCont 
                                              + " {" +  getExpectedLabels(difference(expected,[20])).join(", ") + "}. "
                                              + ((isProblematicWhitespace(source))? LANG.maybeWhitespace:"");
                                              ;                       
                       } 
                               
                      result.error = 0;
                      break;
     }       
     if(!true) result.error_string = "";
     if(!true && result.error == 1) result.error = 2;
     return result;
  }
  
  /* -PRIVATE ATTRIBUTES ---------------------------------------------------- */
  // parse table
  /* LL(1) Parse Table */
var parseTable = new Array();
parseTable[0] = new Array();
parseTable[0][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[0][2] = createLL1TabEntry(false, null, [14], false, false);
parseTable[0][3] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[0][4] = createLL1TabEntry(false, null, [14], false, false);
parseTable[0][5] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[0][6] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[0][7] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[0][8] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[0][9] = createLL1TabEntry(false, null, [14], false, false);
parseTable[0][10] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[0][20] = createLL1TabEntry(false, null, [14], false, false);
parseTable[2] = new Array();
parseTable[2][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[2][2] = createLL1TabEntry(false, null, null, false, true);
parseTable[2][3] = createLL1TabEntry(false, [2], null, false, false);
parseTable[2][4] = createLL1TabEntry(false, [2], null, false, false);
parseTable[2][5] = createLL1TabEntry(false, [2], null, false, false);
parseTable[2][6] = createLL1TabEntry(false, [2], null, false, false);
parseTable[2][7] = createLL1TabEntry(false, [2], null, false, false);
parseTable[2][8] = createLL1TabEntry(false, [2], null, false, false);
parseTable[2][9] = createLL1TabEntry(false, [2], null, false, false);
parseTable[2][10] = createLL1TabEntry(false, [2], null, false, false);
parseTable[2][20] = createLL1TabEntry(false, [2], null, false, false);
parseTable[3] = new Array();
parseTable[3][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[3][2] = createLL1TabEntry(false, [3], null, false, false);
parseTable[3][3] = createLL1TabEntry(false, null, null, false, true);
parseTable[3][4] = createLL1TabEntry(false, [3], null, false, false);
parseTable[3][5] = createLL1TabEntry(false, [3], null, false, false);
parseTable[3][6] = createLL1TabEntry(false, [3], null, false, false);
parseTable[3][7] = createLL1TabEntry(false, [3], null, false, false);
parseTable[3][8] = createLL1TabEntry(false, [3], null, false, false);
parseTable[3][9] = createLL1TabEntry(false, [3], null, false, false);
parseTable[3][10] = createLL1TabEntry(false, [3], null, false, false);
parseTable[3][20] = createLL1TabEntry(false, [3], null, false, false);
parseTable[4] = new Array();
parseTable[4][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[4][2] = createLL1TabEntry(false, [4], null, false, false);
parseTable[4][3] = createLL1TabEntry(false, [4], null, false, false);
parseTable[4][4] = createLL1TabEntry(false, null, null, false, true);
parseTable[4][5] = createLL1TabEntry(false, [4], null, false, false);
parseTable[4][6] = createLL1TabEntry(false, [4], null, false, false);
parseTable[4][7] = createLL1TabEntry(false, [4], null, false, false);
parseTable[4][8] = createLL1TabEntry(false, [4], null, false, false);
parseTable[4][9] = createLL1TabEntry(false, [4], null, false, false);
parseTable[4][10] = createLL1TabEntry(false, [4], null, false, false);
parseTable[4][20] = createLL1TabEntry(false, [4], null, false, false);
parseTable[5] = new Array();
parseTable[5][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[5][2] = createLL1TabEntry(false, [5], null, false, false);
parseTable[5][3] = createLL1TabEntry(false, [5], null, false, false);
parseTable[5][4] = createLL1TabEntry(false, [5], null, false, false);
parseTable[5][5] = createLL1TabEntry(false, null, null, false, true);
parseTable[5][6] = createLL1TabEntry(false, [5], null, false, false);
parseTable[5][7] = createLL1TabEntry(false, [5], null, false, false);
parseTable[5][8] = createLL1TabEntry(false, [5], null, false, false);
parseTable[5][9] = createLL1TabEntry(false, [5], null, false, false);
parseTable[5][10] = createLL1TabEntry(false, [5], null, false, false);
parseTable[5][20] = createLL1TabEntry(false, [5], null, false, false);
parseTable[6] = new Array();
parseTable[6][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[6][2] = createLL1TabEntry(false, [6], null, false, false);
parseTable[6][3] = createLL1TabEntry(false, [6], null, false, false);
parseTable[6][4] = createLL1TabEntry(false, [6], null, false, false);
parseTable[6][5] = createLL1TabEntry(false, [6], null, false, false);
parseTable[6][6] = createLL1TabEntry(false, null, null, false, true);
parseTable[6][7] = createLL1TabEntry(false, [6], null, false, false);
parseTable[6][8] = createLL1TabEntry(false, [6], null, false, false);
parseTable[6][9] = createLL1TabEntry(false, [6], null, false, false);
parseTable[6][10] = createLL1TabEntry(false, [6], null, false, false);
parseTable[6][20] = createLL1TabEntry(false, [6], null, false, false);
parseTable[7] = new Array();
parseTable[7][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[7][2] = createLL1TabEntry(false, [7], null, false, false);
parseTable[7][3] = createLL1TabEntry(false, [7], null, false, false);
parseTable[7][4] = createLL1TabEntry(false, [7], null, false, false);
parseTable[7][5] = createLL1TabEntry(false, [7], null, false, false);
parseTable[7][6] = createLL1TabEntry(false, [7], null, false, false);
parseTable[7][7] = createLL1TabEntry(false, null, null, false, true);
parseTable[7][8] = createLL1TabEntry(false, [7], null, false, false);
parseTable[7][9] = createLL1TabEntry(false, [7], null, false, false);
parseTable[7][10] = createLL1TabEntry(false, [7], null, false, false);
parseTable[7][20] = createLL1TabEntry(false, [7], null, false, false);
parseTable[8] = new Array();
parseTable[8][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[8][2] = createLL1TabEntry(false, [8], null, false, false);
parseTable[8][3] = createLL1TabEntry(false, [8], null, false, false);
parseTable[8][4] = createLL1TabEntry(false, [8], null, false, false);
parseTable[8][5] = createLL1TabEntry(false, [8], null, false, false);
parseTable[8][6] = createLL1TabEntry(false, [8], null, false, false);
parseTable[8][7] = createLL1TabEntry(false, [8], null, false, false);
parseTable[8][8] = createLL1TabEntry(false, null, null, false, true);
parseTable[8][9] = createLL1TabEntry(false, [8], null, false, false);
parseTable[8][10] = createLL1TabEntry(false, [8], null, false, false);
parseTable[8][20] = createLL1TabEntry(false, [8], null, false, false);
parseTable[9] = new Array();
parseTable[9][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[9][2] = createLL1TabEntry(false, [9], null, false, false);
parseTable[9][3] = createLL1TabEntry(false, [9], null, false, false);
parseTable[9][4] = createLL1TabEntry(false, [9], null, false, false);
parseTable[9][5] = createLL1TabEntry(false, [9], null, false, false);
parseTable[9][6] = createLL1TabEntry(false, [9], null, false, false);
parseTable[9][7] = createLL1TabEntry(false, [9], null, false, false);
parseTable[9][8] = createLL1TabEntry(false, [9], null, false, false);
parseTable[9][9] = createLL1TabEntry(false, null, null, false, true);
parseTable[9][10] = createLL1TabEntry(false, [9], null, false, false);
parseTable[9][20] = createLL1TabEntry(false, [9], null, false, false);
parseTable[10] = new Array();
parseTable[10][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[10][2] = createLL1TabEntry(false, [10], null, false, false);
parseTable[10][3] = createLL1TabEntry(false, [10], null, false, false);
parseTable[10][4] = createLL1TabEntry(false, [10], null, false, false);
parseTable[10][5] = createLL1TabEntry(false, [10], null, false, false);
parseTable[10][6] = createLL1TabEntry(false, [10], null, false, false);
parseTable[10][7] = createLL1TabEntry(false, [10], null, false, false);
parseTable[10][8] = createLL1TabEntry(false, [10], null, false, false);
parseTable[10][9] = createLL1TabEntry(false, [10], null, false, false);
parseTable[10][10] = createLL1TabEntry(false, null, null, false, true);
parseTable[10][20] = createLL1TabEntry(false, [10], null, false, false);
parseTable[11] = new Array();
parseTable[11][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[11][2] = createLL1TabEntry(false, null, [2, 3, 15], false, false);
parseTable[11][3] = createLL1TabEntry(false, [2, 20, 9, 4], null, false, false);
parseTable[11][4] = createLL1TabEntry(false, null, [], false, false);
parseTable[11][5] = createLL1TabEntry(false, [2, 20, 9, 4], null, false, false);
parseTable[11][6] = createLL1TabEntry(false, [2, 20, 9, 4], null, false, false);
parseTable[11][7] = createLL1TabEntry(false, [2, 20, 9, 4], null, false, false);
parseTable[11][8] = createLL1TabEntry(false, [2, 20, 9, 4], null, false, false);
parseTable[11][9] = createLL1TabEntry(false, null, [], false, false);
parseTable[11][10] = createLL1TabEntry(false, [2, 20, 9, 4], null, false, false);
parseTable[11][20] = createLL1TabEntry(false, null, [], false, false);
parseTable[12] = new Array();
parseTable[12][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[12][2] = createLL1TabEntry(false, [4, 20, 9], null, false, false);
parseTable[12][3] = createLL1TabEntry(false, [4, 20, 9], null, false, false);
parseTable[12][4] = createLL1TabEntry(false, null, [4, 15, 8, 15, 5, 3, 15, 12], false, false);
parseTable[12][5] = createLL1TabEntry(false, [4, 20, 9], null, false, false);
parseTable[12][6] = createLL1TabEntry(false, [4, 20, 9], null, false, false);
parseTable[12][7] = createLL1TabEntry(false, [4, 20, 9], null, false, false);
parseTable[12][8] = createLL1TabEntry(false, [4, 20, 9], null, false, false);
parseTable[12][9] = createLL1TabEntry(false, null, [], false, false);
parseTable[12][10] = createLL1TabEntry(false, [4, 20, 9], null, false, false);
parseTable[12][20] = createLL1TabEntry(false, null, [], false, false);
parseTable[13] = new Array();
parseTable[13][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[13][2] = createLL1TabEntry(false, [9, 20], null, false, false);
parseTable[13][3] = createLL1TabEntry(false, [9, 20], null, false, false);
parseTable[13][4] = createLL1TabEntry(false, [9, 20], null, false, false);
parseTable[13][5] = createLL1TabEntry(false, [9, 20], null, false, false);
parseTable[13][6] = createLL1TabEntry(false, [9, 20], null, false, false);
parseTable[13][7] = createLL1TabEntry(false, [9, 20], null, false, false);
parseTable[13][8] = createLL1TabEntry(false, [9, 20], null, false, false);
parseTable[13][9] = createLL1TabEntry(false, null, [9, 3, 16], false, false);
parseTable[13][10] = createLL1TabEntry(false, [9, 20], null, false, false);
parseTable[13][20] = createLL1TabEntry(false, null, [], false, false);
parseTable[14] = new Array();
parseTable[14][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[14][2] = createLL1TabEntry(false, null, [11, 12, 13], false, false);
parseTable[14][3] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[14][4] = createLL1TabEntry(false, null, [11, 12, 13], false, false);
parseTable[14][5] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[14][6] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[14][7] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[14][8] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[14][9] = createLL1TabEntry(false, null, [11, 12, 13], false, false);
parseTable[14][10] = createLL1TabEntry(false, [2, 9, 4, 20], null, false, false);
parseTable[14][20] = createLL1TabEntry(false, null, [11, 12, 13], false, false);
parseTable[15] = new Array();
parseTable[15][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[15][2] = createLL1TabEntry(false, null, [2], false, false);
parseTable[15][3] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[15][4] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[15][5] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[15][6] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[15][7] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[15][8] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[15][9] = createLL1TabEntry(false, null, [9], false, false);
parseTable[15][10] = createLL1TabEntry(false, null, [10], false, false);
parseTable[15][20] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[16] = new Array();
parseTable[16][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[16][2] = createLL1TabEntry(false, [6], null, false, false);
parseTable[16][3] = createLL1TabEntry(false, [6], null, false, false);
parseTable[16][4] = createLL1TabEntry(false, [6], null, false, false);
parseTable[16][5] = createLL1TabEntry(false, [6], null, false, false);
parseTable[16][6] = createLL1TabEntry(false, null, [6, 17, 7], false, false);
parseTable[16][7] = createLL1TabEntry(false, [6], null, false, false);
parseTable[16][8] = createLL1TabEntry(false, [6], null, false, false);
parseTable[16][9] = createLL1TabEntry(false, [6], null, false, false);
parseTable[16][10] = createLL1TabEntry(false, [6], null, false, false);
parseTable[16][20] = createLL1TabEntry(false, [6], null, false, false);
parseTable[17] = new Array();
parseTable[17][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[17][2] = createLL1TabEntry(false, null, [18], false, false);
parseTable[17][3] = createLL1TabEntry(false, [10, 2, 9, 7], null, false, false);
parseTable[17][4] = createLL1TabEntry(false, [10, 2, 9, 7], null, false, false);
parseTable[17][5] = createLL1TabEntry(false, [10, 2, 9, 7], null, false, false);
parseTable[17][6] = createLL1TabEntry(false, [10, 2, 9, 7], null, false, false);
parseTable[17][7] = createLL1TabEntry(false, null, [], false, false);
parseTable[17][8] = createLL1TabEntry(false, [10, 2, 9, 7], null, false, false);
parseTable[17][9] = createLL1TabEntry(false, null, [18], false, false);
parseTable[17][10] = createLL1TabEntry(false, null, [18], false, false);
parseTable[17][20] = createLL1TabEntry(false, [10, 2, 9, 7], null, false, false);
parseTable[18] = new Array();
parseTable[18][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[18][2] = createLL1TabEntry(false, null, [15, 19], false, false);
parseTable[18][3] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[18][4] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[18][5] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[18][6] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[18][7] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[18][8] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[18][9] = createLL1TabEntry(false, null, [15, 19], false, false);
parseTable[18][10] = createLL1TabEntry(false, null, [15, 19], false, false);
parseTable[18][20] = createLL1TabEntry(false, [10, 2, 9], null, false, false);
parseTable[19] = new Array();
parseTable[19][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[19][2] = createLL1TabEntry(false, [8, 7], null, false, false);
parseTable[19][3] = createLL1TabEntry(false, [8, 7], null, false, false);
parseTable[19][4] = createLL1TabEntry(false, [8, 7], null, false, false);
parseTable[19][5] = createLL1TabEntry(false, [8, 7], null, false, false);
parseTable[19][6] = createLL1TabEntry(false, [8, 7], null, false, false);
parseTable[19][7] = createLL1TabEntry(false, null, [], false, false);
parseTable[19][8] = createLL1TabEntry(false, null, [8, 15, 19], false, false);
parseTable[19][9] = createLL1TabEntry(false, [8, 7], null, false, false);
parseTable[19][10] = createLL1TabEntry(false, [8, 7], null, false, false);
parseTable[19][20] = createLL1TabEntry(false, [8, 7], null, false, false);
parseTable[20] = new Array();
parseTable[20][1] = createLL1TabEntry(true, null, null, false, false);
parseTable[20][2] = createLL1TabEntry(false, [20], null, false, false);
parseTable[20][3] = createLL1TabEntry(false, [20], null, false, false);
parseTable[20][4] = createLL1TabEntry(false, [20], null, false, false);
parseTable[20][5] = createLL1TabEntry(false, [20], null, false, false);
parseTable[20][6] = createLL1TabEntry(false, [20], null, false, false);
parseTable[20][7] = createLL1TabEntry(false, [20], null, false, false);
parseTable[20][8] = createLL1TabEntry(false, [20], null, false, false);
parseTable[20][9] = createLL1TabEntry(false, [20], null, false, false);
parseTable[20][10] = createLL1TabEntry(false, [20], null, false, false);
parseTable[20][20] = createLL1TabEntry(false, null, null, true, false);

  // array containing labels of symbols
  /* Symbol labels */
var labels = new Array(
	"Start'" /* Non-terminal symbol */,
	"^" /* Terminal symbol */,
	"INIT" /* Terminal symbol */,
	"EQUALS" /* Terminal symbol */,
	"LEFT_PARENTHESIS" /* Terminal symbol */,
	"RIGHT_PARENTHESIS" /* Terminal symbol */,
	"LEFT_BRACKET" /* Terminal symbol */,
	"RIGHT_BRACKET" /* Terminal symbol */,
	"COMMA" /* Terminal symbol */,
	"FINAL" /* Terminal symbol */,
	"STATE_AND_ALPHABET" /* Terminal symbol */,
	"Init" /* Non-terminal symbol */,
	"Productions" /* Non-terminal symbol */,
	"Final" /* Non-terminal symbol */,
	"Start" /* Non-terminal symbol */,
	"StateNames" /* Non-terminal symbol */,
	"Set" /* Non-terminal symbol */,
	"SetContent" /* Non-terminal symbol */,
	"SetItems" /* Non-terminal symbol */,
	"SetItems*" /* Non-terminal symbol */,
	"EOF" /* Terminal symbol */
);


  // array containing regex description of symbols
  /* Symbols' regexes */
var regexes = new Array(
	unescape("undefined") /* Non-terminal symbol */,
	unescape("undefined") /* Terminal symbol */,
	unescape("init") /* Terminal symbol */,
	unescape("%3D") /* Terminal symbol */,
	unescape("%28") /* Terminal symbol */,
	unescape("%29") /* Terminal symbol */,
	unescape("%7B") /* Terminal symbol */,
	unescape("%7D") /* Terminal symbol */,
	unescape("%2C") /* Terminal symbol */,
	unescape("final") /* Terminal symbol */,
	unescape("%5Ba-zA-Z0-9%5D+") /* Terminal symbol */,
	unescape("undefined") /* Non-terminal symbol */,
	unescape("undefined") /* Non-terminal symbol */,
	unescape("undefined") /* Non-terminal symbol */,
	unescape("undefined") /* Non-terminal symbol */,
	unescape("undefined") /* Non-terminal symbol */,
	unescape("undefined") /* Non-terminal symbol */,
	unescape("undefined") /* Non-terminal symbol */,
	unescape("undefined") /* Non-terminal symbol */,
	unescape("undefined") /* Non-terminal symbol */,
	unescape("end%20of%20input") /* Terminal symbol */
);


    
  // czech language
  var LANG_CS = new Object();
  LANG_CS.parseError = "Chyba syntaxe";
  LANG_CS.parseErrorSeparator = " - ";
  LANG_CS.near = " u ";
  LANG_CS.emptyLang = "Akceptující jazyk je prázdný.";
  LANG_CS.expecting = "očekávám něco z";
  LANG_CS.unexpected_symbol = "neočekávaný znak";
  LANG_CS.unexpected_string = "Neočekávaný řetězec";
  LANG_CS.was_expected = "Bylo očekáváno něco z";
  LANG_CS.missing = "Ještě očekávám něco z";
  LANG_CS.cont = "Můžete pokračovat v psaní";
  LANG_CS.canCont = "Můžete pokračovat něčím z";
  LANG_CS.but_missing = ", jinak ještě očekávám něco z"; 
  LANG_CS.forLabel = " pro "; 
  LANG_CS.continueWriting = "Pokračujte psaním";
  LANG_CS.or = " nebo ";
  LANG_CS.orInsteadOf = "Případně místo";
  LANG_CS.mustContinue = "Musíte pokračovat psaním";
  LANG_CS.maybeWhitespace = "Možná budete muset použít bílé místo jako oddělovač od předešlého slova.";
  LANG_CS.string = "Řetězec";
  LANG_CS.leadsToDeadend = "vede do slepé uličky.";
  // english language
  var LANG_EN = new Object();
  LANG_EN.parseError = "Parse error";
  LANG_EN.parseErrorSeparator = " - ";
  LANG_EN.near = " near ";
  LANG_EN.emptyLang = "Accepting language is empty.";
  LANG_EN.expecting = "expecting somehting from";
  LANG_EN.unexpected_symbol = "unexpected character";
  LANG_EN.unexpected_string = "Unexpected string";
  LANG_EN.was_expected = "Parser expected something from";
  LANG_EN.missing = "Furthemore expecting something from";
  LANG_EN.canCont = "You can continue with something from";
  LANG_EN.cont = "You can continue with writing";
  LANG_EN.but_missing = ", otherwise expecting something from"; 
  LANG_EN.forLabel = " for "; 
  LANG_EN.continueWriting = "Continue with writing";
  LANG_EN.or = " or ";
  LANG_EN.orInsteadOf = "Or instead of";
  LANG_EN.mustContinue = "You have to continue writing";
  LANG_EN.maybeWhitespace = "Maybe you will have to use whitespace as a separator from previous word.";
  LANG_EN.string = "String";
  LANG_EN.leadsToDeadend = "leads to dead end.";
  
  // assignment of selected language
  var LANG = LANG_CS;
  
 var   stack  = new Array();
  
  /* -PUBLIC---------------------------------------------------------------- */
  return {  
  
  /* -FUNCTION------------------------------------------------------------------
  Function:   parse( src )
  Usage:      parser of the src argument
  Returns:    object, with properties: error, error_string
              error = flag (0 - no errors, 1 - other input is expected, 2 - hard error)
              error_string = error message (can be not empty even when error == 0)         
  --------------------------------------------------------------------------- */
  parse : function( src )
  {
      var     la;
      var   parseinfo     = new Function( "", "var offset; var src; var att;" );
      var     info      = new parseinfo();
      //document.getElementById("appletholder").innerHTML = "";
      var   err_cnt = 0;
      var   result = new Object();
      // 0 - withou error, 1 - missing text, 2 - fail...
      result.error = 0;
      result.error_string = "";
            
      // IE is putting CR LF as new line, lets make it only LF, like in firefox
      src = src.replace(/\r\n/gi,"\n");     
      
      info.offset = 0;
      info.src = src;
      info.att = new String();
      stack = new Array();
      exp = new Array();
      // put the EOF symbol on the stack  
      stack.push( 20 );
      // put the starting nonterminal on the stack (it is always the first one in labels array)
      stack.push(0);
      
      
      // read the first token
      var lex_res = lex( info );
      previous_lex_res = lex_res;
      la = lex_res.match;
     
      while( true )
      {
      
      if(parseTable[stack[stack.length-1]][la])
      {         
        //Shift - probably we are reading token, which should be ignored, just continue reading input
        if( parseTable[stack[stack.length-1]][la].shift)
        {             
          result.error_string += "shift(" + la+ ")||";                  
          previous_lex_res = lex_res;
          lex_res = lex( info );
          la = lex_res.match;
        }
        //Reduce (remove) - we have same symbol on the stack and same on the input, remove both
        else if(parseTable[stack[stack.length-1]][la].remove)
        {
          result.error_string += "remove(" + la+ ")||";
          
          stack.pop();
          previous_lex_res = lex_res;
          lex_res = lex( info );
          la = lex_res.match;          
        }     
        // accept the sentence
        else if(parseTable[stack[stack.length-1]][la].accept)
        {        
          result.error_string += "accept(" + la+ ")||";
          break;
        }
        // remove first symbol on the stack and put another production on the stack
        else if(parseTable[stack[stack.length-1]][la].production != null)
        {
          result.error_string += "prod(" + la+ "," + parseTable[stack[stack.length-1]][la].production.toString() + ")||";
               
          var index = stack[stack.length-1];
          stack.pop();        
          for(var i = parseTable[index][la].production.length-1; i > -1; i--)
          {
            stack.push(parseTable[index][la].production[i]);
          }           
        }
        // syntax error
        else if(parseTable[stack[stack.length-1]][la].error != null)
        {          
          var result;           
          if(parseTable[stack[stack.length-1]][la].error.length == 0) 
          {            
            // errorType = 0 => nonterminal has no expected terminals
            result = evaluateError(0, src, info, previous_lex_res);                           
          }
          else
          {              
             // error has occured before end of reading the string - it's dead now
            if(la != 20 )
            {
              // 
              // errorType = 1 => error has occured before end of reading the string
              result =  evaluateError(1 , src, info, previous_lex_res);
            }
            else // some text is missing...
            {
                // errorType = 2 => some text is missing          
                result = evaluateError(2 , src, info, previous_lex_res);          
            }
          }         
          return result;
        }
      }
      else //parseTable[stack[stack.length-1]][la] is not defined
      {  // means, that there is something unexpected
            err_cnt += 1;
           
           
            // errorType = 3 => there was something unexpected for lexical analyzer - we do not have match...
            return  evaluateError(3 , src, info, previous_lex_res);             
            
        }         
      }
      // errorType = 4 => source was accepted
      
      //return result;
      return evaluateError(4 , src, info, previous_lex_res);
      
  }
  
  /* - END OF PUBLIC--------------------------------------------------------- */
  };

}();




