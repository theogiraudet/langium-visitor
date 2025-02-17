import { Property, TypeOption } from "langium/grammar";

export type OverrideProperty = { 
    property: Property, // A property of a type
    override: boolean  // True if the property comes from a supertype
}

export type FlattenedInterface = { 
    name: string, // The name of the interface
    types: string[], // The different types that this interface may have, including the interface names and the subtypes names. Useful to fill the "$type" attribute of the generated code
    properties: OverrideProperty[], // The properties of the interface
    isConcrete: boolean, // True if the interface is a leaf, i.e., it has no subtypes
    containerTypes: TypeOption[] // The types that contain this interface. Useful to fill the "$container" attribute of the generated code
}

export type FlattenedTranslatedInterface = { name: string, references: TranslatedAttribute[], containerTypes: string[], types: string[], isConcrete: boolean }

export type TranslatedAttribute = { name: string, type: string, isReference: boolean }

export type TranslatedTypeOption = {
    name: string,
    types: string
}
