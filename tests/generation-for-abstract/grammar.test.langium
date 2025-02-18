grammar HelloWorld

entry Model:
    (livings+=Living | greetings+=Greeting)*;

Living:
    Person | Animal;

Animal:
    'animal' name=ID;

Person:
    'person' name=ID;

Greeting:
    'Hello' person=[Living:ID] '!';

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
