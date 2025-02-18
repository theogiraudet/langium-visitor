grammar HelloWorld

entry Model returns Model:
    (persons+=Person | greetings+=Greeting)*;

Person returns Person:
    'person' name=ID;

Greeting returns Greeting:
    'Hello' person=[Person:ID] '!';

interface Model {
    persons: Person[];
    greetings: Greeting[];
}

interface Person {
    name: string;
}

interface Greeting {
    person: @Person;
}


hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal INT returns number: /[0-9]+/;
terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
