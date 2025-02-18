import { Greeting, HelloWorldVisitor, Model, Person } from "../semantics/hello-world-visitor.js";

export class HelloWorldInterpreter implements HelloWorldVisitor {

    visitGreeting(node: Greeting) {
        console.log(`Hello ${node.person.ref?.name}!`);
    }

    visitModel(node: Model) {
        node.greetings.forEach(greeting => this.visitGreeting(greeting));
    }

    visitPerson(node: Person) {}
}
