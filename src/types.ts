import { Property, TypeOption } from "langium/grammar";

export type OverrideProperty = { 
    property: Property, // A property of a type
    override: boolean  // True if the property comes from a supertype
}

export type FlattenedInterface = { 
    name: string, // The name of the interface
    types: string[], // The different types that this interface may have, including the interface names and the subtypes names. Useful to fill the "$type" attribute of the generated code
    properties: OverrideProperty[], // The properties of the interface
    directSuperType: string | undefined, // The name of the direct supertype of the interface. Useful to do inheritance between the visitor classes
    isConcrete: boolean, // True if the interface is a leaf, i.e., it has no subtypes
    containerTypes: TypeOption[] // The types that contain this interface. Useful to fill the "$container" attribute of the generated code
    overrideContainers: boolean // True if the container types come from a supertype
}

export type FlattenedTranslatedInterface = { types: string[], name: string, attributes: TranslatedAttribute[], directSuperType: string | undefined, isConcrete: boolean, containerTypes: string[], overrideContainers: boolean }

export type TranslatedAttribute = { name: string, type: string, override: boolean }