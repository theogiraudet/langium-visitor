import { Greeting, HelloWorldValidationVisitor, Model, Person } from '../semantics/hello-world-visitor.js';

export class HelloWorldValidator extends HelloWorldValidationVisitor {
    
    override visitGreeting(node: Greeting) {}

    override visitModel(node: Model) {
        node.persons.forEach(person => this.visitPerson(person));
    }
    
    override visitPerson(node: Person) {
        if (node.name.charAt(0) !== node.name.charAt(0).toUpperCase()) {
            this.validationAccept("error", "Person name should start with a capital letter.", { node: node, property: "name" });
        }
    }
}
